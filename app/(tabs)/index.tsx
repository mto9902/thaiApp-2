import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { canAccessApp, isGuestUser } from "../../src/utils/auth";

import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, SketchRadius, sketchShadow } from "@/constants/theme";
import { API_BASE } from "../../src/config";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  GrammarStage,
} from "../../src/data/grammarStages";
import { CEFR_LEVELS, CefrLevel } from "../../src/data/grammarLevels";
import { useGrammarCatalog } from "../../src/grammar/GrammarCatalogProvider";
import { isPremiumGrammarPoint } from "../../src/subscription/premium";
import { useSubscription } from "../../src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "../../src/subscription/usePremiumAccess";
import {
  GrammarProgressData,
  getAllProgress,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";
import { getAuthToken } from "../../src/utils/authStorage";

// Thresholds: 0 = nothing, 1-14 = light, 15-39 = medium, 40-79 = dark, 80+ = darkest
function activityToLevel(count: number): number {
  if (count === 0) return 0;
  if (count < 15) return 1;
  if (count < 40) return 2;
  if (count < 80) return 3;
  return 4;
}

/** Format date as "YYYY-MM-DD" in local time (avoids timezone issues with toISOString). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const HEATMAP_COLORS = ["#E8E8E8", "#D0D0D0", "#B0B0B0", "#888888", "#555555"];

const PROGRESS_LEVEL_OPTIONS = CEFR_LEVELS.filter(
  (level) => level !== "C2",
) as readonly CefrLevel[];
const PROGRESS_FILTER_LEVELS = ["All", ...PROGRESS_LEVEL_OPTIONS] as const;

type ProgressFilterLevel = (typeof PROGRESS_FILTER_LEVELS)[number];
type PendingProgressMixAction =
  | {
      type: "premium";
      label: string;
      route: string;
    }
  | {
      type: "practice";
      route: string;
    };

type ModuleInfo = {
  stage: GrammarStage;
  title: string;
  grammarIds: string[];
};

function shuffleIds(ids: string[]) {
  return [...ids].sort(() => Math.random() - 0.5);
}

function formatReviewDelay(nextDueAt: string): string {
  const msUntilDue = Math.max(new Date(nextDueAt).getTime() - Date.now(), 0);
  const minsUntilDue = Math.ceil(msUntilDue / 60000);

  if (minsUntilDue <= 1) return "<1m";
  if (minsUntilDue < 60) return `${minsUntilDue}m`;

  const hoursUntilDue = Math.ceil(minsUntilDue / 60);
  if (hoursUntilDue < 24) return `${hoursUntilDue}h`;

  const daysUntilDue = Math.ceil(hoursUntilDue / 24);
  return `${daysUntilDue}d`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();
  const modules = useMemo<ModuleInfo[]>(
    () => [
      ...GRAMMAR_STAGES.filter((stage) =>
        grammarPoints.some((g) => g.stage === stage),
      ).map((stage) => ({
        stage,
        title: GRAMMAR_STAGE_META[stage].shortTitle,
        grammarIds: grammarPoints
          .filter((g) => g.stage === stage)
          .map((g) => g.id),
      })),
    ],
    [grammarPoints],
  );
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [isGuest, setIsGuest] = useState(false);
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );
  const [moduleProgress, setModuleProgress] = useState<number[]>([]);
  const [overallGrammarProgress, setOverallGrammarProgress] = useState(0);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [reviewStatusText, setReviewStatusText] = useState("You're caught up");
  const [progressPage, setProgressPage] = useState(0);
  const [showProgressMixModal, setShowProgressMixModal] = useState(false);
  const [selectedProgressLevels, setSelectedProgressLevels] = useState<
    ProgressFilterLevel[]
  >(["All"]);
  const [pendingProgressMixAction, setPendingProgressMixAction] =
    useState<PendingProgressMixAction | null>(null);

  const checkAuth = useCallback(async () => {
    const allowed = await canAccessApp();
    if (!allowed) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadProgress = useCallback(async () => {
    try {
      const allProgress = await getAllProgress();
      const totalPracticed = grammarPoints.filter((point) =>
        isGrammarPracticed(allProgress[point.id]),
      ).length;
      const newModuleProgress = modules.map((mod) => {
        if (mod.grammarIds.length === 0) return 0;
        const practiced = mod.grammarIds.filter((id) =>
          isGrammarPracticed(allProgress[id]),
        ).length;
        return Math.round((practiced / mod.grammarIds.length) * 100);
      });
      const overallPercent =
        grammarPoints.length > 0
          ? Math.round((totalPracticed / grammarPoints.length) * 100)
          : 0;

      setProgress(allProgress);
      setModuleProgress(newModuleProgress);
      setOverallGrammarProgress(overallPercent);
    } catch (err) {
      console.error("Failed to load progress:", err);
    }
  }, [grammarPoints, modules]);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
      void loadReviewStatus();
      void loadHeatmap();
    }, [loadProgress]),
  );

  useEffect(() => {
    setModuleProgress(modules.map(() => 0));
  }, [modules]);

  const progressCards = useMemo(() => {
    const cards: {
      key: string;
      label: string;
      title: string;
      percent: number;
      route: string;
    }[] = [];

    if (moduleProgress.some((p) => p > 0)) {
      cards.push({
        key: "overview",
        label: "Overview",
        title: "All Grammar",
        percent: overallGrammarProgress,
        route: "/progress",
      });

      modules.forEach((mod, i) => {
        if (moduleProgress[i] === 0) return;
        cards.push({
          key: mod.stage,
          label: mod.stage,
          title: mod.title,
          percent: moduleProgress[i],
        route: `/practice/topics?stage=${mod.stage}`,
        });
      });
    }

    return cards;
  }, [moduleProgress, modules, overallGrammarProgress]);

  const progressPageCount = Math.ceil(progressCards.length / 3);
  const visibleProgressCards = progressCards.slice(
    progressPage * 3,
    progressPage * 3 + 3,
  );

  useEffect(() => {
    setProgressPage((current) => {
      if (progressPageCount === 0) return 0;
      return Math.min(current, progressPageCount - 1);
    });
  }, [progressPageCount]);

  const practicedGrammar = useMemo(
    () => grammarPoints.filter((point) => isGrammarPracticed(progress[point.id])),
    [grammarPoints, progress],
  );
  const nextLesson = useMemo(
    () => grammarPoints.find((point) => !isGrammarPracticed(progress[point.id])) ?? null,
    [grammarPoints, progress],
  );
  const firstLesson = grammarPoints[0] ?? null;

  const heroCard = useMemo(() => {
    if (!isGuest && reviewsDue > 0) {
      return {
        label: "Today",
        title: "Review before your next lesson",
        subtitle:
          reviewsDue === 1
            ? "You have 1 card ready. A quick review keeps recent words active."
            : `You have ${reviewsDue} cards ready. A quick review keeps recent words active.`,
        actionLabel: "Start review",
        action: () => router.push("/review/" as any),
      };
    }

    if (practicedGrammar.length === 0) {
      return {
        label: "Start",
        title: "Begin your first topic",
        subtitle: firstLesson
          ? `${firstLesson.stage} · ${firstLesson.title}`
          : "Start with the first grammar lesson and build from there.",
        actionLabel: "Start topic",
        action: () =>
          router.push(
            (firstLesson ? `/practice/${firstLesson.id}` : "/progress") as any,
          ),
      };
    }

    if (nextLesson) {
      return {
        label: "Continue",
        title: nextLesson.title,
        subtitle: `${nextLesson.stage} · Pick up where your current path continues.`,
        actionLabel: "Resume topic",
        action: () => router.push(`/practice/${nextLesson.id}` as any),
      };
    }

    return {
      label: "Continue",
      title: "Keep your grammar active",
      subtitle: "You have completed every topic so far. Revisit studied grammar or review vocabulary.",
      actionLabel: "View progress",
      action: () => router.push("/progress" as any),
    };
  }, [firstLesson, isGuest, nextLesson, practicedGrammar.length, reviewsDue, router]);

  const progressCountsByLevel = useMemo(
    () =>
      CEFR_LEVELS.reduce(
        (acc, level) => {
          acc[level] = practicedGrammar.filter(
            (point) => point.level === level,
          ).length;
          return acc;
        },
        {} as Record<CefrLevel, number>,
      ),
    [practicedGrammar],
  );

  const filteredProgressGrammar = useMemo(() => {
    if (selectedProgressLevels.includes("All")) return practicedGrammar;
    return practicedGrammar.filter((point) =>
      selectedProgressLevels.includes(point.level),
    );
  }, [practicedGrammar, selectedProgressLevels]);

  useEffect(() => {
    if (showProgressMixModal || !pendingProgressMixAction) return;

    const action = pendingProgressMixAction;
    const task = InteractionManager.runAfterInteractions(() => {
      setPendingProgressMixAction(null);
      if (action.type === "premium") {
        void ensurePremiumAccess(action.label, action.route);
        return;
      }
      router.push(action.route as any);
    });

    return () => {
      task.cancel();
    };
  }, [ensurePremiumAccess, pendingProgressMixAction, router, showProgressMixModal]);

  function toggleProgressLevel(level: ProgressFilterLevel) {
    if (level === "All") {
      setSelectedProgressLevels(["All"]);
      return;
    }

    setSelectedProgressLevels((current) => {
      const withoutAll = current.filter(
        (value): value is CefrLevel => value !== "All",
      );

      if (withoutAll.includes(level)) {
        const next = withoutAll.filter((value) => value !== level);
        return next.length > 0 ? next : ["All"];
      }

      return [...withoutAll, level];
    });
  }

  function handleStartProgressMix() {
    if (filteredProgressGrammar.length === 0) return;

    const shuffled = shuffleIds(filteredProgressGrammar.map((point) => point.id));
    const practiceRoute = `/practice/${shuffled[0]}/exercises?mix=${shuffled.join(",")}&source=progress`;

    if (
      !isPremium &&
      filteredProgressGrammar.some((point) => isPremiumGrammarPoint(point))
    ) {
      setShowProgressMixModal(false);
      setPendingProgressMixAction({
        type: "premium",
        label: "the studied grammar in this mix",
        route: practiceRoute,
      });
      return;
    }

    setShowProgressMixModal(false);
    setPendingProgressMixAction({ type: "practice", route: practiceRoute });
  }

  async function loadReviewStatus() {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);
      if (guest) {
        setReviewsDue(0);
        setReviewStatusText("Log in to review");
        return;
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data?.waiting && data?.nextDueAt) {
        setReviewsDue(0);
        setReviewStatusText(
          `Next card in ${formatReviewDelay(data.nextDueAt)}`,
        );
        return;
      }

      if (data?.done) {
        setReviewsDue(0);
        setReviewStatusText("You're caught up");
        return;
      }

      const counts = data?.counts ?? {};
      const actionableReviews =
        (counts.newCount ?? 0) +
        (counts.learningCount ?? 0) +
        (counts.reviewCount ?? 0);
      const dueNow = actionableReviews > 0 ? actionableReviews : 1;

      setReviewsDue(dueNow);
      setReviewStatusText(
        `Est. time: ${Math.max(1, Math.round(dueNow * 0.15))}m`,
      );
    } catch {
      setReviewsDue(0);
      setReviewStatusText("Review unavailable");
    }
  }

  async function loadHeatmap() {
    try {
      const guest = await isGuestUser();
      if (guest) return;
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setActivityMap(await res.json());
    } catch {
      // keep default empty
    }
  }

  function renderHeatmap() {
    const TOTAL_WEEKS = 26;
    const cardInnerWidth = Math.max(280, Math.min(width - 88, 920));
    const DAY_LABEL_W = width >= 900 ? 42 : width >= 680 ? 34 : 28;
    const MONTH_LABEL_H = width >= 900 ? 22 : width >= 680 ? 18 : 16;
    const cell = Math.max(
      13,
      Math.min(
        width >= 900 ? 22 : width >= 680 ? 18 : 13,
        Math.floor((cardInnerWidth - DAY_LABEL_W) / TOTAL_WEEKS),
      ),
    );
    const GAP = cell >= 18 ? 4 : cell >= 15 ? 3 : 2;
    const SQ = Math.max(10, cell - GAP);
    const CELL = SQ + GAP;
    const heatmapCanvasWidth = DAY_LABEL_W + TOTAL_WEEKS * CELL;
    const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
    const MONTH_NAMES = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    // Fixed 26-week grid (like GitHub contributions).
    // Start = Sunday of the week containing earliest activity, or 26 weeks back.
    // Grid always extends forward to fill 26 columns total.

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = localDateKey(today);

    // Find earliest activity
    const activityDates = Object.keys(activityMap).sort();
    let startSunday: Date;
    if (activityDates.length > 0) {
      const earliest = new Date(activityDates[0] + "T00:00:00");
      startSunday = new Date(earliest);
      startSunday.setDate(startSunday.getDate() - startSunday.getDay());
    } else {
      // No activity — start 26 weeks back from this Saturday
      const endSat = new Date(today);
      endSat.setDate(endSat.getDate() + (6 - endSat.getDay()));
      startSunday = new Date(endSat);
      startSunday.setDate(startSunday.getDate() - (TOTAL_WEEKS * 7 - 1));
    }

    const numWeeks = TOTAL_WEEKS;

    // Month labels: check first day of each week column
    const monthLabels: { col: number; label: string }[] = [];
    let prevMonth = -1;
    for (let w = 0; w < numWeeks; w++) {
      const d = new Date(startSunday);
      d.setDate(d.getDate() + w * 7);
      const m = d.getMonth();
      if (m !== prevMonth) {
        monthLabels.push({ col: w, label: MONTH_NAMES[m] });
        prevMonth = m;
      }
    }

    return (
      <View style={styles.heatmapContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            minWidth: Math.max(cardInnerWidth, heatmapCanvasWidth),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ width: heatmapCanvasWidth }}>
            {/* Month labels */}
            <View
              style={{
                flexDirection: "row",
                height: MONTH_LABEL_H,
                marginLeft: DAY_LABEL_W,
              }}
            >
              {monthLabels.map((ml, i) => (
                <Text
                  key={i}
                  style={{
                    position: "absolute",
                    left: ml.col * CELL,
                    fontSize: width >= 900 ? 11 : 10,
                    color: Sketch.inkMuted,
                    fontWeight: "500",
                  }}
                >
                  {ml.label}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: "row" }}>
              {/* Day-of-week labels */}
              <View style={{ width: DAY_LABEL_W }}>
                {DAY_LABELS.map((label, i) => (
                  <View
                    key={i}
                    style={{ height: CELL, justifyContent: "center" }}
                  >
                    <Text
                      style={{
                        fontSize: width >= 900 ? 10 : 9,
                        color: Sketch.inkMuted,
                        fontWeight: "500",
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Squares: rows = day-of-week (0=Sun..6=Sat), cols = weeks */}
              <View style={styles.heatmapGrid}>
                {Array.from({ length: 7 }).map((_, dow) => (
                  <View key={dow} style={styles.heatmapRow}>
                    {Array.from({ length: numWeeks }).map((_, week) => {
                      const d = new Date(startSunday);
                      d.setDate(d.getDate() + week * 7 + dow);
                      const key = localDateKey(d);
                      const isFuture = key > todayKey;
                      const count = activityMap[key] || 0;
                      const level = isFuture ? 0 : activityToLevel(count);

                      return (
                        <View
                          key={week}
                          style={{
                            width: SQ,
                            height: SQ,
                            backgroundColor: HEATMAP_COLORS[level],
                            marginRight: GAP,
                            marginBottom: GAP,
                            borderRadius: 4,
                          }}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <Modal
        visible={showProgressMixModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProgressMixModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowProgressMixModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>Studied Grammar</Text>
                <Text style={styles.modalSubtitle}>
                  Practice grammar points you have already studied.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowProgressMixModal(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterWrap}>
              {PROGRESS_FILTER_LEVELS.map((level) => {
                const count =
                  level === "All"
                    ? practicedGrammar.length
                    : progressCountsByLevel[level];
                const isSelected = selectedProgressLevels.includes(level);
                const isDisabled = count === 0;

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipActive,
                      isDisabled && styles.filterChipDisabled,
                    ]}
                    onPress={() => {
                      if (isDisabled) return;
                      toggleProgressLevel(level);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                    <Text
                      style={[
                        styles.filterChipCount,
                        isSelected && styles.filterChipCountActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalSummaryText}>
              {filteredProgressGrammar.length} practiced topic
              {filteredProgressGrammar.length === 1 ? "" : "s"} ready
            </Text>

            <TouchableOpacity
              style={[
                styles.modalPrimaryButton,
                filteredProgressGrammar.length === 0 &&
                  styles.modalPrimaryButtonDisabled,
              ]}
              onPress={handleStartProgressMix}
              activeOpacity={0.82}
              disabled={filteredProgressGrammar.length === 0}
            >
              <Text style={styles.modalPrimaryButtonText}>Practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Branded Header */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>Keystone</Text>
          <Text style={styles.brandThaiPrompt}>วันนี้เรียนอะไรดี</Text>
          <Text style={styles.brandPromptTranslation}>
            What should we study today?
          </Text>
        </View>

        <TouchableOpacity
          style={styles.heroCard}
          onPress={heroCard.action}
          activeOpacity={0.74}
        >
          <Text style={styles.heroCardLabel}>{heroCard.label}</Text>
          <Text style={styles.heroCardTitle}>{heroCard.title}</Text>
          <Text style={styles.heroCardSubtitle}>{heroCard.subtitle}</Text>
          <View style={styles.heroCardFooter}>
            <Text style={styles.heroCardAction}>{heroCard.actionLabel}</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={Sketch.paperDark}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.spacing} />

        {/* Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Activity</Text>
            {isGuest ? (
              <Text style={styles.sectionHint}>Log in to track heatmap</Text>
            ) : null}
          </View>
          <View style={styles.heatmapCard}>{renderHeatmap()}</View>
        </View>

        <View style={styles.spacing} />

        {/* Action Tiles */}
        <View style={styles.actionStack}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => router.push("/review/" as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionTileValue}>
                {reviewsDue > 0 ? reviewsDue : 0}
              </Text>
              <Text style={styles.actionTileLabel}>cards due</Text>
              <Text style={styles.actionTileMeta}>{reviewStatusText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => router.push("/trainer" as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionTileGlyph}>ก</Text>
              <Text style={styles.actionTileTitle}>Alphabet Trainer</Text>
              <Text style={styles.actionTileLabel}>Consonants & vowels</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.studyMixTile,
              practicedGrammar.length === 0 && styles.studyMixTileDisabled,
            ]}
            onPress={() => {
              if (practicedGrammar.length === 0) return;
              setSelectedProgressLevels(["All"]);
              setShowProgressMixModal(true);
            }}
            activeOpacity={0.7}
            disabled={practicedGrammar.length === 0}
          >
            <View style={styles.studyMixCopy}>
              <Text style={styles.studyMixTitle}>Studied Grammar</Text>
              <Text style={styles.studyMixSubtitle}>
                {practicedGrammar.length > 0
                  ? "Practice grammar points you have already studied"
                  : isGuest
                    ? "Log in to keep your studied grammar here"
                    : "Your studied grammar will appear here"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.spacing} />

        {/* Grammar Modules */}
        <View style={styles.section}>
          <View style={styles.progressSectionHeader}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            {progressPageCount > 1 ? (
              <View style={styles.progressPager}>
                <TouchableOpacity
                  style={[
                    styles.progressPagerButton,
                    progressPage === 0 && styles.progressPagerButtonDisabled,
                  ]}
                  onPress={() =>
                    setProgressPage((current) => Math.max(0, current - 1))
                  }
                  activeOpacity={0.75}
                  disabled={progressPage === 0}
                >
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={progressPage === 0 ? Sketch.inkFaint : Sketch.inkMuted}
                  />
                </TouchableOpacity>
                <Text style={styles.progressPagerText}>
                  {progressPage + 1}/{progressPageCount}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.progressPagerButton,
                    progressPage >= progressPageCount - 1 &&
                      styles.progressPagerButtonDisabled,
                  ]}
                  onPress={() =>
                    setProgressPage((current) =>
                      Math.min(progressPageCount - 1, current + 1),
                    )
                  }
                  activeOpacity={0.75}
                  disabled={progressPage >= progressPageCount - 1}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={
                      progressPage >= progressPageCount - 1
                        ? Sketch.inkFaint
                        : Sketch.inkMuted
                    }
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {moduleProgress.some((p) => p > 0) ? (
            <View style={styles.modulesGrid}>
              {visibleProgressCards.map((card) => (
                <TouchableOpacity
                  key={card.key}
                  style={styles.moduleCard}
                  onPress={() => router.push(card.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.moduleCardHeader}>
                    <Text style={styles.moduleLevel}>{card.label}</Text>
                  </View>
                  <Text style={styles.moduleTitle}>{card.title}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${card.percent}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressPercent}>
                      {card.percent}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startGrammarCard}
              onPress={() => router.push("/progress" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={28} color={Sketch.accent} />
              <View style={styles.startGrammarText}>
                <Text style={styles.startGrammarTitle}>
                  Begin your grammar journey
                </Text>
                <Text style={styles.startGrammarSub}>
                  Explore Thai grammar from A1.1 onward
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Sketch.inkMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.spacing} />

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.quickLinks}>
            {[
              {
                label: "Alphabet",
                glyph: "ก",
                route: "/alphabet/",
              },
              {
                label: "Numbers",
                glyph: "๑",
                route: "/numbers/",
              },
              {
                label: "Tones",
                icon: "musical-notes-outline" as const,
                route: "/tones/",
              },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickLinkCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                {"glyph" in item ? (
                  <Text style={styles.quickLinkGlyph}>{item.glyph}</Text>
                ) : (
                  <Ionicons name={item.icon} size={24} color={Sketch.accent} />
                )}
                <Text style={styles.quickLinkText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  spacing: {
    height: 32,
  },
  actionStack: {
    gap: 14,
  },
  // Branded Header
  brandHeader: {
    paddingVertical: 24,
    paddingBottom: 12,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
    marginBottom: 0,
  },
  brandThaiPrompt: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: Sketch.accent,
  },
  brandPromptTranslation: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: Sketch.inkMuted,
  },
  heroCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 8,
    ...sketchShadow(2),
  },
  heroCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroCardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: Sketch.ink,
  },
  heroCardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
  heroCardFooter: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: Sketch.accent,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Sketch.accent,
  },
  heroCardAction: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.paperDark,
  },
  // Action Tiles
  actionRow: {
    flexDirection: "row",
    gap: 16,
  },
  actionTile: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    minHeight: 140,
    ...sketchShadow(2),
  },
  actionTileValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.accent,
  },
  actionTileTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  actionTileGlyph: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "700",
    color: Sketch.accent,
  },
  actionTileLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  actionTileMeta: {
    fontSize: 11,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  studyMixTile: {
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    ...sketchShadow(2),
  },
  studyMixTileDisabled: {
    opacity: 0.56,
  },
  studyMixCopy: {
    flex: 1,
    gap: 6,
  },
  studyMixTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  studyMixSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    lineHeight: 19,
  },
  // Sections
  section: {
    gap: 16,
  },
  progressSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  progressPager: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressPagerButton: {
    width: 32,
    height: 32,
    borderRadius: SketchRadius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  progressPagerButtonDisabled: {
    opacity: 0.5,
  },
  progressPagerText: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  heatmapCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    ...sketchShadow(2),
  },
  heatmapContainer: {
    marginTop: 0,
  },
  heatmapGrid: {
    flexDirection: "column",
  },
  heatmapRow: {
    flexDirection: "row",
  },
  // Module Cards
  modulesGrid: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    ...sketchShadow(2),
  },
  moduleCardHeader: {
    marginBottom: 10,
  },
  moduleLevel: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
    marginBottom: 14,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.track,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Sketch.accent,
    borderRadius: SketchRadius.track,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    minWidth: 30,
    textAlign: "right",
  },
  // Start Grammar CTA
  startGrammarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    ...sketchShadow(2),
  },
  startGrammarText: {
    flex: 1,
    gap: 6,
  },
  startGrammarTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  startGrammarSub: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  // Quick Links
  quickLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickLinkCard: {
    width: "31%",
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    ...sketchShadow(2),
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.ink,
  },
  quickLinkGlyph: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.accent,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(33, 28, 24, 0.18)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: Sketch.paper,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 18,
    ...sketchShadow(3),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalHeading: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  modalCloseButton: {
    padding: 4,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  filterChipActive: {
    borderColor: Sketch.orange,
    backgroundColor: `${Sketch.orange}10`,
  },
  filterChipDisabled: {
    opacity: 0.45,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  filterChipTextActive: {
    color: Sketch.orange,
  },
  filterChipCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  filterChipCountActive: {
    color: Sketch.orange,
  },
  modalSummaryText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  modalPrimaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.orange,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 13,
  },
  modalPrimaryButtonDisabled: {
    opacity: 0.45,
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
