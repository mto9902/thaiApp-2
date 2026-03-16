import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { Sketch, SketchRadius, sketchShadow } from "@/constants/theme";
import {
  CEFR_LEVELS,
  CEFR_LEVEL_META,
  CefrLevel,
} from "../../src/data/grammarLevels";
import {
  GRAMMAR_STAGE_META,
} from "../../src/data/grammarStages";
import { useGrammarCatalog } from "../../src/grammar/GrammarCatalogProvider";
import {
  getAllProgress,
  GrammarProgressData,
} from "../../src/utils/grammarProgress";
import {
  buildStageProgressSummaries,
  getRecommendedGrammarStage,
} from "../../src/utils/grammarStageRecommendation";

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
  const { grammarPoints } = useGrammarCatalog();
  const scrollViewRef = useRef<ScrollView>(null);
  const levelOffsetsRef = useRef<Partial<Record<CefrLevel, number>>>({});
  const hasAutoScrolledRef = useRef(false);
  const autoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [expandedLevels, setExpandedLevels] = useState<
    Partial<Record<CefrLevel, boolean>>
  >({});
  const [hasManualLevelToggle, setHasManualLevelToggle] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const stageSummaries = useMemo(
    () => buildStageProgressSummaries(grammarPoints, progress),
    [grammarPoints, progress],
  );
  const recommended = useMemo(
    () => getRecommendedGrammarStage(stageSummaries),
    [stageSummaries],
  );
  const recommendedStage = recommended?.stage ?? null;
  const recommendedLevel = recommended?.level ?? null;
  const levelSections = useMemo(
    () =>
      CEFR_LEVELS.map((level) => {
        const levelStages = stageSummaries.filter(
          (summary) => summary.level === level,
        );
        if (levelStages.length === 0) return null;

        const practiced = levelStages.reduce(
          (sum, summary) => sum + summary.practiced,
          0,
        );
        const total = levelStages.reduce((sum, summary) => sum + summary.total, 0);
        const percentage = total > 0 ? Math.round((practiced / total) * 100) : 0;
        const nextStage = levelStages.find(
          (summary) => summary.stage === recommendedStage,
        );

        return {
          level,
          meta: CEFR_LEVEL_META[level],
          levelTitle: CEFR_LEVEL_META[level].homeTitle.startsWith(`${level} `)
            ? CEFR_LEVEL_META[level].homeTitle.slice(level.length + 1)
            : CEFR_LEVEL_META[level].homeTitle,
          stages: levelStages,
          total,
          practiced,
          percentage,
          isRecommended: level === recommendedLevel,
          recommendedStageSummary: nextStage ?? null,
        };
      }).filter(Boolean),
    [recommendedLevel, recommendedStage, stageSummaries],
  ) as {
    level: CefrLevel;
    meta: (typeof CEFR_LEVEL_META)[CefrLevel];
    levelTitle: string;
    stages: ReturnType<typeof buildStageProgressSummaries>;
    total: number;
    practiced: number;
    percentage: number;
    isRecommended: boolean;
    recommendedStageSummary: ReturnType<typeof buildStageProgressSummaries>[number] | null;
  }[];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      hasAutoScrolledRef.current = false;
      setExpandedLevels({});
      setHasManualLevelToggle(false);
      setFocusTick((current) => current + 1);

      getAllProgress().then((nextProgress) => {
        if (!isActive) return;
        setProgress(nextProgress);
      });

      return () => {
        isActive = false;
      };
    }, []),
  );

  const totalPoints = grammarPoints.length;
  const totalPracticed = stageSummaries.reduce(
    (sum, summary) => sum + summary.practiced,
    0,
  );
  const overallPercent =
    totalPoints > 0 ? Math.round((totalPracticed / totalPoints) * 100) : 0;

  const toggleLevel = (level: CefrLevel) => {
    setHasManualLevelToggle(true);
    setExpandedLevels((current) => ({
      ...current,
      [level]: !current[level],
    }));
  };

  const openStage = (stage: string) => {
    router.push(`/practice/CSVGrammarIndex?stage=${stage}` as any);
  };

  const clearAutoScrollTimeout = useCallback(() => {
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }
  }, []);

  const scrollToRecommendedLevel = useCallback(() => {
    if (!recommendedLevel || hasManualLevelToggle || hasAutoScrolledRef.current) {
      return;
    }

    const targetY = levelOffsetsRef.current[recommendedLevel];
    if (typeof targetY !== "number") return;

    scrollViewRef.current?.scrollTo({
      y: Math.max(0, targetY - 12),
      animated: true,
    });
    hasAutoScrolledRef.current = true;
  }, [hasManualLevelToggle, recommendedLevel]);

  const scheduleAutoScroll = useCallback(() => {
    if (!recommendedLevel || hasManualLevelToggle || hasAutoScrolledRef.current) {
      return;
    }

    clearAutoScrollTimeout();
    autoScrollTimeoutRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        scrollToRecommendedLevel();
      });
    }, 80);
  }, [
    clearAutoScrollTimeout,
    hasManualLevelToggle,
    recommendedLevel,
    scrollToRecommendedLevel,
  ]);

  useEffect(() => {
    scheduleAutoScroll();

    return () => {
      clearAutoScrollTimeout();
    };
  }, [clearAutoScrollTimeout, focusTick, scheduleAutoScroll]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          scheduleAutoScroll();
        }}
      >
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
            const isExpanded =
              expandedLevels[section.level] ??
              (!hasManualLevelToggle && section.isRecommended);

            return (
              <View
                key={section.level}
                style={styles.levelCard}
                onLayout={(event) => {
                  levelOffsetsRef.current[section.level] = event.nativeEvent.layout.y;
                  scheduleAutoScroll();
                }}
              >
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

                    {section.isRecommended && section.recommendedStageSummary ? (
                      <View style={styles.continueBlock}>
                        <Text style={styles.continueLabel}>RECOMMENDED</Text>
                      </View>
                    ) : null}

                  <Text style={styles.levelSubtitle}>{section.meta.subtitle}</Text>

                  <View style={styles.levelMetaRow}>
                    <Text style={styles.levelCount}>
                      {section.practiced}/{section.total} topics practiced
                    </Text>
                    <Text style={styles.levelStageCount}>
                      {section.stages.length} unit{section.stages.length === 1 ? "" : "s"}
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
                    {section.stages.map((stageSummary) => {
                      const meta = GRAMMAR_STAGE_META[stageSummary.stage];
                      const isRecommendedStage =
                        stageSummary.stage === recommendedStage;

                      return (
                          <TouchableOpacity
                            key={stageSummary.stage}
                            style={styles.stageRow}
                            onPress={() => openStage(stageSummary.stage)}
                            activeOpacity={0.76}
                          >
                            <View style={styles.stageRowTop}>
                              <View style={styles.stageHeading}>
                                <View style={styles.stageMetaRow}>
                                  <Text style={styles.stageLabel}>{stageSummary.stage}</Text>
                                </View>
                                <View style={styles.stageTitleRow}>
                                  <Text style={styles.stageTitle}>{meta.shortTitle}</Text>
                                  {isRecommendedStage ? (
                                    <Pressable
                                      onPress={(event) => {
                                        event.stopPropagation();
                                        openStage(stageSummary.stage);
                                      }}
                                      style={({ pressed }) => [
                                        styles.stageContinueButton,
                                        pressed && styles.stageContinueButtonPressed,
                                      ]}
                                    >
                                      <Text style={styles.stageContinueText}>Continue</Text>
                                      <Ionicons
                                        name="chevron-forward"
                                        size={13}
                                        color={Sketch.orange}
                                      />
                                    </Pressable>
                                  ) : null}
                                </View>
                              </View>
                            <View style={styles.stageStats}>
                              <Text style={styles.stagePercent}>
                                {stageSummary.percentage}%
                              </Text>
                              <Text style={styles.stageCount}>
                                {stageSummary.practiced}/{stageSummary.total}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.stageSubtitle}>{meta.subtitle}</Text>

                          <View style={styles.stageProgressBar}>
                            <View
                              style={[
                                styles.stageProgressFill,
                                { width: `${stageSummary.percentage}%` },
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  spacing: {
    height: 20,
  },
  spacingLg: {
    height: 24,
  },
  pageTitle: {
    fontSize: 32,
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
    borderRadius: SketchRadius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    ...sketchShadow(2),
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
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    overflow: "hidden",
    ...sketchShadow(2),
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
    fontWeight: "600",
    color: Sketch.inkLight,
    letterSpacing: 0.2,
  },
  levelHeaderRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  levelPercent: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  levelChevron: {
    marginTop: 2,
  },
  continueBlock: {
    marginTop: 2,
  },
  continueLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 1,
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
    height: 4,
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.track,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  levelProgressFill: {
    height: "100%",
    borderRadius: SketchRadius.track,
    backgroundColor: Sketch.orange,
  },
  stageList: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 10,
  },
  stageRow: {
    backgroundColor: Sketch.paper,
    borderRadius: SketchRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 8,
    ...sketchShadow(2),
  },
  stageRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  stageHeading: {
    flex: 1,
    gap: 4,
  },
  stageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: 0.5,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
    flexShrink: 1,
  },
  stageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stageContinueButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingVertical: 1,
  },
  stageContinueButtonPressed: {
    opacity: 0.72,
  },
  stageContinueText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.1,
  },
  stageStats: {
    alignItems: "flex-end",
    gap: 2,
  },
  stagePercent: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
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
    height: 4,
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.track,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  stageProgressFill: {
    height: "100%",
    borderRadius: SketchRadius.track,
    backgroundColor: Sketch.orange,
  },
});
