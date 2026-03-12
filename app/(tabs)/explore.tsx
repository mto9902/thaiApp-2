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
import { API_BASE } from "../../src/config";
import { GrammarPoint, grammarPoints } from "../../src/data/grammar";
import { isGuestUser } from "../../src/utils/auth";
import {
  GrammarProgressData,
  getAllProgress,
} from "../../src/utils/grammarProgress";
import { Sketch, sketchShadow } from "@/constants/theme";

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

export default function MyGrammarScreen() {
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
      console.error("[MyGrammar] loadData failed:", err);
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
      <View style={st.emptyWrap}>
        <View style={st.emptyIcon}>
          <Ionicons name="bookmark-outline" size={44} color={Sketch.inkFaint} />
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
          <Ionicons name="arrow-forward" size={14} color={Sketch.cardBg} />
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
        style={st.card}
        onPress={() => router.push(`/practice/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={st.cardTop}>
          <View style={[st.levelBadge, { backgroundColor: levelColor }]}>
            <Text style={st.levelBadgeText}>
              {LEVEL_NAMES[item.level]?.toUpperCase() || `LEVEL ${item.level}`}
            </Text>
          </View>
          <Ionicons name="bookmark" size={18} color={Sketch.yellow} />
        </View>

        <Text style={st.cardTitle}>{item.title}</Text>

        {p ? (
          <View style={st.statsRow}>
            <View style={st.statChip}>
              <Ionicons name="flash-outline" size={12} color={Sketch.inkLight} />
              <Text style={st.statText}>{p.rounds} rounds</Text>
            </View>
            <View style={st.statChip}>
              <Ionicons name="checkmark-circle-outline" size={12} color={Sketch.inkLight} />
              <Text style={st.statText}>{accuracyLabel(p)}</Text>
            </View>
            <View style={st.statChip}>
              <Ionicons name="time-outline" size={12} color={Sketch.inkLight} />
              <Text style={st.statText}>{timeAgo(p.lastPracticed)}</Text>
            </View>
          </View>
        ) : (
          <Text style={st.noPractice}>Not practiced yet</Text>
        )}

        <TouchableOpacity
          style={st.practiceBtn}
          onPress={() => router.push(`/practice/${item.id}/PracticeCSV`)}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={16} color={Sketch.cardBg} />
          <Text style={st.practiceBtnText}>PRACTICE</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
      <Header title="My Grammar" onBack={() => router.back()} />

      {loading ? (
        <View style={st.loadingWrap}>
          <ActivityIndicator size="large" color={Sketch.ink} />
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
                <Ionicons name="person-outline" size={44} color={Sketch.inkFaint} />
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
                <Ionicons name="arrow-forward" size={14} color={Sketch.cardBg} />
              </TouchableOpacity>
            </View>
          ) : bookmarked.length === 0 ? (
            renderEmpty()
          ) : (
            <>
              <TouchableOpacity
                style={st.quickMix}
                onPress={handleQuickMix}
                activeOpacity={0.85}
              >
                <Ionicons name="shuffle" size={20} color={Sketch.cardBg} />
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

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  quickMix: {
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    gap: 4,
    ...sketchShadow(5),
  },
  quickMixText: { fontSize: 18, fontWeight: "900", color: Sketch.cardBg },
  quickMixSub: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: Sketch.inkMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },

  card: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    gap: 10,
    ...sketchShadow(4),
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
  cardTitle: { fontSize: 18, fontWeight: "900", color: Sketch.ink },

  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Sketch.paperDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statText: { fontSize: 12, fontWeight: "700", color: Sketch.inkLight },
  noPractice: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkFaint,
    fontStyle: "italic",
  },

  practiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Sketch.orange,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
    ...sketchShadow(2),
  },
  practiceBtnText: { fontSize: 13, fontWeight: "900", color: Sketch.cardBg },

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
    backgroundColor: Sketch.paperDark,
    borderWidth: 2,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: Sketch.ink },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  browseCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Sketch.orange,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    ...sketchShadow(3),
  },
  browseCtaText: { fontSize: 13, fontWeight: "900", color: Sketch.cardBg },
});
