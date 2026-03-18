import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { CEFR_LEVELS, CEFR_LEVEL_META, CefrLevel } from "@/src/data/grammarLevels";
import { GRAMMAR_STAGE_META } from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { getAllProgress, GrammarProgressData } from "@/src/utils/grammarProgress";
import {
  buildStageProgressSummaries,
  getRecommendedGrammarStage,
} from "@/src/utils/grammarStageRecommendation";

export default function GrammarProgressWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllProgress().then((nextProgress) => {
        if (!active) return;
        setProgress(nextProgress);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const stageSummaries = useMemo(
    () => buildStageProgressSummaries(grammarPoints, progress),
    [grammarPoints, progress],
  );
  const recommended = useMemo(
    () => getRecommendedGrammarStage(stageSummaries),
    [stageSummaries],
  );
  const columns = width >= 1460 ? 4 : width >= 1100 ? 3 : width >= 820 ? 2 : 1;
  const levelCardWidth =
    columns === 4 ? "23.6%" : columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

  const totalPoints = grammarPoints.length;
  const totalPracticed = stageSummaries.reduce(
    (sum, summary) => sum + summary.practiced,
    0,
  );
  const overallPercent =
    totalPoints > 0 ? Math.round((totalPracticed / totalPoints) * 100) : 0;

  const levelSections = useMemo(
    () =>
      CEFR_LEVELS.map((level) => {
        const stages = stageSummaries.filter((summary) => summary.level === level);
        if (stages.length === 0) return null;
        const practiced = stages.reduce((sum, summary) => sum + summary.practiced, 0);
        const total = stages.reduce((sum, summary) => sum + summary.total, 0);
        const percentage = total > 0 ? Math.round((practiced / total) * 100) : 0;
        return {
          level,
          meta: CEFR_LEVEL_META[level],
          stages,
          practiced,
          total,
          percentage,
        };
      }).filter(Boolean),
    [stageSummaries],
  ) as {
    level: CefrLevel;
    meta: (typeof CEFR_LEVEL_META)[CefrLevel];
    stages: typeof stageSummaries;
    practiced: number;
    total: number;
    percentage: number;
  }[];

  return (
    <DesktopPage
      eyebrow="Grammar"
      title="Your grammar progress"
      subtitle="Follow the lesson path, see what is complete, and continue from the next topic."
    >
      <View style={styles.pageStack}>
        <View style={styles.topRow}>
          <DesktopPanel style={styles.summaryPanel}>
            <DesktopSectionTitle
              title="Overview"
              caption={`${totalPracticed} of ${totalPoints} grammar topics practiced.`}
            />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>{overallPercent}%</Text>
              <View style={styles.summaryTrackWrap}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${overallPercent}%` }]} />
                </View>
                <Text style={styles.summaryHint}>
                  {Math.max(totalPoints - totalPracticed, 0)} topics still open
                </Text>
              </View>
            </View>
          </DesktopPanel>

          <DesktopPanel style={styles.recommendPanel}>
            <DesktopSectionTitle
              title="Continue learning"
              caption="Resume the most relevant unit instead of hunting for where to go next."
            />
            {recommended ? (
              <TouchableOpacity
                style={styles.recommendCard}
                onPress={() =>
                      router.push(`/practice/topics?stage=${recommended.stage}` as any)
                }
                activeOpacity={0.82}
              >
                <Text style={styles.recommendEyebrow}>Recommended</Text>
                <Text style={styles.recommendTitle}>
                  {recommended.stage} {GRAMMAR_STAGE_META[recommended.stage].shortTitle}
                </Text>
                <Text style={styles.recommendBody}>
                  {GRAMMAR_STAGE_META[recommended.stage].subtitle}
                </Text>
                <View style={styles.openRow}>
                  <Text style={styles.openText}>Open unit</Text>
                  <Ionicons name="chevron-forward" size={14} color={Sketch.accent} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.recommendCard}>
                <Text style={styles.recommendTitle}>Everything is completed.</Text>
                <Text style={styles.recommendBody}>
                  Use mixed practice or revisit specific units you want to reinforce.
                </Text>
              </View>
            )}
          </DesktopPanel>
        </View>

        <DesktopPanel>
          <DesktopSectionTitle
            title="Levels"
            caption="Browse the curriculum by level and open any unit from the lesson path."
          />
          <View style={styles.levelGrid}>
            {levelSections.map((section) => (
              <View key={section.level} style={[styles.levelCard, { width: levelCardWidth }]}>
                <View style={styles.levelTop}>
                  <View style={styles.levelHeading}>
                    <Text style={styles.levelName}>{section.level}</Text>
                    <Text style={styles.levelSubtitle}>{section.meta.subtitle}</Text>
                  </View>
                  <Text style={styles.levelPercent}>{section.percentage}%</Text>
                </View>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${section.percentage}%` }]} />
                </View>
                <Text style={styles.levelCount}>
                  {section.practiced}/{section.total} topics practiced
                </Text>

                <View style={styles.unitList}>
                  {section.stages.map((stageSummary) => {
                    const meta = GRAMMAR_STAGE_META[stageSummary.stage];
                    const isRecommended = recommended?.stage === stageSummary.stage;
                    return (
                      <TouchableOpacity
                        key={stageSummary.stage}
                        style={[
                          styles.unitCard,
                          isRecommended && styles.unitCardRecommended,
                        ]}
                        onPress={() =>
                    router.push(`/practice/topics?stage=${stageSummary.stage}` as any)
                        }
                        activeOpacity={0.82}
                      >
                        <View style={styles.unitTop}>
                          <Text style={styles.unitStage}>{stageSummary.stage}</Text>
                          <Text style={styles.unitPercent}>{stageSummary.percentage}%</Text>
                        </View>
                        <Text style={styles.unitTitle}>{meta.shortTitle}</Text>
                        <Text style={styles.unitBody}>{meta.subtitle}</Text>
                        <Text style={styles.unitCount}>
                          {stageSummary.practiced}/{stageSummary.total}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </DesktopPanel>
      </View>
    </DesktopPage>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 28,
  },
  topRow: {
    flexDirection: "row",
    gap: 20,
  },
  summaryPanel: {
    flex: 0.95,
    minHeight: 210,
  },
  recommendPanel: {
    flex: 1.05,
    minHeight: 210,
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  summaryValue: {
    minWidth: 120,
    fontSize: 50,
    lineHeight: 54,
    fontWeight: "700",
    color: Sketch.accent,
    letterSpacing: -1.3,
  },
  summaryTrackWrap: {
    flex: 1,
    gap: 10,
  },
  summaryHint: {
    fontSize: 14,
    color: Sketch.inkMuted,
  },
  track: {
    height: 8,
    backgroundColor: Sketch.inkFaint,
  },
  fill: {
    height: "100%",
    backgroundColor: Sketch.accent,
  },
  recommendCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 20,
    gap: 8,
    minHeight: 130,
    justifyContent: "center",
  },
  recommendEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  recommendTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  recommendBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 4,
  },
  openText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accent,
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  levelCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 12,
    alignSelf: "flex-start",
  },
  levelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  levelHeading: {
    flex: 1,
    gap: 4,
  },
  levelName: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.7,
  },
  levelSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
  levelPercent: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.accent,
  },
  levelCount: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  unitList: {
    gap: 10,
  },
  unitCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 14,
    gap: 6,
  },
  unitCardRecommended: {
    borderColor: Sketch.accent,
  },
  unitTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  unitStage: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  unitPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.accent,
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  unitBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  unitCount: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
});
