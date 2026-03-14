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

import { Sketch } from "@/constants/theme";
import { API_BASE } from "../../src/config";
import { GrammarPoint, grammarPoints } from "../../src/data/grammar";
import { isGuestUser } from "../../src/utils/auth";
import {
  GrammarProgressData,
  getAllProgress,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";

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
          <Ionicons name="bookmark-outline" size={32} color={Sketch.inkMuted} />
        </View>
        <Text style={styles.emptyTitle}>No bookmarks yet</Text>
        <Text style={styles.emptySubtitle}>
          Save grammar lessons from the Grammar tab and they will show up here
          for quick practice.
        </Text>
      </View>
    );
  }

  function renderCard(item: GrammarPoint) {
    const p = progress[item.id];
    const practiced = isGrammarPracticed(p);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => router.push(`/practice/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{item.level}</Text>
          </View>
          <Ionicons name="bookmark" size={15} color={Sketch.orange} />
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        {practiced && p ? (
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
          <Text style={styles.pageTitle}>Bookmarks</Text>
          <Text style={styles.pageSubtitle}>Your saved grammar lessons</Text>

          <View style={styles.divider} />

          {isGuest ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="person-outline"
                  size={32}
                  color={Sketch.inkMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>Guest mode</Text>
              <Text style={styles.emptySubtitle}>
                Log in to save bookmarks and track your grammar practice
                progress.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/login")}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Log in</Text>
              </TouchableOpacity>
            </View>
          ) : bookmarked.length === 0 ? (
            renderEmpty()
          ) : (
            <>
              {/* Quick Mix — compact action tile */}
              <TouchableOpacity
                style={styles.quickMix}
                onPress={handleQuickMix}
                activeOpacity={0.7}
              >
                <View style={styles.quickMixLeft}>
                  <Ionicons name="shuffle" size={20} color={Sketch.orange} />
                  <View>
                    <Text style={styles.quickMixTitle}>Quick Mix</Text>
                    <Text style={styles.quickMixSub}>
                      {bookmarked.length} bookmarks · random order
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Sketch.inkMuted}
                />
              </TouchableOpacity>

              <View style={styles.spacing} />

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
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
    marginVertical: 20,
  },

  spacing: { height: 16 },

  // Quick Mix — horizontal row tile matching actionTile style
  quickMix: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickMixLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickMixTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
  },
  quickMixSub: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 1,
  },

  // Cards matching moduleCard style
  card: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    marginBottom: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkLight,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  statText: { fontSize: 12, fontWeight: "400", color: Sketch.inkMuted },
  statDot: { fontSize: 12, color: Sketch.inkFaint },
  noPractice: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
    fontStyle: "italic",
  },

  // Primary button matching index primaryBtn
  practiceBtn: {
    alignItems: "center",
    backgroundColor: Sketch.orange,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 11,
    marginTop: 4,
    shadowColor: Sketch.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  practiceBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Shared primary btn (empty/guest states)
  primaryBtn: {
    backgroundColor: Sketch.orange,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
    shadowColor: Sketch.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Sketch.ink,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
