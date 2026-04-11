import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, View } from "react-native";

import TermsAgreement from "@/src/components/TermsAgreement";
import { API_BASE } from "@/src/config";
import AuthMobileShell from "@/src/screens/mobile/AuthMobileShell";
import { BRAND, SurfaceButton } from "@/src/screens/mobile/dashboardSurface";
import { setAuthToken } from "@/src/utils/authStorage";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export default function RegisterMobileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirectTo?: string }>();
  const redirectTo = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;
  const passwordInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (submitting) return;

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert(
        "Weak password",
        "Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.",
      );
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(
        "Agreement required",
        "Please agree to the Terms and Conditions and Privacy Policy to create an account.",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          acceptedTerms: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      await AsyncStorage.multiRemove(["isGuest"]);
      await setAuthToken(data.token);
      router.replace((redirectTo || "/(tabs)") as any);
    } catch {
      setError("We could not create your account right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthMobileShell
      title="Get started with Keystone"
      subtitle="Save your progress across web and mobile."
      footerPrompt="Already have an account?"
      footerActionLabel="Log in"
      onFooterActionPress={() =>
        router.push(
          (redirectTo
            ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
            : "/login") as any,
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
          inputMode="email"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />
        {email.trim().length > 0 && !isValidEmail(email.toLowerCase().trim()) ? (
          <Text style={styles.validationText}>Enter a valid email address.</Text>
        ) : null}

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
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />
        <Text style={styles.helperText}>
          Use at least 8 characters with uppercase, lowercase, and a number.
        </Text>
        {password.length > 0 && !isValidPassword(password) ? (
          <Text style={styles.validationText}>
            Password does not meet the requirements yet.
          </Text>
        ) : null}

        <TermsAgreement
          accepted={acceptedTerms}
          onToggle={() => setAcceptedTerms((current) => !current)}
          variant="mobile"
        />

        {error ? <Text style={styles.validationText}>{error}</Text> : null}

        <SurfaceButton
          label={submitting ? "Creating account..." : "Create account"}
          onPress={() => void handleRegister()}
          variant="primary"
          disabled={!acceptedTerms || submitting}
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
  helperText: {
    marginTop: -4,
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  validationText: {
    marginTop: -4,
    fontSize: 12,
    lineHeight: 18,
    color: "#B42318",
  },
  fullWidthButton: {
    alignSelf: "stretch",
  },
});
