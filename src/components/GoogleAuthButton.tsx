import { Sketch } from "@/constants/theme";
import TermsAgreement from "@/src/components/TermsAgreement";
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
    return configuredWebRedirectUri;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }

  return undefined;
}

function getConfiguredWebOrigin() {
  if (!configuredWebRedirectUri) return null;

  try {
    return new URL(configuredWebRedirectUri).origin;
  } catch {
    return null;
  }
}

type PendingGoogleConsent = {
  idToken: string;
  email: string;
  displayName?: string | null;
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

function useGoogleTokenExchange() {
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
      router.replace("/(tabs)");

      return {
        requiresTerms: false as const,
      };
    },
    [router],
  );
}

function GoogleAuthButtonWeb() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<PendingGoogleConsent | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const exchangeGoogleToken = useGoogleTokenExchange();
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

    const idToken =
      response?.params?.id_token ?? response?.authentication?.idToken ?? "";

    if (response?.type !== "success") {
      return;
    }

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
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agree to Continue</Text>
            <Text style={styles.modalBody}>
              Before we create your Keystone account with Google, please agree
              to the Terms and Conditions and Privacy Policy.
            </Text>

            {pendingConsent ? (
              <View style={styles.accountCard}>
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
            />

            <View style={styles.modalActions}>
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
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={!request || isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Connecting to Google..." : "Continue with Google"}
        </Text>
      </TouchableOpacity>
    </>
  );
}

function GoogleAuthButtonNative() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<PendingGoogleConsent | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [hasPreviousAccount, setHasPreviousAccount] = useState(false);
  const exchangeGoogleToken = useGoogleTokenExchange();
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
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agree to Continue</Text>
            <Text style={styles.modalBody}>
              Before we create your Keystone account with Google, please agree
              to the Terms and Conditions and Privacy Policy.
            </Text>

            {pendingConsent ? (
              <View style={styles.accountCard}>
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
            />

            <View style={styles.modalActions}>
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
            </View>
          </View>
        </View>
      </Modal>

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

      {hasPreviousAccount ? (
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
      ) : null}
    </>
  );
}

export default function GoogleAuthButton() {
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
    return (
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert(
            "Google sign-in needs a development build",
            "Expo Go cannot be used to test OAuth sign-in flows like Google on native. Use web for now, or run a development build and test again.",
          )
        }
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    );
  }

  if (hasWebOriginMismatch) {
    return (
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert(
            "Open the configured web URL",
            `Google sign-in is configured for ${configuredWebOrigin}. Open the app from that exact address to avoid redirect mismatches.`,
          )
        }
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    );
  }

  if (!hasClientId) {
    return (
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert(
            "Google sign-in isn't configured yet",
            "Add your Google client IDs to the Expo environment first.",
          )
        }
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    );
  }

  if (Platform.OS === "android" || Platform.OS === "ios") {
    return <GoogleAuthButtonNative />;
  }

  return <GoogleAuthButtonWeb />;
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: 10,
    backgroundColor: Sketch.paper,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: "500",
    color: Sketch.ink,
    fontSize: 15,
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  accountCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 14,
    gap: 4,
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  accountEmail: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 13,
    shadowColor: Sketch.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.paperDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
  },
});
