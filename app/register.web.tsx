import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import TermsAgreement from "@/src/components/TermsAgreement";
import AuthShell from "@/src/components/web/AuthShell";
import { API_BASE } from "@/src/config";
import { setAuthToken } from "@/src/utils/authStorage";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export default function RegisterWeb() {
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
      setError(
        "We could not create your account right now. Please try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <AuthShell
        pageEyebrow="Keystone Thai"
        pageTitle="Build real Thai sentence understanding."
        pageSubtitle="Create an account to keep your lesson path, saved grammar, review cards, and progress together across web and mobile."
        rightEyebrow="Create account"
        rightTitle="Join Keystone"
        rightSubtitle="Start with the open lessons, then keep the full path attached to your account."
        footerNote="No gamification, real understanding."
        secondaryActionLabel="Back to login"
        onSecondaryActionPress={() =>
          router.push(
            (redirectTo
              ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
              : "/login") as any,
          )
        }
        features={[
          {
            eyebrow: "Path",
            title: "Keep your lesson flow in one place",
            body: "Your next lesson, bookmarks, and grammar progress stay tied to the same account.",
          },
          {
            eyebrow: "Review",
            title: "Pick vocabulary back up on any device",
            body: "Review cards and remembered words carry across web and mobile once you sign in.",
          },
          {
            eyebrow: "Access",
            title: "Unlock more only when you are ready",
            body: "Start with the free lessons, then move into Keystone Access when you want the full grammar path.",
          },
          {
            eyebrow: "Return",
            title: "Come back without losing your place",
            body: "The same progress and saved lessons wait for you when you return later.",
          },
        ]}
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
            placeholderTextColor={Sketch.inkMuted}
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
            Use at least 8 characters, including uppercase, lowercase, and a number.
          </Text>
          {password.length > 0 && !isValidPassword(password) ? (
            <Text style={styles.validationText}>
              Password does not meet the requirements yet.
            </Text>
          ) : null}

          <TermsAgreement
            accepted={acceptedTerms}
            onToggle={() => setAcceptedTerms((current) => !current)}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!acceptedTerms || submitting) && styles.disabledAction,
            ]}
            onPress={handleRegister}
            disabled={!acceptedTerms || submitting}
            activeOpacity={acceptedTerms && !submitting ? 0.82 : 1}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create account</Text>
            )}
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
    gap: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: Sketch.paper,
    color: Sketch.ink,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.inkMuted,
    marginTop: -4,
    marginBottom: 8,
  },
  validationText: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.red,
    marginTop: -4,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.red,
    marginTop: 4,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: Sketch.accent,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  disabledAction: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
