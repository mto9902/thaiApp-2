import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { Sketch } from "@/constants/theme";
import { grammarPoints } from "../../src/data/grammar";
import {
  CEFR_LEVELS,
  CEFR_LEVEL_META,
  CefrLevel,
} from "../../src/data/grammarLevels";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
} from "../../src/data/grammarStages";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";

function ProgressRing({ percent, size = 72, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Sketch.inkFaint}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Sketch.orange}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringPercent}>{percent}%</Text>
    </View>
  );
}

export default function GrammarScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [expandedLevels, setExpandedLevels] = useState<
    Partial<Record<CefrLevel, boolean>>
  >({});
  const stages = GRAMMAR_STAGES.filter((stage) =>
    grammarPoints.some((point) => point.stage === stage),
  );
  const levelSections = CEFR_LEVELS.map((level) => {
    const levelStages = stages.filter(
      (stage) => GRAMMAR_STAGE_META[stage].level === level,
    );
    const levelPoints = grammarPoints.filter((point) => point.level === level);
    const practiced = levelPoints.filter((point) =>
      isGrammarPracticed(progress[point.id]),
    ).length;
    const percentage =
      levelPoints.length > 0
        ? Math.round((practiced / levelPoints.length) * 100)
        : 0;

    return {
      level,
      meta: CEFR_LEVEL_META[level],
      levelTitle: CEFR_LEVEL_META[level].homeTitle.startsWith(`${level} `)
        ? CEFR_LEVEL_META[level].homeTitle.slice(level.length + 1)
        : CEFR_LEVEL_META[level].homeTitle,
      stages: levelStages,
      points: levelPoints,
      practiced,
      percentage,
    };
  }).filter((section) => section.points.length > 0);

  useFocusEffect(
    useCallback(() => {
      getAllProgress().then(setProgress);
    }, [])
  );

  const totalPoints = grammarPoints.length;
  const totalPracticed = grammarPoints.filter((g) =>
    isGrammarPracticed(progress[g.id]),
  ).length;
  const overallPercent = totalPoints > 0 ? Math.round((totalPracticed / totalPoints) * 100) : 0;

  const toggleLevel = (level: CefrLevel) => {
    setExpandedLevels((current) => ({
      ...current,
      [level]: !current[level],
    }));
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Grammar</Text>

        <View style={styles.spacing} />

        {/* Overall progress with ring */}
        <View style={styles.summaryRow}>
          <ProgressRing percent={overallPercent} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Overall Progress</Text>
            <Text style={styles.summarySubtitle}>
              {totalPracticed} of {totalPoints} topics practiced
            </Text>
          </View>
        </View>

        <View style={styles.spacingLg} />

        <View style={styles.levelList}>
          {levelSections.map((section) => {
            const isExpanded = Boolean(expandedLevels[section.level]);

            return (
              <View key={section.level} style={styles.levelCard}>
                <TouchableOpacity
                  style={styles.levelHeader}
                  onPress={() => toggleLevel(section.level)}
                  activeOpacity={0.78}
                >
                  <View style={styles.levelHeaderRow}>
                    <View style={styles.levelHeading}>
                      <Text style={styles.levelTitle}>{section.level}</Text>
                      <Text style={styles.levelTrackTitle}>{section.levelTitle}</Text>
                    </View>
                    <View style={styles.levelHeaderRight}>
                      <Text style={styles.levelPercent}>{section.percentage}%</Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={Sketch.inkMuted}
                        style={styles.levelChevron}
                      />
                    </View>
                  </View>

                  <Text style={styles.levelSubtitle}>{section.meta.subtitle}</Text>

                  <View style={styles.levelMetaRow}>
                    <Text style={styles.levelCount}>
                      {section.practiced}/{section.points.length} topics practiced
                    </Text>
                    <Text style={styles.levelStageCount}>
                      {section.stages.length} stage{section.stages.length === 1 ? "" : "s"}
                    </Text>
                  </View>

                  <View style={styles.levelProgressBar}>
                    <View
                      style={[
                        styles.levelProgressFill,
                        { width: `${section.percentage}%` },
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded ? (
                  <View style={styles.stageList}>
                    {section.stages.map((stage) => {
                      const meta = GRAMMAR_STAGE_META[stage];
                      const points = grammarPoints.filter((g) => g.stage === stage);
                      const practiced = points.filter((g) =>
                        isGrammarPracticed(progress[g.id]),
                      ).length;
                      const percentage =
                        points.length > 0
                          ? Math.round((practiced / points.length) * 100)
                          : 0;

                      return (
                        <TouchableOpacity
                          key={stage}
                          style={styles.stageRow}
                          onPress={() =>
                            router.push(`/practice/CSVGrammarIndex?stage=${stage}` as any)
                          }
                          activeOpacity={0.76}
                        >
                          <View style={styles.stageRowTop}>
                            <View style={styles.stageHeading}>
                              <Text style={styles.stageLabel}>{stage}</Text>
                              <Text style={styles.stageTitle}>{meta.shortTitle}</Text>
                            </View>
                            <View style={styles.stageStats}>
                              <Text style={styles.stagePercent}>{percentage}%</Text>
                              <Text style={styles.stageCount}>
                                {practiced}/{points.length}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.stageSubtitle}>{meta.subtitle}</Text>

                          <View style={styles.stageProgressBar}>
                            <View
                              style={[
                                styles.stageProgressFill,
                                { width: `${percentage}%` },
                              ]}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  spacing: {
    height: 20,
  },
  spacingLg: {
    height: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  // Summary
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  summaryText: {
    flex: 1,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  summarySubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  ringPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.orange,
  },
  levelList: {
    gap: 14,
  },
  levelCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  levelHeader: {
    padding: 18,
    gap: 10,
  },
  levelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  levelHeading: {
    flex: 1,
    gap: 4,
  },
  levelTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.8,
  },
  levelTrackTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.4,
  },
  levelHeaderRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  levelPercent: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.orange,
  },
  levelChevron: {
    marginTop: 2,
  },
  levelSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  levelMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  levelCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.ink,
  },
  levelStageCount: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  levelProgressBar: {
    height: 6,
    backgroundColor: Sketch.paperDark,
    borderRadius: 999,
    overflow: "hidden",
  },
  levelProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Sketch.orange,
  },
  stageList: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 10,
  },
  stageRow: {
    backgroundColor: Sketch.paper,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 8,
  },
  stageRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  stageHeading: {
    flex: 1,
    gap: 8,
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.5,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
  stageStats: {
    alignItems: "flex-end",
    gap: 2,
  },
  stagePercent: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.orange,
  },
  stageCount: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  stageSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
    lineHeight: 17,
  },
  stageProgressBar: {
    height: 5,
    backgroundColor: Sketch.paperDark,
    borderRadius: 999,
    overflow: "hidden",
  },
  stageProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Sketch.orange,
  },
});
