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
import { Sketch } from "@/constants/theme";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleGuest() {
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

    await AsyncStorage.setItem("token", data.token);
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Keystone</Text>
        <Text style={styles.subtitle}>Thai Grammar Blueprint</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={Sketch.inkMuted}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={Sketch.inkMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
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

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Sketch.inkFaint,
  },
  dividerText: {
    marginHorizontal: 12,
    color: Sketch.inkMuted,
    fontSize: 13,
    fontWeight: "400",
  },
  guestButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: 10,
    backgroundColor: Sketch.paper,
    alignItems: "center",
  },
  guestButtonText: {
    fontWeight: "500",
    color: Sketch.inkLight,
    fontSize: 15,
  },
});
