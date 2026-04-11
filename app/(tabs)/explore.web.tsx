import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import {
  DESKTOP_PAGE_WIDTH,
  MOBILE_WEB_BREAKPOINT,
} from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT,
  WEB_BRAND,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
import { API_BASE } from "@/src/config";
import { GrammarPoint } from "@/src/data/grammar";
import { PUBLIC_CEFR_LEVELS, PublicCefrLevel } from "@/src/data/grammarLevels";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import BookmarksMobileScreen from "@/src/screens/mobile/BookmarksMobileScreen";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { clearAuthState, isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getGrammarCardCopy } from "@/src/utils/grammarCardCopy";
import {
  GrammarProgressData,
  getAllProgress,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

type BookmarkFilterLevel = "All" | PublicCefrLevel;

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

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
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <BookmarksMobileScreen />;
  }

  return <ExploreDesktopContent />;
}

function ExploreDesktopContent() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();
  const isCompactWidth = width < 620;

  const [bookmarked, setBookmarked] = useState<GrammarPoint[]>([]);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [selectedBookmarkLevels, setSelectedBookmarkLevels] = useState<BookmarkFilterLevel[]>([
    "All",
  ]);

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

  const filteredBookmarked = selectedBookmarkLevels.includes("All")
    ? bookmarked
    : bookmarked.filter((point) =>
        selectedBookmarkLevels.includes(point.level as PublicCefrLevel),
      );

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

  const handleGuestLogin = useCallback(async () => {
    await clearAuthState();
    router.replace("/login");
  }, [router]);

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
      void ensurePremiumAccess("your bookmarked Keystone Access lessons", practiceRoute);
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
      void ensurePremiumAccess("your bookmarked Keystone Access lessons", practiceRoute);
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
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPracticeModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>Choose bookmark practice</Text>
                <Text style={styles.modalSubtitle}>
                  Pick which saved lessons to include in this mixed practice round.
                </Text>
              </View>
              <Pressable
                onPress={() => setShowPracticeModal(false)}
                style={({ hovered, pressed }) => [
                  styles.iconButton,
                  (hovered || pressed) && styles.lightButtonActive,
                ]}
              >
                <Ionicons name="close" size={18} color={BRAND.ink} />
              </Pressable>
            </View>

            <View style={styles.filterWrap}>
              {(["All", ...PUBLIC_CEFR_LEVELS] as BookmarkFilterLevel[]).map((level) => {
                const count =
                  level === "All" ? bookmarked.length : bookmarkCountsByLevel[level];
                const selected = selectedBookmarkLevels.includes(level);
                const disabled = count === 0;

                return (
                  <Pressable
                    key={level}
                    onPress={() => toggleBookmarkLevel(level)}
                    disabled={disabled}
                    style={({ hovered, pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipActive,
                      disabled && styles.filterChipDisabled,
                      !disabled && (hovered || pressed) && styles.filterChipHover,
                    ]}
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
                  </Pressable>
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

              <Pressable
                onPress={handleStartChosenPractice}
                disabled={filteredBookmarked.length === 0}
                style={({ hovered, pressed }) => [
                  styles.primaryButton,
                  styles.modalPrimaryButton,
                  filteredBookmarked.length === 0 && styles.disabledPrimaryButton,
                  filteredBookmarked.length > 0 &&
                    (hovered || pressed) &&
                    styles.primaryButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    filteredBookmarked.length === 0 && styles.primaryButtonTextDisabled,
                  ]}
                >
                  Practice {filteredBookmarked.length} topic
                  {filteredBookmarked.length === 1 ? "" : "s"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shell}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Bookmarks</Text>
                <Text style={styles.title}>Saved grammar lessons</Text>
                <Text style={styles.subtitle}>
                  Keep saved lessons close, start quick practice, and return to grammar
                  you want to revisit.
                </Text>
              </View>
            </View>

            <View style={[styles.surfaceCard, styles.summaryPanel]}>
              <View style={[styles.summaryRow, isCompactWidth && styles.summaryRowStack]}>
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
                <View
                  style={[
                    styles.summaryActions,
                    isCompactWidth && styles.summaryActionsStack,
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedBookmarkLevels(["All"]);
                      setShowPracticeModal(true);
                    }}
                    disabled={bookmarked.length === 0}
                    style={({ hovered, pressed }) => [
                      styles.secondaryButton,
                      isCompactWidth && styles.summaryButtonFluid,
                      bookmarked.length === 0 && styles.disabledLightButton,
                      bookmarked.length > 0 &&
                        (hovered || pressed) &&
                        styles.lightButtonActive,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>Choose what to practice</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleQuickPractice(false)}
                    disabled={bookmarked.length === 0}
                    style={({ hovered, pressed }) => [
                      styles.primaryButton,
                      isCompactWidth && styles.summaryButtonFluid,
                      bookmarked.length === 0 && styles.disabledPrimaryButton,
                      bookmarked.length > 0 &&
                        (hovered || pressed) &&
                        styles.primaryButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        bookmarked.length === 0 && styles.primaryButtonTextDisabled,
                      ]}
                    >
                        Practice All
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

              <View style={styles.surfaceCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeading}>Bookmark library</Text>
                  <Text style={styles.sectionSubheading}>
                    {isGuest
                      ? "Sign in to save lessons and practice from bookmarks."
                      : loading
                        ? "Loading your saved lessons."
                        : `${bookmarked.length} saved lessons`}
                  </Text>
                </View>

                {isGuest ? (
                  <View style={styles.guestBookmarksWrap}>
                    <Pressable
                      onPress={() => void handleGuestLogin()}
                      style={({ hovered, pressed }) => [
                        styles.primaryButton,
                        styles.guestBookmarksButton,
                        (hovered || pressed) && styles.primaryButtonActive,
                      ]}
                    >
                      <Text style={styles.primaryButtonText}>Log in</Text>
                    </Pressable>
                  </View>
                ) : loading ? (
                  <Text style={styles.helperText}>Loading bookmarks...</Text>
                ) : bookmarked.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="bookmark-outline" size={24} color={BRAND.inkSoft} />
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
                      <Pressable
                        key={item.id}
                        onPress={() => router.push(`/practice/${item.id}` as any)}
                        style={({ hovered, pressed }) => [
                          styles.bookmarkCard,
                          { width: cardWidth },
                          (hovered || pressed) && styles.bookmarkCardHover,
                        ]}
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
                              <Ionicons name="lock-closed-outline" size={14} color={BRAND.navy} />
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.bookmarkBody}>
                          <Text style={styles.bookmarkTitle}>{cardCopy.title}</Text>
                          <Text style={styles.bookmarkMeta}>
                            {practiced && p
                              ? timeAgo(p.lastPracticed)
                              : "Open when you want to revisit it"}
                          </Text>
                        </View>

                        <View style={styles.bookmarkFooter}>
                          <Text style={styles.bookmarkFooterHint}>
                            {practiced ? "Return to lesson" : "Start lesson"}
                          </Text>
                          <View style={styles.inlineAction}>
                            <Text style={styles.inlineActionText}>Open lesson</Text>
                            <Ionicons name="arrow-forward" size={14} color={BRAND.ink} />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  pageContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 28,
  },
  shell: {
    width: "100%",
    maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    color: BRAND.inkSoft,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  title: {
    color: BRAND.ink,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: DISPLAY_FONT,
  },
  subtitle: {
    maxWidth: 760,
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: BODY_FONT,
  },
  surfaceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 24,
    gap: 18,
    boxShadow: WEB_CARD_SHADOW as any,
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
  summaryCopy: {
    flex: 1,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  summaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  summaryRowStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  summaryActionsStack: {
    width: "100%",
    flexDirection: "column",
    alignItems: "stretch",
  },
  summaryButtonFluid: {
    width: "100%",
    minWidth: 0,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionHeading: {
    color: BRAND.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sectionSubheading: {
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: BODY_FONT,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 190,
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D2237",
    backgroundColor: BRAND.navy,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: BODY_FONT,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 170,
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  disabledPrimaryButton: {
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  primaryButtonTextDisabled: {
    color: BRAND.inkSoft,
  },
  disabledLightButton: {
    opacity: 0.45,
  },
  lightButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  helperText: {
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  guestBookmarksWrap: {
    paddingTop: 4,
  },
  guestBookmarksButton: {
    alignSelf: "flex-start",
    minWidth: 132,
  },
  emptyState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: WEB_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  emptyBody: {
    maxWidth: 420,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  bookmarkCard: {
    borderRadius: WEB_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 16,
    gap: 10,
    minHeight: 176,
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  bookmarkCardHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
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
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: BODY_FONT,
  },
  bookmarkTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.3,
    fontFamily: DISPLAY_FONT,
  },
  bookmarkMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  bookmarkMetaInline: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  bookmarkFooter: {
    marginTop: "auto",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bookmarkFooterHint: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineActionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 24,
    paddingVertical: 22,
    gap: 20,
    boxShadow: WEB_CARD_SHADOW as any,
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
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
    fontFamily: DISPLAY_FONT,
  },
  modalSubtitle: {
    maxWidth: 460,
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
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
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
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
    borderRadius: WEB_RADIUS.md,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  filterChipHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  filterChipActive: {
    borderColor: BRAND.navy,
    backgroundColor: BRAND.paper,
  },
  filterChipDisabled: {
    opacity: 0.45,
  },
  filterChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  filterChipCount: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  filterChipTextActive: {
    color: BRAND.navy,
  },
  modalFooter: {
    gap: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
  },
  modalSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalSummaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.inkSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  modalSummaryValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  modalPrimaryButton: {
    width: "100%",
    minWidth: 0,
  },
});
