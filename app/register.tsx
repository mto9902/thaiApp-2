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

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Signup failed");
      return;
    }

    await AsyncStorage.setItem("token", data.token);
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
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
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        autoComplete="new-password"
        textContentType="newPassword"
        nativeID="register-password"
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Create Account</Text>
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
});
