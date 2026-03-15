import { Sketch } from "@/constants/theme";
import TermsAgreement from "@/src/components/TermsAgreement";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
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

function isValidPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleRegister() {
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

    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        acceptedTerms: true,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Signup failed");
      return;
    }

    await AsyncStorage.multiRemove(["isGuest"]);
    await AsyncStorage.setItem("token", data.token);
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Keystone</Text>

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
            nativeID="register-email"
          />
          {email.trim().length > 0 && !isValidEmail(email.toLowerCase().trim()) ? (
            <Text style={styles.validationText}>Enter a valid email address.</Text>
          ) : null}

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
            autoComplete="new-password"
            textContentType="newPassword"
            nativeID="register-password"
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

          <TouchableOpacity
            style={[styles.button, !acceptedTerms && styles.buttonDisabled]}
            onPress={handleRegister}
            activeOpacity={acceptedTerms ? 0.8 : 1}
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
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
    marginTop: 2,
    marginBottom: 40,
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

  button: {
    backgroundColor: Sketch.orange,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },

  linkText: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "500",
    color: Sketch.orange,
    fontSize: 15,
  },
});
