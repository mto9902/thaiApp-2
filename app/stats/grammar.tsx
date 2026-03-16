import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import Header from "../../src/components/Header";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
} from "../../src/data/grammarStages";
import { useGrammarCatalog } from "../../src/grammar/GrammarCatalogProvider";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";
import { MUTED_APP_ACCENTS, withAlpha } from "../../src/utils/toneAccent";

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

export default function GrammarStatsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );

  const metricCardWidth = width < 380 ? "100%" : "48%";

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const allProgress = await getAllProgress();
      setProgress(allProgress);
    } catch (err) {
      console.error("Failed to load grammar stats:", err);
    } finally {
      setLoading(false);
    }
  }

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

  const stageSummaries: StageSummary[] = GRAMMAR_STAGES.filter((stage) =>
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
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Grammar Stats" onBack={() => router.back()} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Grammar Overview</Text>
            <Text style={styles.heroValue}>
              {practicedEntries.length}/{grammarPoints.length}
            </Text>
            <Text style={styles.heroSubtitle}>topics practiced</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { width: metricCardWidth }]}>
              <Text style={[styles.statValue, { color: MUTED_APP_ACCENTS.clay }]}>
                {totalRounds}
              </Text>
              <Text style={styles.statLabel}>All-time rounds</Text>
            </View>
            <View style={[styles.statCard, { width: metricCardWidth }]}>
              <Text style={[styles.statValue, { color: MUTED_APP_ACCENTS.sage }]}>
                {percent(totalCorrect, totalAttempts)}%
              </Text>
              <Text style={styles.statLabel}>All-time accuracy</Text>
            </View>
            <View style={[styles.statCard, { width: metricCardWidth }]}>
              <Text style={styles.lastPracticedLabel}>Last practiced</Text>
              <Text style={styles.lastPracticedValue}>
                {timeAgo(lastPracticed)}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>By unit</Text>
            <View style={styles.levelGrid}>
              {stageSummaries.map((item, index) => {
                const accent = LEVEL_ACCENTS[index % LEVEL_ACCENTS.length];
                const percentage =
                  item.total > 0
                    ? Math.round((item.practiced / item.total) * 100)
                    : 0;

                return (
                  <View
                    key={item.stage}
                    style={[styles.levelCard, { width: metricCardWidth }]}
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
                            {
                              width: `${percentage}%`,
                              backgroundColor: accent,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressPercent, { color: accent }]}>
                        {percentage}%
                      </Text>
                    </View>
                    <Text style={styles.levelMeta}>
                      {item.practiced}/{item.total} topics - {item.accuracy}%
                      {" "}accuracy
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    backgroundColor: withAlpha(MUTED_APP_ACCENTS.stone, "0B"),
    borderRadius: 0,
    padding: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroValue: {
    fontSize: 40,
    fontWeight: "700",
    color: Sketch.ink,
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flexGrow: 1,
    backgroundColor: Sketch.cardBg,
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 4,
  },
  lastPracticedLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  lastPracticedValue: {
    fontSize: 18,
    fontWeight: "600",
    color: Sketch.ink,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  levelCard: {
    flexGrow: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 8,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelTag: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  levelRounds: {
    fontSize: 12,
    fontWeight: "500",
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: Sketch.inkFaint,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  progressFill: {
    height: "100%",
    borderRadius: 0,
    backgroundColor: MUTED_APP_ACCENTS.clay,
  },
  progressPercent: {
    minWidth: 32,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
    color: MUTED_APP_ACCENTS.clay,
  },
  levelMeta: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
});
