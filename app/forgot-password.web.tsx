import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import AuthShell from "@/src/components/web/AuthShell";
import { API_BASE } from "@/src/config";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordWeb() {
  const router = useRouter();
  const emailInputRef = useRef<TextInput>(null);
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
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <AuthShell
        pageEyebrow="Account recovery"
        pageTitle="Get back into your lessons."
        pageSubtitle="Use the email attached to your Keystone account and we’ll send you a secure reset link."
        rightEyebrow="Reset password"
        rightTitle="Reset your password"
        rightSubtitle="Enter your account email. We’ll send you a link to choose a new password."
        footerNote="The reset link expires automatically for security."
        secondaryActionLabel="Back to login"
        onSecondaryActionPress={() => router.replace("/login")}
        features={[
          {
            eyebrow: "Step 1",
            title: "Enter the same email you use for Keystone",
            body: "Use the account email you normally sign in with on web or mobile.",
          },
          {
            eyebrow: "Step 2",
            title: "Open the reset email",
            body: "Check your inbox and spam folder, then open the reset link from Keystone Languages.",
          },
          {
            eyebrow: "Step 3",
            title: "Choose a new password",
            body: "Use at least 8 characters with uppercase, lowercase, and a number.",
          },
          {
            eyebrow: "Security",
            title: "Only the latest link should be used",
            body: "If you request another email, use the newest reset link and ignore the older one.",
          },
        ]}
      >
        <View style={styles.form}>
          {!submitted ? (
            <>
              <TextInput
                ref={emailInputRef}
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
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledAction]}
                onPress={handleSubmit}
                activeOpacity={0.82}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send reset link</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successCard}>
              <Text style={styles.successEyebrow}>Check your inbox</Text>
              <Text style={styles.successTitle}>Reset email sent</Text>
              <Text style={styles.successBody}>
                If an account exists for {email.toLowerCase().trim()}, we sent a password reset link there.
              </Text>
              <Text style={styles.successHint}>
                Open the newest email from Keystone Languages and follow the link inside.
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.replace("/login")}
            style={styles.secondaryLink}
          >
            <Text style={styles.secondaryLinkText}>Back to login</Text>
          </TouchableOpacity>
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
  },
  errorText: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.red,
    marginTop: -2,
  },
  primaryButton: {
    backgroundColor: Sketch.accent,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.accent,
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  disabledAction: {
    opacity: 0.55,
  },
  successCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 22,
    gap: 8,
  },
  successEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  successTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  successBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkLight,
  },
  successHint: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  secondaryLink: {
    paddingVertical: 4,
  },
  secondaryLinkText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.accent,
  },
});
