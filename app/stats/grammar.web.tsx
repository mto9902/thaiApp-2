import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT,
  WEB_BRAND as BRAND,
  WEB_CARD_SHADOW as CARD_SHADOW,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED as LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW as LIGHT_BUTTON,
} from "@/src/components/web/designSystem";
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
import GrammarStatsMobileScreen from "@/src/screens/mobile/GrammarStatsMobileScreen";

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
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <GrammarStatsMobileScreen />;
  }

  return <DesktopGrammarStatsContent />;
}

function DesktopGrammarStatsContent() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );
  const { width } = useWindowDimensions();

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
          <Pressable
            onPress={() => router.back()}
            style={({ hovered, pressed }) => [
              styles.backButton,
              (hovered || pressed) && styles.backButtonActive,
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={BRAND.ink} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={BRAND.inkSoft} />
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={[styles.summaryStrip, compactMetrics && styles.summaryStripWrap]}>
              <View style={styles.heroCard}>
                <Text style={styles.metricLabel}>Topics practiced</Text>
                <Text style={styles.heroValue}>
                  {practicedEntries.length}/{grammarPoints.length}
                </Text>
                <Text style={styles.metricDetail}>active curriculum coverage</Text>
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
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 0,
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  backButtonActive: {
    transform: [{ translateY: 1.6 }],
    boxShadow: LIGHT_BUTTON_PRESSED as any,
  },
  backButtonText: {
    color: BRAND.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  loadingPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryStrip: {
    flexDirection: "row",
    gap: 16,
  },
  summaryStripWrap: {
    flexWrap: "wrap",
  },
  heroCard: {
    flex: 1.16,
    minWidth: 260,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.paper,
    padding: 22,
    gap: 6,
    boxShadow: CARD_SHADOW as any,
  },
  metricCard: {
    flex: 0.92,
    minWidth: 190,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.paper,
    padding: 20,
    gap: 4,
    boxShadow: CARD_SHADOW as any,
  },
  metricLabel: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: WEB_BODY_FONT,
  },
  heroValue: {
    color: BRAND.ink,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: -1,
    fontFamily: WEB_DISPLAY_FONT,
  },
  metricValue: {
    color: BRAND.ink,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    fontFamily: WEB_DISPLAY_FONT,
  },
  metricDetail: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: WEB_BODY_FONT,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  stageCard: {
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.paper,
    padding: 18,
    gap: 12,
    boxShadow: CARD_SHADOW as any,
  },
  stageCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stageTag: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    fontFamily: WEB_BODY_FONT,
  },
  stageRounds: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  stageTitle: {
    color: BRAND.ink,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  stageProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stageTrack: {
    flex: 1,
    height: 7,
    backgroundColor: "#E8EBEF",
    borderRadius: 999,
    overflow: "hidden",
  },
  stageFill: {
    height: "100%",
    backgroundColor: BRAND.navy,
    borderRadius: 999,
  },
  stagePercent: {
    minWidth: 42,
    textAlign: "right",
    color: BRAND.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  stageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stageMeta: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: WEB_BODY_FONT,
  },
});
