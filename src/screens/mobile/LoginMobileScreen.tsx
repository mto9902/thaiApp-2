import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import GoogleAuthButton from "@/src/components/GoogleAuthButton";
import { API_BASE } from "@/src/config";
import AuthMobileShell from "@/src/screens/mobile/AuthMobileShell";
import { BRAND, SurfaceButton } from "@/src/screens/mobile/dashboardSurface";
import { clearAuthToken, setAuthToken } from "@/src/utils/authStorage";

export default function LoginMobileScreen() {
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
      setError("We could not reach the server right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthMobileShell
      title="Continue with Keystone"
      subtitle="Sign in or get started."
      footerPrompt="Don't have an account?"
      footerActionLabel="Sign up now!"
      onFooterActionPress={() =>
        router.push(
          (redirectTo
            ? `/register?redirectTo=${encodeURIComponent(redirectTo)}`
            : "/register") as any,
        )
      }
    >
      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          placeholderTextColor={BRAND.muted}
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
          placeholderTextColor={BRAND.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <View style={styles.inlineActionRow}>
          <Pressable onPress={() => router.push("/forgot-password")} style={styles.textLink}>
            <Text style={styles.textLinkLabel}>Forgot password?</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <SurfaceButton
          label={submitting ? "Logging in..." : "Log in"}
          onPress={() => void handleLogin()}
          variant="primary"
          disabled={submitting || !email.trim() || !password}
          style={styles.fullWidthButton}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleAuthButton redirectTo={redirectTo} variant="mobile" />

        <SurfaceButton
          label="Continue as guest"
          onPress={() => void handleGuest()}
          disabled={submitting}
          style={styles.fullWidthButton}
        />
      </View>
    </AuthMobileShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "500",
    color: BRAND.ink,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : null),
  },
  inlineActionRow: {
    alignItems: "flex-end",
    marginTop: -2,
  },
  textLink: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  textLinkLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#B42318",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BRAND.line,
  },
  dividerText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: BRAND.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  fullWidthButton: {
    alignSelf: "stretch",
  },
});
