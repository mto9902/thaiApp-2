import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const token = await AsyncStorage.getItem("token");

    if (!token) return;

    const decoded: any = jwtDecode(token);

    setUserId(decoded.userId);
  }

  async function logout() {
    await AsyncStorage.removeItem("token");

    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.info}>User ID: {userId}</Text>

      <Text style={styles.info}>Logged in</Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 20,
  },

  info: {
    fontSize: 18,
  },

  button: {
    marginTop: 30,
    backgroundColor: "black",
    padding: 14,
    borderRadius: 8,
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
  },
});
