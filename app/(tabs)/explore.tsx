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

import Header from "../../src/components/Header";
import { GrammarPoint, grammarPoints } from "../../src/data/grammar";
import { isGuestUser } from "../../src/utils/auth";
import {
  GrammarProgressData,
  getAllProgress,
} from "../../src/utils/grammarProgress";

// ── Level meta ───────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<number, string> = {
  1: "#66BB6A",
  2: "#42A5F5",
  3: "#FF4081",
};
const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Component ────────────────────────────────────────────────────────────────
export default function MyGrammarScreen() {
  const router = useRouter();

  const [bookmarked, setBookmarked] = useState<GrammarPoint[]>([]);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );
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
      const res = await fetch("http://192.168.1.121:3000/bookmarks", {
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
      console.error("[MyGrammar] loadData failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Refresh every time tab gains focus
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

  // ── Empty state ────────────────────────────────────────────────────────────
  function renderEmpty() {
    return (
      <View style={st.emptyWrap}>
        <View style={st.emptyIcon}>
          <Ionicons name="bookmark-outline" size={48} color="#BDBDBD" />
        </View>
        <Text style={st.emptyTitle}>NO BOOKMARKS YET</Text>
        <Text style={st.emptySubtitle}>
          Browse grammar lessons and tap the bookmark button to save them here
          for quick practice.
        </Text>
        <TouchableOpacity
          style={st.browseCta}
          onPress={() => router.push("/practice/levels")}
        >
          <Text style={st.browseCtaText}>BROWSE GRAMMAR</Text>
          <Ionicons name="arrow-forward" size={16} color="black" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Card for each bookmarked grammar ───────────────────────────────────────
  function renderCard(item: GrammarPoint) {
    const p = progress[item.id];
    const levelColor = LEVEL_COLORS[item.level] || "#66BB6A";

    return (
      <TouchableOpacity
        key={item.id}
        style={st.card}
        onPress={() => router.push(`/practice/${item.id}`)}
        activeOpacity={0.8}
      >
        {/* Top: level badge + bookmark icon */}
        <View style={st.cardTop}>
          <View style={[st.levelBadge, { backgroundColor: levelColor }]}>
            <Text style={st.levelBadgeText}>
              {LEVEL_NAMES[item.level]?.toUpperCase() || `LEVEL ${item.level}`}
            </Text>
          </View>
          <Ionicons name="bookmark" size={18} color="#FFD54F" />
        </View>

        <Text style={st.cardTitle}>{item.title}</Text>

        {/* Progress stats */}
        {p ? (
          <View style={st.statsRow}>
            <View style={st.statChip}>
              <Ionicons name="flash-outline" size={12} color="#555" />
              <Text style={st.statText}>{p.rounds} rounds</Text>
            </View>
            <View style={st.statChip}>
              <Ionicons
                name="checkmark-circle-outline"
                size={12}
                color="#555"
              />
              <Text style={st.statText}>{accuracyLabel(p)}</Text>
            </View>
            <View style={st.statChip}>
              <Ionicons name="time-outline" size={12} color="#555" />
              <Text style={st.statText}>{timeAgo(p.lastPracticed)}</Text>
            </View>
          </View>
        ) : (
          <Text style={st.noPractice}>Not practiced yet</Text>
        )}

        {/* Practice button */}
        <TouchableOpacity
          style={st.practiceBtn}
          onPress={() => router.push(`/practice/${item.id}/PracticeCSV`)}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={16} color="black" />
          <Text style={st.practiceBtnText}>PRACTICE</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
      <Header title="My Grammar" onBack={() => router.back()} />

      {loading ? (
        <View style={st.loadingWrap}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={st.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {isGuest ? (
            <View style={st.emptyWrap}>
              <View style={st.emptyIcon}>
                <Ionicons name="person-outline" size={48} color="#BDBDBD" />
              </View>
              <Text style={st.emptyTitle}>GUEST MODE</Text>
              <Text style={st.emptySubtitle}>
                Log in to save bookmarks and track your grammar practice progress.
              </Text>
              <TouchableOpacity
                style={st.browseCta}
                onPress={() => router.push("/login")}
              >
                <Text style={st.browseCtaText}>LOG IN</Text>
                <Ionicons name="arrow-forward" size={16} color="black" />
              </TouchableOpacity>
            </View>
          ) : bookmarked.length === 0 ? (
            renderEmpty()
          ) : (
            <>
              {/* Quick Mix */}
              <TouchableOpacity
                style={st.quickMix}
                onPress={handleQuickMix}
                activeOpacity={0.85}
              >
                <Ionicons name="shuffle" size={20} color="black" />
                <Text style={st.quickMixText}>QUICK MIX</Text>
                <Text style={st.quickMixSub}>
                  Random practice from your {bookmarked.length} bookmarks
                </Text>
              </TouchableOpacity>

              <Text style={st.sectionLabel}>YOUR BOOKMARKS</Text>

              {bookmarked.map((item) => renderCard(item))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F5" },
  scroll: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Quick Mix
  quickMix: {
    backgroundColor: "#FFFF00",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  quickMixText: { fontSize: 18, fontWeight: "900", color: "black" },
  quickMixSub: { fontSize: 12, fontWeight: "600", color: "rgba(0,0,0,0.5)" },

  // Section
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#757575",
    letterSpacing: 2,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "white",
    letterSpacing: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: "900", color: "black" },

  // Stats
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statText: { fontSize: 12, fontWeight: "700", color: "#555" },
  noPractice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#BDBDBD",
    fontStyle: "italic",
  },

  // Practice button
  practiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFF00",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  practiceBtnText: { fontSize: 14, fontWeight: "900", color: "black" },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#1A1A1A" },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  browseCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFF00",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  browseCtaText: { fontSize: 14, fontWeight: "900", color: "black" },
});
