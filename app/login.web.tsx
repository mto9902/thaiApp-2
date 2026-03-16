import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import GoogleAuthButton from "@/src/components/GoogleAuthButton";
import { API_BASE } from "@/src/config";
import { clearAuthToken, setAuthToken } from "@/src/utils/authStorage";

export default function LoginWeb() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleGuest() {
    await clearAuthToken();
    await AsyncStorage.setItem("isGuest", "true");
    router.replace("/(tabs)");
  }

  async function handleLogin() {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    await AsyncStorage.multiRemove(["isGuest"]);
    await setAuthToken(data.token);
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Keystone Thai</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            Log in to continue grammar, vocabulary review, bookmarks, and your saved progress.
          </Text>

          <View style={styles.heroCard}>
            <Text style={styles.heroCardTitle}>What carries across devices</Text>
            <Text style={styles.heroCardBody}>
              Grammar progress, vocabulary review, saved lessons, activity heatmap,
              and your Keystone Access status.
            </Text>
          </View>
        </View>

        <View style={styles.formPanel}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formBody}>
            Use email or Google to get back into your lessons.
          </Text>

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
            />

            <TextInput
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
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.secondaryLinkText}>Create account</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <GoogleAuthButton />

            <TouchableOpacity style={styles.ghostButton} onPress={handleGuest}>
              <Text style={styles.ghostButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
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
  shell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  hero: {
    flex: 1.05,
    paddingHorizontal: 56,
    paddingVertical: 56,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: Sketch.inkFaint,
    gap: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -1.5,
  },
  subtitle: {
    maxWidth: 520,
    fontSize: 18,
    lineHeight: 30,
    color: Sketch.inkLight,
  },
  heroCard: {
    marginTop: 10,
    maxWidth: 420,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 22,
    gap: 8,
  },
  heroCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  heroCardBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  formPanel: {
    width: 480,
    paddingHorizontal: 48,
    paddingVertical: 56,
    justifyContent: "center",
    gap: 12,
  },
  formTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.8,
  },
  formBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
    marginBottom: 10,
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
  primaryButton: {
    backgroundColor: Sketch.accent,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.accent,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryLink: {
    paddingVertical: 6,
  },
  secondaryLinkText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.accent,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
