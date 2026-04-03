import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  AppSketch,
  AppRadius,
  appShadow,
  AppTypography,
  AppSpacing,
} from "@/constants/theme-app";
import AppButton from "@/src/components/app/AppButton";
import AppCard from "@/src/components/app/AppCard";
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

// ── Types ──────────────────────────────────────────────────────────────────────
type ProgressFilterLevel = "All" | PublicCefrLevel;
type PendingProgressMixAction =
  | { type: "premium"; label: string; route: string }
  | { type: "practice"; route: string };

interface LessonPoint {
  id: string;
  title: string;
  stage: GrammarStage;
  level: PublicCefrLevel;
  completed: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Main Component ─────────────────────────────────────────────────────────────
export default function HomeScreenApp() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();

  // State
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [reviewsDue, setReviewsDue] = useState(0);
  const [reviewStatus, setReviewStatus] = useState("You're caught up");
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [isGuest, setIsGuest] = useState(false);
  const [showProgressMixModal, setShowProgressMixModal] = useState(false);
  const [selectedProgressLevels, setSelectedProgressLevels] = useState<ProgressFilterLevel[]>(["All"]);
  const [pendingProgressMixAction, setPendingProgressMixAction] = useState<PendingProgressMixAction | null>(null);

  // Auth check
  const checkAuth = useCallback(async () => {
    const allowed = await canAccessApp();
    if (!allowed) router.replace("/login");
  }, [router]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  // Data loading
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
        setReviewStatus("Log in to review");
        return;
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data?.waiting && data?.nextDueAt) {
        setReviewsDue(0);
        setReviewStatus(`Next in ${formatDelay(data.nextDueAt)}`);
      } else if (data?.done) {
        setReviewsDue(0);
        setReviewStatus("You're caught up");
      } else {
        const counts = data?.counts ?? {};
        const actionable = (counts.newCount ?? 0) + (counts.learningCount ?? 0) + (counts.reviewCount ?? 0);
        setReviewsDue(Math.max(0, actionable));
        setReviewStatus(`${actionable} card${actionable !== 1 ? 's' : ''} ready`);
      }
    } catch {
      setReviewsDue(0);
      setReviewStatus("Review unavailable");
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
      // keep default empty
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
      void loadReviewStatus();
      void loadHeatmap();
    }, [loadProgress, loadReviewStatus, loadHeatmap])
  );

  // Derived data
  const practicedGrammar = useMemo(
    () => grammarPoints.filter((p) => isGrammarPracticed(progress[p.id])),
    [grammarPoints, progress]
  );
  const nextLesson = useMemo(
    () => grammarPoints.find((p) => !isGrammarPracticed(progress[p.id])) ?? null,
    [grammarPoints, progress]
  );
  const firstLesson = grammarPoints[0] ?? null;

  const overallProgress = useMemo(() => {
    if (grammarPoints.length === 0) return 0;
    return Math.round((practicedGrammar.length / grammarPoints.length) * 100);
  }, [grammarPoints, practicedGrammar]);

  // Streak calculation
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      if ((activityMap[key] || 0) > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [activityMap]);

  // Learning path generation
  const learningPath = useMemo<LessonPoint[]>(() => {
    const currentIndex = nextLesson
      ? grammarPoints.findIndex((p) => p.id === nextLesson.id)
      : grammarPoints.length;
    
    const path: LessonPoint[] = [];
    
    // Last 2 completed
    for (let i = Math.max(0, currentIndex - 2); i < currentIndex; i++) {
      const p = grammarPoints[i];
      if (p) path.push({ id: p.id, title: p.title, stage: p.stage, level: p.level, completed: true });
    }
    
    // Current
    if (nextLesson) {
      path.push({
        id: nextLesson.id,
        title: nextLesson.title,
        stage: nextLesson.stage,
        level: nextLesson.level,
        completed: false,
      });
    }
    
    // Next 2 upcoming
    for (let i = currentIndex + 1; i < Math.min(grammarPoints.length, currentIndex + 3); i++) {
      const p = grammarPoints[i];
      if (p) path.push({ id: p.id, title: p.title, stage: p.stage, level: p.level, completed: false });
    }
    
    return path;
  }, [grammarPoints, nextLesson]);

  // Progress mix handling
  const filteredProgressGrammar = useMemo(() => {
    if (selectedProgressLevels.includes("All")) return practicedGrammar;
    return practicedGrammar.filter((p) => selectedProgressLevels.includes(p.level));
  }, [practicedGrammar, selectedProgressLevels]);

  const progressCountsByLevel = useMemo(() =>
    PUBLIC_CEFR_LEVELS.reduce((acc, level) => {
      acc[level] = practicedGrammar.filter((p) => p.level === level).length;
      return acc;
    }, {} as Record<PublicCefrLevel, number>),
    [practicedGrammar]
  );

  function toggleProgressLevel(level: ProgressFilterLevel) {
    if (level === "All") {
      setSelectedProgressLevels(["All"]);
      return;
    }
    setSelectedProgressLevels((current) => {
      const withoutAll = current.filter((v): v is PublicCefrLevel => v !== "All");
      if (withoutAll.includes(level)) {
        const next = withoutAll.filter((v) => v !== level);
        return next.length > 0 ? next : ["All"];
      }
      return [...withoutAll, level];
    });
  }

  function handleStartProgressMix() {
    if (filteredProgressGrammar.length === 0) return;
    const shuffled = shuffleIds(filteredProgressGrammar.map((p) => p.id));
    const route = `/practice/${shuffled[0]}/exercises?mix=${shuffled.join(",")}&source=progress`;

    if (!isPremium && filteredProgressGrammar.some((p) => isPremiumGrammarPoint(p))) {
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Progress Mix Modal */}
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
                <Text style={styles.modalTitle}>Practice Studied Grammar</Text>
                <Text style={styles.modalSubtitle}>
                  Review grammar points you&apos;ve already learned
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
              {["All", ...PUBLIC_CEFR_LEVELS].map((level) => {
                const count = level === "All" ? practicedGrammar.length : progressCountsByLevel[level];
                const selected = selectedProgressLevels.includes(level as ProgressFilterLevel);
                const disabled = count === 0;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterChip,
                      selected && styles.filterChipActive,
                      disabled && styles.filterChipDisabled,
                    ]}
                    onPress={() => toggleProgressLevel(level as ProgressFilterLevel)}
                    disabled={disabled}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {level}
                    </Text>
                    <Text style={[styles.filterChipCount, selected && styles.filterChipTextActive]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppButton
              title={`Practice ${filteredProgressGrammar.length} topic${filteredProgressGrammar.length !== 1 ? 's' : ''}`}
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
        {/* Header Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good to see you</Text>
          <Text style={styles.subtitle}>
            {isGuest ? "Start learning Thai today" : "Continue your Thai journey"}
          </Text>
        </View>

        {/* Daily Focus - Hero Card */}
        <AppCard variant="elevated" size="lg" style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroText}>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabel}>TODAY&apos;S FOCUS</Text>
                {nextLesson && (
                  <View style={styles.stageBadge}>
                    <Text style={styles.stageBadgeText}>{nextLesson.stage}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroTitle}>
                {nextLesson
                  ? nextLesson.title
                  : practicedGrammar.length > 0
                  ? "Great progress!"
                  : "Start your first lesson"}
              </Text>
              <Text style={styles.heroBody}>
                {nextLesson
                  ? `Continue with ${nextLesson.stage} and build your skills`
                  : practicedGrammar.length > 0
                  ? "You've completed all available lessons. Review or practice to keep learning."
                  : "Begin with the fundamentals and start speaking Thai"}
              </Text>
            </View>
            <AppButton
              title={nextLesson ? "Continue" : practicedGrammar.length > 0 ? "Review" : "Start Learning"}
              onPress={() =>
                router.push(
                  (nextLesson
                    ? `/practice/${nextLesson.id}`
                    : practicedGrammar.length > 0
                    ? "/review"
                    : firstLesson
                    ? `/practice/${firstLesson.id}`
                    : "/progress") as any
                )
              }
              size="lg"
            />
          </View>
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{overallProgress}% complete</Text>
          </View>
        </AppCard>

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <AppCard
            variant="flat"
            size="md"
            style={[styles.actionCard, styles.actionCardPrimary]}
            onPress={() => router.push("/progress" as any)}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="book-outline" size={24} color={AppSketch.primary} />
            </View>
            <Text style={styles.actionTitle}>Grammar Path</Text>
            <Text style={styles.actionSubtitle}>
              {nextLesson ? nextLesson.stage : "Start learning"}
            </Text>
          </AppCard>

          <AppCard
            variant="flat"
            size="md"
            style={[styles.actionCard, reviewsDue > 0 && styles.actionCardHighlight]}
            onPress={() => router.push("/review/" as any)}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="albums-outline" size={24} color={reviewsDue > 0 ? AppSketch.primary : AppSketch.inkMuted} />
            </View>
            <Text style={styles.actionTitle}>Review</Text>
            <Text style={styles.actionSubtitle}>{reviewStatus}</Text>
            {reviewsDue > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{reviewsDue}</Text>
              </View>
            )}
          </AppCard>

          <AppCard
            variant="flat"
            size="md"
            style={[styles.actionCard, practicedGrammar.length === 0 && styles.actionCardDisabled]}
            onPress={() => {
              if (practicedGrammar.length === 0) return;
              setSelectedProgressLevels(["All"]);
              setShowProgressMixModal(true);
            }}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="shuffle-outline" size={24} color={practicedGrammar.length > 0 ? AppSketch.primary : AppSketch.inkFaint} />
            </View>
            <Text style={[styles.actionTitle, practicedGrammar.length === 0 && styles.actionTitleDisabled]}>
              Practice Mix
            </Text>
            <Text style={styles.actionSubtitle}>
              {practicedGrammar.length > 0 ? `${practicedGrammar.length} topics` : "No topics yet"}
            </Text>
          </AppCard>
        </View>

        {/* Learning Path */}
        {learningPath.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Path</Text>
            <AppCard variant="flat" size="md" style={styles.pathCard}>
              <View style={styles.pathTrack}>
                {learningPath.map((point, index) => (
                  <TouchableOpacity
                    key={point.id}
                    style={styles.pathNode}
                    onPress={() => router.push(`/practice/${point.id}` as any)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.pathDot,
                        point.completed && styles.pathDotCompleted,
                        index === learningPath.findIndex((p) => !p.completed) && styles.pathDotCurrent,
                      ]}
                    >
                      {point.completed ? (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      ) : index === learningPath.findIndex((p) => !p.completed) ? (
                        <View style={styles.pathDotPulse} />
                      ) : null}
                    </View>
                    <Text style={styles.pathLabel} numberOfLines={1}>
                      {point.stage}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AppCard>
          </View>
        )}

        {/* Bottom Row: Streak & Tools */}
        <View style={styles.bottomRow}>
          {/* Streak Card */}
          <AppCard variant="flat" size="md" style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View>
                <Text style={styles.streakValue}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
            {/* Mini sparkline */}
            <View style={styles.sparkline}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const key = localDateKey(d);
                const active = (activityMap[key] || 0) > 0;
                return (
                  <View
                    key={i}
                    style={[styles.sparkDot, active && styles.sparkDotActive]}
                  />
                );
              })}
            </View>
          </AppCard>

          {/* Quick Tools */}
          <View style={styles.toolsSection}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.toolsGrid}>
              {[
                { label: "Alphabet", icon: "language-outline", route: "/alphabet/" },
                { label: "Numbers", icon: "calculator-outline", route: "/numbers/" },
                { label: "Tones", icon: "musical-notes-outline", route: "/tones/" },
                { label: "Trainer", icon: "school-outline", route: "/trainer/" },
              ].map((tool) => (
                <TouchableOpacity
                  key={tool.label}
                  style={styles.toolChip}
                  onPress={() => router.push(tool.route as any)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={tool.icon as any} size={16} color={AppSketch.inkMuted} />
                  <Text style={styles.toolLabel}>{tool.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Spacer for scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppSketch.background,
  },
  content: {
    padding: AppSpacing.xl,
    gap: AppSpacing.xl,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: {
    gap: 4,
  },
  greeting: {
    ...AppTypography.hero,
  },
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppSketch.inkMuted,
  },

  // Hero Card
  heroCard: {
    gap: AppSpacing.lg,
  },
  heroContent: {
    gap: AppSpacing.lg,
  },
  heroText: {
    gap: AppSpacing.sm,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
  },
  heroLabel: {
    ...AppTypography.labelSmall,
    color: AppSketch.primary,
    letterSpacing: 1.5,
  },
  stageBadge: {
    backgroundColor: `${AppSketch.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppRadius.sm,
  },
  stageBadgeText: {
    ...AppTypography.caption,
    color: AppSketch.primary,
    fontWeight: '600',
  },
  heroTitle: {
    ...AppTypography.title,
  },
  heroBody: {
    ...AppTypography.body,
    color: AppSketch.inkSecondary,
  },
  progressBarContainer: {
    gap: AppSpacing.sm,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: AppSketch.border,
    borderRadius: AppRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.full,
  },
  progressText: {
    ...AppTypography.caption,
    textAlign: 'right',
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    gap: AppSpacing.md,
    flexWrap: 'wrap',
  },
  actionCard: {
    flex: 1,
    minWidth: 180,
    alignItems: 'center',
    paddingVertical: AppSpacing.lg,
  },
  actionCardPrimary: {
    borderColor: `${AppSketch.primary}30`,
    backgroundColor: `${AppSketch.primary}08`,
  },
  actionCardHighlight: {
    borderColor: `${AppSketch.success}30`,
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: AppRadius.md,
    backgroundColor: AppSketch.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.md,
  },
  actionTitle: {
    ...AppTypography.subheading,
  },
  actionTitleDisabled: {
    color: AppSketch.inkMuted,
  },
  actionSubtitle: {
    ...AppTypography.caption,
    marginTop: 2,
  },
  actionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Section
  section: {
    gap: AppSpacing.md,
  },
  sectionTitle: {
    ...AppTypography.heading,
  },

  // Path
  pathCard: {
    paddingVertical: AppSpacing.lg,
  },
  pathTrack: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pathNode: {
    alignItems: 'center',
    gap: AppSpacing.sm,
    minWidth: 80,
  },
  pathDot: {
    width: 32,
    height: 32,
    borderRadius: AppRadius.full,
    backgroundColor: AppSketch.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathDotCompleted: {
    backgroundColor: AppSketch.success,
  },
  pathDotCurrent: {
    backgroundColor: AppSketch.primary,
    ...appShadow('sm'),
  },
  pathDotPulse: {
    width: 12,
    height: 12,
    borderRadius: AppRadius.full,
    backgroundColor: '#fff',
  },
  pathLabel: {
    ...AppTypography.caption,
    fontWeight: '600',
  },

  // Bottom Row
  bottomRow: {
    flexDirection: 'row',
    gap: AppSpacing.lg,
    flexWrap: 'wrap',
  },
  streakCard: {
    flex: 1,
    minWidth: 200,
    gap: AppSpacing.md,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakValue: {
    ...AppTypography.hero,
    lineHeight: 36,
  },
  streakLabel: {
    ...AppTypography.caption,
  },
  sparkline: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  sparkDot: {
    width: 8,
    height: 8,
    borderRadius: AppRadius.full,
    backgroundColor: AppSketch.border,
  },
  sparkDotActive: {
    backgroundColor: AppSketch.warning,
  },

  // Tools
  toolsSection: {
    flex: 2,
    minWidth: 280,
    gap: AppSpacing.md,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.sm,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    borderRadius: AppRadius.sm,
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  toolLabel: {
    ...AppTypography.labelSmall,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: AppSpacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.xl,
    padding: AppSpacing.xl,
    gap: AppSpacing.lg,
    ...appShadow('lg'),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
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
