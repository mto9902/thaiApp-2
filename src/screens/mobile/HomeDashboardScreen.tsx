import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED as WEB_LIGHT_BUTTON_PRESSED_SHADOW,
  WEB_LIGHT_BUTTON_SHADOW as WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED as WEB_NAVY_BUTTON_PRESSED_SHADOW,
  WEB_NAVY_BUTTON_SHADOW as WEB_NAVY_BUTTON_SHADOW,
} from "@/src/components/web/designSystem";
import ToneDots from "@/src/components/ToneDots";
import ToneThaiText from "@/src/components/ToneThaiText";
import SentenceExplanationModal from "@/src/components/mobile/SentenceExplanationModal";
import { API_BASE } from "@/src/config";
import { GrammarPoint } from "@/src/data/grammar";
import {
  CEFR_LEVEL_META,
  PUBLIC_CEFR_LEVELS,
  PublicCefrLevel,
} from "@/src/data/grammarLevels";
import {
  GRAMMAR_STAGE_META,
  PUBLIC_GRAMMAR_STAGES,
  GrammarStage,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { useDashboardMiniExercise } from "@/src/hooks/useDashboardMiniExercise";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { getSentenceExplanation } from "@/src/api/getSentenceExplanation";
import { canAccessApp, isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getBreakdownTones } from "@/src/utils/breakdownTones";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";
import { getProfileDisplayName } from "@/src/utils/profileName";

type HomeProfile = {
  id?: number | null;
  email?: string | null;
  display_name?: string | null;
  has_keystone_access?: boolean | null;
};

type SentenceReportStatus = {
  kind: "success" | "error";
  message: string;
};

type LevelPickerOption = {
  level: PublicCefrLevel;
  title: string;
  locked: boolean;
  targetPoint: GrammarPoint | null;
};

type PracticeMixFilterLevel = "All" | PublicCefrLevel;

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
  wrongBg: "#F3F4F6",
};

const TONE = {
  mid: "#7A736D",
  low: "#97674B",
  falling: "#9A7691",
  high: "#6D86A1",
  rising: "#86A07F",
} as const;

const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_WORD_BREAKDOWN_TTS = "pref_word_breakdown_tts";
const TONE_GUIDE_ITEMS = [
  { label: "mid", tone: "mid" },
  { label: "low", tone: "low" },
  { label: "falling", tone: "falling" },
  { label: "high", tone: "high" },
  { label: "rising", tone: "rising" },
] as const;

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

const SURFACE_PRESSED = {
  transform: [{ translateY: 1.5 }],
  shadowOpacity: 0.04,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
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

const WEB_DEFAULT_BUTTON_STYLE =
  Platform.OS === "web"
    ? ({
        minHeight: 48,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        boxShadow: WEB_LIGHT_BUTTON_SHADOW,
        userSelect: "none",
        ...WEB_INTERACTIVE_TRANSITION,
      } as any)
    : null;

const WEB_DEFAULT_BUTTON_PRESSED =
  Platform.OS === "web"
    ? ({
        transform: WEB_DEPRESSED_TRANSFORM as any,
        boxShadow: WEB_LIGHT_BUTTON_PRESSED_SHADOW,
      } as any)
    : null;

const WEB_PRIMARY_BUTTON_STYLE =
  Platform.OS === "web"
    ? ({
        minHeight: 48,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: BRAND.navy,
        borderWidth: 1,
        borderColor: "#0D2237",
        boxShadow: WEB_NAVY_BUTTON_SHADOW,
        userSelect: "none",
        ...WEB_INTERACTIVE_TRANSITION,
      } as any)
    : null;

const WEB_PRIMARY_BUTTON_PRESSED =
  Platform.OS === "web"
    ? ({
        transform: WEB_DEPRESSED_TRANSFORM as any,
        boxShadow: WEB_NAVY_BUTTON_PRESSED_SHADOW,
      } as any)
    : null;

const WEB_UTILITY_BUTTON_STYLE =
  Platform.OS === "web"
    ? ({
        minHeight: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BRAND.line,
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 12,
        paddingVertical: 0,
        boxShadow: WEB_LIGHT_BUTTON_SHADOW,
        userSelect: "none",
        ...WEB_INTERACTIVE_TRANSITION,
      } as any)
    : null;

const WEB_UTILITY_BUTTON_PRESSED =
  Platform.OS === "web"
    ? ({
        transform: WEB_DEPRESSED_TRANSFORM as any,
        boxShadow: WEB_LIGHT_BUTTON_PRESSED_SHADOW,
      } as any)
    : null;

const WEB_DISPLAY_TOGGLE_STYLE =
  Platform.OS === "web"
    ? ({
        minHeight: 34,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BRAND.line,
        backgroundColor: BRAND.paper,
        paddingHorizontal: 10,
        paddingVertical: 7,
        boxShadow: WEB_LIGHT_BUTTON_SHADOW,
        userSelect: "none",
        ...WEB_INTERACTIVE_TRANSITION,
      } as any)
    : null;

const WEB_DISPLAY_TOGGLE_PRESSED =
  Platform.OS === "web"
    ? ({
        transform: WEB_DEPRESSED_TRANSFORM as any,
        boxShadow: WEB_LIGHT_BUTTON_PRESSED_SHADOW,
      } as any)
    : null;

const WEB_STATUS_TAG_STYLE =
  Platform.OS === "web"
    ? ({
        minHeight: 30,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BRAND.line,
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 9,
        paddingVertical: 5,
        boxShadow: WEB_LIGHT_BUTTON_SHADOW,
      } as any)
    : null;

const TAP_SETTLE_MS = 140;

type ToneDisplayItem = {
  thai: string;
  tone?: unknown;
  tones?: unknown;
  romanization?: string;
  roman?: string;
  english?: string;
  displayThaiSegments?: string[] | null;
};

type BuildSlotToneItem = ToneDisplayItem & {
  builtWordId?: number | null;
};

function isPublicCefrLevel(level: string): level is PublicCefrLevel {
  return (PUBLIC_CEFR_LEVELS as readonly string[]).includes(level);
}

function BreakdownToneText({
  breakdown,
  style,
}: {
  breakdown: ToneDisplayItem[];
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={style}>
      {breakdown.map((item, index) => (
        <ToneThaiText
          key={`${item.thai}-${index}`}
          thai={item.thai}
          tones={getBreakdownTones(item)}
          romanization={item.romanization || item.roman}
          displayThaiSegments={item.displayThaiSegments}
          fallbackColor={BRAND.ink}
        />
      ))}
    </Text>
  );
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function shuffleIds(ids: string[]) {
  return [...ids].sort(() => Math.random() - 0.5);
}

function formatDelay(nextDueAt: string) {
  const ms = Math.max(new Date(nextDueAt).getTime() - Date.now(), 0);
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.ceil(hours / 24)}d`;
}

function getItemRomanization(item: { romanization?: string; roman?: string }) {
  return item.romanization || item.roman || "";
}

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
  size = "default",
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  size?: "default" | "compact";
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: any;
}) {
  const { transientPressed, onPressIn, onPressOut } = useTransientPressed(Boolean(disabled));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={({ pressed }) => [
        styles.buttonBase,
        Platform.OS === "web"
          ? size === "compact"
            ? variant === "primary"
              ? WEB_PRIMARY_BUTTON_STYLE
              : WEB_UTILITY_BUTTON_STYLE
            : variant === "primary"
              ? WEB_PRIMARY_BUTTON_STYLE
              : WEB_DEFAULT_BUTTON_STYLE
          : size === "compact"
            ? styles.buttonCompact
            : null,
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        (pressed || transientPressed) && !disabled
          ? variant === "primary"
            ? [styles.primaryButtonPressed, Platform.OS === "web" ? WEB_PRIMARY_BUTTON_PRESSED : null]
            : [
                styles.secondaryButtonPressed,
                Platform.OS === "web"
                  ? size === "compact"
                    ? WEB_UTILITY_BUTTON_PRESSED
                    : WEB_DEFAULT_BUTTON_PRESSED
                  : null,
              ]
          : null,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={size === "compact" ? 15 : 16}
          color={variant === "primary" ? BRAND.white : BRAND.ink}
          style={styles.buttonIcon}
        />
      ) : null}
      <Text
        style={[
          styles.buttonLabel,
          size === "compact" ? styles.buttonLabelCompact : null,
          variant === "primary" ? styles.primaryButtonLabel : styles.secondaryButtonLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DisplayToggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { transientPressed, onPressIn, onPressOut } = useTransientPressed(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.toggleChip,
        Platform.OS === "web" ? WEB_DISPLAY_TOGGLE_STYLE : null,
        pressed || transientPressed ? styles.secondaryButtonPressed : null,
        (pressed || transientPressed) && Platform.OS === "web" ? WEB_DISPLAY_TOGGLE_PRESSED : null,
      ]}
    >
      <Text style={styles.toggleChipLabel}>{label}</Text>
      <View style={[styles.toggleIndicator, active ? styles.toggleIndicatorActive : null]}>
        {active ? <Ionicons name="checkmark" size={12} color={BRAND.white} /> : null}
      </View>
    </Pressable>
  );
}

function SettledPressable({
  disabled,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: any) {
  const { transientPressed, onPressIn: handlePressIn, onPressOut: handlePressOut } =
    useTransientPressed(Boolean(disabled));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        handlePressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        handlePressOut();
        onPressOut?.(event);
      }}
      style={(state) =>
        typeof style === "function"
          ? style({ ...state, pressed: state.pressed || transientPressed })
          : style
      }
    >
      {typeof children === "function"
        ? children({ pressed: transientPressed, hovered: false, focused: false })
        : children}
    </Pressable>
  );
}

function ProgressDots({
  stageRail,
}: {
  stageRail: { id: GrammarStage; label: string; status: string }[];
}) {
  return (
    <View style={styles.stageRailWrap}>
      <View style={styles.stageRailRow}>
        {stageRail.map((stage) => (
          <View key={stage.id} style={styles.stageDotItem}>
            <View
              style={[
                styles.stageDot,
                stage.status === "complete"
                  ? styles.stageDotComplete
                  : stage.status === "current"
                    ? styles.stageDotCurrent
                    : stage.status === "visited"
                      ? styles.stageDotVisited
                      : styles.stageDotLocked,
              ]}
            />
            <Text style={styles.stageDotLabel}>{stage.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HomeDashboardScreen() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();
  const { playSentence } = useSentenceAudio();

  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [reviewsDue, setReviewsDue] = useState(0);
  const [reviewStatus, setReviewStatus] = useState("You're caught up");
  const [isGuest, setIsGuest] = useState(false);
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [showRoman, setShowRoman] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [wordAudioEnabled, setWordAudioEnabled] = useState(false);
  const [toneGuideOpen, setToneGuideOpen] = useState(false);
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);
  const [showPracticeMixModal, setShowPracticeMixModal] = useState(false);
  const [selectedPracticeMixLevels, setSelectedPracticeMixLevels] = useState<
    PracticeMixFilterLevel[]
  >(["All"]);
  const [lockedNextLesson, setLockedNextLesson] = useState<GrammarPoint | null>(null);
  const [expandedMatchOptionIndex, setExpandedMatchOptionIndex] = useState<number | null>(null);
  const [sentenceReportOpen, setSentenceReportOpen] = useState(false);
  const [sentenceReportDraft, setSentenceReportDraft] = useState("");
  const [sentenceReportBusy, setSentenceReportBusy] = useState(false);
  const [sentenceReportStatus, setSentenceReportStatus] = useState<SentenceReportStatus | null>(
    null,
  );
  const [sentenceExplanationOpen, setSentenceExplanationOpen] = useState(false);
  const [sentenceExplanationLoading, setSentenceExplanationLoading] = useState(false);
  const [sentenceExplanationError, setSentenceExplanationError] = useState<string | null>(null);
  const [sentenceExplanation, setSentenceExplanation] = useState<string | null>(null);
  const sentenceReportInputRef = useRef<TextInput | null>(null);

  const checkAuth = useCallback(async () => {
    if (!(await canAccessApp())) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    let cancelled = false;

    async function loadPrefs() {
      try {
        const [roman, english, wordAudio] = await Promise.all([
          AsyncStorage.getItem(PREF_ROMANIZATION),
          AsyncStorage.getItem(PREF_ENGLISH),
          AsyncStorage.getItem(PREF_WORD_BREAKDOWN_TTS),
        ]);
        if (cancelled) return;
        if (roman !== null) setShowRoman(roman === "true");
        if (english !== null) setShowEnglish(english === "true");
        if (wordAudio !== null) setWordAudioEnabled(wordAudio === "true");
      } catch (error) {
        console.error("Failed to load mobile home display prefs:", error);
      }
    }

    void loadPrefs();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDisplaySetting = useCallback(
    async (target: "roman" | "english") => {
      const isRoman = target === "roman";
      const currentValue = isRoman ? showRoman : showEnglish;
      const nextValue = !currentValue;
      const key = isRoman ? PREF_ROMANIZATION : PREF_ENGLISH;

      if (isRoman) setShowRoman(nextValue);
      else setShowEnglish(nextValue);

      try {
        await AsyncStorage.setItem(key, String(nextValue));
      } catch (error) {
        console.error("Failed to save mobile home display prefs:", error);
        if (isRoman) setShowRoman(currentValue);
        else setShowEnglish(currentValue);
      }
    },
    [showEnglish, showRoman],
  );

  const toggleWordAudio = useCallback(async () => {
    const nextValue = !wordAudioEnabled;
    setWordAudioEnabled(nextValue);
    try {
      await AsyncStorage.setItem(PREF_WORD_BREAKDOWN_TTS, String(nextValue));
    } catch (error) {
      console.error("Failed to save mobile home word audio pref:", error);
      setWordAudioEnabled(!nextValue);
    }
  }, [wordAudioEnabled]);

  const loadProgress = useCallback(async () => {
    try {
      setProgress(await getAllProgress());
    } catch (error) {
      console.error("Failed to load mobile home progress:", error);
    }
  }, []);

  const loadReview = useCallback(async () => {
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
        return;
      }

      if (data?.done) {
        setReviewsDue(0);
        setReviewStatus("You're caught up");
        return;
      }

      const counts = data?.counts ?? {};
      const actionable =
        (counts.newCount ?? 0) +
        (counts.learningCount ?? 0) +
        (counts.reviewCount ?? 0);
      setReviewsDue(actionable);
      setReviewStatus(`${actionable} card${actionable !== 1 ? "s" : ""} ready`);
    } catch {
      setReviewsDue(0);
      setReviewStatus("Review unavailable");
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      if (await isGuestUser()) {
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
      if (!res.ok) throw new Error(`Profile load failed ${res.status}`);
      setProfile(await res.json());
    } catch (error) {
      console.error("Failed to load mobile home profile:", error);
      setProfile(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
      void loadReview();
      void loadProfile();
    }, [loadProfile, loadProgress, loadReview]),
  );

  const visibleGrammar = useMemo(
    () =>
      grammarPoints.filter(
        (point): point is GrammarPoint & { level: PublicCefrLevel } =>
          isPublicCefrLevel(point.level),
      ),
    [grammarPoints],
  );

  const accessibleGrammar = useMemo(
    () =>
      visibleGrammar.filter((point) =>
        isPremium ? true : !isPremiumGrammarPoint(point),
      ),
    [isPremium, visibleGrammar],
  );

  const practicedGrammar = useMemo(
    () => visibleGrammar.filter((point) => isGrammarPracticed(progress[point.id])),
    [progress, visibleGrammar],
  );

  const practiceMixCountsByLevel = useMemo(
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

  const filteredPracticeMixGrammar = useMemo(
    () =>
      selectedPracticeMixLevels.includes("All")
        ? practicedGrammar
        : practicedGrammar.filter((point) =>
            selectedPracticeMixLevels.includes(point.level as PublicCefrLevel),
          ),
    [practicedGrammar, selectedPracticeMixLevels],
  );

  const nextAccessibleLesson = useMemo(
    () =>
      accessibleGrammar.find((point) => !isGrammarPracticed(progress[point.id])) ?? null,
    [accessibleGrammar, progress],
  );

  const mini = useDashboardMiniExercise({
    grammarPoints: visibleGrammar,
    progress,
    isPremium,
  });
  const resetMiniToExplanation = mini.resetToExplanation;

  useFocusEffect(
    useCallback(() => {
      resetMiniToExplanation();
    }, [resetMiniToExplanation]),
  );

  const selectedLesson =
    mini.currentPoint ?? nextAccessibleLesson ?? accessibleGrammar[0] ?? null;
  const selectedLessonIndex = useMemo(
    () =>
      selectedLesson
        ? visibleGrammar.findIndex((point) => point.id === selectedLesson.id)
        : -1,
    [selectedLesson, visibleGrammar],
  );
  const previousLesson =
    selectedLessonIndex > 0 ? visibleGrammar[selectedLessonIndex - 1] ?? null : null;
  const nextLessonInSequence =
    selectedLessonIndex >= 0 && selectedLessonIndex < visibleGrammar.length - 1
      ? visibleGrammar[selectedLessonIndex + 1] ?? null
      : null;

  const currentStageMeta = selectedLesson ? GRAMMAR_STAGE_META[selectedLesson.stage] : null;
  const currentStagePoints = useMemo(
    () =>
      selectedLesson
        ? visibleGrammar.filter((point) => point.stage === selectedLesson.stage)
        : [],
    [selectedLesson, visibleGrammar],
  );
  const currentStagePracticed = useMemo(
    () => currentStagePoints.filter((point) => isGrammarPracticed(progress[point.id])).length,
    [currentStagePoints, progress],
  );
  const overallProgress = useMemo(
    () =>
      visibleGrammar.length > 0
        ? Math.round((practicedGrammar.length / visibleGrammar.length) * 100)
        : 0,
    [practicedGrammar.length, visibleGrammar.length],
  );
  const stageProgress = useMemo(
    () =>
      currentStagePoints.length > 0
        ? Math.round((currentStagePracticed / currentStagePoints.length) * 100)
        : 0,
    [currentStagePoints.length, currentStagePracticed],
  );
  const todayCount = useMemo(() => {
    const today = localDateKey(new Date());
    return visibleGrammar.filter((point) => {
      const last = progress[point.id]?.lastPracticed;
      return last ? localDateKey(new Date(last)) === today : false;
    }).length;
  }, [progress, visibleGrammar]);

  const stageRail = useMemo(() => {
    const counts = visibleGrammar.reduce(
      (acc, point) => {
        const current = acc[point.stage] ?? { practiced: 0, total: 0 };
        current.total += 1;
        if (isGrammarPracticed(progress[point.id])) current.practiced += 1;
        acc[point.stage] = current;
        return acc;
      },
      {} as Record<GrammarStage, { practiced: number; total: number }>,
    );

    return PUBLIC_GRAMMAR_STAGES.map((stage) => {
      const info = counts[stage] ?? { practiced: 0, total: 0 };
      const status =
        info.total > 0 && info.practiced >= info.total
          ? "complete"
          : stage === selectedLesson?.stage
            ? "current"
            : info.practiced > 0
              ? "visited"
              : "locked";
      return { id: stage, label: GRAMMAR_STAGE_META[stage].id, status };
    });
  }, [progress, selectedLesson?.stage, visibleGrammar]);

  const levelPickerOptions = useMemo(
    () =>
      PUBLIC_CEFR_LEVELS.map((level) => {
        const accessiblePoints = accessibleGrammar.filter((point) => point.level === level);
        const visiblePoints = visibleGrammar.filter((point) => point.level === level);
        const firstUnpracticedAccessible =
          accessiblePoints.find((point) => !isGrammarPracticed(progress[point.id])) ?? null;
        return {
          level,
          title: CEFR_LEVEL_META[level].homeTitle,
          locked: accessiblePoints.length === 0 && visiblePoints.length > 0,
          targetPoint:
            firstUnpracticedAccessible ?? accessiblePoints[0] ?? visiblePoints[0] ?? null,
        };
      }),
    [accessibleGrammar, progress, visibleGrammar],
  );

  const selectedWordIds = useMemo(
    () => new Set(mini.buildState.builtSentence.map((word) => word.id)),
    [mini.buildState.builtSentence],
  );

  const previewSentence = mini.previewSentence;
  const activeSentence = mini.activeSentence;
  const exerciseBusy = mini.exerciseLoading || mini.transitionPending;
  const canPlayExerciseAudio =
    mini.phase === "explanation" || mini.result === "correct" || mini.result === "revealed";
  const audioSentence =
    mini.phase === "explanation"
      ? previewSentence
      : canPlayExerciseAudio
        ? mini.currentMode === "matchThai" && mini.matchRevealed
          ? mini.matchOptions.find((option) => option.isCorrect) ?? activeSentence
          : activeSentence
        : null;
  const sentenceReportTarget =
    mini.phase === "explanation" ? previewSentence : activeSentence ?? previewSentence ?? null;
  const profileName = isGuest
    ? "Guest User"
    : getProfileDisplayName(profile) || "Keystone learner";
  const profileEmail = isGuest ? "Sign in to sync progress" : profile?.email || "No email available";
  const isNewUser = practicedGrammar.length === 0;
  const heroEyebrow = isNewUser ? "Welcome" : "Welcome back";
  const heroTitle = isNewUser ? "Welcome to Keystone Thai" : "Welcome back";
  const heroSubtitle = isNewUser
    ? "Start with your first lesson whenever you're ready."
    : "Pick up where you left off and keep practicing.";

  const showSolvedSentence =
    mini.phase === "exercise" &&
    (mini.result === "correct" || mini.result === "revealed") &&
    activeSentence;

  const buildSlotItems = useMemo<BuildSlotToneItem[]>(
    () => {
      let builtCursor = 0;

      return mini.buildState.prefilled.map((prefilledWord, index) => {
        if (prefilledWord !== null) {
          const breakdownItem = activeSentence?.breakdown[index];
          if (!breakdownItem) {
            return {
              thai: prefilledWord,
              builtWordId: null,
            };
          }

          return {
            thai: breakdownItem.thai,
            tone: breakdownItem.tone,
            tones: breakdownItem.tones,
            romanization: breakdownItem.romanization,
            roman: breakdownItem.roman,
            english: breakdownItem.english,
            displayThaiSegments: breakdownItem.displayThaiSegments,
            builtWordId: null,
          };
        }

        const builtWord = mini.buildState.builtSentence[builtCursor] ?? null;
        builtCursor += 1;

        if (!builtWord) {
          return {
            thai: "",
            builtWordId: null,
          };
        }

        return {
          thai: builtWord.thai,
          tones: builtWord.tones,
          roman: builtWord.roman,
          english: builtWord.english,
          displayThaiSegments: builtWord.displayThaiSegments,
          builtWordId: builtWord.id,
        };
      });
    },
    [activeSentence?.breakdown, mini.buildState.builtSentence, mini.buildState.prefilled],
  );

  const tools = useMemo(
    () => [
      { title: "Saved Bookmarks", detail: "Open saved grammar", icon: "bookmark-outline" as const, route: "/explore" },
      {
        title: "Practice Mix",
        detail:
          practicedGrammar.length > 0
            ? `${practicedGrammar.length} studied topics ready`
            : "Unlocks after your first lesson",
        icon: "shuffle-outline" as const,
        route: null,
      },
      { title: "Alphabet Trainer", detail: "Alphabet drills and recall", icon: "school-outline" as const, route: "/trainer/" },
      { title: "Alphabet", detail: "Consonants and sound groups", icon: "text-outline" as const, route: "/alphabet/" },
      { title: "Numbers", detail: "Counting and quantities", icon: "calculator-outline" as const, route: "/numbers/" },
    ],
    [practicedGrammar.length],
  );

  const handleRemoveBuildSlot = useCallback(
    (slotIndex: number) => {
      const slotItem = buildSlotItems[slotIndex];
      if (slotItem?.builtWordId != null) {
        mini.removeBuiltWord(slotItem.builtWordId);
      }
    },
    [buildSlotItems, mini],
  );

  const sentenceReportContextKey = useMemo(
    () =>
      [
        selectedLesson?.id ?? "",
        mini.phase,
        mini.currentMode,
        previewSentence?.thai ?? "",
        activeSentence?.thai ?? "",
        mini.matchOptions.map((option) => option.thai).join("|"),
      ].join("::"),
    [
      activeSentence?.thai,
      mini.currentMode,
      mini.matchOptions,
      mini.phase,
      previewSentence?.thai,
      selectedLesson?.id,
    ],
  );

  useEffect(() => {
    setSentenceReportOpen(false);
    setSentenceReportDraft("");
    setSentenceReportStatus(null);
  }, [sentenceReportContextKey]);

  const sentenceExplanationContextKey = useMemo(
    () =>
      [
        selectedLesson?.id ?? "",
        mini.currentMode,
        mini.result,
        activeSentence?.thai ?? "",
        mini.selectedOptionIndex ?? "none",
      ].join("::"),
    [
      activeSentence?.thai,
      mini.currentMode,
      mini.result,
      mini.selectedOptionIndex,
      selectedLesson?.id,
    ],
  );
  useEffect(() => {
    setSentenceExplanationOpen(false);
    setSentenceExplanationLoading(false);
    setSentenceExplanationError(null);
    setSentenceExplanation(null);
  }, [sentenceExplanationContextKey]);

  const matchOptionsKey = useMemo(
    () => mini.matchOptions.map((option) => option.thai).join("|"),
    [mini.matchOptions],
  );

  useEffect(() => {
    setExpandedMatchOptionIndex(null);
  }, [mini.phase, mini.currentMode, matchOptionsKey]);

  const toggleMatchOptionExpanded = useCallback((index: number) => {
    setExpandedMatchOptionIndex((current) => (current === index ? null : index));
  }, []);

  const openLesson = useCallback(
    async (point: GrammarPoint | null) => {
      if (!point) return;
      const route = `/practice/${point.id}`;
      if (!isPremium && isPremiumGrammarPoint(point)) {
        await ensurePremiumAccess("this lesson", route);
        return;
      }
      router.push(route as any);
    },
    [ensurePremiumAccess, isPremium, router],
  );

  const togglePracticeMixLevel = useCallback((level: PracticeMixFilterLevel) => {
    if (level === "All") {
      setSelectedPracticeMixLevels(["All"]);
      return;
    }

    setSelectedPracticeMixLevels((current) => {
      const withoutAll = current.filter(
        (value): value is PublicCefrLevel => value !== "All",
      );

      if (withoutAll.includes(level)) {
        const next = withoutAll.filter((value) => value !== level);
        return next.length > 0 ? next : ["All"];
      }

      return [...withoutAll, level];
    });
  }, []);

  const openPracticeMixChooser = useCallback(() => {
    if (practicedGrammar.length === 0) return;
    setSelectedPracticeMixLevels(["All"]);
    setShowPracticeMixModal(true);
  }, [practicedGrammar.length]);

  const startPracticeMix = useCallback(() => {
    if (filteredPracticeMixGrammar.length === 0) return;

    const shuffled = shuffleIds(filteredPracticeMixGrammar.map((point) => point.id));
    const practiceRoute = `/practice/${shuffled[0]}/exercises?mix=${shuffled.join(",")}&source=progress`;

    setShowPracticeMixModal(false);

    if (!isPremium && filteredPracticeMixGrammar.some((point) => isPremiumGrammarPoint(point))) {
      void ensurePremiumAccess("your studied Keystone Access lessons", practiceRoute);
      return;
    }

    router.push(practiceRoute as any);
  }, [ensurePremiumAccess, filteredPracticeMixGrammar, isPremium, router]);

  const handleLevelSelection = useCallback(
    async (option: LevelPickerOption) => {
      if (!option.targetPoint || exerciseBusy) return;
      setLevelPickerOpen(false);
      if (option.locked || (!isPremium && isPremiumGrammarPoint(option.targetPoint))) {
        await ensurePremiumAccess(`${option.level} grammar`, "/");
        return;
      }
      mini.selectGrammar(option.targetPoint.id);
    },
    [ensurePremiumAccess, exerciseBusy, isPremium, mini],
  );

  const handlePreviousNavigation = useCallback(async () => {
    if (!previousLesson || exerciseBusy) return;
    if (!isPremium && isPremiumGrammarPoint(previousLesson)) {
      await ensurePremiumAccess("continue learning", `/practice/${previousLesson.id}`);
      return;
    }
    mini.goToPreviousGrammar();
  }, [ensurePremiumAccess, exerciseBusy, isPremium, mini, previousLesson]);

  const handleNextNavigation = useCallback(async () => {
    if (!nextLessonInSequence || exerciseBusy) return;
    if (!isPremium && isPremiumGrammarPoint(nextLessonInSequence)) {
      setLockedNextLesson(nextLessonInSequence);
      return;
    }
    mini.goToNextGrammar();
  }, [exerciseBusy, isPremium, mini, nextLessonInSequence]);

  const handleLockedNextAccess = useCallback(async () => {
    if (!lockedNextLesson) return;
    const label = lockedNextLesson.title;
    const route = `/practice/${lockedNextLesson.id}`;
    setLockedNextLesson(null);

    if (await isGuestUser()) {
      const premiumParams = new URLSearchParams();
      premiumParams.set("label", label);
      premiumParams.set("redirectTo", route);

      const loginParams = new URLSearchParams();
      loginParams.set("redirectTo", `/premium?${premiumParams.toString()}`);

      router.push(`/login?${loginParams.toString()}` as any);
      return;
    }

    await ensurePremiumAccess(label, route);
  }, [ensurePremiumAccess, lockedNextLesson, router]);

  const openReview = useCallback(() => {
    if (isGuest) {
      router.push("/login?redirectTo=%2Freview" as any);
      return;
    }
    router.push("/review/" as any);
  }, [isGuest, router]);

  const playSentenceText = useCallback(
    async (text?: string | null) => {
      if (!text) return;
      await playSentence(text);
    },
    [playSentence],
  );

  const submitSentenceReport = useCallback(async () => {
    if (sentenceReportBusy) return;

    const message = sentenceReportDraft.trim();
    if (!message) {
      setSentenceReportStatus({ kind: "error", message: "Add a short note before sending." });
      return;
    }

    const token = await getAuthToken();
    if (!token || isGuest || !profile?.email) {
      setSentenceReportStatus({
        kind: "error",
        message: "Sign in to report sentence issues.",
      });
      return;
    }

    const contextLines = [
      "[Dashboard sentence report]",
      `Lesson: ${selectedLesson?.title ?? "Unknown"} (${selectedLesson?.id ?? "unknown"})`,
      `Stage: ${selectedLesson?.stage ?? "unknown"}`,
      `Phase: ${mini.phase}`,
      `Mode: ${mini.currentMode}`,
    ];

    if (sentenceReportTarget?.thai) contextLines.push(`Thai: ${sentenceReportTarget.thai}`);
    if (sentenceReportTarget?.romanization) {
      contextLines.push(`Romanization: ${sentenceReportTarget.romanization}`);
    }
    if (sentenceReportTarget?.english) {
      contextLines.push(`English: ${sentenceReportTarget.english}`);
    }

    try {
      setSentenceReportBusy(true);
      setSentenceReportStatus(null);

      const res = await fetch(`${API_BASE}/support/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: profile.email,
          message: `${message}\n\n${contextLines.join("\n")}`,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Failed to send report (${res.status})`);
      }

      setSentenceReportDraft("");
      setSentenceReportStatus({
        kind: "success",
        message:
          data?.deliveredByEmail === false
            ? "Thank you for your input. We are always trying to make our content better, and your note has been saved for review."
            : "Thank you for your input. We are always trying to make our content better, and this kind of report really helps us improve it.",
      });
    } catch (error) {
      setSentenceReportStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to send report.",
      });
    } finally {
      setSentenceReportBusy(false);
    }
  }, [
    isGuest,
    mini.currentMode,
    mini.phase,
    profile?.email,
    selectedLesson?.id,
    selectedLesson?.stage,
    selectedLesson?.title,
    sentenceReportBusy,
    sentenceReportDraft,
    sentenceReportTarget,
  ]);

  const requestSentenceExplanation = useCallback(async () => {
    if (sentenceExplanationLoading) return;

    setSentenceExplanationOpen(true);
    setSentenceExplanationLoading(true);
    setSentenceExplanationError(null);
    setSentenceExplanation(null);

    try {
      if (!selectedLesson) {
        throw new Error("No lesson is ready to explain yet.");
      }

      if (!activeSentence || mini.result !== "revealed") {
        throw new Error("Reveal an answer first, then ask for an explanation.");
      }
      const explanation = await getSentenceExplanation({
        grammar: {
          id: selectedLesson.id,
          title: selectedLesson.title,
          level: selectedLesson.level,
          stage: selectedLesson.stage,
          pattern: selectedLesson.pattern,
          explanation: selectedLesson.explanation,
          focus: selectedLesson.focus,
        },
        sentence: activeSentence,
      });

      setSentenceExplanation(explanation);
    } catch (error) {
      setSentenceExplanationError(
        error instanceof Error
          ? error.message
          : "We could not generate an explanation right now.",
      );
      setSentenceExplanation(null);
    } finally {
      setSentenceExplanationLoading(false);
    }
  }, [
    activeSentence,
    mini.result,
    selectedLesson,
    sentenceExplanationLoading,
  ]);

  const screenReady = mini.hydrated && Boolean(selectedLesson);

  if (!screenReady || !selectedLesson) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={BRAND.navy} />
          <Text style={styles.loadingScreenText}>Preparing your mobile dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        testID="keystone-mobile-page-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{heroEyebrow}</Text>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Review queue</Text>
          <Text style={styles.reviewCount}>{reviewsDue} cards</Text>
          <Text style={styles.bodyText}>{reviewStatus}</Text>
          <SurfaceButton
            label={isGuest ? "Log in to review" : "Open review"}
            onPress={openReview}
            variant="primary"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <DisplayToggle label="Romanization" active={showRoman} onPress={() => void toggleDisplaySetting("roman")} />
            <DisplayToggle label="Translation" active={showEnglish} onPress={() => void toggleDisplaySetting("english")} />
            <DisplayToggle label="Word Audio (Beta)" active={wordAudioEnabled} onPress={toggleWordAudio} />
          </View>

          <View style={styles.practiceHeaderRow}>
            <SettledPressable
              onPress={() => setLevelPickerOpen(true)}
              style={({ pressed }: any) => [styles.levelBadge, pressed ? styles.surfacePressed : null]}
            >
              <Text style={styles.levelBadgeText}>{selectedLesson.level}</Text>
            </SettledPressable>
            <View style={styles.grammarPointCard}>
              <View style={styles.grammarPointTopRow}>
                <Text style={styles.cardLabel}>Grammar point</Text>
              </View>
              <Text style={styles.grammarPattern}>{selectedLesson.pattern}</Text>
            </View>
          </View>

          <View style={styles.mobileNavRow}>
            <SurfaceButton
              label="Previous"
              icon="chevron-back-outline"
              size="compact"
              onPress={() => void handlePreviousNavigation()}
              disabled={!previousLesson || exerciseBusy}
              style={styles.navButton}
            />
            <SurfaceButton
              label="Next"
              icon="chevron-forward-outline"
              size="compact"
              onPress={() => void handleNextNavigation()}
              disabled={!nextLessonInSequence || exerciseBusy}
              style={styles.navButton}
            />
          </View>

          <View style={styles.infoStack}>
            <View style={styles.infoCard}>
              <Text style={styles.cardLabel}>Lesson title</Text>
              <Text style={styles.infoTitle}>{selectedLesson.title}</Text>
              <Text style={styles.bodyText}>{currentStageMeta?.title || selectedLesson.stage}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.cardLabel}>What it means</Text>
              <Text style={styles.infoTitle}>{selectedLesson.focus.meaning}</Text>
              <Text style={styles.bodyText}>{selectedLesson.explanation?.split("\n")[0] || ""}</Text>
            </View>
          </View>

          <View style={styles.toneGuideRow}>
            <View style={styles.toneGuideInlineRow}>
              <Text style={styles.toneGuideStandaloneLabel}>Tone guide</Text>
              <SettledPressable
                onPress={() => setToneGuideOpen((value) => !value)}
                style={({ pressed }: any) => [
                  styles.toneGuideTrigger,
                  Platform.OS === "web" ? WEB_UTILITY_BUTTON_STYLE : null,
                  pressed ? styles.secondaryButtonPressed : null,
                  pressed && Platform.OS === "web" ? WEB_UTILITY_BUTTON_PRESSED : null,
                ]}
              >
                <View style={styles.toneDots}>
                  {Object.keys(TONE).map((tone) => (
                    <View key={tone} style={[styles.toneDot, { backgroundColor: TONE[tone as keyof typeof TONE] }]} />
                  ))}
                </View>
              </SettledPressable>
            </View>
            {toneGuideOpen ? (
              <View style={styles.inlineToneGuidePopover}>
                {TONE_GUIDE_ITEMS.map(({ tone, label }) => (
                  <View key={label} style={styles.toneGuidePopoverRow}>
                    <View style={[styles.toneDot, styles.toneGuidePopoverDot, { backgroundColor: TONE[tone] }]} />
                    <Text style={styles.toneGuidePopoverText}>{label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.sentenceCard}>
            <View style={styles.sentenceHeaderRow}>
              <Text style={styles.cardLabel}>
                {mini.phase === "explanation"
                  ? "Example sentence"
                  : mini.currentMode === "wordScraps"
                    ? "Build the sentence"
                    : mini.result === "correct" || mini.result === "revealed"
                      ? "Solved sentence"
                      : "Which sentence means"}
              </Text>
              <View style={styles.sentenceHeaderActions}>
                <SettledPressable
                  onPress={() => setSentenceReportOpen(true)}
                  style={({ pressed }: any) => [
                    styles.iconButton,
                    Platform.OS === "web" ? WEB_UTILITY_BUTTON_STYLE : null,
                    pressed ? styles.secondaryButtonPressed : null,
                    pressed && Platform.OS === "web" ? WEB_UTILITY_BUTTON_PRESSED : null,
                  ]}
                >
                  <Text style={styles.reportButtonText}>!</Text>
                </SettledPressable>
                <SettledPressable
                  onPress={() => void playSentenceText(audioSentence?.thai)}
                  disabled={!audioSentence}
                  style={({ pressed }: any) => [
                    styles.iconButton,
                    Platform.OS === "web" ? WEB_UTILITY_BUTTON_STYLE : null,
                    !audioSentence ? styles.buttonDisabled : null,
                    pressed && audioSentence ? styles.secondaryButtonPressed : null,
                    pressed && audioSentence && Platform.OS === "web" ? WEB_UTILITY_BUTTON_PRESSED : null,
                  ]}
                >
                  <Ionicons name="volume-high-outline" size={18} color={BRAND.ink} />
                </SettledPressable>
              </View>
            </View>

            {mini.phase === "explanation" ? (
              <>
                {previewSentence ? (
                  <>
                    <BreakdownToneText breakdown={previewSentence.breakdown} style={styles.mainThaiText} />
                    {showRoman && previewSentence.romanization ? <Text style={styles.romanText}>{previewSentence.romanization}</Text> : null}
                    {showEnglish ? <Text style={styles.englishText}>{previewSentence.english}</Text> : null}
                  </>
                ) : (
                  <View style={styles.inlineLoading}><ActivityIndicator color={BRAND.navy} /></View>
                )}
              </>
            ) : mini.currentMode === "wordScraps" ? (
              showSolvedSentence ? (
                <>
                  <BreakdownToneText breakdown={showSolvedSentence.breakdown} style={styles.mainThaiText} />
                  {showRoman && showSolvedSentence.romanization ? <Text style={styles.romanText}>{showSolvedSentence.romanization}</Text> : null}
                  {showEnglish ? <Text style={styles.englishText}>{showSolvedSentence.english}</Text> : null}
                </>
              ) : (
                <>
                  <View style={styles.answerBoard}>
                    {buildSlotItems.map((slotItem, index) => {
                      const slot = slotItem?.thai || "";
                      const isFilled = Boolean(slot);
                      const isBuiltWord = slotItem?.builtWordId != null;

                        return (
                        <SettledPressable
                          key={`slot-${index}`}
                          onPress={() => isBuiltWord && handleRemoveBuildSlot(index)}
                        style={({ pressed }: any) => [
                          styles.answerChip,
                          isFilled ? styles.answerChipFilled : styles.answerChipEmpty,
                          pressed && isBuiltWord ? styles.secondaryButtonPressed : null,
                        ]}
                        >
                          {isFilled ? (
                            <View style={styles.answerChipContent}>
                              <ToneThaiText
                                thai={slot}
                                tones={getBreakdownTones(slotItem)}
                                romanization={slotItem?.romanization || slotItem?.roman}
                                displayThaiSegments={slotItem?.displayThaiSegments}
                                fallbackColor={BRAND.ink}
                                style={styles.answerChipText}
                              />
                              {showRoman && (slotItem?.romanization || slotItem?.roman) ? (
                                <Text style={styles.answerChipRoman}>
                                  {slotItem.romanization || slotItem.roman}
                                </Text>
                              ) : null}
                              {showEnglish && slotItem?.english ? (
                                <Text style={styles.answerChipEnglish}>
                                  {slotItem.english.toLowerCase()}
                                </Text>
                              ) : null}
                            </View>
                          ) : (
                            <Text style={[styles.answerChipText, styles.answerChipPlaceholderText]}>...</Text>
                          )}
                        </SettledPressable>
                      );
                    })}
                  </View>
                  <Text style={styles.cardLabel}>Translate into Thai</Text>
                  <Text style={styles.promptText}>{activeSentence?.english || "Loading prompt..."}</Text>
                  <Text style={styles.promptHint}>Tap the word cards below to build the answer.</Text>
                </>
              )
            ) : mini.matchRevealed && activeSentence ? (
              <>
                <BreakdownToneText
                  breakdown={(mini.matchOptions.find((option) => option.isCorrect) ?? activeSentence).breakdown}
                  style={styles.mainThaiText}
                />
                {showRoman && (mini.matchOptions.find((option) => option.isCorrect) ?? activeSentence).romanization ? <Text style={styles.romanText}>{(mini.matchOptions.find((option) => option.isCorrect) ?? activeSentence).romanization}</Text> : null}
                {showEnglish && activeSentence.english ? <Text style={styles.englishText}>{activeSentence.english}</Text> : null}
              </>
            ) : (
              <>
                <Text style={styles.promptText}>{activeSentence?.english || "Loading prompt..."}</Text>
                <Text style={styles.promptHint}>Choose the most appropriate sentence below.</Text>
              </>
            )}

            {mini.result === "wrong" ? (
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>Not quite</Text>
                <Text style={styles.feedbackText}>
                  {mini.currentMode === "wordScraps"
                    ? "Check the word order, show the answer, or skip to the next round."
                    : "Show the answer or skip to the next round."}
                </Text>
              </View>
            ) : null}

          </View>

          {mini.phase === "explanation" && previewSentence?.breakdown?.length ? (
            <View style={styles.wordBankWrap}>
              {previewSentence.breakdown.map((item, index) => (
                <SettledPressable
                  key={`${item.thai}-${index}`}
                  onPress={() => wordAudioEnabled && void playSentenceText(item.thai)}
                  style={({ pressed }: any) => [styles.wordCard, pressed && wordAudioEnabled ? styles.surfacePressed : null]}
                >
                  <ToneThaiText
                    thai={item.thai}
                    tones={getBreakdownTones(item)}
                    romanization={getItemRomanization(item)}
                    displayThaiSegments={item.displayThaiSegments}
                    style={styles.wordThai}
                    fallbackColor={BRAND.ink}
                  />
                  {showRoman ? <Text style={styles.wordRoman}>{getItemRomanization(item)}</Text> : null}
                  {showEnglish ? <Text style={styles.wordEnglish}>{item.english}</Text> : null}
                </SettledPressable>
              ))}
            </View>
          ) : null}

          {mini.phase === "exercise" && mini.currentMode === "wordScraps" ? (
            <View style={styles.wordBankWrap}>
              {mini.buildState.words.map((word) => (
                <SettledPressable
                  key={word.id}
                  onPress={() => {
                    if (wordAudioEnabled) void playSentenceText(word.thai);
                    mini.handleWordTap(word);
                  }}
                  disabled={selectedWordIds.has(word.id) || exerciseBusy}
                  style={({ pressed }: any) => [
                    styles.wordCard,
                    selectedWordIds.has(word.id) ? styles.wordCardDisabled : null,
                    pressed && !selectedWordIds.has(word.id) ? styles.surfacePressed : null,
                  ]}
                >
                  <ToneThaiText
                    thai={word.thai}
                    tones={getBreakdownTones(word)}
                    romanization={word.roman}
                    displayThaiSegments={word.displayThaiSegments}
                    style={styles.wordThai}
                    fallbackColor={BRAND.ink}
                  />
                  {showRoman ? <Text style={styles.wordRoman}>{word.roman}</Text> : null}
                  {showEnglish ? <Text style={styles.wordEnglish}>{word.english.toLowerCase()}</Text> : null}
                </SettledPressable>
              ))}
            </View>
          ) : null}

          {mini.phase === "exercise" && mini.currentMode === "matchThai" ? (
            <View style={styles.matchGrid}>
              {mini.matchOptions.map((option, index) => {
                const isSelected = mini.selectedOptionIndex === index;
                const isCorrect = mini.matchRevealed && option.isCorrect;
                const isWrong = mini.matchRevealed && isSelected && !option.isCorrect;
                const isExpanded = expandedMatchOptionIndex === index;
                return (
                  <View
                    key={`${option.thai}-${index}`}
                    style={[
                      styles.matchCard,
                      isCorrect ? styles.matchCardCorrect : null,
                      isWrong ? styles.matchCardWrong : null,
                    ]}
                  >
                    <View style={styles.matchCardTopRow}>
                      <SettledPressable
                        onPress={() => {
                          if (wordAudioEnabled) void playSentenceText(option.thai);
                          mini.selectMatchOption(index);
                        }}
                        disabled={mini.matchRevealed || exerciseBusy}
                        style={({ pressed }: any) => [
                          styles.matchCardSelectArea,
                          pressed && !mini.matchRevealed ? styles.surfacePressed : null,
                        ]}
                      >
                        <BreakdownToneText
                          breakdown={option.breakdown}
                          style={styles.matchThaiText}
                        />
                        {showRoman && option.romanization ? (
                          <Text style={styles.matchRoman}>{option.romanization}</Text>
                        ) : null}
                      </SettledPressable>
                      <View style={styles.matchOptionControls}>
                        <SettledPressable
                          onPress={() => toggleMatchOptionExpanded(index)}
                          style={({ pressed }: any) => [
                            styles.matchExpandButton,
                            isExpanded ? styles.matchExpandButtonActive : null,
                            pressed ? styles.secondaryButtonPressed : null,
                          ]}
                        >
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={isExpanded ? BRAND.ink : BRAND.muted}
                          />
                        </SettledPressable>
                      </View>
                    </View>
                    {isExpanded ? (
                      <View style={styles.matchDetailsPanel}>
                        <View style={styles.matchTileRow}>
                          {option.breakdown.map((word, wordIndex) => (
                            <SettledPressable
                              key={`${option.thai}-${wordIndex}-${word.thai}`}
                              onPress={() =>
                                wordAudioEnabled && void playSentenceText(word.thai)
                              }
                              style={({ pressed }: any) => [
                                styles.matchWordTile,
                                pressed && wordAudioEnabled ? styles.surfacePressed : null,
                              ]}
                            >
                              <View style={styles.matchWordTileHeader}>
                                <ToneThaiText
                                  thai={word.thai}
                                  tones={getBreakdownTones(word)}
                                  romanization={word.romanization || word.roman}
                                  displayThaiSegments={word.displayThaiSegments}
                                  style={styles.matchWordTileThai}
                                  fallbackColor={BRAND.ink}
                                />
                                <ToneDots
                                  tones={getBreakdownTones(word)}
                                  style={styles.matchWordToneDots}
                                />
                              </View>
                              {showRoman && (word.romanization || word.roman) ? (
                                <Text style={styles.matchWordTileRoman}>
                                  {word.romanization || word.roman}
                                </Text>
                              ) : null}
                              {showEnglish && word.english ? (
                                <Text style={styles.matchWordTileEnglish}>
                                  {word.english.toUpperCase()}
                                </Text>
                              ) : null}
                            </SettledPressable>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.practiceFooter}>
            {mini.phase === "explanation" ? (
              <SurfaceButton label="Start practice" onPress={mini.startMiniPractice} variant="primary" disabled={!mini.canStartMiniPractice || exerciseBusy} />
            ) : null}
            {mini.phase !== "explanation" && mini.result !== "correct" ? (
              <View style={styles.inlineActions}>
                {mini.result !== "revealed" ? (
                  <SurfaceButton
                    label="Show answer"
                    onPress={mini.currentMode === "wordScraps" ? mini.revealBuildAnswer : mini.revealMatchAnswer}
                    disabled={exerciseBusy}
                    style={mini.result === "" ? styles.inlineActionHalf : undefined}
                  />
                ) : null}
                {mini.result === "" ? (
                  <SurfaceButton
                    label="Skip"
                    onPress={mini.continueToNextRound}
                    disabled={exerciseBusy}
                    style={styles.inlineActionHalf}
                  />
                ) : null}
                {mini.result === "wrong" || mini.result === "revealed" ? (
                  mini.result === "revealed" ? (
                    <>
                      <SurfaceButton
                        label="Got it"
                        onPress={mini.continueToNextRound}
                        variant="primary"
                        disabled={exerciseBusy}
                        style={styles.inlineActionHalf}
                      />
                      <SurfaceButton
                        label={sentenceExplanationLoading ? "Explaining..." : "Explain"}
                        onPress={() => void requestSentenceExplanation()}
                        disabled={exerciseBusy || sentenceExplanationLoading}
                        style={styles.inlineActionHalf}
                      />
                    </>
                  ) : (
                    <SurfaceButton
                      label="Skip"
                      onPress={mini.continueToNextRound}
                      variant="primary"
                      disabled={exerciseBusy}
                    />
                  )
                ) : null}
              </View>
            ) : null}
            <SurfaceButton label="Full lesson" onPress={() => void openLesson(selectedLesson)} disabled={exerciseBusy} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarBadge}><Ionicons name="person-outline" size={20} color={BRAND.ink} /></View>
            <View style={styles.profileCopy}>
              <Text numberOfLines={1} style={styles.profileName}>{profileName}</Text>
              <Text numberOfLines={1} style={styles.profileEmail}>{profileEmail}</Text>
            </View>
            <View style={[styles.statusTag, Platform.OS === "web" ? WEB_STATUS_TAG_STYLE : null]}>
              <Text style={styles.statusTagText}>{isPremium ? "Keystone Access" : "Standard"}</Text>
            </View>
          </View>

          <View style={styles.accountStatsRow}>
            <View style={styles.accountStat}><Text style={styles.accountStatValue}>{todayCount}</Text><Text style={styles.accountStatLabel}>New today</Text></View>
            <View style={styles.accountStatDivider} />
            <View style={styles.accountStat}><Text style={styles.accountStatValue}>{practicedGrammar.length}</Text><Text style={styles.accountStatLabel}>Practiced</Text></View>
            <View style={styles.accountStatDivider} />
            <View style={styles.accountStat}><Text style={styles.accountStatValue}>{selectedLesson.stage}</Text><Text style={styles.accountStatLabel}>Stage</Text></View>
          </View>

          <View style={styles.actionStack}>
            <SurfaceButton label="Profile" icon="person-outline" onPress={() => router.push("/profile" as any)} />
            <SurfaceButton label="Settings" icon="settings-outline" onPress={() => router.push("/settings" as any)} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Course progress</Text>
          <Text style={styles.bodyText}>See where you are in the course at a glance.</Text>
          <Text style={styles.bigPercent}>{overallProgress}%</Text>
          <Text style={styles.bodyText}>complete so far</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${overallProgress}%` }]} /></View>

          <View style={styles.metricCard}><Text style={styles.cardLabel}>Current path</Text><Text style={styles.metricTitle}>{currentStageMeta?.shortTitle || "Path"}</Text></View>
          <View style={styles.metricCard}><Text style={styles.cardLabel}>Stage progress</Text><Text style={styles.metricTitle}>{stageProgress}% - {currentStagePracticed}/{currentStagePoints.length}</Text></View>
          <View style={styles.metricCard}><Text style={styles.cardLabel}>Studied grammar</Text><Text style={styles.metricTitle}>{practicedGrammar.length} topics</Text></View>

          <ProgressDots stageRail={stageRail} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Study tools</Text>
          <Text style={styles.bodyText}>Use these tools whenever you want extra practice.</Text>
          <View style={styles.tileGrid}>
            {tools.map((tool) => {
              const isPracticeMixTile = tool.title === "Practice Mix";
              const isDisabled = isPracticeMixTile && practicedGrammar.length === 0;

              return (
                <SettledPressable
                  key={tool.title}
                  disabled={isDisabled}
                  onPress={() => {
                    if (isPracticeMixTile) {
                      openPracticeMixChooser();
                      return;
                    }
                    if (tool.route) router.push(tool.route as any);
                  }}
                  style={({ pressed }: any) => [
                    styles.tileCard,
                    isDisabled ? styles.tileCardDisabled : null,
                    pressed && !isDisabled ? styles.surfacePressed : null,
                  ]}
                >
                  <View style={styles.tileIconWrap}>
                    {tool.title === "Alphabet" ? (
                      <Text style={styles.tileThaiGlyph}>ก</Text>
                    ) : (
                      <Ionicons name={tool.icon} size={18} color={BRAND.ink} />
                    )}
                  </View>
                  <View style={styles.tileCopy}>
                    <Text style={styles.tileTitle}>{tool.title}</Text>
                    <Text style={styles.tileDetail}>{tool.detail}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={18}
                    color={isDisabled ? BRAND.muted : BRAND.ink}
                  />
                </SettledPressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPracticeMixModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPracticeMixModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowPracticeMixModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalEyebrow}>Practice mix</Text>
                <Text style={styles.modalTitle}>Choose what to practice</Text>
                <Text style={styles.modalBody}>
                  Pick which studied grammar topics to include.
                </Text>
              </View>
              <SettledPressable
                onPress={() => setShowPracticeMixModal(false)}
                style={({ pressed }: any) => [
                  styles.iconButton,
                  Platform.OS === "web" ? WEB_UTILITY_BUTTON_STYLE : null,
                  pressed ? styles.secondaryButtonPressed : null,
                  pressed && Platform.OS === "web" ? WEB_UTILITY_BUTTON_PRESSED : null,
                ]}
              >
                <Ionicons name="close" size={18} color={BRAND.ink} />
              </SettledPressable>
            </View>

            <View style={styles.filterGrid}>
              {(["All", ...PUBLIC_CEFR_LEVELS] as PracticeMixFilterLevel[]).map((level) => {
                const count =
                  level === "All" ? practicedGrammar.length : practiceMixCountsByLevel[level];
                const selected = selectedPracticeMixLevels.includes(level);
                const disabled = count === 0;

                return (
                  <SettledPressable
                    key={level}
                    disabled={disabled}
                    onPress={() => togglePracticeMixLevel(level)}
                    style={({ pressed }: any) => [
                      styles.filterCard,
                      selected ? styles.filterCardSelected : null,
                      disabled ? styles.filterCardDisabled : null,
                      pressed && !disabled ? styles.surfacePressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterLabel,
                        selected ? styles.filterLabelSelected : null,
                      ]}
                    >
                      {level}
                    </Text>
                    <Text
                      style={[
                        styles.filterCount,
                        selected ? styles.filterLabelSelected : null,
                      ]}
                    >
                      {count}
                    </Text>
                  </SettledPressable>
                );
              })}
            </View>

            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryEyebrow}>Selected set</Text>
              <Text style={styles.modalSummaryText}>
                {filteredPracticeMixGrammar.length} studied topic
                {filteredPracticeMixGrammar.length === 1 ? "" : "s"}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <SurfaceButton
                label="Cancel"
                onPress={() => setShowPracticeMixModal(false)}
                style={styles.modalHalf}
              />
              <SurfaceButton
                label="Start mix"
                variant="primary"
                disabled={filteredPracticeMixGrammar.length === 0}
                onPress={startPracticeMix}
                style={styles.modalHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(lockedNextLesson)}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedNextLesson(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLockedNextLesson(null)}
        >
          <Pressable style={[styles.modalCard, styles.accessPromptCard]} onPress={() => {}}>
            <Text style={[styles.modalTitle, styles.accessPromptTitle]}>
              Get Keystone Access to continue learning
            </Text>
            <Text style={[styles.modalBody, styles.accessPromptBody]}>
              The next grammar point, {lockedNextLesson?.title ?? "this lesson"}, is part of
              Keystone Access.
            </Text>
            <View style={styles.accessPromptActions}>
              <SurfaceButton
                label="Get Keystone Access"
                variant="primary"
                onPress={() => void handleLockedNextAccess()}
                style={styles.accessPromptPrimary}
              />
              <SurfaceButton
                label="Not now"
                onPress={() => setLockedNextLesson(null)}
                style={styles.accessPromptSecondary}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={levelPickerOpen} transparent animationType="fade" onRequestClose={() => setLevelPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLevelPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalEyebrow}>Grammar level</Text>
            <Text style={styles.modalTitle}>Choose a level</Text>
            <View style={styles.levelPickerList}>
              {levelPickerOptions.map((option) => (
                <SettledPressable
                  key={option.level}
                  onPress={() => void handleLevelSelection(option)}
                  style={({ pressed }: any) => [styles.levelOption, pressed ? styles.surfacePressed : null]}
                >
                  <View style={styles.levelOptionCopy}>
                    <Text style={styles.levelOptionLabel}>{option.level}</Text>
                    <Text style={styles.levelOptionTitle}>{option.title}</Text>
                  </View>
                  {option.locked ? <Text style={styles.levelLocked}>Locked</Text> : null}
                </SettledPressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={sentenceReportOpen} transparent animationType="fade" onRequestClose={() => setSentenceReportOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSentenceReportOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalEyebrow}>Support</Text>
            <Text style={styles.modalTitle}>Report sentence issue</Text>
            {sentenceReportStatus?.kind === "success" ? (
              <>
                <Text style={styles.modalBody}>{sentenceReportStatus.message}</Text>
                <SurfaceButton label="Close" onPress={() => setSentenceReportOpen(false)} />
              </>
            ) : (
              <>
                <TextInput
                  ref={sentenceReportInputRef}
                  value={sentenceReportDraft}
                  onChangeText={setSentenceReportDraft}
                  placeholder="Example: Tone color is wrong, audio doesn't match, or translation is unnatural."
                  placeholderTextColor={BRAND.muted}
                  multiline
                  style={styles.reportInput}
                />
                {sentenceReportStatus?.kind === "error" ? <Text style={styles.reportErrorText}>{sentenceReportStatus.message}</Text> : null}
                <View style={styles.modalActions}>
                  <SurfaceButton label="Cancel" onPress={() => setSentenceReportOpen(false)} style={styles.modalHalf} />
                  <SurfaceButton label={sentenceReportBusy ? "Sending..." : "Send"} onPress={() => void submitSentenceReport()} variant="primary" disabled={sentenceReportBusy} style={styles.modalHalf} />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <SentenceExplanationModal
        visible={sentenceExplanationOpen}
        loading={sentenceExplanationLoading}
        error={sentenceExplanationError}
        explanation={sentenceExplanation}
        onClose={() => setSentenceExplanationOpen(false)}
      />
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
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingScreenText: {
    color: BRAND.inkSoft,
    fontSize: 16,
  },
  hero: {
    gap: 8,
    paddingTop: 4,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    color: BRAND.ink,
  },
  heroSubtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 14,
    ...CARD_SHADOW,
  },
  sectionEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  reviewCount: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
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
  buttonCompact: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  primaryButton: {
    backgroundColor: BRAND.navy,
    borderColor: BRAND.navy,
    ...(Platform.OS === "web" ? null : NAVY_BUTTON_SHADOW),
  },
  secondaryButton: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.line,
    ...(Platform.OS === "web" ? null : LIGHT_BUTTON_SHADOW),
  },
  primaryButtonPressed: {
    ...(Platform.OS === "web" ? null : NAVY_BUTTON_PRESSED),
  },
  secondaryButtonPressed: {
    ...(Platform.OS === "web" ? null : LIGHT_BUTTON_PRESSED),
  },
  surfacePressed: {
    ...SURFACE_PRESSED,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  buttonLabelCompact: {
    fontSize: 15,
    lineHeight: 18,
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
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toggleChip: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...(Platform.OS === "web" ? null : LIGHT_BUTTON_SHADOW),
  },
  toggleChipLabel: {
    color: BRAND.ink,
    fontWeight: "700",
    fontSize: 14,
  },
  toggleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.paper,
  },
  toggleIndicatorActive: {
    backgroundColor: BRAND.navy,
    borderColor: BRAND.navy,
  },
  practiceHeaderRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },
  levelBadge: {
    width: 72,
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
    ...SURFACE_SHADOW,
  },
  levelBadgeText: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    color: BRAND.ink,
  },
  grammarPointCard: {
    flex: 1,
    backgroundColor: BRAND.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  grammarPointTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mobileNavRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  navButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  grammarPattern: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  cardLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  infoStack: {
    gap: 10,
  },
  infoCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  infoTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  toneGuideRow: {
    alignItems: "flex-end",
    position: "relative",
    zIndex: 20,
  },
  toneGuideInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toneGuideStandaloneLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  toneGuideTrigger: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? null : LIGHT_BUTTON_SHADOW),
  },
  toneDots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  toneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inlineToneGuidePopover: {
    position: "absolute",
    top: 52,
    right: 0,
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    ...CARD_SHADOW,
    zIndex: 30,
    elevation: 8,
  },
  toneGuidePopoverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toneGuidePopoverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(16, 42, 67, 0.08)",
  },
  toneGuidePopoverText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: BRAND.ink,
  },
  sentenceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 14,
    ...SURFACE_SHADOW,
  },
  sentenceHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sentenceHeaderActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? null : LIGHT_BUTTON_SHADOW),
  },
  reportButtonText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
  },
  mainThaiText: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
  },
  romanText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: BRAND.ink,
  },
  englishText: {
    fontSize: 18,
    lineHeight: 26,
    color: BRAND.ink,
  },
  inlineLoading: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  answerBoard: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  answerChip: {
    minWidth: 62,
    minHeight: 52,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F6F6",
    borderWidth: 1,
    borderColor: BRAND.line,
    ...SURFACE_SHADOW,
  },
  answerChipFilled: {},
  answerChipEmpty: {
    backgroundColor: BRAND.paper,
  },
  answerChipContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  answerChipText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
    textAlign: "center",
  },
  answerChipRoman: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
    color: BRAND.ink,
    textAlign: "center",
  },
  answerChipEnglish: {
    fontSize: 12,
    lineHeight: 15,
    color: BRAND.inkSoft,
    textAlign: "center",
  },
  answerChipPlaceholderText: {
    color: BRAND.muted,
  },
  promptText: {
    fontSize: 18,
    lineHeight: 26,
    color: BRAND.ink,
    fontWeight: "700",
  },
  promptHint: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  feedbackCard: {
    backgroundColor: BRAND.wrongBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 12,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  feedbackTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: BRAND.ink,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inlineActionHalf: {
    flex: 1,
  },
  inlineActionFull: {
    width: "100%",
  },
  wordBankWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  wordCard: {
    minWidth: 96,
    maxWidth: "48%",
    flexGrow: 1,
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  wordCardDisabled: {
    opacity: 0.42,
  },
  wordThai: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  wordRoman: {
    fontSize: 15,
    lineHeight: 20,
    color: BRAND.ink,
    fontWeight: "600",
  },
  wordEnglish: {
    fontSize: 14,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  matchGrid: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  matchCardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  matchCardSelectArea: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  matchOptionControls: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
  matchExpandButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
    ...SURFACE_SHADOW,
  },
  matchExpandButtonActive: {
    borderColor: BRAND.inkSoft,
    backgroundColor: BRAND.panel,
  },
  matchDetailsPanel: {
    paddingTop: 10,
  },
  matchTileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  matchCardCorrect: {
    borderColor: BRAND.navy,
    borderWidth: 2,
    backgroundColor: BRAND.paper,
  },
  matchCardWrong: {
    backgroundColor: BRAND.wrongBg,
  },
  matchThaiText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
  },
  matchRoman: {
    fontSize: 16,
    lineHeight: 22,
    color: BRAND.ink,
  },
  matchWordTile: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    alignSelf: "flex-start",
    minWidth: 86,
    ...SURFACE_SHADOW,
  },
  matchWordTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  matchWordTileThai: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.ink,
    flexShrink: 1,
  },
  matchWordToneDots: {
    alignSelf: "center",
  },
  matchWordTileRoman: {
    fontSize: 9,
    fontWeight: "500",
    color: BRAND.muted,
    opacity: 0.9,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  matchWordTileEnglish: {
    fontSize: 8,
    fontWeight: "600",
    color: BRAND.inkSoft,
    opacity: 0.9,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  practiceFooter: {
    gap: 10,
    marginTop: 6,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  avatarBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
    ...SURFACE_SHADOW,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  profileEmail: {
    fontSize: 15,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  statusTag: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? null : LIGHT_BUTTON_SHADOW),
    flexShrink: 0,
  },
  statusTagText: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontWeight: "600",
  },
  accountStatsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: BRAND.panel,
    ...SURFACE_SHADOW,
  },
  accountStat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 4,
  },
  accountStatDivider: {
    width: 1,
    backgroundColor: BRAND.line,
  },
  accountStatValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
  },
  accountStatLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  actionStack: {
    gap: 10,
  },
  bigPercent: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: "800",
    color: BRAND.ink,
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
  metricCard: {
    backgroundColor: BRAND.panel,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    padding: 14,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  metricTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: BRAND.ink,
    fontWeight: "700",
  },
  stageRailWrap: {
    gap: 8,
  },
  stageRailBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E6EAF0",
  },
  stageRailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stageDotItem: {
    alignItems: "center",
    gap: 6,
    width: 28,
  },
  stageDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  stageDotComplete: {
    backgroundColor: BRAND.navy,
    borderColor: BRAND.navy,
  },
  stageDotCurrent: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.navy,
  },
  stageDotVisited: {
    backgroundColor: "#C7D2E1",
    borderColor: "#C7D2E1",
  },
  stageDotLocked: {
    backgroundColor: BRAND.paper,
    borderColor: "#D5DCE5",
  },
  stageDotLabel: {
    fontSize: 10,
    lineHeight: 12,
    color: BRAND.inkSoft,
    textAlign: "center",
  },
  tileGrid: {
    gap: 10,
  },
  tileCard: {
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...SURFACE_SHADOW,
  },
  tileCardDisabled: {
    opacity: 0.45,
  },
  tileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  tileThaiGlyph: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  tileCopy: {
    flex: 1,
    gap: 2,
  },
  tileTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
  },
  tileDetail: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 14,
    ...CARD_SHADOW,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalHeaderCopy: {
    flex: 1,
    gap: 6,
  },
  modalEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  modalTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
  },
  modalBody: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterCard: {
    width: "31%",
    minWidth: "31%",
    backgroundColor: BRAND.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  filterCardSelected: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.navy,
  },
  filterCardDisabled: {
    opacity: 0.45,
  },
  filterLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
  },
  filterCount: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  filterLabelSelected: {
    color: BRAND.navy,
  },
  modalSummary: {
    gap: 4,
  },
  modalSummaryEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  modalSummaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.ink,
    fontWeight: "700",
  },
  accessPromptCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  accessPromptTitle: {
    textAlign: "center",
    fontSize: 20,
    lineHeight: 26,
  },
  accessPromptBody: {
    textAlign: "center",
  },
  accessPromptActions: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
  },
  accessPromptPrimary: {
    flex: 1.4,
  },
  accessPromptSecondary: {
    flex: 1,
  },
  levelPickerList: {
    gap: 10,
  },
  levelOption: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    ...SURFACE_SHADOW,
  },
  levelOptionCopy: {
    gap: 4,
    flex: 1,
  },
  levelOptionLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: BRAND.inkSoft,
  },
  levelOptionTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
  },
  levelLocked: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.muted,
    fontWeight: "600",
  },
  reportInput: {
    minHeight: 130,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    padding: 14,
    color: BRAND.ink,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: "top",
    ...SURFACE_SHADOW,
  },
  reportErrorText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#A16207",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalHalf: {
    flex: 1,
  },
  explanationModalCard: {
    maxHeight: "88%",
  },
  explanationAttribution: {
    marginTop: -4,
    marginBottom: 2,
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.muted,
    fontWeight: "700",
  },
  explanationLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  explanationScroll: {
    maxHeight: 470,
  },
  explanationContent: {
    gap: 12,
    paddingBottom: 2,
  },
  explanationSection: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 14,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  explanationSectionTitle: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "800",
  },
  explanationSectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  explanationPlainText: {
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.ink,
  },
  explanationMeaningText: {
    fontSize: 18,
    lineHeight: 25,
    color: BRAND.ink,
    fontWeight: "800",
  },
  explanationSentenceRomanization: {
    fontSize: 14,
    lineHeight: 19,
    color: BRAND.inkSoft,
    fontWeight: "700",
  },
  explanationWordList: {
    gap: 8,
  },
  explanationWordCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 12,
    gap: 3,
    ...SURFACE_SHADOW,
  },
  explanationWordThai: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
  },
  explanationWordRoman: {
    fontSize: 14,
    lineHeight: 19,
    color: BRAND.inkSoft,
    fontWeight: "700",
  },
  explanationWordBody: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.body,
  },
  explanationNotesList: {
    gap: 8,
  },
  explanationNoteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  explanationNoteBullet: {
    fontSize: 16,
    lineHeight: 22,
    color: BRAND.ink,
    fontWeight: "800",
  },
  explanationNoteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.body,
  },
});
