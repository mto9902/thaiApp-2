import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CEFR_LEVEL_META,
  PUBLIC_CEFR_LEVELS,
  type PublicCefrLevel,
} from "@/src/data/grammarLevels";
import { GRAMMAR_STAGE_META } from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import {
  getAllProgress,
  type GrammarProgressData,
} from "@/src/utils/grammarProgress";
import {
  buildStageProgressSummaries,
  getRecommendedGrammarStage,
} from "@/src/utils/grammarStageRecommendation";

const BRAND = {
  bg: "#FAFAFA",
  paper: "#FFFFFF",
  panel: "#FAFAFA",
  ink: "#102A43",
  inkSoft: "#486581",
  body: "#52606D",
  muted: "#7B8794",
  line: "#E5E7EB",
  navy: "#17324D",
  white: "#FFFFFF",
};

const CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;

const SURFACE_SHADOW = {
  shadowColor: "#111827",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;

const LIGHT_BUTTON_SHADOW = {
  shadowColor: "#111827",
  shadowOpacity: 0.1,
  shadowRadius: 7,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

const LIGHT_BUTTON_PRESSED = {
  transform: [{ translateY: 1.25 }],
  shadowOpacity: 0.05,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

const NAVY_BUTTON_SHADOW = {
  shadowColor: "#102A43",
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 3,
} as const;

const NAVY_BUTTON_PRESSED = {
  transform: [{ translateY: 1.25 }],
  shadowOpacity: 0.1,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

const SURFACE_PRESSED = {
  transform: [{ translateY: 1.5 }],
  shadowOpacity: 0.04,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;

const TAP_SETTLE_MS = 140;

function useTransientPressed(disabled = false) {
  const [transientPressed, setTransientPressed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTransientPressed(true);
  }, [disabled]);

  const onPressOut = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setTransientPressed(false), TAP_SETTLE_MS);
  }, [disabled]);

  return {
    transientPressed,
    onPressIn,
    onPressOut,
  };
}

function SurfaceButton({
  label,
  onPress,
  variant = "secondary",
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { transientPressed, onPressIn, onPressOut } = useTransientPressed(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.buttonBase,
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        (pressed || transientPressed) && (variant === "primary"
          ? styles.primaryButtonPressed
          : styles.secondaryButtonPressed),
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={variant === "primary" ? BRAND.white : BRAND.ink}
          style={styles.buttonIcon}
        />
      ) : null}
      <Text
        style={[
          styles.buttonLabel,
          variant === "primary" ? styles.primaryButtonLabel : styles.secondaryButtonLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SettledPressable({
  children,
  disabled,
  onPress,
  style,
}: {
  children: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: any;
}) {
  const { transientPressed, onPressIn, onPressOut } = useTransientPressed(Boolean(disabled));

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) =>
        typeof style === "function"
          ? style({ pressed: pressed || transientPressed })
          : style
      }
    >
      {children}
    </Pressable>
  );
}

type LevelSection = {
  level: PublicCefrLevel;
  practiced: number;
  total: number;
  percentage: number;
  stageCount: number;
  title: string;
  subtitle: string;
  stages: ReturnType<typeof buildStageProgressSummaries>;
};

export default function GrammarProgressScreen() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [expandedLevels, setExpandedLevels] = useState<
    Partial<Record<PublicCefrLevel, boolean>>
  >({});
  const [hasManualLevelToggle, setHasManualLevelToggle] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setExpandedLevels({});
      setHasManualLevelToggle(false);

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

  const totalPoints = grammarPoints.length;
  const totalPracticed = stageSummaries.reduce(
    (sum, summary) => sum + summary.practiced,
    0,
  );
  const overallPercent =
    totalPoints > 0 ? Math.round((totalPracticed / totalPoints) * 100) : 0;

  const levelSections = useMemo<LevelSection[]>(
    () =>
      PUBLIC_CEFR_LEVELS.map((level) => {
        const stages = stageSummaries.filter((summary) => summary.level === level);
        if (stages.length === 0) return null;

        const practiced = stages.reduce((sum, summary) => sum + summary.practiced, 0);
        const total = stages.reduce((sum, summary) => sum + summary.total, 0);
        const percentage = total > 0 ? Math.round((practiced / total) * 100) : 0;

        return {
          level,
          practiced,
          total,
          percentage,
          stageCount: stages.length,
          title: CEFR_LEVEL_META[level].homeTitle.startsWith(`${level} `)
            ? CEFR_LEVEL_META[level].homeTitle.slice(level.length + 1)
            : CEFR_LEVEL_META[level].homeTitle,
          subtitle: CEFR_LEVEL_META[level].subtitle,
          stages,
        };
      }).filter((section): section is LevelSection => section !== null),
    [stageSummaries],
  );

  const toggleLevel = useCallback((level: PublicCefrLevel) => {
    setHasManualLevelToggle(true);
    setExpandedLevels((current) => ({
      ...current,
      [level]: !current[level],
    }));
  }, []);

  const openStage = useCallback(
    (stage: string) => {
      router.push(`/grammar-topics?stage=${stage}` as any);
    },
    [router],
  );

  const recommendedMeta = recommended ? GRAMMAR_STAGE_META[recommended.stage] : null;

  return (
    <SafeAreaView
      testID="keystone-mobile-screen-root"
      edges={["top"]}
      style={styles.safeArea}
    >
      <ScrollView
        testID="keystone-mobile-page-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Grammar progress</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Progress</Text>
          <Text style={styles.bodyText}>See what you have practiced so far.</Text>

          <View style={styles.overviewRow}>
            <Text style={styles.bigPercent}>{overallPercent}%</Text>
            <View style={styles.overviewCopy}>
              <Text style={styles.overviewMetric}>
                {totalPracticed}/{totalPoints} topics practiced
              </Text>
              <Text style={styles.overviewHint}>Complete so far</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${overallPercent}%` }]} />
          </View>

          {recommended && recommendedMeta ? (
            <View style={styles.recommendPanel}>
              <View style={styles.recommendHeader}>
                <Text style={styles.recommendEyebrow}>Next up</Text>
                <Text style={styles.recommendStage}>{recommended.stage}</Text>
              </View>
              <Text style={styles.recommendTitle}>
                {recommended.stage} {recommendedMeta.shortTitle}
              </Text>
              <Text style={styles.recommendBody}>Continue with the next unit.</Text>
              <SurfaceButton
                label="Continue"
                variant="primary"
                onPress={() => openStage(recommended.stage)}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Levels</Text>
          <Text style={styles.bodyText}>
            Browse the course by level and open any unit when you are ready.
          </Text>

          <View style={styles.levelList}>
            {levelSections.map((section) => {
              const isExpanded =
                expandedLevels[section.level] ??
                (!hasManualLevelToggle && recommended?.level === section.level);

              return (
                <View key={section.level} style={styles.levelCard}>
                  <SettledPressable
                    onPress={() => toggleLevel(section.level)}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.levelHeader,
                      pressed ? styles.surfacePressed : null,
                    ]}
                  >
                    <View style={styles.levelTopRow}>
                      <View style={styles.levelTitleRow}>
                        <Text style={styles.levelName}>{section.level}</Text>
                        <Text style={styles.levelTitle}>{section.title}</Text>
                      </View>
                      <View style={styles.levelTopRight}>
                        <Text style={styles.levelPercent}>{section.percentage}%</Text>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={BRAND.inkSoft}
                        />
                      </View>
                    </View>

                    <Text style={styles.levelSubtitle}>{section.subtitle}</Text>

                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { width: `${section.percentage}%` }]}
                      />
                    </View>

                    <View style={styles.levelMetaRow}>
                      <Text style={styles.levelMetaText}>
                        {section.practiced}/{section.total} topics practiced
                      </Text>
                      <Text style={styles.levelMetaText}>
                        {section.stageCount} unit{section.stageCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </SettledPressable>

                  {isExpanded ? (
                    <View style={styles.stageList}>
                      {section.stages.map((stageSummary) => {
                        const meta = GRAMMAR_STAGE_META[stageSummary.stage];
                        const isRecommended = recommended?.stage === stageSummary.stage;

                        return (
                          <SettledPressable
                            key={stageSummary.stage}
                            onPress={() => openStage(stageSummary.stage)}
                            style={({ pressed }: { pressed: boolean }) => [
                              styles.stageCard,
                              pressed ? styles.surfacePressed : null,
                            ]}
                          >
                            <View style={styles.stageTopRow}>
                              <Text style={styles.stageLabel}>{stageSummary.stage}</Text>
                              <Text style={styles.stagePercent}>
                                {stageSummary.percentage}%
                              </Text>
                            </View>

                            <Text style={styles.stageTitle}>{meta.title}</Text>
                            <Text style={styles.stageBody}>{meta.subtitle}</Text>

                            <View style={styles.stageProgressRow}>
                              <View style={styles.stageTrack}>
                                <View
                                  style={[
                                    styles.stageFill,
                                    { width: `${stageSummary.percentage}%` },
                                  ]}
                                />
                              </View>
                            </View>

                            <View style={styles.stageFooterRow}>
                              <Text style={styles.stageFooterText}>
                                {stageSummary.practiced}/{stageSummary.total} topics
                              </Text>
                              <View style={styles.openRow}>
                                <Text style={styles.openText}>
                                  {isRecommended ? "Continue" : "Open unit"}
                                </Text>
                                <Ionicons
                                  name="chevron-forward"
                                  size={14}
                                  color={BRAND.ink}
                                />
                              </View>
                            </View>
                          </SettledPressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    paddingTop: 4,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
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
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bigPercent: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: "800",
    color: BRAND.ink,
  },
  overviewCopy: {
    flex: 1,
    gap: 4,
  },
  overviewMetric: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
  },
  overviewHint: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E6EAF0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: BRAND.navy,
    borderRadius: 999,
  },
  recommendPanel: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  recommendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  recommendEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  recommendStage: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  recommendTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  recommendBody: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  buttonBase: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: BRAND.navy,
    borderColor: BRAND.navy,
    ...NAVY_BUTTON_SHADOW,
  },
  secondaryButton: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.line,
    ...LIGHT_BUTTON_SHADOW,
  },
  primaryButtonPressed: {
    ...NAVY_BUTTON_PRESSED,
  },
  secondaryButtonPressed: {
    ...LIGHT_BUTTON_PRESSED,
  },
  buttonLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  primaryButtonLabel: {
    color: BRAND.white,
  },
  secondaryButtonLabel: {
    color: BRAND.ink,
  },
  buttonIcon: {
    marginRight: 8,
  },
  levelList: {
    gap: 12,
  },
  levelCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    overflow: "hidden",
    ...SURFACE_SHADOW,
  },
  levelHeader: {
    padding: 16,
    gap: 10,
  },
  levelTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  levelTitleRow: {
    flex: 1,
    gap: 4,
  },
  levelTopRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  levelName: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
  },
  levelTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
  },
  levelPercent: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  levelSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  levelMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  levelMetaText: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  stageList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  stageCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  stageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stageLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  stageTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  stageBody: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  stageProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stageTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E6EAF0",
    overflow: "hidden",
  },
  stageFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: BRAND.navy,
  },
  stagePercent: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    minWidth: 40,
    textAlign: "right",
  },
  stageFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stageFooterText: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
  },
  statusTag: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
    ...LIGHT_BUTTON_SHADOW,
  },
  statusTagText: {
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.inkSoft,
    fontWeight: "600",
  },
  surfacePressed: {
    ...SURFACE_PRESSED,
  },
});
