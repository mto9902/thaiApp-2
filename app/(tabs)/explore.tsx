import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, SketchRadius, sketchShadow } from "@/constants/theme";
import { API_BASE } from "../../src/config";
import { GrammarPoint, grammarPoints } from "../../src/data/grammar";
import { CEFR_LEVELS, CefrLevel } from "../../src/data/grammarLevels";
import { isPremiumGrammarPoint } from "../../src/subscription/premium";
import { useSubscription } from "../../src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "../../src/subscription/usePremiumAccess";
import { isGuestUser } from "../../src/utils/auth";
import { getAuthToken } from "../../src/utils/authStorage";
import { getGrammarCardCopy } from "../../src/utils/grammarCardCopy";
import {
  GrammarProgressData,
  getAllProgress,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";

const PROGRESS_LEVEL_OPTIONS = CEFR_LEVELS.filter(
  (level) => level !== "C2",
) as readonly CefrLevel[];

const PROGRESS_FILTER_LEVELS = ["All", ...PROGRESS_LEVEL_OPTIONS] as const;

type ProgressFilterLevel = (typeof PROGRESS_FILTER_LEVELS)[number];

type PendingProgressMixAction =
  | {
      type: "premium";
      label: string;
      route: string;
    }
  | {
      type: "practice";
      route: string;
    };

function shuffleIds(ids: string[]) {
  return [...ids].sort(() => Math.random() - 0.5);
}

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
  if (p.total === 0) return "--";
  return `${Math.round((p.correct / p.total) * 100)}%`;
}

export default function DecksScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();

  const [bookmarked, setBookmarked] = useState<GrammarPoint[]>([]);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showProgressMixModal, setShowProgressMixModal] = useState(false);
  const [selectedProgressLevels, setSelectedProgressLevels] = useState<
    ProgressFilterLevel[]
  >(["All"]);
  const [pendingProgressMixAction, setPendingProgressMixAction] =
    useState<PendingProgressMixAction | null>(null);

  async function loadData() {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);

      if (guest) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const matched = data
        .map((b: { grammar_id?: string }) =>
          grammarPoints.find((g) => g.id === b.grammar_id),
        )
        .filter(Boolean)
        .sort((a, b) => {
          const aIndex = grammarPoints.findIndex((point) => point.id === a.id);
          const bIndex = grammarPoints.findIndex((point) => point.id === b.id);
          return aIndex - bIndex;
        }) as GrammarPoint[];

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
      setShowProgressMixModal(false);
      setPendingProgressMixAction(null);
      loadData();
      return () => {
        setShowProgressMixModal(false);
      };
    }, []),
  );

  useEffect(() => {
    if (showProgressMixModal || !pendingProgressMixAction) return;

    const action = pendingProgressMixAction;
    const task = InteractionManager.runAfterInteractions(() => {
      setPendingProgressMixAction(null);
      if (action.type === "premium") {
        void ensurePremiumAccess(action.label, action.route);
        return;
      }

      router.push(action.route);
    });

    return () => {
      task.cancel();
    };
  }, [ensurePremiumAccess, pendingProgressMixAction, router, showProgressMixModal]);

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  function handleQuickMix() {
    if (bookmarked.length === 0) {
      return;
    }

    const shuffled = shuffleIds(bookmarked.map((g) => g.id));
    const practiceRoute = `/practice/${shuffled[0]}/PracticeCSV?mix=${shuffled.join(",")}&source=bookmarks`;

    if (!isPremium && bookmarked.some((point) => isPremiumGrammarPoint(point))) {
      void ensurePremiumAccess(
        "your bookmarked Keystone Access lessons",
        practiceRoute,
      );
      return;
    }
    router.push(
      practiceRoute,
    );
  }

  const practicedGrammar = useMemo(
    () => grammarPoints.filter((point) => isGrammarPracticed(progress[point.id])),
    [progress],
  );

  const progressCountsByLevel = useMemo(
    () =>
      CEFR_LEVELS.reduce(
        (acc, level) => {
          acc[level] = practicedGrammar.filter(
            (point) => point.level === level,
          ).length;
          return acc;
        },
        {} as Record<CefrLevel, number>,
      ),
    [practicedGrammar],
  );

  const filteredProgressGrammar = useMemo(() => {
    if (selectedProgressLevels.includes("All")) return practicedGrammar;
    return practicedGrammar.filter(
      (point) => selectedProgressLevels.includes(point.level),
    );
  }, [practicedGrammar, selectedProgressLevels]);

  function toggleProgressLevel(level: ProgressFilterLevel) {
    if (level === "All") {
      setSelectedProgressLevels(["All"]);
      return;
    }

    setSelectedProgressLevels((current) => {
      const withoutAll = current.filter(
        (value): value is CefrLevel => value !== "All",
      );

      if (withoutAll.includes(level)) {
        const next = withoutAll.filter((value) => value !== level);
        return next.length > 0 ? next : ["All"];
      }

      return [...withoutAll, level];
    });
  }

  function handleStartProgressMix() {
    if (filteredProgressGrammar.length === 0) {
      return;
    }
    const shuffled = shuffleIds(filteredProgressGrammar.map((point) => point.id));
    const practiceRoute = `/practice/${shuffled[0]}/PracticeCSV?mix=${shuffled.join(",")}&source=progress`;

    if (
      !isPremium &&
      filteredProgressGrammar.some((point) => isPremiumGrammarPoint(point))
    ) {
      setShowProgressMixModal(false);
      setPendingProgressMixAction({
        type: "premium",
        label: "the studied grammar in this mix",
        route: practiceRoute,
      });
      return;
    }
    setShowProgressMixModal(false);
    setPendingProgressMixAction({ type: "practice", route: practiceRoute });
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
    const cardCopy = getGrammarCardCopy(item);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => router.push(`/practice/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{item.stage}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {cardCopy.title}
        </Text>

        {practiced && p ? (
          <View style={styles.statsStack}>
            <Text style={styles.statText}>
              {p.rounds} rounds · {accuracyLabel(p)}
            </Text>
            <Text style={styles.statText}>{timeAgo(p.lastPracticed)}</Text>
          </View>
        ) : (
          <Text style={styles.noPractice}>Not practiced yet</Text>
        )}

        <TouchableOpacity
          style={styles.practiceBtn}
          onPress={() => router.push(`/practice/${item.id}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.practiceBtnText}>Practice</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <Modal
        visible={showProgressMixModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProgressMixModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowProgressMixModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>Studied Grammar</Text>
                <Text style={styles.modalSubtitle}>
                  Practice grammar points you have already studied.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowProgressMixModal(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterWrap}>
              {PROGRESS_FILTER_LEVELS.map((level) => {
                const count =
                  level === "All"
                    ? practicedGrammar.length
                    : progressCountsByLevel[level];
                const isSelected = selectedProgressLevels.includes(level);
                const isDisabled = count === 0;

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipActive,
                      isDisabled && styles.filterChipDisabled,
                    ]}
                    onPress={() => {
                      if (isDisabled) return;
                      toggleProgressLevel(level);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                    <Text
                      style={[
                        styles.filterChipCount,
                        isSelected && styles.filterChipCountActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalSummaryText}>
              {filteredProgressGrammar.length} practiced topic
              {filteredProgressGrammar.length === 1 ? "" : "s"} ready
            </Text>

            <TouchableOpacity
              style={[
                styles.modalPrimaryButton,
                filteredProgressGrammar.length === 0 &&
                  styles.modalPrimaryButtonDisabled,
              ]}
              onPress={handleStartProgressMix}
              activeOpacity={0.82}
              disabled={filteredProgressGrammar.length === 0}
            >
              <Text style={styles.modalPrimaryButtonText}>Practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <View style={styles.mixRow}>
                <TouchableOpacity
                  style={[
                    styles.mixTile,
                    bookmarked.length === 0 && styles.mixTileDisabled,
                  ]}
                  onPress={handleQuickMix}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mixTileTitle}>Quick Practice</Text>
                  <Text style={styles.mixTileSub}>
                    {bookmarked.length > 0
                      ? "Practice grammar points using bookmarks"
                      : "Save grammar points to practice them here"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mixTile,
                    practicedGrammar.length === 0 && styles.mixTileDisabled,
                  ]}
                  onPress={() => {
                    if (practicedGrammar.length === 0) return;
                    setSelectedProgressLevels(["All"]);
                    setShowProgressMixModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mixTileTitle}>Studied Grammar</Text>
                  <Text style={styles.mixTileSub}>
                    {practicedGrammar.length > 0
                      ? "Practice grammar points you have already studied"
                      : "Practice grammar first"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.spacing} />

              <View style={styles.bookmarksGrid}>
                {bookmarked.map((item) => renderCard(item))}
              </View>
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
  scroll: { paddingHorizontal: 24, paddingTop: 20 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 2,
    fontStyle: "italic",
  },

  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
    marginVertical: 24,
  },

  spacing: { height: 16 },
  bookmarksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
  },

  mixRow: {
    flexDirection: "row",
    gap: 12,
  },
  mixTile: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 10,
    justifyContent: "space-between",
    minHeight: 110,
    ...sketchShadow(2),
  },
  mixTileDisabled: {
    opacity: 0.56,
  },
  mixTileTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  mixTileSub: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    lineHeight: 19,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(33, 28, 24, 0.18)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: Sketch.paper,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 18,
    ...sketchShadow(3),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalHeading: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  modalCloseButton: {
    padding: 4,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  filterChipActive: {
    borderColor: Sketch.orange,
    backgroundColor: `${Sketch.orange}10`,
  },
  filterChipDisabled: {
    opacity: 0.45,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  filterChipTextActive: {
    color: Sketch.orange,
  },
  filterChipCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  filterChipCountActive: {
    color: Sketch.orange,
  },
  modalSummaryText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  modalPrimaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.orange,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 13,
  },
  modalPrimaryButtonDisabled: {
    opacity: 0.45,
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  card: {
    width: "47%",
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 13,
    gap: 7,
    justifyContent: "space-between",
    minHeight: 156,
    marginBottom: 12,
    ...sketchShadow(2),
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: SketchRadius.badge,
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
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
    lineHeight: 19,
  },

  statsStack: {
    gap: 2,
  },
  statText: { fontSize: 12, fontWeight: "400", color: Sketch.inkMuted },
  noPractice: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
    fontStyle: "italic",
  },

  practiceBtn: {
    alignItems: "center",
    backgroundColor: Sketch.orange,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 9,
    marginTop: 2,
  },
  practiceBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },

  primaryBtn: {
    backgroundColor: Sketch.orange,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
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
    borderRadius: SketchRadius.card,
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
