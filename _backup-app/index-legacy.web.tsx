import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
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
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import {
  GRAMMAR_STAGE_META,
  PUBLIC_GRAMMAR_STAGES,
  GrammarStage,
} from "@/src/data/grammarStages";
import {
  PUBLIC_CEFR_LEVELS,
  PublicCefrLevel,
} from "@/src/data/grammarLevels";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { canAccessApp, isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

const PROGRESS_FILTER_LEVELS = ["All", ...PUBLIC_CEFR_LEVELS] as const;

type ProgressFilterLevel = (typeof PROGRESS_FILTER_LEVELS)[number];
type PendingProgressMixAction =
  | { type: "premium"; label: string; route: string }
  | { type: "practice"; route: string };

type ModuleInfo = {
  stage: GrammarStage;
  title: string;
  grammarIds: string[];
};

function formatDelay(nextDueAt: string) {
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

export default function HomeScreenWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>(
    {},
  );
  const [overallGrammarProgress, setOverallGrammarProgress] = useState(0);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [reviewSummary, setReviewSummary] = useState("You are caught up");
  const [showProgressMixModal, setShowProgressMixModal] = useState(false);
  const [selectedProgressLevels, setSelectedProgressLevels] = useState<
    ProgressFilterLevel[]
  >(["All"]);
  const [pendingProgressMixAction, setPendingProgressMixAction] =
    useState<PendingProgressMixAction | null>(null);

  const modules = useMemo<ModuleInfo[]>(
    () =>
      PUBLIC_GRAMMAR_STAGES.filter((stage) =>
        grammarPoints.some((point) => point.stage === stage),
      ).map((stage) => ({
        stage,
        title: GRAMMAR_STAGE_META[stage].shortTitle,
        grammarIds: grammarPoints
          .filter((point) => point.stage === stage)
          .map((point) => point.id),
      })),
    [grammarPoints],
  );

  const checkAuth = useCallback(async () => {
    const allowed = await canAccessApp();
    if (!allowed) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const loadProgress = useCallback(async () => {
    try {
      const allProgress = await getAllProgress();
      const practicedCount = grammarPoints.filter((point) =>
        isGrammarPracticed(allProgress[point.id]),
      ).length;

      setProgress(allProgress);
      setOverallGrammarProgress(
        grammarPoints.length > 0
          ? Math.round((practicedCount / grammarPoints.length) * 100)
          : 0,
      );
    } catch (err) {
      console.error("Failed to load grammar progress:", err);
    }
  }, [grammarPoints]);

  const loadReviewStatus = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      if (guest) {
        setReviewsDue(0);
        setReviewSummary("Log in to review vocabulary");
        return;
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data?.waiting && data?.nextDueAt) {
        setReviewsDue(0);
        setReviewSummary(`Next card in ${formatDelay(data.nextDueAt)}`);
        return;
      }

      if (data?.done) {
        setReviewsDue(0);
        setReviewSummary("You are caught up");
        return;
      }

      const counts = data?.counts ?? {};
      const actionableReviews =
        (counts.newCount ?? 0) +
        (counts.learningCount ?? 0) +
        (counts.reviewCount ?? 0);
      const dueNow = actionableReviews > 0 ? actionableReviews : 1;

      setReviewsDue(dueNow);
      setReviewSummary(
        dueNow === 1 ? "1 card ready now" : `${dueNow} cards ready now`,
      );
    } catch (err) {
      console.error("Failed to load review status:", err);
      setReviewsDue(0);
      setReviewSummary("Review unavailable");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
      void loadReviewStatus();
    }, [loadProgress, loadReviewStatus]),
  );

  const practicedGrammar = useMemo(
    () => grammarPoints.filter((point) => isGrammarPracticed(progress[point.id])),
    [grammarPoints, progress],
  );
  const nextLesson = useMemo(
    () => grammarPoints.find((point) => !isGrammarPracticed(progress[point.id])) ?? null,
    [grammarPoints, progress],
  );
  const firstLesson = grammarPoints[0] ?? null;

  const currentStage = nextLesson?.stage
    ? nextLesson.stage
    : practicedGrammar[practicedGrammar.length - 1]?.stage ?? firstLesson?.stage ?? null;
  const currentModule =
    currentStage ? modules.find((module) => module.stage === currentStage) ?? null : null;
  const currentStageProgress =
    currentModule && currentModule.grammarIds.length > 0
      ? Math.round(
          (currentModule.grammarIds.filter((id) => isGrammarPracticed(progress[id]))
            .length /
            currentModule.grammarIds.length) *
            100,
        )
      : 0;
  const currentStageCompleted = currentModule
    ? currentModule.grammarIds.filter((id) => isGrammarPracticed(progress[id])).length
    : 0;
  const currentStageTotal = currentModule?.grammarIds.length ?? 0;
  const currentStageTitle =
    currentStage && GRAMMAR_STAGE_META[currentStage]
      ? GRAMMAR_STAGE_META[currentStage].shortTitle
      : "Start here";

  const continueCard = useMemo(() => {
    if (practicedGrammar.length === 0) {
      return {
        label: firstLesson?.stage ?? "A1.1",
        title: firstLesson?.title ?? "Start your first lesson",
        body:
          firstLesson?.explanation ??
          "Begin with the first six lessons and build a clear base in Thai sentence structure.",
        actionLabel: "Continue lesson",
        action: () =>
          router.push(
            (firstLesson ? `/practice/${firstLesson.id}` : "/progress") as any,
          ),
      };
    }

    if (nextLesson) {
      return {
        label: nextLesson.stage,
        title: nextLesson.title,
        body: "Pick up the next grammar lesson and keep your path moving forward.",
        actionLabel: "Continue lesson",
        action: () => router.push(`/practice/${nextLesson.id}` as any),
      };
    }

    return {
      label: "Complete",
      title: "Everything currently available is done",
      body:
        "Revisit grammar you have already studied, or review vocabulary to keep it active.",
      actionLabel: "Open grammar path",
      action: () => router.push("/progress" as any),
    };
  }, [firstLesson, nextLesson, practicedGrammar.length, router]);

  const progressCountsByLevel = useMemo(
    () =>
      PUBLIC_CEFR_LEVELS.reduce(
        (acc, level) => {
          acc[level] = practicedGrammar.filter((point) => point.level === level).length;
          return acc;
        },
        {} as Record<PublicCefrLevel, number>,
      ),
    [practicedGrammar],
  );

  const filteredProgressGrammar = useMemo(() => {
    if (selectedProgressLevels.includes("All")) return practicedGrammar;
    return practicedGrammar.filter(
      (point) => point.level !== "C2" && selectedProgressLevels.includes(point.level),
    );
  }, [practicedGrammar, selectedProgressLevels]);

  useEffect(() => {
    if (showProgressMixModal || !pendingProgressMixAction) return;

    const action = pendingProgressMixAction;
    setPendingProgressMixAction(null);
    if (action.type === "premium") {
      void ensurePremiumAccess(action.label, action.route);
      return;
    }
    router.push(action.route as any);
  }, [ensurePremiumAccess, pendingProgressMixAction, router, showProgressMixModal]);

  function toggleProgressLevel(level: ProgressFilterLevel) {
    if (level === "All") {
      setSelectedProgressLevels(["All"]);
      return;
    }

    setSelectedProgressLevels((current) => {
      const withoutAll = current.filter(
        (value): value is PublicCefrLevel => value !== "All",
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

  const isTopStacked = width < 1220;
  const toolCardWidth =
    width >= 1320 ? "32.4%" : width >= 980 ? "48.8%" : "100%";
  const foundationCardWidth =
    width >= 1320 ? "32.4%" : width >= 980 ? "48.8%" : "100%";

  return (
    <>
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
                <Text style={styles.modalTitle}>Studied grammar</Text>
                <Text style={styles.modalSubtitle}>
                  Practice grammar points you have already studied.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowProgressMixModal(false)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={20} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterWrap}>
              {PROGRESS_FILTER_LEVELS.map((level) => {
                const count =
                  level === "All" ? practicedGrammar.length : progressCountsByLevel[level];
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
                    onPress={() => toggleProgressLevel(level)}
                    disabled={isDisabled}
                    activeOpacity={0.82}
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
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                filteredProgressGrammar.length === 0 && styles.disabledButton,
              ]}
              onPress={handleStartProgressMix}
              disabled={filteredProgressGrammar.length === 0}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Start practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DesktopPage
        density="primary"
        eyebrow="Home"
        title="Continue your Thai"
        subtitle="Open your next lesson, review vocabulary, and keep the course moving."
        maxWidth={1240}
      >
        <View style={styles.pageStack}>
          <View style={[styles.heroCluster, isTopStacked && styles.heroClusterStacked]}>
            <TouchableOpacity
              style={styles.sideActionCard}
              onPress={() => router.push("/progress" as any)}
              activeOpacity={0.82}
            >
              <View style={styles.sideActionIconBox}>
                <Ionicons name="book-outline" size={18} color={Sketch.accent} />
              </View>
              <Text style={styles.sideActionTitle}>Learn Grammar</Text>
              <Text style={styles.sideActionBody}>
                {nextLesson
                  ? `${nextLesson.stage} · ${nextLesson.title}`
                  : "Open the grammar path and continue the next lesson."}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.progressHero}
              onPress={continueCard.action}
              activeOpacity={0.82}
            >
              <View style={styles.progressHeroHeader}>
                <View style={styles.progressHeroLabelRow}>
                  <Text style={styles.progressHeroLabel}>Current progress</Text>
                  <Text style={styles.progressHeroStage}>{currentStage ?? "A1.1"}</Text>
                </View>
                <Text style={styles.progressHeroTitle}>{currentStageTitle}</Text>
                <Text style={styles.progressHeroBody}>
                  {currentStageTotal > 0
                    ? `${currentStageCompleted} of ${currentStageTotal} lessons completed in this stage`
                    : "Start with the first lesson and build forward from there."}
                </Text>
              </View>
              <View style={styles.progressHeroTrack}>
                <View
                  style={[styles.progressHeroFill, { width: `${currentStageProgress}%` }]}
                />
              </View>
              <View style={styles.progressHeroStats}>
                <View style={styles.progressHeroStat}>
                  <Text style={styles.progressHeroStatValue}>
                    {overallGrammarProgress}%
                  </Text>
                  <Text style={styles.progressHeroStatLabel}>Course complete</Text>
                </View>
                <View style={styles.progressHeroStat}>
                  <Text style={styles.progressHeroStatValue}>
                    {practicedGrammar.length}
                  </Text>
                  <Text style={styles.progressHeroStatLabel}>Lessons studied</Text>
                </View>
                <View style={styles.progressHeroNext}>
                  <Text style={styles.progressHeroNextLabel}>Next lesson</Text>
                  <Text style={styles.progressHeroNextValue}>
                    {continueCard.title}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideActionCard}
              onPress={() => router.push("/review/" as any)}
              activeOpacity={0.82}
            >
              <View style={styles.sideActionIconBox}>
                <Ionicons name="albums-outline" size={18} color={Sketch.accent} />
              </View>
              <Text style={styles.sideActionTitle}>Review Vocabulary</Text>
              <Text style={styles.sideActionBody}>
                {reviewsDue > 0 ? reviewSummary : "Open review and keep recent words active."}
              </Text>
              <View style={styles.sideActionBadge}>
                <Text style={styles.sideActionBadgeText}>
                  {reviewsDue > 0 ? reviewsDue : 0}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <DesktopPanel style={styles.toolsCluster}>
            <View style={styles.clusterHeaderRow}>
              <View style={styles.clusterHeaderText}>
                <Text style={styles.clusterTitle}>Study tools</Text>
                <Text style={styles.clusterBody}>
                  Keep your main tools clustered together in one place.
                </Text>
              </View>
            </View>
            <View style={styles.utilityGrid}>
              {[
                {
                  title: "Saved practice",
                  route: "/explore",
                  icon: "bookmark-outline" as const,
                  disabled: false,
                  onPress: () => router.push("/explore" as any),
                },
                {
                  title: "Studied grammar",
                  route: "",
                  icon: "shuffle-outline" as const,
                  disabled: practicedGrammar.length === 0,
                  onPress: () => {
                    if (practicedGrammar.length === 0) return;
                    setSelectedProgressLevels(["All"]);
                    setShowProgressMixModal(true);
                  },
                },
                {
                  title: "Trainer",
                  route: "/trainer",
                  icon: "school-outline" as const,
                  disabled: false,
                  onPress: () => router.push("/trainer" as any),
                },
                {
                  title: "Open grammar path",
                  route: "/progress",
                  icon: "map-outline" as const,
                  disabled: false,
                  onPress: () => router.push("/progress" as any),
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={[
                    styles.utilityShortcut,
                    { width: toolCardWidth },
                    item.disabled && styles.utilityCardDisabled,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                  activeOpacity={0.82}
                >
                  <View style={styles.utilityIconBox}>
                    <Ionicons name={item.icon} size={16} color={Sketch.accent} />
                  </View>
                  <Text style={styles.utilityShortcutText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </DesktopPanel>

          <DesktopPanel style={styles.foundationsCluster}>
            <View style={styles.clusterHeaderRow}>
              <View style={styles.clusterHeaderText}>
                <Text style={styles.clusterTitle}>Alphabet + Numbers</Text>
                <Text style={styles.clusterBody}>
                  Keep the reading foundations close to the main course.
                </Text>
              </View>
            </View>
            <View style={styles.utilityGrid}>
              {[
                {
                  title: "Alphabet",
                  body: "Browse consonants and sound classes.",
                  icon: "language-outline" as const,
                  onPress: () => router.push("/alphabet/" as any),
                },
                {
                  title: "Numbers",
                  body: "Learn digits, Thai numerals, and number patterns.",
                  icon: "calculator-outline" as const,
                  onPress: () => router.push("/numbers/" as any),
                },
                {
                  title: "Tones",
                  body: "Open the tone guide and listening reference.",
                  icon: "musical-notes-outline" as const,
                  onPress: () => router.push("/tones/" as any),
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={[styles.foundationCard, { width: foundationCardWidth }]}
                  onPress={item.onPress}
                  activeOpacity={0.82}
                >
                  <View style={styles.utilityIconBox}>
                    <Ionicons name={item.icon} size={16} color={Sketch.accent} />
                  </View>
                  <View style={styles.foundationCopy}>
                    <Text style={styles.foundationTitle}>{item.title}</Text>
                    <Text style={styles.foundationBody}>{item.body}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </DesktopPanel>
        </View>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 18,
  },
  heroCluster: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  heroClusterStacked: {
    flexDirection: "column",
  },
  sideActionCard: {
    width: 220,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 12,
    justifyContent: "space-between",
  },
  sideActionIconBox: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  sideActionTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sideActionBody: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
  sideActionBadge: {
    alignSelf: "flex-start",
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    alignItems: "center",
  },
  sideActionBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  progressHero: {
    flex: 1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 26,
    gap: 18,
    justifyContent: "space-between",
  },
  progressHeroHeader: {
    gap: 10,
  },
  progressHeroLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  progressHeroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressHeroStage: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.accent,
  },
  progressHeroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.9,
  },
  progressHeroBody: {
    maxWidth: 620,
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  progressHeroTrack: {
    height: 8,
    backgroundColor: Sketch.inkFaint,
  },
  progressHeroFill: {
    height: "100%",
    backgroundColor: Sketch.accent,
  },
  progressHeroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  progressHeroStat: {
    minWidth: 120,
    gap: 2,
  },
  progressHeroStatValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  progressHeroStatLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.inkMuted,
  },
  progressHeroNext: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  progressHeroNextLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressHeroNextValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  reviewBanner: {
    display: "none",
  },
  clusterHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
  },
  clusterHeaderText: {
    flex: 1,
    gap: 4,
  },
  clusterTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.4,
  },
  clusterBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  toolsCluster: {
    gap: 16,
  },
  foundationsCluster: {
    gap: 16,
  },
  utilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  utilityShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 0,
  },
  utilityCardDisabled: {
    opacity: 0.45,
  },
  utilityIconBox: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  utilityShortcutText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
  foundationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
    minHeight: 118,
  },
  foundationCopy: {
    flex: 1,
    gap: 6,
  },
  foundationTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  foundationBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  primaryButton: {
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  disabledButton: {
    opacity: 0.45,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.26)",
    justifyContent: "center",
    padding: 28,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 22,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  modalHeading: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    gap: 2,
  },
  filterChipActive: {
    borderColor: Sketch.accent,
  },
  filterChipDisabled: {
    opacity: 0.45,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  filterChipCount: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  filterChipTextActive: {
    color: Sketch.accent,
  },
});
