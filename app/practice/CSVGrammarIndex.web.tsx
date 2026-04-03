import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
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
import {
  CEFR_LEVEL_META,
  PUBLIC_CEFR_LEVELS,
  PublicCefrLevel,
} from "@/src/data/grammarLevels";
import {
  GRAMMAR_STAGE_META,
  PUBLIC_GRAMMAR_STAGES,
  PublicGrammarStage,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { getAuthToken } from "@/src/utils/authStorage";
import { getGrammarCardCopy } from "@/src/utils/grammarCardCopy";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

export default function GrammarTopicsScreenWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const { level, stage } = useLocalSearchParams<{ level?: string; stage?: string }>();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const rawLevel = Array.isArray(level) ? level[0] : level;
  const rawStage = Array.isArray(stage) ? stage[0] : stage;
  const selectedLevel =
    rawLevel && PUBLIC_CEFR_LEVELS.includes(rawLevel as PublicCefrLevel)
      ? (rawLevel as PublicCefrLevel)
      : undefined;
  const selectedStage =
    rawStage && PUBLIC_GRAMMAR_STAGES.includes(rawStage as PublicGrammarStage)
      ? (rawStage as PublicGrammarStage)
      : undefined;

  const isWide = width >= 1200;
  const isMedium = width >= 860;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const [nextProgress, token] = await Promise.all([
          getAllProgress(),
          getAuthToken(),
        ]);

        if (!active) return;
        setProgress(nextProgress);

        if (!token) {
          setBookmarkedIds(new Set());
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/bookmarks`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = res.ok ? await res.json() : [];
          if (!active) return;
          setBookmarkedIds(
            new Set(
              Array.isArray(data)
                ? data
                    .map((item: { grammar_id?: string }) => item.grammar_id)
                    .filter((value): value is string => Boolean(value))
                : [],
            ),
          );
        } catch (err) {
          console.error("[GrammarTopicsScreenWeb] load bookmarks failed:", err);
          if (!active) return;
          setBookmarkedIds(new Set());
        }
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  const filtered = useMemo(() => {
    if (selectedStage) return grammarPoints.filter((p) => p.stage === selectedStage);
    if (!selectedLevel) return grammarPoints;
    return grammarPoints.filter((p) => p.level === selectedLevel);
  }, [grammarPoints, selectedLevel, selectedStage]);

  const nextUnlearned = useMemo(
    () => filtered.find((point) => !isGrammarPracticed(progress[point.id])) ?? null,
    [filtered, progress],
  );

  const practiced = filtered.filter((point) =>
    isGrammarPracticed(progress[point.id]),
  ).length;
  const percentage =
    filtered.length > 0 ? Math.round((practiced / filtered.length) * 100) : 0;

  const levelMeta = selectedLevel ? CEFR_LEVEL_META[selectedLevel] : null;
  const stageMeta = selectedStage ? GRAMMAR_STAGE_META[selectedStage] : null;

  const columns = isWide ? 3 : isMedium ? 2 : 1;
  const cardWidth = columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow={selectedStage ? selectedStage : selectedLevel ? selectedLevel : "Grammar"}
        title={
          selectedStage
            ? stageMeta?.title ?? "Grammar"
            : selectedLevel
              ? `${selectedLevel} Grammar`
              : "Grammar Curriculum"
        }
        subtitle={
          selectedStage
            ? stageMeta?.subtitle
            : selectedLevel
              ? `${levelMeta?.title ?? selectedLevel} lesson track`
              : "Browse the curriculum and open any grammar lesson from the list."
        }
        toolbar={
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={Sketch.ink} />
            <Text style={styles.topButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.pageStack}>
          <View style={[styles.summaryGrid, !isWide && styles.stack]}>
            <DesktopPanel style={styles.summaryPanel}>
              <DesktopSectionTitle
                title="Progress"
                caption={`${practiced} of ${filtered.length} topics practiced in this view.`}
              />
              <View style={styles.summaryMetrics}>
                <View style={styles.bigMetric}>
                  <Text style={styles.bigMetricValue}>{percentage}%</Text>
                  <Text style={styles.bigMetricLabel}>Completed</Text>
                </View>
                <View style={styles.trackWrap}>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.trackHint}>
                    {filtered.length - practiced} topics still open
                  </Text>
                </View>
              </View>
            </DesktopPanel>

            <DesktopPanel style={styles.summaryPanel}>
              <DesktopSectionTitle
                title="Next lesson"
                caption="Jump to the first unpracticed topic in this view."
              />
              {nextUnlearned ? (
                <TouchableOpacity
                  style={styles.nextCard}
                  onPress={() => {
                    const cardCopy = getGrammarCardCopy(nextUnlearned);
                    if (!isPremium && isPremiumGrammarPoint(nextUnlearned)) {
                      void ensurePremiumAccess(cardCopy.title, `/practice/${nextUnlearned.id}`);
                      return;
                    }
                    router.push(`/practice/${nextUnlearned.id}`);
                  }}
                  activeOpacity={0.82}
                >
                  <Text style={styles.nextLabel}>Next up</Text>
                  <Text style={styles.nextTitle}>
                    {getGrammarCardCopy(nextUnlearned).title}
                  </Text>
                  <Text style={styles.nextMeta}>{nextUnlearned.stage}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.nextCard}>
                  <Text style={styles.nextTitle}>All topics practiced here.</Text>
                  <Text style={styles.nextBody}>
                    Pick another unit or keep reviewing mixed practice.
                  </Text>
                </View>
              )}
            </DesktopPanel>
          </View>

          <DesktopPanel>
            <DesktopSectionTitle
              title="Grammar topics"
              caption="Open any lesson in this unit and continue where you left off."
            />
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.grid}
            >
              {filtered.map((item) => {
                const done = isGrammarPracticed(progress[item.id]);
                const bookmarked = bookmarkedIds.has(item.id);
                const locked = isPremiumGrammarPoint(item) && !isPremium;
                const cardCopy = getGrammarCardCopy(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { width: cardWidth }]}
                    onPress={() => {
                      if (locked) {
                        void ensurePremiumAccess(cardCopy.title, `/practice/${item.id}`);
                        return;
                      }
                      router.push(`/practice/${item.id}`);
                    }}
                    activeOpacity={0.82}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.cardStage}>{item.stage}</Text>
                      <View style={styles.cardStatusRow}>
                        {bookmarked ? (
                          <Ionicons
                            name="bookmark"
                            size={14}
                            color={Sketch.accent}
                          />
                        ) : null}
                        {locked ? (
                          <Ionicons
                            name="lock-closed-outline"
                            size={15}
                            color={Sketch.accent}
                          />
                        ) : done ? (
                          <View style={styles.doneBadge}>
                            <Ionicons
                              name="checkmark"
                              size={13}
                              style={styles.doneBadgeIcon}
                            />
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.cardTitle}>{cardCopy.title}</Text>
                    <Text style={styles.cardPattern}>{cardCopy.pattern}</Text>
                    <Text style={styles.cardMeaning}>{cardCopy.meaning}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardId}>{item.id}</Text>
                      <Text style={styles.cardLink}>
                        {locked ? "Unlock" : "Open lesson"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </DesktopPanel>
        </View>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 34,
  },
  stack: {
    flexDirection: "column",
  },
  topButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  topButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 20,
  },
  summaryPanel: {
    flex: 1,
    minHeight: 210,
  },
  summaryMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  bigMetric: {
    minWidth: 130,
    gap: 4,
  },
  bigMetricValue: {
    fontSize: 46,
    lineHeight: 48,
    fontWeight: "700",
    color: Sketch.accent,
    letterSpacing: -1.2,
  },
  bigMetricLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  trackWrap: {
    flex: 1,
    gap: 10,
  },
  track: {
    height: 8,
    backgroundColor: Sketch.inkFaint,
  },
  fill: {
    height: "100%",
    backgroundColor: Sketch.accent,
  },
  trackHint: {
    fontSize: 14,
    color: Sketch.inkMuted,
  },
  nextCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 8,
    minHeight: 120,
    justifyContent: "center",
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  nextTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  nextMeta: {
    fontSize: 14,
    color: Sketch.accent,
    fontWeight: "700",
  },
  nextBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 12,
    minHeight: 282,
  },
  cardLearned: {
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardStage: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  doneBadge: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  doneBadgeIcon: {
    color: Sketch.accentDark,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
    minHeight: 56,
  },
  cardPattern: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.ink,
  },
  cardMeaning: {
    flex: 1,
    minHeight: 44,
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  cardId: {
    flex: 1,
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  cardLink: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accent,
  },
});
