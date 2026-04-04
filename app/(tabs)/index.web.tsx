import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AppRadius,
  AppSketch,
  AppSpacing,
  AppTypography,
  appShadow,
} from "@/constants/theme-app";
import AppButton from "@/src/components/app/AppButton";
import AppCard from "@/src/components/app/AppCard";
import KimiIcon from "@/src/components/app/KimiIcon";
import { DESKTOP_PAGE_WIDTHS } from "@/src/components/web/desktopLayout";
import { API_BASE } from "@/src/config";
import {
  GRAMMAR_STAGE_META,
  GrammarStage,
  PUBLIC_GRAMMAR_STAGES,
} from "@/src/data/grammarStages";
import {
  CEFR_LEVEL_META,
  PUBLIC_CEFR_LEVELS,
  PublicCefrLevel,
} from "@/src/data/grammarLevels";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { canAccessApp, isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getProfileDisplayName } from "@/src/utils/profileName";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

type ProgressFilterLevel = "All" | PublicCefrLevel;
type PendingProgressMixAction =
  | { type: "premium"; label: string; route: string }
  | { type: "practice"; route: string };

type HomeProfile = {
  id?: number | null;
  email?: string | null;
  display_name?: string | null;
};

function formatDelay(nextDueAt: string): string {
  const msUntilDue = Math.max(new Date(nextDueAt).getTime() - Date.now(), 0);
  const minsUntilDue = Math.ceil(msUntilDue / 60000);
  if (minsUntilDue <= 1) return "<1m";
  if (minsUntilDue < 60) return `${minsUntilDue}m`;
  const hoursUntilDue = Math.ceil(minsUntilDue / 60);
  if (hoursUntilDue < 24) return `${hoursUntilDue}h`;
  return `${Math.ceil(hoursUntilDue / 24)}d`;
}

function shuffleIds(ids: string[]) {
  return [...ids].sort(() => Math.random() - 0.5);
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildDateCountMap(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, isoString) => {
    if (!isoString) return acc;
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return acc;
    const key = localDateKey(date);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function isPublicCefrLevel(level: string): level is PublicCefrLevel {
  return (PUBLIC_CEFR_LEVELS as readonly string[]).includes(level);
}

export default function HomeScreenWeb() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();

  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [reviewsDue, setReviewsDue] = useState(0);
  const [reviewStatus, setReviewStatus] = useState("You're caught up");
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [isGuest, setIsGuest] = useState(false);
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [showProgressMixModal, setShowProgressMixModal] = useState(false);
  const [selectedProgressLevels, setSelectedProgressLevels] = useState<ProgressFilterLevel[]>([
    "All",
  ]);
  const [pendingProgressMixAction, setPendingProgressMixAction] =
    useState<PendingProgressMixAction | null>(null);

  const checkAuth = useCallback(async () => {
    const allowed = await canAccessApp();
    if (!allowed) router.replace("/login");
  }, [router]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const loadProgress = useCallback(async () => {
    try {
      const allProgress = await getAllProgress();
      setProgress(allProgress);
    } catch (err) {
      console.error("Failed to load progress:", err);
    }
  }, []);

  const loadReviewStatus = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);

      if (guest) {
        setReviewsDue(0);
        setReviewStatus("Sign in to review vocabulary");
        return;
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data?.waiting && data?.nextDueAt) {
        setReviewsDue(0);
        setReviewStatus(`Next batch in ${formatDelay(data.nextDueAt)}`);
      } else if (data?.done) {
        setReviewsDue(0);
        setReviewStatus("You're caught up");
      } else {
        const counts = data?.counts ?? {};
        const actionable =
          (counts.newCount ?? 0) +
          (counts.learningCount ?? 0) +
          (counts.reviewCount ?? 0);
        setReviewsDue(Math.max(0, actionable));
        setReviewStatus(`${actionable} card${actionable !== 1 ? "s" : ""} ready`);
      }
    } catch {
      setReviewsDue(0);
      setReviewStatus("Review unavailable");
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      if (guest) {
        setProfile(null);
        return;
      }

      const token = await getAuthToken();
      if (!token) {
        setProfile(null);
        return;
      }

      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load profile (${res.status})`);
      }

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load home profile:", err);
      setProfile(null);
    }
  }, []);

  const loadHeatmap = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      if (guest) return;

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setActivityMap(await res.json());
    } catch {
      // keep default empty state
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
      void loadReviewStatus();
      void loadHeatmap();
      void loadProfile();
    }, [loadHeatmap, loadProfile, loadProgress, loadReviewStatus]),
  );

  const visibleGrammarPoints = useMemo(
    () =>
      grammarPoints.filter(
        (point): point is typeof point & { level: PublicCefrLevel } =>
          isPublicCefrLevel(point.level),
      ),
    [grammarPoints],
  );

  const practicedGrammar = useMemo(
    () => visibleGrammarPoints.filter((point) => isGrammarPracticed(progress[point.id])),
    [progress, visibleGrammarPoints],
  );

  const grammarActivityMap = useMemo(
    () =>
      buildDateCountMap(
        Object.values(progress)
          .map((entry) => entry.lastPracticed)
          .filter(Boolean),
      ),
    [progress],
  );

  const combinedActivityMap = useMemo(() => {
    const merged = { ...activityMap };
    Object.entries(grammarActivityMap).forEach(([key, count]) => {
      merged[key] = (merged[key] || 0) + count;
    });
    return merged;
  }, [activityMap, grammarActivityMap]);

  const nextLesson = useMemo(
    () => visibleGrammarPoints.find((point) => !isGrammarPracticed(progress[point.id])) ?? null,
    [progress, visibleGrammarPoints],
  );

  const firstLesson = visibleGrammarPoints[0] ?? null;
  const anchorLesson =
    nextLesson ??
    (visibleGrammarPoints.length > 0
      ? visibleGrammarPoints[visibleGrammarPoints.length - 1]
      : null);
  const currentStageMeta = anchorLesson ? GRAMMAR_STAGE_META[anchorLesson.stage] : null;

  const currentStagePoints = useMemo(() => {
    if (!anchorLesson) return [];
    return visibleGrammarPoints.filter((point) => point.stage === anchorLesson.stage);
  }, [anchorLesson, visibleGrammarPoints]);

  const currentStagePracticed = useMemo(
    () => currentStagePoints.filter((point) => isGrammarPracticed(progress[point.id])).length,
    [currentStagePoints, progress],
  );

  const overallProgress = useMemo(() => {
    if (visibleGrammarPoints.length === 0) return 0;
    return Math.round((practicedGrammar.length / visibleGrammarPoints.length) * 100);
  }, [practicedGrammar.length, visibleGrammarPoints.length]);

  const stageProgress = useMemo(() => {
    if (currentStagePoints.length === 0) return 0;
    return Math.round((currentStagePracticed / currentStagePoints.length) * 100);
  }, [currentStagePoints.length, currentStagePracticed]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      if ((combinedActivityMap[key] || 0) > 0) {
        streak += 1;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [combinedActivityMap]);

  const streakBlocks = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, index) => ({
        key: `streak-${index}`,
        active: index < Math.min(currentStreak, 7),
      })),
    [currentStreak],
  );

  const todayGrammarCount = useMemo(() => {
    const todayKey = localDateKey(new Date());
    return visibleGrammarPoints.filter((point) => {
      const lastPracticed = progress[point.id]?.lastPracticed;
      if (!lastPracticed) return false;
      const practicedDate = new Date(lastPracticed);
      if (Number.isNaN(practicedDate.getTime())) return false;
      return localDateKey(practicedDate) === todayKey;
    }).length;
  }, [progress, visibleGrammarPoints]);

  const dominantStageMeta = useMemo(() => {
    if (practicedGrammar.length === 0) return GRAMMAR_STAGE_META["A1.1"];

    const counts = practicedGrammar.reduce<Record<GrammarStage, number>>((acc, point) => {
      acc[point.stage] = (acc[point.stage] || 0) + 1;
      return acc;
    }, {} as Record<GrammarStage, number>);

    return Object.values(GRAMMAR_STAGE_META)
      .filter((meta) => meta.id !== "C2")
      .sort((a, b) => {
        const countDiff = (counts[b.id] || 0) - (counts[a.id] || 0);
        if (countDiff !== 0) return countDiff;
        return b.order - a.order;
      })[0];
  }, [practicedGrammar]);

  const stageRail = useMemo(() => {
    const countsByStage = visibleGrammarPoints.reduce(
      (acc, point) => {
        const existing = acc[point.stage] ?? { practiced: 0, total: 0 };
        existing.total += 1;
        if (isGrammarPracticed(progress[point.id])) existing.practiced += 1;
        acc[point.stage] = existing;
        return acc;
      },
      {} as Record<GrammarStage, { practiced: number; total: number }>,
    );

    const currentStageId = currentStageMeta?.id;
    return PUBLIC_GRAMMAR_STAGES.map((stage) => {
      const counts = countsByStage[stage] ?? { practiced: 0, total: 0 };
      const isCompleted = counts.total > 0 && counts.practiced >= counts.total;
      const isVisited = counts.practiced > 0 && !isCompleted;
      const status =
        isCompleted
          ? "completed"
          : stage === currentStageId
            ? "current"
            : isVisited
              ? "visited"
              : "unstarted";

      return {
        id: stage,
        label: GRAMMAR_STAGE_META[stage].id,
        status,
      };
    });
  }, [currentStageMeta?.id, progress, visibleGrammarPoints]);

  const filteredProgressGrammar = useMemo(() => {
    if (selectedProgressLevels.includes("All")) return practicedGrammar;
    return practicedGrammar.filter((point) => selectedProgressLevels.includes(point.level));
  }, [practicedGrammar, selectedProgressLevels]);

  const progressCountsByLevel = useMemo(
    () =>
      PUBLIC_CEFR_LEVELS.reduce((acc, level) => {
        acc[level] = practicedGrammar.filter((point) => point.level === level).length;
        return acc;
      }, {} as Record<PublicCefrLevel, number>),
    [practicedGrammar],
  );

  const levelProgress = useMemo(
    () =>
      PUBLIC_CEFR_LEVELS.map((level) => {
        const points = visibleGrammarPoints.filter((point) => point.level === level);
        const practiced = points.filter((point) => isGrammarPracticed(progress[point.id])).length;
        const percent = points.length > 0 ? Math.round((practiced / points.length) * 100) : 0;
        return {
          level,
          practiced,
          total: points.length,
          percent,
          current: anchorLesson?.level === level,
          meta: CEFR_LEVEL_META[level],
        };
      }),
    [anchorLesson?.level, progress, visibleGrammarPoints],
  );

  function toggleProgressLevel(level: ProgressFilterLevel) {
    if (level === "All") {
      setSelectedProgressLevels(["All"]);
      return;
    }

    setSelectedProgressLevels((current) => {
      const withoutAll = current.filter((value): value is PublicCefrLevel => value !== "All");
      if (withoutAll.includes(level)) {
        const next = withoutAll.filter((value) => value !== level);
        return next.length > 0 ? next : ["All"];
      }
      return [...withoutAll, level];
    });
  }

  function openLevelProgress(level: PublicCefrLevel) {
    const count = progressCountsByLevel[level];
    if (count === 0) return;
    setSelectedProgressLevels([level]);
    setShowProgressMixModal(true);
  }

  function handleStartProgressMix() {
    if (filteredProgressGrammar.length === 0) return;

    const shuffled = shuffleIds(filteredProgressGrammar.map((point) => point.id));
    const route = `/practice/${shuffled[0]}/exercises?mix=${shuffled.join(",")}&source=progress`;

    if (!isPremium && filteredProgressGrammar.some((point) => isPremiumGrammarPoint(point))) {
      setShowProgressMixModal(false);
      setPendingProgressMixAction({ type: "premium", label: "studied grammar", route });
      return;
    }

    setShowProgressMixModal(false);
    setPendingProgressMixAction({ type: "practice", route });
  }

  useEffect(() => {
    if (showProgressMixModal || !pendingProgressMixAction) return;

    const action = pendingProgressMixAction;
    setPendingProgressMixAction(null);

    if (action.type === "premium") {
      void ensurePremiumAccess(action.label, action.route);
    } else {
      router.push(action.route as any);
    }
  }, [ensurePremiumAccess, pendingProgressMixAction, router, showProgressMixModal]);

  const heroRoute = nextLesson
    ? `/practice/${nextLesson.id}`
    : practicedGrammar.length > 0
      ? "/progress"
      : firstLesson
        ? `/practice/${firstLesson.id}`
        : "/progress";

  const heroActionLabel = nextLesson
    ? "Pick up next lesson"
    : practicedGrammar.length > 0
      ? "Open grammar path"
      : "Start first lesson";

  const reviewActionRoute = isGuest ? "/login" : "/review/";

  const studyTools = [
    {
      label: "Saved Practice",
      detail: "Open bookmarks and saved grammar",
      icon: "bookmark-outline",
      onPress: () => router.push("/explore" as any),
      disabled: false,
    },
    {
      label: "Practice Mix",
      detail:
        practicedGrammar.length > 0
          ? `${practicedGrammar.length} studied topics ready`
          : "Unlocks after your first completed lesson",
      icon: "shuffle-outline",
      onPress: () => {
        if (practicedGrammar.length === 0) return;
        setSelectedProgressLevels(["All"]);
        setShowProgressMixModal(true);
      },
      disabled: practicedGrammar.length === 0,
    },
    {
      label: "Trainer",
      detail: "Reading drills and focused recall",
      icon: "school-outline",
      onPress: () => router.push("/trainer/" as any),
      disabled: false,
    },
    {
      label: "Content Review",
      detail: "Revisit studied lessons by content",
      icon: "layers-outline",
      onPress: () => router.push("/content-review/" as any),
      disabled: false,
    },
  ] as const;

  const foundations = [
    {
      label: "Alphabet",
      detail: "Consonants and sound groups",
      customIcon: "alphabet",
      route: "/alphabet/",
    },
    {
      label: "Numbers",
      detail: "Counting, time, and quantities",
      customIcon: "numbers",
      route: "/numbers/",
    },
    {
      label: "Tones",
      detail: "Tone patterns and listening",
      icon: "musical-notes-outline",
      route: "/tones/",
    },
  ] as const;

  return (
    <>
      <Modal
        visible={showProgressMixModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProgressMixModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowProgressMixModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>Practice studied grammar</Text>
                <Text style={styles.modalSubtitle}>
                  Build a mixed round from grammar points you have already practiced.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowProgressMixModal(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={AppSketch.inkMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterGrid}>
              {(["All", ...PUBLIC_CEFR_LEVELS] as ProgressFilterLevel[]).map((level) => {
                const count =
                  level === "All" ? practicedGrammar.length : progressCountsByLevel[level];
                const selected = selectedProgressLevels.includes(level);
                const disabled = count === 0;

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterChip,
                      selected && styles.filterChipActive,
                      disabled && styles.filterChipDisabled,
                    ]}
                    onPress={() => toggleProgressLevel(level)}
                    disabled={disabled}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {level}
                    </Text>
                    <Text
                      style={[styles.filterChipCount, selected && styles.filterChipTextActive]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppButton
              title={`Practice ${filteredProgressGrammar.length} topic${filteredProgressGrammar.length !== 1 ? "s" : ""}`}
              onPress={handleStartProgressMix}
              disabled={filteredProgressGrammar.length === 0}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Home</Text>
          <Text style={styles.title}>Continue your Thai</Text>
          <Text style={styles.subtitle}>
            Keep the next lesson, review queue, and core tools in one place.
          </Text>
        </View>

        <View style={styles.workspaceGrid}>
          <View style={styles.mainColumn}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.topActionCard, styles.learnActionCard]}
                onPress={() => router.push("/progress" as any)}
                activeOpacity={0.9}
              >
                <View style={styles.topActionCopy}>
                  <Text style={styles.topActionLabel}>Learn Grammar</Text>
                  <Text style={styles.topActionDetail}>
                    {nextLesson
                      ? `${nextLesson.stage} ready to continue`
                      : "Open the full grammar path"}
                  </Text>
                </View>
                <Ionicons name="book-outline" size={24} color="rgba(255,255,255,0.38)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.topActionCard, styles.reviewActionCard]}
                onPress={() => router.push(reviewActionRoute as any)}
                activeOpacity={0.9}
              >
                <View style={styles.topActionCopy}>
                  <Text style={styles.topActionLabel}>Review Vocabulary</Text>
                  <Text style={styles.topActionDetail}>{reviewStatus}</Text>
                </View>
                {reviewsDue > 0 ? (
                  <View style={styles.reviewBadge}>
                    <Text style={styles.reviewBadgeText}>{reviewsDue}</Text>
                  </View>
                ) : (
                  <Ionicons name="albums-outline" size={24} color="rgba(255,255,255,0.38)" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.heroCard}
              onPress={() => router.push(heroRoute as any)}
              activeOpacity={0.95}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroHeading}>
                  <Text style={styles.heroEyebrow}>Current progress</Text>
                  <Text style={styles.heroTitle}>
                    {currentStageMeta?.title ?? "Start your first lesson"}
                  </Text>
                  <Text style={styles.heroBody}>
                    {nextLesson
                      ? `Next lesson: ${nextLesson.title}`
                      : practicedGrammar.length > 0
                        ? "You are caught up. Revisit the path or keep your review queue fresh."
                        : "Begin with the first lesson and start building the foundation."}
                  </Text>
                </View>

                <View style={styles.heroSide}>
                  {currentStageMeta ? (
                    <View style={styles.heroStageChip}>
                      <Text style={styles.heroStageChipText}>{currentStageMeta.id}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.heroPercent}>{overallProgress}%</Text>
                  <Text style={styles.heroPercentLabel}>course complete</Text>
                </View>
              </View>

              <View style={styles.heroProgressRow}>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricLabel}>Current path</Text>
                  <Text style={styles.heroMetricValue}>
                    {currentStageMeta?.shortTitle ?? "Getting started"}
                  </Text>
                </View>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricLabel}>Stage progress</Text>
                  <Text style={styles.heroMetricValue}>
                    {stageProgress}% · {currentStagePracticed}/{currentStagePoints.length || 0}
                  </Text>
                </View>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricLabel}>Studied grammar</Text>
                  <Text style={styles.heroMetricValue}>{practicedGrammar.length} topics</Text>
                </View>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
              </View>

              {stageRail.length > 0 ? (
                <View style={styles.heroPathRail}>
                  {stageRail.map((point) => (
                    <View key={point.id} style={styles.heroPathNode}>
                      <View
                        style={[
                          styles.heroPathDot,
                          point.status === "completed" && styles.heroPathDotCompleted,
                          point.status === "current" && styles.heroPathDotCurrent,
                          point.status === "visited" && styles.heroPathDotVisited,
                        ]}
                      >
                        {point.status === "completed" ? (
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        ) : point.status === "visited" ? (
                          <View style={styles.heroPathDotVisitedInner} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.heroPathLabel,
                          point.status !== "unstarted" && styles.heroPathLabelActive,
                          point.status === "current" && styles.heroPathLabelCurrent,
                        ]}
                      >
                        {point.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.heroFooter}>
                <Text style={styles.heroFooterText}>{heroActionLabel}</Text>
                <Ionicons name="arrow-forward" size={16} color={AppSketch.primary} />
              </View>
            </TouchableOpacity>

            <AppCard variant="flat" size="lg" style={styles.clusterCard}>
              <View style={styles.clusterHeader}>
                <View style={styles.clusterHeading}>
                  <Text style={styles.clusterTitle}>Study tools</Text>
                  <Text style={styles.clusterSubtitle}>
                    Keep the most useful practice surfaces close to the path.
                  </Text>
                </View>
              </View>

              <View style={styles.tileGrid}>
                {studyTools.map((tool) => (
                  <TouchableOpacity
                    key={tool.label}
                    style={[styles.tileCard, tool.disabled && styles.tileCardDisabled]}
                    onPress={tool.onPress}
                    activeOpacity={tool.disabled ? 1 : 0.88}
                  >
                    <View style={styles.tileIcon}>
                      <Ionicons
                        name={tool.icon as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={tool.disabled ? AppSketch.inkFaint : AppSketch.primary}
                      />
                    </View>
                    <View style={styles.tileCopy}>
                      <Text style={[styles.tileTitle, tool.disabled && styles.tileTitleDisabled]}>
                        {tool.label}
                      </Text>
                      <Text style={styles.tileSubtitle}>{tool.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={AppSketch.inkFaint} />
                  </TouchableOpacity>
                ))}
              </View>
            </AppCard>

            <AppCard variant="flat" size="lg" style={styles.clusterCard}>
              <View style={styles.clusterHeader}>
                <View style={styles.clusterHeading}>
                  <Text style={styles.clusterTitle}>Alphabet + numbers</Text>
                  <Text style={styles.clusterSubtitle}>
                    Jump into the reading tools when you want focused script practice.
                  </Text>
                </View>
              </View>

              <View style={styles.tileGrid}>
                {foundations.map((tool) => (
                  <TouchableOpacity
                    key={tool.label}
                    style={styles.tileCard}
                    onPress={() => router.push(tool.route as any)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.tileIcon}>
                      {tool.customIcon ? (
                        <KimiIcon name={tool.customIcon} size={18} color={AppSketch.primary} />
                      ) : (
                        <Ionicons
                          name={tool.icon as keyof typeof Ionicons.glyphMap}
                          size={18}
                          color={AppSketch.primary}
                        />
                      )}
                    </View>
                    <View style={styles.tileCopy}>
                      <Text style={styles.tileTitle}>{tool.label}</Text>
                      <Text style={styles.tileSubtitle}>{tool.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={AppSketch.inkFaint} />
                  </TouchableOpacity>
                ))}
              </View>
            </AppCard>
          </View>

          <View style={styles.sideColumn}>
            <AppCard variant="flat" size="lg" style={styles.sideCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={18} color={AppSketch.primary} />
                </View>
                <View style={styles.profileCopy}>
                  <Text style={styles.profileTitle} numberOfLines={1}>
                    {isGuest ? "Guest learner" : getProfileDisplayName(profile)}
                  </Text>
                  <Text style={styles.profileSubtitle} numberOfLines={1}>
                    {isGuest
                      ? "Sign in to sync review and progress"
                      : profile?.email || "Keystone Thai"}
                  </Text>
                </View>
                <View
                  style={[styles.statusChip, isPremium && styles.statusChipPremium]}
                >
                  <Text
                    style={[styles.statusChipText, isPremium && styles.statusChipTextPremium]}
                  >
                    {isGuest ? "Guest" : isPremium ? "Access" : "Standard"}
                  </Text>
                </View>
              </View>

              <View style={styles.streakBlock}>
                <View style={styles.streakValueRow}>
                  <Text style={styles.streakValue}>{currentStreak}</Text>
                  <Text style={styles.streakValueLabel}>day streak</Text>
                </View>
                <View style={styles.sparkline}>
                  {streakBlocks.map((day) => (
                    <View
                      key={day.key}
                      style={[styles.sparkDot, day.active && styles.sparkDotActive]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.snapshotStats}>
                <View style={styles.snapshotStat}>
                  <Text style={styles.snapshotStatValue}>{todayGrammarCount}</Text>
                  <Text style={styles.snapshotStatLabel} numberOfLines={2}>
                    New today
                  </Text>
                </View>
                <View style={styles.snapshotDivider} />
                <View style={styles.snapshotStat}>
                  <Text style={styles.snapshotStatValue}>{practicedGrammar.length}</Text>
                  <Text style={styles.snapshotStatLabel} numberOfLines={2}>
                    Practiced
                  </Text>
                </View>
                <View style={styles.snapshotDivider} />
                <View style={styles.snapshotStat}>
                  <Text style={styles.snapshotStatValue}>{dominantStageMeta.id}</Text>
                  <Text style={styles.snapshotStatLabel} numberOfLines={2}>
                    Stage
                  </Text>
                </View>
              </View>

              <View style={styles.sideActions}>
                <AppButton
                  title="Profile"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onPress={() => router.push("/profile" as any)}
                />
                <AppButton
                  title="Settings"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onPress={() => router.push("/settings" as any)}
                />
              </View>
            </AppCard>

            <AppCard variant="flat" size="lg" style={styles.sideCard}>
              <View style={styles.clusterHeader}>
                <View style={styles.clusterHeading}>
                  <Text style={styles.clusterTitle}>Course progress</Text>
                  <Text style={styles.clusterSubtitle}>
                    Keep the full path visible without turning home into a report page.
                  </Text>
                </View>
              </View>

              <View style={styles.sideProgressSummary}>
                <Text style={styles.sideProgressValue}>{overallProgress}%</Text>
                <Text style={styles.sideProgressLabel}>complete so far</Text>
              </View>

              <View style={styles.sideProgressTrack}>
                <View style={[styles.sideProgressFill, { width: `${overallProgress}%` }]} />
              </View>

                <View style={styles.levelGrid}>
                  {levelProgress.map((level) => (
                    <TouchableOpacity
                      key={level.level}
                      style={[styles.levelTile, level.current && styles.levelTileCurrent]}
                      onPress={() => openLevelProgress(level.level)}
                      activeOpacity={level.practiced === 0 ? 1 : 0.88}
                      disabled={level.practiced === 0}
                    >
                      <View style={styles.levelTileTop}>
                        <Text style={styles.levelTileTitle}>{level.level}</Text>
                        <Text style={styles.levelTilePercent}>{level.percent}%</Text>
                      </View>
                    <Text style={styles.levelTileSubtitle} numberOfLines={1}>
                      {level.meta.homeTitle}
                    </Text>
                    <View style={styles.levelTileTrack}>
                      <View
                        style={[styles.levelTileFill, { width: `${level.percent}%` }]}
                      />
                    </View>
                      <Text style={styles.levelTileMeta}>
                        {level.practiced}/{level.total} topics
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
            </AppCard>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppSketch.background,
  },
  content: {
    width: "100%",
    maxWidth: DESKTOP_PAGE_WIDTHS.standard,
    alignSelf: "center",
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.xl,
    paddingBottom: AppSpacing["3xl"],
    gap: AppSpacing.xl,
  },

  header: {
    gap: AppSpacing.xs,
  },
  eyebrow: {
    ...AppTypography.labelSmall,
    color: AppSketch.inkFaint,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    ...AppTypography.hero,
  },
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppSketch.inkMuted,
    maxWidth: 700,
  },

  workspaceGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: AppSpacing.xl,
    flexWrap: "wrap",
  },
  mainColumn: {
    flex: 1,
    minWidth: 640,
    gap: AppSpacing.xl,
  },
  sideColumn: {
    width: 340,
    maxWidth: "100%",
    gap: AppSpacing.xl,
  },

  actionRow: {
    flexDirection: "row",
    gap: AppSpacing.md,
    flexWrap: "wrap",
  },
  topActionCard: {
    flex: 1,
    minWidth: 230,
    borderRadius: AppRadius.sm,
    paddingHorizontal: AppSpacing.xl,
    paddingVertical: AppSpacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...appShadow("sm"),
  },
  learnActionCard: {
    backgroundColor: "#5F6877",
  },
  reviewActionCard: {
    backgroundColor: "#4A5362",
  },
  topActionCopy: {
    flex: 1,
    gap: 4,
    paddingRight: AppSpacing.md,
  },
  topActionLabel: {
    ...AppTypography.subheading,
    color: "#FFFFFF",
  },
  topActionDetail: {
    ...AppTypography.caption,
    color: "rgba(255,255,255,0.76)",
  },
  reviewBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: AppRadius.md,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: AppSpacing.sm,
  },
  reviewBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  heroCard: {
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.sm,
    borderWidth: 1,
    borderColor: AppSketch.border,
    padding: AppSpacing["2xl"],
    gap: AppSpacing.lg,
    ...appShadow("md"),
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: AppSpacing.xl,
    flexWrap: "wrap",
  },
  heroHeading: {
    flex: 1,
    minWidth: 280,
    gap: AppSpacing.sm,
  },
  heroEyebrow: {
    ...AppTypography.labelSmall,
    color: AppSketch.primary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    ...AppTypography.title,
  },
  heroBody: {
    ...AppTypography.body,
    color: AppSketch.inkSecondary,
  },
  heroSide: {
    alignItems: "flex-end",
    gap: AppSpacing.xs,
    minWidth: 120,
  },
  heroStageChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: AppRadius.full,
    backgroundColor: `${AppSketch.primary}12`,
  },
  heroStageChipText: {
    ...AppTypography.caption,
    color: AppSketch.primary,
    fontWeight: "700",
  },
  heroPercent: {
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42,
    color: AppSketch.ink,
  },
  heroPercentLabel: {
    ...AppTypography.caption,
  },
  heroProgressRow: {
    flexDirection: "row",
    gap: AppSpacing.md,
    flexWrap: "wrap",
  },
  heroMetric: {
    flex: 1,
    minWidth: 160,
    paddingVertical: AppSpacing.md,
    paddingHorizontal: AppSpacing.lg,
    borderRadius: AppRadius.sm,
    backgroundColor: AppSketch.background,
    borderWidth: 1,
    borderColor: AppSketch.borderLight,
    gap: 2,
  },
  heroMetricLabel: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkFaint,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroMetricValue: {
    ...AppTypography.label,
    color: AppSketch.ink,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: AppSketch.borderLight,
    borderRadius: AppRadius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.full,
  },
  heroPathRail: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: AppSpacing.xs,
    paddingTop: AppSpacing.xs,
  },
  heroPathNode: {
    alignItems: "center",
    gap: AppSpacing.xs,
    flex: 1,
    minWidth: 0,
  },
  heroPathDot: {
    width: 20,
    height: 20,
    borderRadius: AppRadius.full,
    backgroundColor: "#E9EAED",
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  heroPathDotCompleted: {
    backgroundColor: "#5F89AB",
  },
  heroPathDotCurrent: {
    width: 24,
    height: 24,
    backgroundColor: AppSketch.primaryDark,
  },
  heroPathDotVisited: {
    backgroundColor: AppSketch.surface,
    borderWidth: 2,
    borderColor: "#7D97AD",
  },
  heroPathDotVisitedInner: {
    width: 8,
    height: 8,
    borderRadius: AppRadius.full,
    backgroundColor: "#7D97AD",
  },
  heroPathLabel: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
    textAlign: "center",
  },
  heroPathLabelActive: {
    color: AppSketch.ink,
  },
  heroPathLabelCurrent: {
    fontWeight: "700",
    color: AppSketch.primaryDark,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: AppSpacing.xs,
  },
  heroFooterText: {
    ...AppTypography.label,
    color: AppSketch.primary,
  },

  clusterCard: {
    gap: AppSpacing.lg,
    borderRadius: AppRadius.sm,
  },
  clusterHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: AppSpacing.md,
  },
  clusterHeading: {
    flex: 1,
    gap: 4,
  },
  clusterTitle: {
    ...AppTypography.heading,
  },
  clusterSubtitle: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
  },

  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.md,
  },
  tileCard: {
    flex: 1,
    minWidth: 250,
    backgroundColor: AppSketch.background,
    borderRadius: AppRadius.sm,
    borderWidth: 1,
    borderColor: AppSketch.borderLight,
    padding: AppSpacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: AppSpacing.md,
  },
  tileCardDisabled: {
    opacity: 0.55,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: AppRadius.xs,
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tileCopy: {
    flex: 1,
    gap: 2,
  },
  tileTitle: {
    ...AppTypography.label,
  },
  tileTitleDisabled: {
    color: AppSketch.inkMuted,
  },
  tileSubtitle: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
  },

  sideCard: {
    gap: AppSpacing.lg,
    borderRadius: AppRadius.sm,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppSpacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: AppRadius.xs,
    backgroundColor: `${AppSketch.primary}10`,
    borderWidth: 1,
    borderColor: `${AppSketch.primary}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileTitle: {
    ...AppTypography.subheading,
  },
  profileSubtitle: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppRadius.xs,
    backgroundColor: AppSketch.background,
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  statusChipPremium: {
    backgroundColor: AppSketch.surface,
    borderColor: `${AppSketch.primary}30`,
  },
  statusChipText: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkMuted,
  },
  statusChipTextPremium: {
    color: AppSketch.primary,
  },
  streakBlock: {
    gap: AppSpacing.md,
  },
  streakValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: AppSpacing.sm,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 40,
    color: AppSketch.ink,
  },
  streakValueLabel: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
    marginBottom: 6,
  },
  sparkline: {
    flexDirection: "row",
    gap: 8,
  },
  sparkDot: {
    flex: 1,
    height: 10,
    borderRadius: AppRadius.full,
    backgroundColor: AppSketch.border,
  },
  sparkDotActive: {
    backgroundColor: AppSketch.warning,
  },
  snapshotStats: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: AppSketch.background,
    borderRadius: AppRadius.sm,
    borderWidth: 1,
    borderColor: AppSketch.borderLight,
    overflow: "hidden",
  },
  snapshotStat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: AppSpacing.md,
    paddingHorizontal: AppSpacing.xs,
    gap: 2,
  },
  snapshotDivider: {
    width: 1,
    backgroundColor: AppSketch.border,
  },
  snapshotStatValue: {
    ...AppTypography.subheading,
  },
  snapshotStatLabel: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkFaint,
    textAlign: "center",
    lineHeight: 14,
    maxWidth: 72,
  },
  sideActions: {
    gap: AppSpacing.sm,
  },

  sideProgressSummary: {
    alignItems: "flex-start",
    gap: 2,
  },
  sideProgressValue: {
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 38,
    color: AppSketch.ink,
  },
  sideProgressLabel: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
  },
  sideProgressTrack: {
    height: 8,
    backgroundColor: AppSketch.borderLight,
    borderRadius: AppRadius.full,
    overflow: "hidden",
  },
  sideProgressFill: {
    height: "100%",
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.full,
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
  },
  levelTile: {
    width: "48%",
    minWidth: 130,
    backgroundColor: AppSketch.background,
    borderRadius: AppRadius.sm,
    borderWidth: 1,
    borderColor: AppSketch.borderLight,
    padding: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  levelTileCurrent: {
    borderColor: `${AppSketch.primary}35`,
    backgroundColor: `${AppSketch.primary}07`,
  },
  levelTileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelTileTitle: {
    ...AppTypography.label,
  },
  levelTilePercent: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
  },
  levelTileSubtitle: {
    ...AppTypography.caption,
    color: AppSketch.inkSecondary,
  },
  levelTileTrack: {
    height: 6,
    backgroundColor: AppSketch.border,
    borderRadius: AppRadius.full,
    overflow: "hidden",
  },
  levelTileFill: {
    height: "100%",
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.full,
  },
  levelTileMeta: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkFaint,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: AppSpacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.xl,
    padding: AppSpacing.xl,
    gap: AppSpacing.lg,
    ...appShadow("lg"),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: AppSpacing.md,
  },
  modalHeading: {
    flex: 1,
    gap: AppSpacing.xs,
  },
  modalTitle: {
    ...AppTypography.heading,
  },
  modalSubtitle: {
    ...AppTypography.body,
    color: AppSketch.inkMuted,
  },
  modalClose: {
    padding: AppSpacing.xs,
    borderRadius: AppRadius.sm,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppSpacing.xs,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    borderRadius: AppRadius.sm,
    backgroundColor: AppSketch.background,
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  filterChipActive: {
    borderColor: AppSketch.primary,
    backgroundColor: `${AppSketch.primary}10`,
  },
  filterChipDisabled: {
    opacity: 0.4,
  },
  filterChipText: {
    ...AppTypography.labelSmall,
  },
  filterChipTextActive: {
    color: AppSketch.primary,
  },
  filterChipCount: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkFaint,
  },
});
