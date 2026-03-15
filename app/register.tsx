import { Sketch } from "@/constants/theme";
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
import { API_BASE } from "../src/config";

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
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
            autoComplete="off"
            textContentType="none"
            inputMode="email"
            nativeID="register-email"
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
            autoComplete="new-password"
            textContentType="newPassword"
            nativeID="register-password"
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
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

  linkText: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "500",
    color: Sketch.orange,
    fontSize: 15,
  },
});
