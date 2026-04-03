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

import { Sketch } from "@/constants/theme";
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
import { MUTED_APP_ACCENTS, withAlpha } from "@/src/utils/toneAccent";

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

const LEVEL_ACCENTS = [
  MUTED_APP_ACCENTS.clay,
  MUTED_APP_ACCENTS.slate,
  MUTED_APP_ACCENTS.sage,
  MUTED_APP_ACCENTS.rose,
  MUTED_APP_ACCENTS.stone,
  MUTED_APP_ACCENTS.clay,
];

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

  const stageCardWidth =
    width >= 1320 ? "31.8%" : width >= 980 ? "48.8%" : "100%";
  const compactSummary = width < 1180;

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
        const correct = levelProgress.reduce(
          (sum, item) => sum + item.correct,
          0,
        );
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
        subtitle="See how much grammar you have practiced and where your strongest progress is."
        toolbar={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={Sketch.ink} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={Sketch.inkMuted} />
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={[styles.metricStrip, compactSummary && styles.metricStripWrap]}>
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Topics practiced</Text>
                <Text style={styles.heroValue}>
                  {practicedEntries.length}/{grammarPoints.length}
                </Text>
                <Text style={styles.heroSubtitle}>active curriculum coverage</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: MUTED_APP_ACCENTS.clay }]}>
                  {totalRounds}
                </Text>
                <Text style={styles.statLabel}>All-time rounds</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: MUTED_APP_ACCENTS.sage }]}>
                  {percent(totalCorrect, totalAttempts)}%
                </Text>
                <Text style={styles.statLabel}>All-time accuracy</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.lastLabel}>Last practiced</Text>
                <Text style={styles.lastValue}>{timeAgo(lastPracticed)}</Text>
              </View>
            </View>

            <DesktopPanel>
              <DesktopSectionTitle
                title="By unit"
                caption="Each unit shows your coverage, rounds, and accuracy."
              />
              <View style={styles.grid}>
                {stageSummaries.map((item, index) => {
                  const accent = LEVEL_ACCENTS[index % LEVEL_ACCENTS.length];
                  const completion =
                    item.total > 0
                      ? Math.round((item.practiced / item.total) * 100)
                      : 0;

                  return (
                    <View
                      key={item.stage}
                      style={[styles.levelCard, { width: stageCardWidth }]}
                    >
                      <View style={styles.levelHeader}>
                        <Text style={[styles.levelTag, { color: accent }]}>
                          {item.stage}
                        </Text>
                        <Text style={[styles.levelRounds, { color: accent }]}>
                          {item.rounds} rounds
                        </Text>
                      </View>
                      <Text style={styles.levelTitle}>{item.title}</Text>
                      <View style={styles.progressRow}>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${completion}%`, backgroundColor: accent },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressPercent, { color: accent }]}>
                          {completion}%
                        </Text>
                      </View>
                      <Text style={styles.levelMeta}>
                        {item.practiced}/{item.total} topics - {item.accuracy}% accuracy
                      </Text>
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
    gap: 28,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  loadingPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  metricStrip: {
    flexDirection: "row",
    gap: 16,
  },
  metricStripWrap: {
    flexWrap: "wrap",
  },
  heroCard: {
    flex: 1.12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: withAlpha(MUTED_APP_ACCENTS.stone, "0B"),
    padding: 22,
    gap: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroValue: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Sketch.inkMuted,
  },
  statCard: {
    flex: 0.88,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 20,
    gap: 6,
    minWidth: 220,
  },
  statValue: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  statLabel: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  lastLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  lastValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  levelCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 12,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  levelTag: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  levelRounds: {
    fontSize: 12,
    fontWeight: "600",
  },
  levelTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Sketch.inkFaint,
  },
  progressFill: {
    height: "100%",
  },
  progressPercent: {
    minWidth: 40,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  levelMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
});
