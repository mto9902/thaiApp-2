import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Sketch } from "@/constants/theme";
import { API_BASE } from "../../src/config";
import { clearAuthState, isGuestUser } from "../../src/utils/auth";

export default function Profile() {
  const [userId, setUserId] = useState<number | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [vocabStats, setVocabStats] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  const router = useRouter();

  useEffect(() => {
    isGuestUser().then((g) => {
      setIsGuest(g);
      if (!g) {
        loadUser();
        loadProgress();
        loadVocabStats();
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

  async function loadVocabStats() {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE}/vocab/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVocabStats(data);
    } catch (err) {
      console.error("Failed to load vocab stats:", err);
    }
  }

  async function logout() {
    await clearAuthState();
    router.replace("/login");
  }

  if (isGuest) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <View style={styles.centerWrap}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={28} color={Sketch.inkMuted} />
          </View>
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestSub}>
            Log in to save your progress, bookmarks, and vocabulary
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={logout}>
            <Text style={styles.primaryBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {userId ? `${userId}` : "..."}
            </Text>
          </View>
          <Text style={styles.profileName}>User #{userId || "..."}</Text>
        </View>

        <View style={styles.divider} />

        {/* Today's Progress */}
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{vocabStats?.reviews_due || 0}</Text>
            <Text style={styles.statLabel}>Reviews Due</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>
              {progress?.words_learned_today || 0}
            </Text>
            <Text style={styles.statLabel}>Learned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{progress?.mastered_words || 0}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Debug Section */}
        <Text style={styles.sectionTitle}>Debug</Text>
        <View style={styles.menuCard}>
          {[
            { label: "Vocab Stats", route: "/debug/VocabStats", icon: "bar-chart-outline" },
            { label: "Vocab Review", route: "/debug/review", icon: "flash-outline" },
            { label: "Mastery Stats", route: "/debug/MasteryStats", icon: "trophy-outline" },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuRow, i < arr.length - 1 && styles.menuRowBorder]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuRowLeft}>
                <Ionicons name={item.icon as any} size={18} color={Sketch.inkLight} />
                <Text style={styles.menuRowText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Sketch.inkMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
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

  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },

  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Sketch.paperDark,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: Sketch.ink,
  },

  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: Sketch.ink,
  },

  guestTitle: { fontSize: 22, fontWeight: "600", color: Sketch.ink },
  guestSub: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
    marginVertical: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
    marginBottom: 12,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  statNum: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 4,
  },

  menuCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuRowText: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.ink,
  },

  primaryBtn: {
    backgroundColor: Sketch.orange,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  logoutBtn: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.red,
  },
});
