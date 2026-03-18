import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import { GrammarPoint } from "@/src/data/grammar";
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

  const columns = width >= 1440 ? 4 : width >= 1120 ? 3 : width >= 820 ? 2 : 1;
  const cardWidth =
    columns === 4 ? "23.6%" : columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

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

  function handleQuickPractice() {
    if (bookmarked.length === 0) return;

    const shuffled = shuffleIds(bookmarked.map((g) => g.id));
    const practiceRoute = `/practice/${shuffled[0]}/exercises?mix=${shuffled.join(",")}&source=bookmarks`;

    if (!isPremium && bookmarked.some((point) => isPremiumGrammarPoint(point))) {
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
      <DesktopPage
        eyebrow="Bookmarks"
        title="Saved grammar lessons"
        subtitle="Keep saved lessons close, start quick practice, and return to grammar you want to revisit."
      >
        <View style={styles.pageStack}>
        <DesktopPanel style={styles.actionPanel}>
          <DesktopSectionTitle
            title="Quick Practice"
            caption="Practice grammar points using your saved bookmarks."
          />
          <TouchableOpacity
            style={[styles.primaryButton, bookmarked.length === 0 && styles.disabledButton]}
            onPress={handleQuickPractice}
            disabled={bookmarked.length === 0}
            activeOpacity={0.82}
          >
            <Text style={styles.primaryButtonText}>Practice bookmarks</Text>
          </TouchableOpacity>
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
              <Ionicons name="bookmark-outline" size={24} color={Sketch.inkMuted} />
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
                      <Text style={styles.bookmarkStage}>{item.stage}</Text>
                      {!isPremium && isPremiumGrammarPoint(item) ? (
                        <Ionicons name="lock-closed-outline" size={14} color={Sketch.accent} />
                      ) : null}
                    </View>
                    <View style={styles.bookmarkBody}>
                      <Text style={styles.bookmarkTitle}>{cardCopy.title}</Text>
                      {practiced && p ? (
                        <>
                          <Text style={styles.bookmarkMeta}>
                            {p.rounds} rounds - {accuracyLabel(p)}
                          </Text>
                          <Text style={styles.bookmarkMeta}>{timeAgo(p.lastPracticed)}</Text>
                        </>
                      ) : (
                        <Text style={styles.bookmarkMeta}>Not practiced yet</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.innerButton}
                      onPress={() => router.push(`/practice/${item.id}` as any)}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.innerButtonText}>Open lesson</Text>
                    </TouchableOpacity>
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
    gap: 28,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 20,
  },
  actionPanel: {
    flex: 1,
    minHeight: 180,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
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
    color: Sketch.inkMuted,
  },
  emptyState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  emptyBody: {
    maxWidth: 420,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  bookmarkCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 12,
    minHeight: 260,
  },
  bookmarkBody: {
    flex: 1,
    gap: 8,
  },
  bookmarkTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  bookmarkStage: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bookmarkTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  bookmarkMeta: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  innerButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  innerButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
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
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 24,
    gap: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  modalHeading: {
    flex: 1,
    gap: 6,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  modalSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  modalCloseButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    gap: 2,
  },
  filterChipActive: {
    borderColor: Sketch.accent,
  },
  filterChipDisabled: {
    opacity: 0.45,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  filterChipCount: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  filterChipTextActive: {
    color: Sketch.accent,
  },
});
