import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import { GrammarPoint } from "@/src/data/grammar";
import { PUBLIC_CEFR_LEVELS, PublicCefrLevel } from "@/src/data/grammarLevels";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getGrammarCardCopy } from "@/src/utils/grammarCardCopy";
import {
  GrammarProgressData,
  getAllProgress,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

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

export default function ExploreWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();

  const [bookmarked, setBookmarked] = useState<GrammarPoint[]>([]);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [selectedBookmarkLevels, setSelectedBookmarkLevels] = useState<
    BookmarkFilterLevel[]
  >(["All"]);

  const columns = width >= 1320 ? 4 : width >= 1040 ? 3 : width >= 760 ? 2 : 1;
  const cardWidth =
    columns === 4 ? "24%" : columns === 3 ? "32%" : columns === 2 ? "49%" : "100%";

  const bookmarkCountsByLevel = PUBLIC_CEFR_LEVELS.reduce(
    (acc, level) => {
      acc[level] = bookmarked.filter((point) => point.level === level).length;
      return acc;
    },
    {} as Record<PublicCefrLevel, number>,
  );

  const filteredBookmarked =
    selectedBookmarkLevels.includes("All")
      ? bookmarked
      : bookmarked.filter((point) => selectedBookmarkLevels.includes(point.level as PublicCefrLevel));

  const loadData = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);

      if (guest) {
        setLoading(false);
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
        .sort((a: GrammarPoint, b: GrammarPoint) => {
          const aIndex = grammarPoints.findIndex((point) => point.id === a.id);
          const bIndex = grammarPoints.findIndex((point) => point.id === b.id);
          return aIndex - bIndex;
        }) as GrammarPoint[];

      const allProgress = await getAllProgress();
      setBookmarked(matched);
      setProgress(allProgress);
    } catch (err) {
      console.error("[ExploreWeb] loadData failed:", err);
    } finally {
      setLoading(false);
    }
  }, [grammarPoints]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  function handleQuickPractice(shouldShuffle = false) {
    if (bookmarked.length === 0) return;

    const ids = bookmarked.map((g) => g.id);
    const mix = shouldShuffle ? shuffleIds(ids) : ids;
    const practiceRoute = `/practice/${mix[0]}/exercises?mix=${mix.join(",")}&source=bookmarks`;

    if (!isPremium && bookmarked.some((point) => isPremiumGrammarPoint(point))) {
      void ensurePremiumAccess(
        "your bookmarked Keystone Access lessons",
        practiceRoute,
      );
      return;
    }

    router.push(practiceRoute as any);
  }

  function toggleBookmarkLevel(level: BookmarkFilterLevel) {
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
  }

  function handleStartChosenPractice() {
    if (filteredBookmarked.length === 0) return;

    const shuffled = shuffleIds(filteredBookmarked.map((point) => point.id));
    const practiceRoute = `/practice/${shuffled[0]}/exercises?mix=${shuffled.join(",")}&source=bookmarks`;

    setShowPracticeModal(false);

    if (!isPremium && filteredBookmarked.some((point) => isPremiumGrammarPoint(point))) {
      void ensurePremiumAccess(
        "your bookmarked Keystone Access lessons",
        practiceRoute,
      );
      return;
    }

    router.push(practiceRoute as any);
  }

  return (
    <>
      <Modal
        visible={showPracticeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPracticeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowPracticeModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>Choose bookmark practice</Text>
                <Text style={styles.modalSubtitle}>
                  Pick which saved lessons to include in this mixed practice round.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPracticeModal(false)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={20} color={AppSketch.inkMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterWrap}>
              {(["All", ...PUBLIC_CEFR_LEVELS] as BookmarkFilterLevel[]).map((level) => {
                const count =
                  level === "All" ? bookmarked.length : bookmarkCountsByLevel[level];
                const selected = selectedBookmarkLevels.includes(level);
                const disabled = count === 0;

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterChip,
                      selected && styles.filterChipActive,
                      disabled && styles.filterChipDisabled,
                    ]}
                    onPress={() => toggleBookmarkLevel(level)}
                    disabled={disabled}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                    <Text
                      style={[
                        styles.filterChipCount,
                        selected && styles.filterChipTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Selected set</Text>
                <Text style={styles.modalSummaryValue}>
                  {filteredBookmarked.length} saved lesson
                  {filteredBookmarked.length === 1 ? "" : "s"}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.modalPrimaryButton,
                  filteredBookmarked.length === 0 && styles.disabledButton,
                ]}
                onPress={handleStartChosenPractice}
                disabled={filteredBookmarked.length === 0}
                activeOpacity={0.82}
              >
                <Text style={styles.primaryButtonText}>
                  Practice {filteredBookmarked.length} topic
                  {filteredBookmarked.length === 1 ? "" : "s"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DesktopPage
        eyebrow="Bookmarks"
        title="Saved grammar lessons"
        subtitle="Keep saved lessons close, start quick practice, and return to grammar you want to revisit."
      >
        <View style={styles.pageStack}>
        <DesktopPanel style={styles.summaryPanel}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>Quick Practice</Text>
              <Text style={styles.summaryBody}>
                {isGuest
                  ? "Log in to practice from your saved lessons."
                  : loading
                    ? "Loading your saved lessons."
                    : bookmarked.length > 0
                      ? `${bookmarked.length} saved lesson${bookmarked.length === 1 ? "" : "s"} ready for quick practice.`
                      : "Save lessons to build a practice set from your bookmarks."}
              </Text>
            </View>
            <View style={styles.summaryActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, bookmarked.length === 0 && styles.disabledSecondaryButton]}
                onPress={() => {
                  setSelectedBookmarkLevels(["All"]);
                  setShowPracticeModal(true);
                }}
                disabled={bookmarked.length === 0}
                activeOpacity={0.82}
              >
                <Text style={styles.secondaryButtonText}>Choose practice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, bookmarked.length === 0 && styles.disabledButton]}
                onPress={() => handleQuickPractice(false)}
                disabled={bookmarked.length === 0}
                activeOpacity={0.82}
              >
                <Text style={styles.primaryButtonText}>Practice bookmarks</Text>
              </TouchableOpacity>
            </View>
          </View>
        </DesktopPanel>

        <DesktopPanel>
          <DesktopSectionTitle
            title="Bookmark library"
            caption={
              isGuest
                ? "Log in to save lessons and practice from bookmarks."
                : loading
                  ? "Loading your saved lessons."
                  : `${bookmarked.length} saved lessons`
            }
          />

          {isGuest ? (
            <Text style={styles.helperText}>
              Log in to save lessons and practice from bookmarks.
            </Text>
          ) : loading ? (
            <Text style={styles.helperText}>Loading bookmarks...</Text>
          ) : bookmarked.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={24} color={AppSketch.inkMuted} />
              <Text style={styles.emptyTitle}>No bookmarks yet</Text>
              <Text style={styles.emptyBody}>
                Save grammar lessons from the curriculum and they will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {bookmarked.map((item) => {
                const cardCopy = getGrammarCardCopy(item);
                const practiced = isGrammarPracticed(progress[item.id]);
                const p = progress[item.id];
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.bookmarkCard, { width: cardWidth }]}
                    onPress={() => router.push(`/practice/${item.id}` as any)}
                    activeOpacity={0.82}
                  >
                    <View style={styles.bookmarkTop}>
                      <View style={styles.bookmarkTopLeft}>
                        <Text style={styles.bookmarkStage}>{item.stage}</Text>
                        {practiced && p ? (
                          <Text style={styles.bookmarkMetaInline}>
                            {p.rounds} rounds · {accuracyLabel(p)}
                          </Text>
                        ) : (
                          <Text style={styles.bookmarkMetaInline}>Not practiced yet</Text>
                        )}
                      </View>
                      <View style={styles.bookmarkTopRight}>
                        {!isPremium && isPremiumGrammarPoint(item) ? (
                          <Ionicons name="lock-closed-outline" size={14} color={AppSketch.primary} />
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.bookmarkBody}>
                      <Text style={styles.bookmarkTitle}>{cardCopy.title}</Text>
                      <Text style={styles.bookmarkMeta}>
                        {practiced && p ? timeAgo(p.lastPracticed) : "Open when you want to revisit it"}
                      </Text>
                    </View>
                    <View style={styles.bookmarkFooter}>
                      <Text style={styles.bookmarkFooterHint}>
                        {practiced ? "Return to lesson" : "Start lesson"}
                      </Text>
                      <View style={styles.inlineAction}>
                        <Text style={styles.inlineActionText}>Open lesson</Text>
                        <Ionicons name="arrow-forward" size={14} color={AppSketch.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </DesktopPanel>
        </View>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 20,
  },
  summaryPanel: {
    paddingVertical: 18,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  summaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  summaryCopy: {
    flex: 1,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 20,
    color: AppSketch.inkMuted,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 190,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.primary,
    ...appShadow("sm"),
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 170,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledSecondaryButton: {
    opacity: 0.45,
  },
  helperText: {
    fontSize: 15,
    lineHeight: 24,
    color: AppSketch.inkMuted,
  },
  emptyState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  emptyBody: {
    maxWidth: 420,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    color: AppSketch.inkMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  bookmarkCard: {
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 16,
    gap: 10,
    minHeight: 176,
    ...appShadow("sm"),
  },
  bookmarkBody: {
    flex: 1,
    gap: 6,
  },
  bookmarkTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  bookmarkTopLeft: {
    flex: 1,
    gap: 4,
  },
  bookmarkTopRight: {
    minWidth: 18,
    alignItems: "flex-end",
    paddingTop: 1,
  },
  bookmarkStage: {
    fontSize: 12,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bookmarkTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.3,
  },
  bookmarkMeta: {
    fontSize: 13,
    color: AppSketch.inkMuted,
  },
  bookmarkMetaInline: {
    fontSize: 12,
    color: AppSketch.inkMuted,
  },
  bookmarkFooter: {
    marginTop: "auto",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppSketch.borderLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bookmarkFooterHint: {
    fontSize: 12,
    color: AppSketch.inkMuted,
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    padding: 28,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 24,
    paddingVertical: 22,
    gap: 20,
    ...appShadow("sm"),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  modalHeading: {
    flex: 1,
    gap: 8,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    maxWidth: 460,
    fontSize: 14,
    lineHeight: 22,
    color: AppSketch.inkMuted,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  filterChip: {
    width: 84,
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.background,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
  },
  filterChipActive: {
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.surface,
  },
  filterChipDisabled: {
    opacity: 0.45,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  filterChipCount: {
    fontSize: 12,
    color: AppSketch.inkMuted,
  },
  filterChipTextActive: {
    color: AppSketch.primary,
  },
  modalFooter: {
    gap: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: AppSketch.borderLight,
  },
  modalSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalSummaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: AppSketch.inkFaint,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  modalSummaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: AppSketch.ink,
  },
  modalPrimaryButton: {
    width: "100%",
    minWidth: 0,
  },
});
