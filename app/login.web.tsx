import AsyncStorage from "@react-native-async-storage/async-storage";
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
import GoogleAuthButton from "@/src/components/GoogleAuthButton";
import AuthShell from "@/src/components/web/AuthShell";
import { API_BASE } from "@/src/config";
import { clearAuthToken, setAuthToken } from "@/src/utils/authStorage";

export default function LoginWeb() {
  const router = useRouter();
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
      router.replace("/(tabs)");
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
        pageEyebrow="Keystone Thai"
        pageTitle="Grammar that stays connected."
        pageSubtitle="Come back to the same lesson flow, the same review tools, and the same progress across web and mobile."
        rightEyebrow="Sign in"
        rightTitle="Welcome back"
        rightSubtitle="Use your email or Google account to continue where you left off."
        footerNote="No gamification, real understanding."
        secondaryActionLabel="Create account"
        onSecondaryActionPress={() => router.push("/register")}
        features={[
          {
            eyebrow: "Study",
            title: "Pick up the next topic quickly",
            body: "Open a lesson, hear the example, and move straight into practice without re-learning the interface.",
          },
          {
            eyebrow: "Sync",
            title: "Keep progress across devices",
            body: "Grammar progress, bookmarks, review cards, and Keystone Access stay tied to your account.",
          },
          {
            eyebrow: "Review",
            title: "Return to saved words and lessons",
            body: "Your vocabulary review and bookmarked grammar stay available when you switch between web and mobile.",
          },
          {
            eyebrow: "Free start",
            title: "Browse first, unlock more when ready",
            body: "Start with the open lessons, then move into the full path only when you want deeper study.",
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

          <TouchableOpacity
            style={[styles.inlineLinkWrap, submitting && styles.disabledAction]}
            onPress={() => router.push("/forgot-password")}
            disabled={submitting}
          >
            <Text style={styles.inlineLinkText}>Forgot password?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.disabledAction]}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleAuthButton />

          <TouchableOpacity style={styles.ghostButton} onPress={handleGuest}>
            <Text style={styles.ghostButtonText}>Continue as guest</Text>
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
  inlineLinkWrap: {
    alignSelf: "flex-end",
    marginTop: -2,
  },
  inlineLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accent,
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
  disabledAction: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
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
  },
  ghostButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.inkLight,
  },
});
