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
import { API_BASE } from "../src/config";

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
      headers: {
        "Content-Type": "application/json",
      },
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
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={{ marginTop: 20, textAlign: "center" }}>
          Create account
        </Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 30,
  },

  input: {
    borderWidth: 2,
    borderColor: "black",
    padding: 12,
    marginBottom: 16,
  },

  button: {
    backgroundColor: "black",
    padding: 16,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
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
    backgroundColor: "#DDD",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
  },
  guestButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: "#DDD",
    borderRadius: 8,
  },
  guestButtonText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#757575",
  },
});
