import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config";
import { type GrammarPoint } from "@/src/data/grammar";
import { PUBLIC_CEFR_LEVELS, type PublicCefrLevel } from "@/src/data/grammarLevels";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getGrammarCardCopy } from "@/src/utils/grammarCardCopy";
import {
  getAllProgress,
  type GrammarProgressData,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

import {
  BRAND,
  CARD_SHADOW,
  SettledPressable,
  SurfaceButton,
  SURFACE_PRESSED,
  SURFACE_SHADOW,
} from "./dashboardSurface";

type BookmarkFilterLevel = "All" | PublicCefrLevel;

function shuffleIds(ids: string[]) {
  return [...ids].sort(() => Math.random() - 0.5);
}

function timeAgo(iso: string) {
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

function accuracyLabel(progress: GrammarProgressData) {
  if (progress.total === 0) return "--";
  return `${Math.round((progress.correct / progress.total) * 100)}%`;
}

export default function BookmarksMobileScreen() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();

  const [bookmarked, setBookmarked] = useState<GrammarPoint[]>([]);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [selectedBookmarkLevels, setSelectedBookmarkLevels] = useState<BookmarkFilterLevel[]>([
    "All",
  ]);

  const bookmarkCountsByLevel = useMemo(
    () =>
      PUBLIC_CEFR_LEVELS.reduce(
        (acc, level) => {
          acc[level] = bookmarked.filter((point) => point.level === level).length;
          return acc;
        },
        {} as Record<PublicCefrLevel, number>,
      ),
    [bookmarked],
  );

  const filteredBookmarked = useMemo(
    () =>
      selectedBookmarkLevels.includes("All")
        ? bookmarked
        : bookmarked.filter((point) =>
            selectedBookmarkLevels.includes(point.level as PublicCefrLevel),
          ),
    [bookmarked, selectedBookmarkLevels],
  );

  const loadData = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);

      if (guest) {
        setBookmarked([]);
        setProgress({});
        return;
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const matched = data
        .map((item: { grammar_id?: string }) =>
          grammarPoints.find((point) => point.id === item.grammar_id),
        )
        .filter(Boolean)
        .sort((a: GrammarPoint, b: GrammarPoint) => {
          const aIndex = grammarPoints.findIndex((point) => point.id === a.id);
          const bIndex = grammarPoints.findIndex((point) => point.id === b.id);
          return aIndex - bIndex;
        }) as GrammarPoint[];

      const allProgress = await getAllProgress();

      setBookmarked(matched);
      setProgress(allProgress);
    } catch (error) {
      console.error("[BookmarksMobileScreen] loadData failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [grammarPoints]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const handleQuickPractice = useCallback(
    (points: GrammarPoint[]) => {
      if (points.length === 0) return;

      const mix = shuffleIds(points.map((point) => point.id));
      const practiceRoute = `/practice/${mix[0]}/exercises?mix=${mix.join(",")}&source=bookmarks`;

      if (!isPremium && points.some((point) => isPremiumGrammarPoint(point))) {
        void ensurePremiumAccess("your bookmarked Keystone Access lessons", practiceRoute);
        return;
      }

      router.push(practiceRoute as any);
    },
    [ensurePremiumAccess, isPremium, router],
  );

  const openLesson = useCallback(
    (point: GrammarPoint) => {
      const lessonRoute = `/grammar-lesson/${point.id}`;
      if (!isPremium && isPremiumGrammarPoint(point)) {
        void ensurePremiumAccess(point.title, lessonRoute);
        return;
      }

      router.push(lessonRoute as any);
    },
    [ensurePremiumAccess, isPremium, router],
  );

  const toggleBookmarkLevel = useCallback((level: BookmarkFilterLevel) => {
    if (level === "All") {
      setSelectedBookmarkLevels(["All"]);
      return;
    }

    setSelectedBookmarkLevels((current) => {
      const withoutAll = current.filter(
        (value): value is PublicCefrLevel => value !== "All",
      );

      if (withoutAll.includes(level)) {
        const next = withoutAll.filter((value) => value !== level);
        return next.length > 0 ? next : ["All"];
      }

      return [...withoutAll, level];
    });
  }, []);

  const startChosenPractice = useCallback(() => {
    setShowPracticeModal(false);
    handleQuickPractice(filteredBookmarked);
  }, [filteredBookmarked, handleQuickPractice]);

  return (
    <>
      <Modal
        visible={showPracticeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPracticeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <SettledPressable
            style={styles.modalBackdrop}
            onPress={() => setShowPracticeModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>Choose what to practice</Text>
                <Text style={styles.modalSubtitle}>
                  Pick which saved lessons to include in this mixed practice round.
                </Text>
              </View>
              <SettledPressable
                onPress={() => setShowPracticeModal(false)}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.iconButton,
                  pressed ? styles.surfacePressed : null,
                ]}
              >
                <Ionicons name="close" size={18} color={BRAND.ink} />
              </SettledPressable>
            </View>

            <View style={styles.filterGrid}>
              {(["All", ...PUBLIC_CEFR_LEVELS] as BookmarkFilterLevel[]).map((level) => {
                const count = level === "All" ? bookmarked.length : bookmarkCountsByLevel[level];
                const selected = selectedBookmarkLevels.includes(level);
                const disabled = count === 0;

                return (
                  <SettledPressable
                    key={level}
                    disabled={disabled}
                    onPress={() => toggleBookmarkLevel(level)}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.filterCard,
                      selected ? styles.filterCardSelected : null,
                      disabled ? styles.filterCardDisabled : null,
                      pressed && !disabled ? styles.surfacePressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterLabel,
                        selected ? styles.filterLabelSelected : null,
                      ]}
                    >
                      {level}
                    </Text>
                    <Text
                      style={[
                        styles.filterCount,
                        selected ? styles.filterLabelSelected : null,
                      ]}
                    >
                      {count}
                    </Text>
                  </SettledPressable>
                );
              })}
            </View>

            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryEyebrow}>Selected set</Text>
              <Text style={styles.modalSummaryText}>
                {filteredBookmarked.length} saved lesson
                {filteredBookmarked.length === 1 ? "" : "s"}
              </Text>
            </View>

            <View style={styles.modalButtonStack}>
              <SurfaceButton
                label={`Practice ${filteredBookmarked.length} topic${
                  filteredBookmarked.length === 1 ? "" : "s"
                }`}
                variant="primary"
                disabled={filteredBookmarked.length === 0}
                onPress={startChosenPractice}
              />
              <SurfaceButton
                label="Cancel"
                onPress={() => setShowPracticeModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={BRAND.inkSoft} />
          </View>
        ) : (
          <ScrollView
            testID="keystone-mobile-page-scroll"
            contentContainerStyle={[
              styles.scrollContent,
              isGuest ? styles.guestScrollContent : null,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
              {isGuest ? (
                <View style={styles.guestStateWrap}>
                  <View style={styles.hero}>
                    <Text style={styles.heroTitle}>Bookmarks</Text>
                  </View>
                  <View style={styles.guestCardWrap}>
                    <View style={[styles.card, styles.guestCard]}>
                      <View style={styles.guestIconWrap}>
                        <Ionicons name="person-outline" size={26} color={BRAND.inkSoft} />
                      </View>
                      <Text style={[styles.sectionHeading, styles.centerText]}>Guest User</Text>
                      <Text style={[styles.bodyText, styles.centerText]}>
                        Log in to save grammar lessons and practice them from your bookmarks.
                      </Text>
                      <SurfaceButton
                        label="Log in"
                        variant="primary"
                        onPress={() => router.push("/login" as any)}
                      />
                    </View>
                  </View>
                </View>
              ) : (
              <>
                <View style={styles.hero}>
                  <Text style={styles.heroTitle}>Bookmarks</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.sectionHeading}>Quick practice</Text>
                  <Text style={styles.bodyText}>
                    {bookmarked.length > 0
                      ? `${bookmarked.length} saved lesson${
                          bookmarked.length === 1 ? "" : "s"
                        } ready for practice.`
                      : "Save lessons to build a practice set here."}
                  </Text>

                  <View style={styles.actionStack}>
                    <SurfaceButton
                      label="Choose what to practice"
                      disabled={bookmarked.length === 0}
                      onPress={() => {
                        setSelectedBookmarkLevels(["All"]);
                        setShowPracticeModal(true);
                      }}
                    />
                    <SurfaceButton
                      label="Practice All"
                      variant="primary"
                      disabled={bookmarked.length === 0}
                      onPress={() => handleQuickPractice(bookmarked)}
                    />
                  </View>
                </View>

                {bookmarked.length === 0 ? (
                  <View style={styles.card}>
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIconWrap}>
                        <Ionicons name="bookmark-outline" size={26} color={BRAND.inkSoft} />
                      </View>
                      <Text style={styles.emptyTitle}>No bookmarks yet</Text>
                      <Text style={styles.emptyBody}>
                        Save grammar lessons from the path and they will show up here for quick
                        practice.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Bookmark library</Text>
                    <Text style={styles.bodyText}>
                      {bookmarked.length} saved lesson{bookmarked.length === 1 ? "" : "s"}
                    </Text>

                    <View style={styles.bookmarkList}>
                      {bookmarked.map((point) => {
                        const copy = getGrammarCardCopy(point);
                        const pointProgress = progress[point.id];
                        const practiced = isGrammarPracticed(pointProgress);
                        const locked = isPremiumGrammarPoint(point) && !isPremium;

                        return (
                          <SettledPressable
                            key={point.id}
                            onPress={() => openLesson(point)}
                            style={({ pressed }: { pressed: boolean }) => [
                              styles.bookmarkCard,
                              pressed ? styles.surfacePressed : null,
                            ]}
                          >
                            <View style={styles.bookmarkTopRow}>
                              <View style={styles.bookmarkMetaRow}>
                                <Text style={styles.cardEyebrow}>{point.stage}</Text>
                                {locked ? (
                                  <Ionicons
                                    name="lock-closed-outline"
                                    size={14}
                                    color={BRAND.inkSoft}
                                  />
                                ) : null}
                              </View>
                              <Text style={styles.bookmarkTopStatus}>
                                {practiced && pointProgress
                                  ? `${pointProgress.rounds} rounds · ${accuracyLabel(
                                      pointProgress,
                                    )}`
                                  : "Not practiced yet"}
                              </Text>
                            </View>

                            <Text style={styles.bookmarkTitle}>{copy.title}</Text>
                            <Text style={styles.bookmarkBody}>{copy.meaning}</Text>

                            <View style={styles.bookmarkFooter}>
                              <Text style={styles.bookmarkFooterHint}>
                                {practiced && pointProgress
                                  ? timeAgo(pointProgress.lastPracticed)
                                  : locked
                                    ? "Keystone Access required"
                                    : "Ready to open"}
                              </Text>
                              <View style={styles.openRow}>
                                <Text style={styles.openText}>Open lesson</Text>
                                <Ionicons
                                  name="chevron-forward"
                                  size={14}
                                  color={BRAND.ink}
                                />
                              </View>
                            </View>
                          </SettledPressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    flexGrow: 1,
    gap: 16,
  },
  guestScrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  guestStateWrap: {
    flex: 1,
    gap: 16,
  },
  guestCardWrap: {
    flex: 1,
    justifyContent: "center",
  },
  hero: {
    paddingTop: 4,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 14,
    ...CARD_SHADOW,
  },
  sectionHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  centerText: {
    textAlign: "center",
  },
  guestCard: {
    alignItems: "center",
  },
  guestIconWrap: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    alignSelf: "center",
    ...SURFACE_SHADOW,
  },
  actionStack: {
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    ...SURFACE_SHADOW,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
    textAlign: "center",
  },
  bookmarkList: {
    gap: 12,
  },
  bookmarkCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  bookmarkTopRow: {
    gap: 6,
  },
  bookmarkMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  bookmarkTopStatus: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontWeight: "700",
  },
  bookmarkTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bookmarkBody: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  bookmarkFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bookmarkFooterHint: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 16,
    ...CARD_SHADOW,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalHeaderCopy: {
    flex: 1,
    gap: 6,
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
  },
  modalSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    ...SURFACE_SHADOW,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterCard: {
    width: "31%",
    minWidth: "31%",
    backgroundColor: BRAND.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  filterCardSelected: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.navy,
  },
  filterCardDisabled: {
    opacity: 0.45,
  },
  filterLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
  },
  filterCount: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  filterLabelSelected: {
    color: BRAND.navy,
  },
  modalSummary: {
    gap: 4,
  },
  modalSummaryEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  modalSummaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.ink,
    fontWeight: "700",
  },
  modalButtonStack: {
    gap: 10,
  },
  surfacePressed: {
    ...SURFACE_PRESSED,
  },
});
