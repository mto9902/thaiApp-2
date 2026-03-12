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
import { Sketch, sketchShadow } from "@/constants/theme";

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
        <View style={styles.titleCard}>
          <Text style={styles.title}>Login</Text>
        </View>

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
          <Text style={styles.buttonText}>LOGIN</Text>
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

  titleCard: {
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
    marginBottom: 30,
    ...sketchShadow(4),
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Sketch.cardBg,
  },

  input: {
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: Sketch.cardBg,
    color: Sketch.ink,
  },

  button: {
    backgroundColor: Sketch.ink,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    ...sketchShadow(4),
  },

  buttonText: {
    color: Sketch.cardBg,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },

  linkText: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "700",
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
    height: 2,
    backgroundColor: Sketch.inkFaint,
  },
  dividerText: {
    marginHorizontal: 12,
    color: Sketch.inkMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  guestButton: {
    padding: 16,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    backgroundColor: Sketch.cardBg,
    alignItems: "center",
    ...sketchShadow(3),
  },
  guestButtonText: {
    fontWeight: "800",
    color: Sketch.inkLight,
    fontSize: 15,
  },
});
