import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import GoogleAuthButton from "@/src/components/GoogleAuthButton";
import {
  WEB_BODY_FONT,
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
import AuthShell from "@/src/components/web/AuthShell";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";
import { API_BASE } from "@/src/config";
import LoginMobileScreen from "@/src/screens/mobile/LoginMobileScreen";
import { clearAuthToken, setAuthToken } from "@/src/utils/authStorage";

export default function LoginWeb() {
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <LoginMobileScreen />;
  }

  return <LoginWebDesktop />;
}

function LoginWebDesktop() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirectTo?: string }>();
  const redirectTo = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleGuest() {
    await clearAuthToken();
    await AsyncStorage.setItem("isGuest", "true");
    router.replace("/(tabs)");
  }

  async function handleLogin() {
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      await AsyncStorage.multiRemove(["isGuest"]);
      await setAuthToken(data.token);
      router.replace((redirectTo || "/(tabs)") as any);
    } catch {
      setError(
        "We could not reach the server right now. Please try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <AuthShell
        rightEyebrow="Sign in"
        rightTitle="Continue with Keystone"
        rightSubtitle="Use your email or Google account to sign in or get started."
        footerPrompt="Don't have an account?"
        secondaryActionLabel="Sign up now!"
        onSecondaryActionPress={() =>
          router.push(
            (redirectTo
              ? `/register?redirectTo=${encodeURIComponent(redirectTo)}`
              : "/register") as any,
          )
        }
        features={[]}
      >
        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={Sketch.inkMuted}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />

          <TextInput
            ref={passwordInputRef}
            placeholder="Password"
            placeholderTextColor={Sketch.inkMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textContentType="password"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Pressable
            onPress={() => router.push("/forgot-password")}
            disabled={submitting}
            style={({ hovered, pressed }) => [
              styles.inlineLinkWrap,
              submitting && styles.disabledAction,
              (hovered || pressed) && !submitting && styles.inlineLinkWrapActive,
            ]}
          >
            <Text style={styles.inlineLinkText}>Forgot password?</Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            style={({ hovered, pressed }) => [
              styles.primaryButton,
              submitting && styles.disabledAction,
              (hovered || pressed) && !submitting && styles.primaryButtonActive,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Log in</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleAuthButton redirectTo={redirectTo} />

          <Pressable
            style={({ hovered, pressed }) => [
              styles.ghostButton,
              (hovered || pressed) && styles.ghostButtonActive,
            ]}
            onPress={handleGuest}
          >
            <Text style={styles.ghostButtonText}>Continue as guest</Text>
          </Pressable>
        </View>
      </AuthShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: Sketch.paper,
    color: Sketch.ink,
    borderRadius: WEB_RADIUS.md,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    fontFamily: WEB_BODY_FONT,
    outlineStyle: "none" as any,
  },
  inlineLinkWrap: {
    alignSelf: "flex-end",
    marginTop: -2,
    paddingVertical: 4,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  inlineLinkWrapActive: {
    opacity: 0.76,
  },
  inlineLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accent,
    fontFamily: WEB_BODY_FONT,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.red,
    marginTop: -2,
    fontFamily: WEB_BODY_FONT,
  },
  primaryButton: {
    backgroundColor: Sketch.accent,
    borderRadius: WEB_RADIUS.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.accentDark,
    marginTop: 4,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  disabledAction: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Sketch.inkFaint,
  },
  dividerText: {
    fontSize: 12,
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: WEB_BODY_FONT,
  },
  ghostButton: {
    borderRadius: WEB_RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  ghostButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  },
});

