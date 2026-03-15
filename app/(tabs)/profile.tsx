import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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

type UserProfile = {
  id: number;
  email: string;
};

type VocabProgress = {
  words_learned_today: number;
  mastered_words: number;
};

type VocabStats = {
  total_words: number;
  mastered_words: number;
};

type JwtPayload = {
  userId?: number;
};

export default function Profile() {
  const tabBarHeight = useBottomTabBarHeight();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<VocabProgress | null>(null);
  const [vocabStats, setVocabStats] = useState<VocabStats | null>(null);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [isGuest, setIsGuest] = useState(false);

  const router = useRouter();

  useEffect(() => {
    isGuestUser().then((guest) => {
      setIsGuest(guest);
      if (!guest) {
        loadData();
      }
    });
  }, []);

  async function loadData() {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode<JwtPayload>(token);
      const fallbackProfile = {
        id: decoded.userId || 0,
        email: "",
      };

      const [meRes, progressRes, statsRes, reviewRes] = await Promise.all([
        fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/vocab/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/vocab/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/vocab/review`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [meData, progressData, statsData, reviewData] = await Promise.all([
        meRes.ok ? meRes.json() : Promise.resolve(fallbackProfile),
        progressRes.json(),
        statsRes.json(),
        reviewRes.json(),
      ]);

      setProfile({
        id: meData.id ?? fallbackProfile.id,
        email: meData.email ?? "",
      });
      setProgress(progressData);
      setVocabStats(statsData);

      if (reviewData?.done || reviewData?.waiting) {
        setReviewsDue(0);
      } else {
        const counts = reviewData?.counts ?? {};
        setReviewsDue(
          (counts.newCount ?? 0) +
            (counts.learningCount ?? 0) +
            (counts.reviewCount ?? 0),
        );
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
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
          <Text style={styles.guestTitle}>Guest mode</Text>
          <Text style={styles.guestSub}>
            Log in to save your progress, bookmarks, vocabulary, and grammar
            history.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={logout}>
            <Text style={styles.primaryBtnText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarLabel =
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    (profile?.id ? String(profile.id) : "…");

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabBarHeight + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarLabel}</Text>
          </View>
          <Text style={styles.profileName}>User #{profile?.id || "..."}</Text>
          <Text style={styles.profileEmail}>
            {profile?.email || "Loading email..."}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Sketch.orange }]}>
              {reviewsDue}
            </Text>
            <Text style={styles.statLabel}>Reviews Due</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Sketch.blue }]}>
              {progress?.words_learned_today || 0}
            </Text>
            <Text style={styles.statLabel}>Learned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Sketch.green }]}>
              {progress?.mastered_words || 0}
            </Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Deck Snapshot</Text>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Tracked words</Text>
            <Text style={styles.snapshotValue}>
              {vocabStats?.total_words || 0}
            </Text>
          </View>
          <View style={[styles.snapshotRow, styles.snapshotRowLast]}>
            <Text style={styles.snapshotLabel}>Mastered words</Text>
            <Text style={styles.snapshotValue}>
              {vocabStats?.mastered_words || 0}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.menuCard}>
          {[
            {
              label: "Vocab Stats",
              route: "/stats/vocab",
              icon: "bar-chart-outline",
            },
            {
              label: "Grammar Stats",
              route: "/stats/grammar",
              icon: "analytics-outline",
            },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuRow,
                index < arr.length - 1 && styles.menuRowBorder,
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuRowLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={Sketch.inkLight}
                />
                <Text style={styles.menuRowText}>{item.label}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Sketch.inkMuted}
              />
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
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 12,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 16,
    gap: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "600",
    color: Sketch.ink,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 14,
    alignItems: "center",
  },
  statNum: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 6,
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  snapshotRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  snapshotLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
  snapshotValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
  },
  menuCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
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
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.red,
  },
});
