import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  AppRadius,
  AppSketch,
  AppSpacing,
  AppTypography,
  appShadow,
} from "@/constants/theme-app";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import {
  GRAMMAR_STAGE_META,
  PUBLIC_GRAMMAR_STAGES,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

type StageSummary = {
  stage: string;
  title: string;
  practiced: number;
  total: number;
  rounds: number;
  accuracy: number;
};

function timeAgo(iso?: string): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function percent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

export default function GrammarStatsWebScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );

  useEffect(() => {
    (async () => {
      try {
        const allProgress = await getAllProgress();
        setProgress(allProgress);
      } catch (err) {
        console.error("Failed to load grammar stats:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const compactMetrics = width < 1260;
  const stageCardWidth =
    width >= 1320 ? "31.9%" : width >= 1020 ? "48.8%" : "100%";

  const practicedEntries = Object.entries(progress).filter(([, item]) =>
    isGrammarPracticed(item),
  );
  const totalRounds = practicedEntries.reduce(
    (sum, [, item]) => sum + (item.rounds || 0),
    0,
  );
  const totalAttempts = practicedEntries.reduce(
    (sum, [, item]) => sum + (item.total || 0),
    0,
  );
  const totalCorrect = practicedEntries.reduce(
    (sum, [, item]) => sum + (item.correct || 0),
    0,
  );
  const sortedPracticeDates = practicedEntries
    .map(([, item]) => item.lastPracticed)
    .filter(Boolean)
    .sort();
  const lastPracticed =
    sortedPracticeDates.length > 0
      ? sortedPracticeDates[sortedPracticeDates.length - 1]
      : undefined;

  const stageSummaries = useMemo<StageSummary[]>(
    () =>
      PUBLIC_GRAMMAR_STAGES.filter((stage) =>
        grammarPoints.some((item) => item.stage === stage),
      ).map((stage) => {
        const points = grammarPoints.filter((item) => item.stage === stage);
        const levelProgress = points
          .map((item) => progress[item.id])
          .filter(isGrammarPracticed);
        const practiced = levelProgress.length;
        const rounds = levelProgress.reduce((sum, item) => sum + item.rounds, 0);
        const correct = levelProgress.reduce((sum, item) => sum + item.correct, 0);
        const attempts = levelProgress.reduce((sum, item) => sum + item.total, 0);

        return {
          stage,
          title: GRAMMAR_STAGE_META[stage].title,
          practiced,
          total: points.length,
          rounds,
          accuracy: percent(correct, attempts),
        };
      }),
    [grammarPoints, progress],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Grammar"
        title="Grammar stats"
        subtitle="Track how much grammar you have practiced, where your strongest coverage is, and which units still need attention."
        density="compact"
        toolbar={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={AppSketch.ink} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={AppSketch.inkMuted} />
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={[styles.summaryStrip, compactMetrics && styles.summaryStripWrap]}>
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Topics practiced</Text>
                <Text style={styles.heroValue}>
                  {practicedEntries.length}/{grammarPoints.length}
                </Text>
                <Text style={styles.heroSubtitle}>active curriculum coverage</Text>
              </View>

              <MetricCard
                label="All-time rounds"
                value={totalRounds}
                detail="completed grammar rounds"
              />
              <MetricCard
                label="All-time accuracy"
                value={`${percent(totalCorrect, totalAttempts)}%`}
                detail="across practiced grammar"
              />
              <MetricCard
                label="Last practiced"
                value={timeAgo(lastPracticed)}
                detail="most recent grammar activity"
              />
            </View>

            <DesktopPanel>
              <DesktopSectionTitle
                title="By unit"
                caption="Each unit shows how much of that stage you have practiced, plus rounds and accuracy."
              />

              <View style={styles.grid}>
                {stageSummaries.map((item) => {
                  const completion =
                    item.total > 0
                      ? Math.round((item.practiced / item.total) * 100)
                      : 0;

                  return (
                    <View
                      key={item.stage}
                      style={[styles.stageCard, { width: stageCardWidth }]}
                    >
                      <View style={styles.stageCardTop}>
                        <Text style={styles.stageTag}>{item.stage}</Text>
                        <Text style={styles.stageRounds}>{item.rounds} rounds</Text>
                      </View>

                      <Text style={styles.stageTitle}>{item.title}</Text>

                      <View style={styles.stageProgressRow}>
                        <View style={styles.stageTrack}>
                          <View
                            style={[
                              styles.stageFill,
                              { width: `${completion}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.stagePercent}>{completion}%</Text>
                      </View>

                      <View style={styles.stageMetaRow}>
                        <Text style={styles.stageMeta}>
                          {item.practiced}/{item.total} topics
                        </Text>
                        <Text style={styles.stageMeta}>{item.accuracy}% accuracy</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </DesktopPanel>
          </View>
        )}
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 20,
  },
  backButton: {
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
  backButtonText: {
    ...AppTypography.label,
    color: AppSketch.ink,
  },
  loadingPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryStrip: {
    flexDirection: "row",
    gap: AppSpacing.md,
  },
  summaryStripWrap: {
    flexWrap: "wrap",
  },
  heroCard: {
    flex: 1.16,
    minWidth: 260,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.lg,
    backgroundColor: AppSketch.surface,
    padding: 22,
    gap: 6,
    ...appShadow("sm"),
  },
  heroLabel: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroValue: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -1,
  },
  heroSubtitle: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
  },
  metricCard: {
    flex: 0.92,
    minWidth: 190,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.lg,
    backgroundColor: AppSketch.surface,
    padding: 20,
    gap: 4,
    ...appShadow("sm"),
  },
  metricLabel: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  metricDetail: {
    ...AppTypography.caption,
    color: AppSketch.inkSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.md,
  },
  stageCard: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.lg,
    backgroundColor: AppSketch.surface,
    padding: 18,
    gap: 12,
  },
  stageCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stageTag: {
    ...AppTypography.captionSmall,
    color: AppSketch.primary,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stageRounds: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
    fontWeight: "700",
  },
  stageTitle: {
    ...AppTypography.subheading,
    color: AppSketch.ink,
    letterSpacing: -0.25,
  },
  stageProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stageTrack: {
    flex: 1,
    height: 7,
    backgroundColor: AppSketch.borderLight,
    borderRadius: AppRadius.full,
    overflow: "hidden",
  },
  stageFill: {
    height: "100%",
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.full,
  },
  stagePercent: {
    minWidth: 42,
    textAlign: "right",
    ...AppTypography.caption,
    color: AppSketch.primary,
    fontWeight: "700",
  },
  stageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stageMeta: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
  },
});
