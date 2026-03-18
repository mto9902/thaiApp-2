import { Sketch } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "../src/config";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPassword() {
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
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your account email and we will send you a reset link.
        </Text>

        <View style={styles.form}>
          {!submitted ? (
            <>
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
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                activeOpacity={0.82}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Send reset link</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successBody}>
                If an account exists for {email.toLowerCase().trim()}, we sent a password reset link.
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 6,
    marginBottom: 34,
    lineHeight: 22,
  },
  form: {
    gap: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "400",
    backgroundColor: Sketch.paper,
    color: Sketch.ink,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.red,
    marginTop: -4,
    marginBottom: 8,
  },
  button: {
    backgroundColor: Sketch.orange,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  successCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    padding: 18,
    gap: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  successBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  linkText: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "500",
    color: Sketch.orange,
    fontSize: 15,
  },
});
