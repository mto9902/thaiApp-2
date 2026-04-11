import { Sketch } from "@/constants/theme";
import TermsAgreement from "@/src/components/TermsAgreement";
import {
  WEB_BODY_FONT,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE } from "../config";
import { setAuthToken } from "../utils/authStorage";
import {
  BRAND,
  CARD_SHADOW,
  SurfaceButton,
  SURFACE_SHADOW,
} from "@/src/screens/mobile/dashboardSurface";

WebBrowser.maybeCompleteAuthSession();

const googleClientConfig = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

const configuredWebRedirectUri =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI?.trim() || null;
const redirectPath =
  Platform.OS === "web" ? "auth/callback" : "oauthredirect";

function getWebRedirectUri() {
  if (configuredWebRedirectUri) {
    try {
      const configuredUrl = new URL(configuredWebRedirectUri);

      if (typeof window !== "undefined") {
        const currentOrigin = window.location.origin;
        const configuredIsLocalhost =
          configuredUrl.hostname === "localhost" ||
          configuredUrl.hostname === "127.0.0.1" ||
          configuredUrl.hostname === "[::1]";
        const currentIsLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname === "[::1]";

        if (configuredIsLocalhost && !currentIsLocalhost) {
          return `${currentOrigin}/auth/callback`;
        }
      }

      return configuredWebRedirectUri;
    } catch {
      return configuredWebRedirectUri;
    }
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }

  return undefined;
}

function getConfiguredWebOrigin() {
  if (!configuredWebRedirectUri) return null;

  try {
    const configuredUrl = new URL(configuredWebRedirectUri);

    if (typeof window !== "undefined") {
      const configuredIsLocalhost =
        configuredUrl.hostname === "localhost" ||
        configuredUrl.hostname === "127.0.0.1" ||
        configuredUrl.hostname === "[::1]";
      const currentIsLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "[::1]";

      if (configuredIsLocalhost && !currentIsLocalhost) {
        return window.location.origin;
      }
    }

    return configuredUrl.origin;
  } catch {
    return null;
  }
}

type PendingGoogleConsent = {
  idToken: string;
  email: string;
  displayName?: string | null;
};

type GoogleAuthButtonProps = {
  redirectTo?: string | null;
  variant?: "default" | "mobile";
};

function getNativeGoogleWebClientId() {
  return googleClientConfig.webClientId ?? googleClientConfig.clientId ?? null;
}

function getCurrentPlatformClientId() {
  if (Platform.OS === "android") {
    return getNativeGoogleWebClientId();
  }

  if (Platform.OS === "ios") {
    return getNativeGoogleWebClientId();
  }

  return googleClientConfig.webClientId ?? googleClientConfig.clientId ?? null;
}

function useGoogleTokenExchange(redirectTo?: string | null) {
  const router = useRouter();

  return useCallback(
    async (idToken: string, acceptedTermsForSignup: boolean) => {
      const authResponse = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          acceptedTerms: acceptedTermsForSignup,
        }),
      });

      const data = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(data.error || "Google sign-in failed");
      }

      if (data.requiresTerms) {
        return {
          requiresTerms: true as const,
          idToken,
          email: data.email ?? "",
          displayName: data.displayName ?? null,
        };
      }

      await AsyncStorage.multiRemove(["isGuest"]);
      await setAuthToken(data.token);
      router.replace((redirectTo || "/(tabs)") as any);

      return {
        requiresTerms: false as const,
      };
    },
    [redirectTo, router],
  );
}

function GoogleAuthButtonWeb({
  redirectTo,
  variant = "default",
}: GoogleAuthButtonProps) {
  const isMobileVariant = variant === "mobile";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<PendingGoogleConsent | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const exchangeGoogleToken = useGoogleTokenExchange(redirectTo);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: googleClientConfig.clientId,
      androidClientId: googleClientConfig.androidClientId,
      iosClientId: googleClientConfig.iosClientId,
      webClientId: googleClientConfig.webClientId,
      redirectUri: Platform.OS === "web" ? getWebRedirectUri() : undefined,
      selectAccount: true,
    },
    {
      scheme: "thaiapp",
      path: redirectPath,
      preferLocalhost: true,
    },
  );

  useEffect(() => {
    if (response?.type === "cancel" || response?.type === "dismiss") {
      setIsSubmitting(false);
      return;
    }

    if (response?.type === "error") {
      setIsSubmitting(false);
      Alert.alert("Google sign-in failed", "Please try again.");
      return;
    }

    if (response?.type !== "success") {
      return;
    }

    const idToken =
      ("params" in response && typeof response.params?.id_token === "string"
        ? response.params.id_token
        : "") ||
      ("authentication" in response &&
      typeof response.authentication?.idToken === "string"
        ? response.authentication.idToken
        : "");

    if (!idToken) {
      setIsSubmitting(false);
      Alert.alert(
        "Google sign-in failed",
        "Google did not return a sign-in token. Please try again.",
      );
      return;
    }

    void (async () => {
      try {
        const result = await exchangeGoogleToken(idToken, false);
        if (result.requiresTerms) {
          setPendingConsent({
            idToken: result.idToken,
            email: result.email,
            displayName: result.displayName,
          });
          setAcceptedTerms(false);
        } else {
          setPendingConsent(null);
          setAcceptedTerms(false);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Google sign-in failed";
        Alert.alert("Google sign-in failed", message);
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [exchangeGoogleToken, response]);

  async function handlePress() {
    if (!request || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await promptAsync();

      if (
        result.type === "cancel" ||
        result.type === "dismiss" ||
        result.type === "locked"
      ) {
        setIsSubmitting(false);
      }

      if (result.type === "error") {
        setIsSubmitting(false);
        Alert.alert("Google sign-in failed", "Please try again.");
      }
    } catch {
      setIsSubmitting(false);
      Alert.alert("Google sign-in failed", "Please try again.");
    }
  }

  async function handleConsentContinue() {
    if (!pendingConsent || !acceptedTerms || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await exchangeGoogleToken(pendingConsent.idToken, true);
      setPendingConsent(null);
      setAcceptedTerms(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed";
      Alert.alert("Google sign-in failed", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        visible={pendingConsent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmitting) {
            setPendingConsent(null);
            setAcceptedTerms(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!isSubmitting) {
                setPendingConsent(null);
                setAcceptedTerms(false);
              }
            }}
          />
          <View style={[styles.modalCard, isMobileVariant && styles.mobileModalCard]}>
            <Text style={styles.modalTitle}>Agree to Continue</Text>
            <Text style={styles.modalBody}>
              Before we create your Keystone account with Google, please agree
              to the Terms and Conditions and Privacy Policy.
            </Text>

            {pendingConsent ? (
              <View style={[styles.accountCard, isMobileVariant && styles.mobileAccountCard]}>
                <Text style={styles.accountLabel}>Google account</Text>
                <Text style={styles.accountName}>
                  {pendingConsent.displayName?.trim() || pendingConsent.email}
                </Text>
                <Text style={styles.accountEmail}>{pendingConsent.email}</Text>
              </View>
            ) : null}

            <TermsAgreement
              accepted={acceptedTerms}
              onToggle={() => setAcceptedTerms((current) => !current)}
              variant={isMobileVariant ? "mobile" : "default"}
            />

            <View style={styles.modalActions}>
              {isMobileVariant ? (
                <>
                  <SurfaceButton
                    label="Cancel"
                    onPress={() => {
                      setPendingConsent(null);
                      setAcceptedTerms(false);
                    }}
                    disabled={isSubmitting}
                    style={styles.modalAction}
                  />
                  <SurfaceButton
                    label={isSubmitting ? "Creating account..." : "Agree and Continue"}
                    onPress={() => void handleConsentContinue()}
                    variant="primary"
                    disabled={!acceptedTerms || isSubmitting}
                    style={styles.modalAction}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.modalAction]}
                    onPress={() => {
                      setPendingConsent(null);
                      setAcceptedTerms(false);
                    }}
                    activeOpacity={0.82}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      styles.modalAction,
                      (!acceptedTerms || isSubmitting) && styles.primaryButtonDisabled,
                    ]}
                    onPress={handleConsentContinue}
                    activeOpacity={0.82}
                    disabled={!acceptedTerms || isSubmitting}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSubmitting ? "Creating account..." : "Agree and Continue"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {isMobileVariant ? (
        <SurfaceButton
          label={isSubmitting ? "Connecting to Google..." : "Continue with Google"}
          onPress={() => void handlePress()}
          disabled={!request || isSubmitting}
        />
      ) : (
        <Pressable
          style={({ hovered, pressed }) => [
            styles.button,
            isSubmitting && styles.buttonDisabled,
            (hovered || pressed) && !isSubmitting && styles.buttonActive,
          ]}
          onPress={() => void handlePress()}
          disabled={!request || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Connecting to Google..." : "Continue with Google"}
          </Text>
        </Pressable>
      )}
    </>
  );
}

function GoogleAuthButtonNative({
  redirectTo,
  variant = "default",
}: GoogleAuthButtonProps) {
  const isMobileVariant = variant === "mobile";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<PendingGoogleConsent | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [hasPreviousAccount, setHasPreviousAccount] = useState(false);
  const exchangeGoogleToken = useGoogleTokenExchange(redirectTo);
  const nativeWebClientId = getNativeGoogleWebClientId();

  useEffect(() => {
    if (!nativeWebClientId) return;

    GoogleSignin.configure({
      webClientId: nativeWebClientId,
      iosClientId: googleClientConfig.iosClientId,
      profileImageSize: 120,
    });
    setHasPreviousAccount(GoogleSignin.hasPreviousSignIn());
  }, [nativeWebClientId]);

  async function handlePress(forceAccountChooser = false) {
    if (!nativeWebClientId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (forceAccountChooser && GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
        setHasPreviousAccount(false);
      }
      const signInResult = await GoogleSignin.signIn();

      if (signInResult.type === "cancelled") {
        setIsSubmitting(false);
        return;
      }

      const idToken =
        signInResult.data.idToken || (await GoogleSignin.getTokens()).idToken;

      if (!idToken) {
        Alert.alert(
          "Google sign-in failed",
          "Google did not return a sign-in token. Please try again.",
        );
        setIsSubmitting(false);
        return;
      }

      const result = await exchangeGoogleToken(idToken, false);
      if (result.requiresTerms) {
        setPendingConsent({
          idToken: result.idToken,
          email: result.email,
          displayName: result.displayName,
        });
        setAcceptedTerms(false);
        setHasPreviousAccount(true);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          setIsSubmitting(false);
          return;
        }
        if (err.code === statusCodes.IN_PROGRESS) {
          setIsSubmitting(false);
          return;
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert(
            "Google Play Services required",
            "Update Google Play Services on this device and try again.",
          );
          setIsSubmitting(false);
          return;
        }
      }

      const message =
        err instanceof Error ? err.message : "Google sign-in failed";
      Alert.alert("Google sign-in failed", message);
      setIsSubmitting(false);
      return;
    }

    setPendingConsent(null);
    setAcceptedTerms(false);
    setHasPreviousAccount(true);
    setIsSubmitting(false);
  }

  async function handleConsentContinue() {
    if (!pendingConsent || !acceptedTerms || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await exchangeGoogleToken(pendingConsent.idToken, true);
      setPendingConsent(null);
      setAcceptedTerms(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed";
      Alert.alert("Google sign-in failed", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        visible={pendingConsent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmitting) {
            setPendingConsent(null);
            setAcceptedTerms(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!isSubmitting) {
                setPendingConsent(null);
                setAcceptedTerms(false);
              }
            }}
          />
          <View style={[styles.modalCard, isMobileVariant && styles.mobileModalCard]}>
            <Text style={styles.modalTitle}>Agree to Continue</Text>
            <Text style={styles.modalBody}>
              Before we create your Keystone account with Google, please agree
              to the Terms and Conditions and Privacy Policy.
            </Text>

            {pendingConsent ? (
              <View style={[styles.accountCard, isMobileVariant && styles.mobileAccountCard]}>
                <Text style={styles.accountLabel}>Google account</Text>
                <Text style={styles.accountName}>
                  {pendingConsent.displayName?.trim() || pendingConsent.email}
                </Text>
                <Text style={styles.accountEmail}>{pendingConsent.email}</Text>
              </View>
            ) : null}

            <TermsAgreement
              accepted={acceptedTerms}
              onToggle={() => setAcceptedTerms((current) => !current)}
              variant={isMobileVariant ? "mobile" : "default"}
            />

            <View style={styles.modalActions}>
              {isMobileVariant ? (
                <>
                  <SurfaceButton
                    label="Cancel"
                    onPress={() => {
                      setPendingConsent(null);
                      setAcceptedTerms(false);
                    }}
                    disabled={isSubmitting}
                    style={styles.modalAction}
                  />
                  <SurfaceButton
                    label={isSubmitting ? "Creating account..." : "Agree and Continue"}
                    onPress={() => void handleConsentContinue()}
                    variant="primary"
                    disabled={!acceptedTerms || isSubmitting}
                    style={styles.modalAction}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.modalAction]}
                    onPress={() => {
                      setPendingConsent(null);
                      setAcceptedTerms(false);
                    }}
                    activeOpacity={0.82}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      styles.modalAction,
                      (!acceptedTerms || isSubmitting) && styles.primaryButtonDisabled,
                    ]}
                    onPress={handleConsentContinue}
                    activeOpacity={0.82}
                    disabled={!acceptedTerms || isSubmitting}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSubmitting ? "Creating account..." : "Agree and Continue"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {isMobileVariant ? (
        <SurfaceButton
          label={isSubmitting ? "Connecting to Google..." : "Continue with Google"}
          onPress={() => void handlePress()}
          disabled={!nativeWebClientId || isSubmitting}
        />
      ) : (
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={() => void handlePress()}
          activeOpacity={0.85}
          disabled={!nativeWebClientId || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Connecting to Google..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>
      )}

      {hasPreviousAccount ? (
        isMobileVariant ? (
          <SurfaceButton
            label="Use a different Google account"
            onPress={() => void handlePress(true)}
            disabled={isSubmitting}
            size="compact"
            style={styles.mobileSwitchAccountButton}
          />
        ) : (
          <TouchableOpacity
            style={styles.switchAccountButton}
            onPress={() => void handlePress(true)}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <Text style={styles.switchAccountText}>
              Use a different Google account
            </Text>
          </TouchableOpacity>
        )
      ) : null}
    </>
  );
}

export default function GoogleAuthButton({
  redirectTo = null,
  variant = "default",
}: GoogleAuthButtonProps) {
  const hasClientId = !!getCurrentPlatformClientId();
  const isExpoGoNative =
    Platform.OS !== "web" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const configuredWebOrigin = getConfiguredWebOrigin();
  const currentWebOrigin =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : null;
  const hasWebOriginMismatch =
    Platform.OS === "web" &&
    !!configuredWebOrigin &&
    !!currentWebOrigin &&
    configuredWebOrigin !== currentWebOrigin;

  if (isExpoGoNative) {
    if (variant === "mobile") {
      return (
        <SurfaceButton
          label="Continue with Google"
          onPress={() =>
            Alert.alert(
              "Google sign-in needs a development build",
              "Expo Go cannot be used to test OAuth sign-in flows like Google on native. Use web for now, or run a development build and test again.",
            )
          }
        />
      );
    }

    return (
      <Pressable
        style={({ hovered, pressed }) => [
          styles.button,
          (hovered || pressed) && styles.buttonActive,
        ]}
        onPress={() =>
          Alert.alert(
            "Google sign-in needs a development build",
            "Expo Go cannot be used to test OAuth sign-in flows like Google on native. Use web for now, or run a development build and test again.",
          )
        }
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>
    );
  }

  if (hasWebOriginMismatch) {
    if (variant === "mobile") {
      return (
        <SurfaceButton
          label="Continue with Google"
          onPress={() =>
            Alert.alert(
              "Open the configured web URL",
              `Google sign-in is configured for ${configuredWebOrigin}. Open the app from that exact address to avoid redirect mismatches.`,
            )
          }
        />
      );
    }

    return (
      <Pressable
        style={({ hovered, pressed }) => [
          styles.button,
          (hovered || pressed) && styles.buttonActive,
        ]}
        onPress={() =>
          Alert.alert(
            "Open the configured web URL",
            `Google sign-in is configured for ${configuredWebOrigin}. Open the app from that exact address to avoid redirect mismatches.`,
          )
        }
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>
    );
  }

  if (!hasClientId) {
    if (variant === "mobile") {
      return (
        <SurfaceButton
          label="Continue with Google"
          onPress={() =>
            Alert.alert(
              "Google sign-in isn't configured yet",
              "Add your Google client IDs to the Expo environment first.",
            )
          }
        />
      );
    }

    return (
      <Pressable
        style={({ hovered, pressed }) => [
          styles.button,
          (hovered || pressed) && styles.buttonActive,
        ]}
        onPress={() =>
          Alert.alert(
            "Google sign-in isn't configured yet",
            "Add your Google client IDs to the Expo environment first.",
          )
        }
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>
    );
  }

  if (Platform.OS === "android" || Platform.OS === "ios") {
    return <GoogleAuthButtonNative redirectTo={redirectTo} variant={variant} />;
  }

  return <GoogleAuthButtonWeb redirectTo={redirectTo} variant={variant} />;
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: WEB_RADIUS.md,
    backgroundColor: Sketch.paper,
    alignItems: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  buttonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: "500",
    color: Sketch.ink,
    fontSize: 15,
    fontFamily: WEB_BODY_FONT,
  },
  switchAccountButton: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 4,
  },
  switchAccountText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.orange,
    fontFamily: WEB_BODY_FONT,
  },
  mobileSwitchAccountButton: {
    marginTop: 12,
    alignSelf: "stretch",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(33, 28, 24, 0.18)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: Sketch.paper,
    borderRadius: WEB_RADIUS.xl,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 16,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  mobileModalCard: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.line,
    borderRadius: 24,
    ...CARD_SHADOW,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
    fontFamily: WEB_BODY_FONT,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  accountCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: WEB_RADIUS.md,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 14,
    gap: 4,
  },
  mobileAccountCard: {
    backgroundColor: BRAND.panel,
    borderColor: BRAND.line,
    borderRadius: 18,
    ...SURFACE_SHADOW,
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: WEB_BODY_FONT,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  accountEmail: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalAction: {
    flex: 1,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.orange,
    borderRadius: WEB_RADIUS.md,
    borderWidth: 1,
    borderColor: Sketch.accentDark,
    paddingVertical: 13,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: WEB_BODY_FONT,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.paperDark,
    borderRadius: WEB_RADIUS.md,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 13,
    paddingHorizontal: 16,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
});
