import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  GRAMMAR_STAGE_META,
  PUBLIC_GRAMMAR_STAGES,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import {
  getAllProgress,
  type GrammarProgressData,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

import {
  BRAND,
  CARD_SHADOW,
  SURFACE_SHADOW,
  SurfaceButton,
} from "./dashboardSurface";

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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function GrammarStatsMobileScreen() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );

  const loadData = useCallback(async () => {
    try {
      const allProgress = await getAllProgress();
      setProgress(allProgress);
    } catch (err) {
      console.error("Failed to load grammar stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData]),
  );

  const practicedEntries = useMemo(
    () => Object.entries(progress).filter(([, item]) => isGrammarPracticed(item)),
    [progress],
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

  const summaryMetrics = useMemo(
    () => [
      {
        label: "Coverage",
        value: `${practicedEntries.length}/${grammarPoints.length}`,
      },
      { label: "Rounds", value: totalRounds },
      { label: "Accuracy", value: `${percent(totalCorrect, totalAttempts)}%` },
      { label: "Last practiced", value: timeAgo(lastPracticed) },
    ],
    [grammarPoints.length, lastPracticed, practicedEntries.length, totalAttempts, totalCorrect, totalRounds],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView
          testID="keystone-mobile-page-scroll"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Text style={styles.topTitle}>Grammar stats</Text>
            <SurfaceButton
              label="Back"
              icon="arrow-back"
              size="compact"
              onPress={() => router.back()}
            />
          </View>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator size="large" color={BRAND.inkSoft} />
            </View>
          ) : (
            <>
              <View style={styles.summaryGrid}>
                {summaryMetrics.map((metric) => (
                  <SummaryCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                  />
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionHeading}>By unit</Text>
                <View style={styles.stageList}>
                  {stageSummaries.map((item) => {
                    const completion =
                      item.total > 0
                        ? Math.round((item.practiced / item.total) * 100)
                        : 0;

                    return (
                      <View key={item.stage} style={styles.stageCard}>
                        <View style={styles.stageTopRow}>
                          <Text style={styles.stageLabel}>{item.stage}</Text>
                          <Text style={styles.stagePercent}>{completion}%</Text>
                        </View>

                        <Text style={styles.stageTitle}>{item.title}</Text>

                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${completion}%` },
                            ]}
                          />
                        </View>

                        <View style={styles.stageMetaRow}>
                          <Text style={styles.stageMeta}>
                            {item.practiced}/{item.total} topics
                          </Text>
                          <Text style={styles.stageMeta}>
                            {item.rounds} rounds · {item.accuracy}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topTitle: {
    flex: 1,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 12,
    ...CARD_SHADOW,
  },
  sectionHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.3,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryCard: {
    width: "48.4%",
    minWidth: 150,
    backgroundColor: BRAND.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  summaryValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  stageList: {
    gap: 10,
  },
  stageCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  stageTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stageLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  stagePercent: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
  },
  stageTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#E6EAF0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: BRAND.navy,
    borderRadius: 999,
  },
  stageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stageMeta: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.inkSoft,
  },
});
