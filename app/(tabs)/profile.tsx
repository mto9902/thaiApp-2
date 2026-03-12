import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
import Header from "../../src/components/Header";
import { API_BASE } from "../../src/config";
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
      const res = await fetch(`${API_BASE}/vocab/progress`, {
        headers: { Authorization: `Bearer ${token}` },
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
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Header title="Profile" onBack={() => router.back()} showSettings={false} />
        <View style={styles.centerWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>?</Text>
          </View>
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestSub}>
            Log in to save your progress, bookmarks, and vocabulary
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={logout}>
            <Text style={styles.primaryBtnText}>LOG IN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Profile" onBack={() => router.back()} showSettings={false} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {userId ? `#${userId}` : "..."}
            </Text>
          </View>
          <Text style={styles.profileLabel}>USER ID</Text>
          <Text style={styles.profileValue}>{userId || "..."}</Text>
        </View>

        {/* Daily Progress */}
        <Text style={styles.sectionLabel}>TODAY'S PROGRESS</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Sketch.yellowLight }]}>
            <Text style={styles.statNum}>{progress?.reviews_today || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#D4EDDA" }]}>
            <Text style={styles.statNum}>{progress?.words_learned_today || 0}</Text>
            <Text style={styles.statLabel}>Learned</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#E8D5F5" }]}>
            <Text style={styles.statNum}>{progress?.mastered_words || 0}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
        </View>

        {/* Debug Section */}
        <Text style={styles.sectionLabel}>DEBUG</Text>
        <View style={styles.debugCard}>
          {[
            { label: "Vocab Stats", route: "/debug/VocabStats" },
            { label: "Vocab Review", route: "/debug/review" },
            { label: "Mastery Stats", route: "/debug/MasteryStats" },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.debugRow}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.debugRowText}>{item.label}</Text>
              <Text style={styles.debugArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { padding: 20, paddingBottom: 40 },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 12,
  },

  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    justifyContent: "center",
    alignItems: "center",
    ...sketchShadow(3),
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: Sketch.cardBg,
  },

  guestTitle: { fontSize: 22, fontWeight: "900", color: Sketch.ink },
  guestSub: {
    fontSize: 14,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  profileCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    ...sketchShadow(4),
  },
  profileLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Sketch.inkMuted,
    letterSpacing: 1.5,
    marginTop: 12,
  },
  profileValue: {
    fontSize: 20,
    fontWeight: "900",
    color: Sketch.ink,
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: Sketch.inkMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    ...sketchShadow(3),
  },
  statNum: {
    fontSize: 24,
    fontWeight: "900",
    color: Sketch.ink,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Sketch.inkLight,
    marginTop: 4,
  },

  debugCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    ...sketchShadow(3),
  },
  debugRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: Sketch.inkFaint,
  },
  debugRowText: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
  },
  debugArrow: {
    fontSize: 16,
    fontWeight: "900",
    color: Sketch.inkMuted,
  },

  primaryBtn: {
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginTop: 8,
    ...sketchShadow(3),
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: Sketch.cardBg,
  },

  logoutBtn: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    ...sketchShadow(3),
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: Sketch.red,
  },
});
