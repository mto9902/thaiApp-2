import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "../../src/config";
import { GrammarPoint, grammarPoints } from "../../src/data/grammar";
import { isGuestUser } from "../../src/utils/auth";
import {
  GrammarProgressData,
  getAllProgress,
} from "../../src/utils/grammarProgress";
import { Sketch } from "@/constants/theme";

const LEVEL_COLORS: Record<number, string> = {
  1: Sketch.green,
  2: Sketch.blue,
  3: Sketch.red,
};
const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function accuracyLabel(p: GrammarProgressData): string {
  if (p.total === 0) return "—";
  return `${Math.round((p.correct / p.total) * 100)}%`;
}

export default function DecksScreen() {
  const router = useRouter();

  const [bookmarked, setBookmarked] = useState<GrammarPoint[]>([]);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  async function loadData() {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);

      if (guest) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const matched = data
        .map((b: any) => grammarPoints.find((g) => g.id === b.grammar_id))
        .filter(Boolean) as GrammarPoint[];

      const allProgress = await getAllProgress();

      setBookmarked(matched);
      setProgress(allProgress);
    } catch (err) {
      console.error("[Decks] loadData failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  function handleQuickMix() {
    if (bookmarked.length === 0) return;
    const shuffled = [...bookmarked]
      .sort(() => Math.random() - 0.5)
      .map((g) => g.id);
    router.push(
      `/practice/${shuffled[0]}/PracticeCSV?mix=${shuffled.join(",")}`,
    );
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Ionicons name="bookmark-outline" size={36} color={Sketch.inkMuted} />
        </View>
        <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
        <Text style={styles.emptySubtitle}>
          Browse grammar lessons and tap the bookmark button to save them here
          for quick practice.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/practice/levels")}
        >
          <Text style={styles.primaryBtnText}>Browse Grammar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderCard(item: GrammarPoint) {
    const p = progress[item.id];
    const levelColor = LEVEL_COLORS[item.level] || Sketch.green;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => router.push(`/practice/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <Text style={styles.levelBadgeText}>
              {LEVEL_NAMES[item.level] || `Level ${item.level}`}
            </Text>
          </View>
          <Ionicons name="bookmark" size={16} color={Sketch.orange} />
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        {p ? (
          <View style={styles.statsRow}>
            <Text style={styles.statText}>{p.rounds} rounds</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statText}>{accuracyLabel(p)} accuracy</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statText}>{timeAgo(p.lastPracticed)}</Text>
          </View>
        ) : (
          <Text style={styles.noPractice}>Not practiced yet</Text>
        )}

        <TouchableOpacity
          style={styles.practiceBtn}
          onPress={() => router.push(`/practice/${item.id}/PracticeCSV`)}
          activeOpacity={0.8}
        >
          <Text style={styles.practiceBtnText}>Practice</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={styles.pageTitle}>Decks</Text>
          <Text style={styles.pageSubtitle}>Your bookmarked lessons</Text>

          <View style={styles.divider} />

          {isGuest ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="person-outline" size={36} color={Sketch.inkMuted} />
              </View>
              <Text style={styles.emptyTitle}>Guest Mode</Text>
              <Text style={styles.emptySubtitle}>
                Log in to save bookmarks and track your grammar practice progress.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.primaryBtnText}>Log In</Text>
              </TouchableOpacity>
            </View>
          ) : bookmarked.length === 0 ? (
            renderEmpty()
          ) : (
            <>
              <TouchableOpacity
                style={styles.quickMix}
                onPress={handleQuickMix}
                activeOpacity={0.8}
              >
                <Ionicons name="shuffle" size={18} color="#FFFFFF" />
                <Text style={styles.quickMixText}>Quick Mix</Text>
                <Text style={styles.quickMixSub}>
                  Random practice from {bookmarked.length} bookmarks
                </Text>
              </TouchableOpacity>

              {bookmarked.map((item) => renderCard(item))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
    marginVertical: 20,
  },

  quickMix: {
    backgroundColor: Sketch.orange,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    gap: 4,
  },
  quickMixText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  quickMixSub: { fontSize: 12, fontWeight: "400", color: "rgba(255,255,255,0.7)" },

  card: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: Sketch.ink },

  statsRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, fontWeight: "400", color: Sketch.inkMuted },
  statDot: { fontSize: 12, color: Sketch.inkMuted },
  noPractice: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    fontStyle: "italic",
  },

  practiceBtn: {
    alignItems: "center",
    backgroundColor: Sketch.orange,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  practiceBtnText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },

  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Sketch.paperDark,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: Sketch.ink },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: Sketch.orange,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
});
