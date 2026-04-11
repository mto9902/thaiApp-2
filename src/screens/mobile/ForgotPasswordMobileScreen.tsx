import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { API_BASE } from "@/src/config";
import AuthMobileShell from "@/src/screens/mobile/AuthMobileShell";
import {
  BRAND,
  SURFACE_SHADOW,
  SurfaceButton,
} from "@/src/screens/mobile/dashboardSurface";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordMobileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "We could not send the reset email.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("We could not send the reset email right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthMobileShell
      title="Reset your password"
      subtitle="We'll send a reset link to your email."
      footerActionLabel="Back to login"
      onFooterActionPress={() => router.replace("/login")}
    >
      {!submitted ? (
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
            inputMode="email"
            keyboardType="email-address"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <SurfaceButton
            label={loading ? "Sending..." : "Send reset link"}
            onPress={() => void handleSubmit()}
            variant="primary"
            disabled={loading}
          />
        </View>
      ) : (
        <View style={styles.successCard}>
          <Text style={styles.successEyebrow}>Check your inbox</Text>
          <Text style={styles.successTitle}>Reset email sent</Text>
          <Text style={styles.successBody}>
            If an account exists for {email.toLowerCase().trim()}, we sent a
            password reset link there.
          </Text>
        </View>
      )}
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
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#B42318",
  },
  successCard: {
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 20,
    backgroundColor: BRAND.panel,
    padding: 16,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  successEyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: BRAND.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  successTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
  },
  successBody: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
});
