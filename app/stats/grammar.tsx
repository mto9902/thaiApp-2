import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import Header from "../../src/components/Header";
import { grammarPoints } from "../../src/data/grammar";
import {
  CEFR_LEVEL_META,
  CEFR_LEVELS,
} from "../../src/data/grammarLevels";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";
import { MUTED_APP_ACCENTS, withAlpha } from "../../src/utils/toneAccent";

type LevelSummary = {
  level: string;
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
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );

  useEffect(() => {
    loadData();
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

  const levelSummaries: LevelSummary[] = CEFR_LEVELS.map((level) => {
    const points = grammarPoints.filter((item) => item.level === level);
    const levelProgress = points
      .map((item) => progress[item.id])
      .filter(isGrammarPracticed);
    const practiced = levelProgress.length;
    const rounds = levelProgress.reduce((sum, item) => sum + item.rounds, 0);
    const correct = levelProgress.reduce((sum, item) => sum + item.correct, 0);
    const attempts = levelProgress.reduce((sum, item) => sum + item.total, 0);

    return {
      level,
      title: CEFR_LEVEL_META[level].homeTitle,
      practiced,
      total: points.length,
      rounds,
      accuracy: percent(correct, attempts),
    };
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Grammar Stats"
        onBack={() => router.back()}
        showSettings={false}
      />

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
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: MUTED_APP_ACCENTS.clay }]}>
                {totalRounds}
              </Text>
              <Text style={styles.statLabel}>Rounds</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: MUTED_APP_ACCENTS.sage }]}>
                {percent(totalCorrect, totalAttempts)}%
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={[styles.statCard, styles.wideCard]}>
              <Text style={styles.lastPracticedLabel}>Last practiced</Text>
              <Text style={styles.lastPracticedValue}>
                {timeAgo(lastPracticed)}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>By level</Text>
            {levelSummaries.map((item, index) => {
              const accent = LEVEL_ACCENTS[index % LEVEL_ACCENTS.length];
              const percentage =
                item.total > 0
                  ? Math.round((item.practiced / item.total) * 100)
                  : 0;

              return (
                <View key={item.level} style={styles.levelCard}>
                  <View style={styles.levelHeader}>
                    <Text style={[styles.levelTag, { color: accent }]}>
                      {item.level}
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
                    {item.practiced}/{item.total} topics practiced •{" "}
                    {item.accuracy}% accuracy
                  </Text>
                </View>
              );
            })}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    backgroundColor: withAlpha(MUTED_APP_ACCENTS.stone, "0B"),
    borderRadius: 16,
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
    width: "48%",
    flexGrow: 1,
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  wideCard: {
    width: "100%",
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
    borderRadius: 16,
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
  levelCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
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
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: Sketch.inkFaint,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
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
