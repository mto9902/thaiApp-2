import { useRouter } from "expo-router";
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
import AuthShell from "@/src/components/web/AuthShell";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
import { API_BASE } from "@/src/config";
import ForgotPasswordMobileScreen from "@/src/screens/mobile/ForgotPasswordMobileScreen";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordWeb() {
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <ForgotPasswordMobileScreen />;
  }

  return <ForgotPasswordWebDesktop />;
}

function ForgotPasswordWebDesktop() {
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

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ hovered, pressed }) => [
                  styles.primaryButton,
                  loading && styles.disabledAction,
                  (hovered || pressed) && !loading && styles.primaryButtonActive,
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send reset link</Text>
                )}
              </Pressable>
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

          <Pressable
            onPress={() => router.replace("/login")}
            style={({ hovered, pressed }) => [
              styles.secondaryLink,
              (hovered || pressed) && styles.secondaryLinkActive,
            ]}
          >
            <Text style={styles.secondaryLinkText}>Back to login</Text>
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
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: WEB_BODY_FONT,
  },
  disabledAction: {
    opacity: 0.55,
  },
  successCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    borderRadius: WEB_RADIUS.lg,
    padding: 22,
    gap: 8,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  successEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: WEB_BODY_FONT,
  },
  successTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  successBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  },
  successHint: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  secondaryLink: {
    alignSelf: "center",
    paddingVertical: 4,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  secondaryLinkActive: {
    opacity: 0.76,
  },
  secondaryLinkText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.accent,
    fontFamily: WEB_BODY_FONT,
  },
});
