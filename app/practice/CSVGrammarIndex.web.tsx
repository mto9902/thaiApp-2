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

import {
  AppRadius,
  AppSketch,
  AppTypography,
  appShadow,
} from "@/constants/theme-app";
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
  const remaining = Math.max(filtered.length - practiced, 0);

  const levelMeta = selectedLevel ? CEFR_LEVEL_META[selectedLevel] : null;
  const stageMeta = selectedStage ? GRAMMAR_STAGE_META[selectedStage] : null;

  const columns = isWide ? 3 : isMedium ? 2 : 1;
  const cardWidth = columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        widthVariant="wide"
        density="compact"
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
            <Ionicons name="arrow-back" size={18} color={AppSketch.ink} />
            <Text style={styles.topButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.pageStack}>
          <View style={[styles.summaryGrid, !isWide && styles.stack]}>
            <DesktopPanel style={[styles.summaryPanel, styles.progressPanel]}>
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
                  <View style={styles.progressMetaRow}>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{practiced} practiced</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{remaining} still open</Text>
                    </View>
                  </View>
                  <Text style={styles.trackHint}>
                    Keep moving through the unit one topic at a time.
                  </Text>
                </View>
              </View>
            </DesktopPanel>

            <DesktopPanel style={[styles.summaryPanel, styles.nextPanel]}>
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
                  <View style={styles.nextHeaderRow}>
                    <Text style={styles.nextLabel}>Next up</Text>
                    <View style={styles.stagePill}>
                      <Text style={styles.stagePillText}>{nextUnlearned.stage}</Text>
                    </View>
                  </View>
                  <Text style={styles.nextTitle}>
                    {getGrammarCardCopy(nextUnlearned).title}
                  </Text>
                  <Text style={styles.nextBody}>
                    Open the next unpracticed lesson and continue from where you left off.
                  </Text>
                  <View style={styles.nextFooterRow}>
                    <Text style={styles.nextMeta}>Continue lesson</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={AppSketch.primary}
                    />
                  </View>
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
                      <View style={styles.stagePill}>
                        <Text style={styles.stagePillText}>{item.stage}</Text>
                      </View>
                      {locked ? (
                        <View style={styles.statusPill}>
                          <Ionicons
                            name="lock-closed-outline"
                            size={13}
                            color={AppSketch.primary}
                          />
                          <Text style={styles.statusPillText}>Access</Text>
                        </View>
                      ) : done ? (
                        <View style={styles.statusPill}>
                          <Ionicons
                            name="checkmark"
                            size={13}
                            color={AppSketch.primary}
                          />
                          <Text style={styles.statusPillText}>Practiced</Text>
                        </View>
                      ) : bookmarked ? (
                        <View style={styles.statusPill}>
                          <Ionicons
                            name="bookmark"
                            size={13}
                            color={AppSketch.primary}
                          />
                          <Text style={styles.statusPillText}>Saved</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.cardTitle}>{cardCopy.title}</Text>
                    <Text style={styles.cardPattern}>{cardCopy.pattern}</Text>
                    <Text style={styles.cardMeaning}>{cardCopy.meaning}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardId}>{item.id}</Text>
                      <View style={styles.cardLinkPill}>
                        <Text style={styles.cardLink}>
                        {locked ? "Unlock" : "Open lesson"}
                        </Text>
                      </View>
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
    gap: 28,
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
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
  },
  topButtonText: {
    ...AppTypography.label,
    color: AppSketch.ink,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 18,
  },
  summaryPanel: {
    flex: 1,
    minHeight: 208,
  },
  progressPanel: {
    flex: 1.12,
  },
  nextPanel: {
    flex: 0.88,
  },
  summaryMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  bigMetric: {
    minWidth: 126,
    gap: 6,
  },
  bigMetricValue: {
    fontSize: 52,
    lineHeight: 54,
    fontWeight: "700",
    color: AppSketch.primary,
    letterSpacing: -1.2,
  },
  bigMetricLabel: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  trackWrap: {
    flex: 1,
    gap: 12,
  },
  track: {
    height: 10,
    backgroundColor: AppSketch.borderLight,
    borderRadius: AppRadius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.full,
  },
  progressMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.full,
    backgroundColor: AppSketch.surface,
  },
  metaChipText: {
    ...AppTypography.caption,
    color: AppSketch.inkSecondary,
  },
  trackHint: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
  },
  nextCard: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
    padding: 18,
    gap: 10,
    minHeight: 138,
    justifyContent: "center",
  },
  nextHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  nextLabel: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  nextTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.6,
  },
  nextMeta: {
    ...AppTypography.label,
    color: AppSketch.primary,
    fontWeight: "700",
  },
  nextBody: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
  },
  nextFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
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
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.lg,
    padding: 18,
    gap: 14,
    minHeight: 260,
    ...appShadow("sm"),
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.full,
    backgroundColor: AppSketch.surface,
  },
  stagePillText: {
    ...AppTypography.caption,
    color: AppSketch.inkSecondary,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.full,
    backgroundColor: AppSketch.surface,
  },
  statusPillText: {
    ...AppTypography.caption,
    color: AppSketch.primary,
  },
  cardTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.5,
    minHeight: 54,
  },
  cardPattern: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkSecondary,
    minHeight: 42,
  },
  cardMeaning: {
    flex: 1,
    minHeight: 40,
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppSketch.border,
  },
  cardId: {
    flex: 1,
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
  },
  cardLinkPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.full,
    backgroundColor: AppSketch.surface,
  },
  cardLink: {
    ...AppTypography.labelSmall,
    color: AppSketch.primary,
  },
});
