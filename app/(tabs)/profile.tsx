import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { clearAuthState, isGuestUser } from "../../src/utils/auth";

export default function Profile() {
  const [userId, setUserId] = useState<number | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  const router = useRouter();

  useEffect(() => {
    isGuestUser().then((g) => {
      setIsGuest(g);
      if (!g) {
        loadUser();
        loadProgress();
      }
    });
  }, []);

  async function loadUser() {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    const decoded: any = jwtDecode(token);
    setUserId(decoded.userId);
  }

  async function loadProgress() {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch("http://192.168.1.121:3000/vocab/progress", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error("Failed to load progress:", err);
    }
  }

  async function logout() {
    await clearAuthState();
    router.replace("/login");
  }

  if (isGuest) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Guest Mode</Text>
        <Text style={styles.info}>You're browsing as a guest</Text>
        <Text style={[styles.info, { color: "#999", marginTop: 8, textAlign: "center", paddingHorizontal: 30 }]}>
          Log in to save your progress, bookmarks, and vocabulary
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#42A5F5" }]}
          onPress={logout}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.info}>User ID: {userId}</Text>
      <Text style={styles.info}>Logged in</Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      {/* DEBUG SECTION */}

      <Text style={styles.debugTitle}>Debug</Text>

      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => router.push("/debug/VocabStats")}
      >
        <Text style={styles.buttonText}>Vocab Stats</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => router.push("/debug/review")}
      >
        <Text style={styles.buttonText}>Vocab Review</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => router.push("/debug/MasteryStats")}
      >
        <Text style={styles.buttonText}>Mastery Stats</Text>
      </TouchableOpacity>

      {/* DAILY PROGRESS */}

      <View style={styles.statsBox}>
        <Text style={styles.stat}>
          Today's reviews: {progress?.reviews_today || 0}
        </Text>

        <Text style={styles.stat}>
          Words learned today: {progress?.words_learned_today || 0}
        </Text>

        <Text style={styles.stat}>
          Mastered words: {progress?.mastered_words || 0}
        </Text>
      </View>
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

  debugTitle: {
    marginTop: 40,
    fontSize: 18,
    fontWeight: "900",
  },

  debugButton: {
    marginTop: 12,
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 8,
  },

  statsBox: {
    marginTop: 30,
    padding: 20,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  stat: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
});
