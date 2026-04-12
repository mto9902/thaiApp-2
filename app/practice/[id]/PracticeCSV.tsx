import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isGuestUser } from "../../../src/utils/auth";

import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header, { SettingsState } from "../../../src/components/Header";
import PremiumGateCard from "../../../src/components/PremiumGateCard";
import ToneDots from "../../../src/components/ToneDots";
import ToneThaiText from "../../../src/components/ToneThaiText";
import SentenceExplanationModal from "@/src/components/mobile/SentenceExplanationModal";

import { Sketch, sketchShadow } from "@/constants/theme";
import { AppRadius, AppSketch } from "@/constants/theme-app";
import { DESKTOP_PAGE_WIDTH } from "@/src/components/web/desktopLayout";
import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import {
  WEB_BODY_FONT,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_TONE,
  WEB_THAI_FONT,
} from "@/src/components/web/designSystem";
import {
  LIGHT_BUTTON_PRESSED,
  SettledPressable,
} from "@/src/screens/mobile/dashboardSurface";
import { getSentenceExplanation } from "@/src/api/getSentenceExplanation";
import { submitSupportRequest } from "@/src/api/submitSupportRequest";
import { getPractice } from "../../../src/api/getPractice";
import { API_BASE } from "../../../src/config";
import { useGrammarCatalog } from "../../../src/grammar/GrammarCatalogProvider";
import { useAdjacentGrammarPoint } from "../../../src/grammar/useAdjacentGrammarPoint";
import { useSentenceAudio } from "../../../src/hooks/useSentenceAudio";
import { isPremiumGrammarPoint } from "../../../src/subscription/premium";
import { usePremiumAccess } from "../../../src/subscription/usePremiumAccess";
import { useSubscription } from "../../../src/subscription/SubscriptionProvider";
import { getAllProgress, saveRound } from "../../../src/utils/grammarProgress";
import {
  DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  getGrammarExerciseSettings,
  GRAMMAR_EXERCISE_LABELS,
  GrammarExerciseMode,
  GrammarExerciseSettings,
  setGrammarExerciseSettings,
} from "../../../src/utils/grammarExerciseSettings";
import {
  getBreakdownTones,
} from "../../../src/utils/breakdownTones";
import { getPracticeWordTrackingEnabled } from "../../../src/utils/practiceWordPreference";
import {
  MUTED_FEEDBACK_ACCENTS,
} from "../../../src/utils/toneAccent";
import { getAuthToken } from "../../../src/utils/authStorage";

// ── Constants ──────────────────────────────────────────────────────────────────
const EXERCISE_FEEDBACK_COLORS = {
  correct: {
    tint: "#F3F6FA",
    border: AppSketch.primaryDark,
    text: Sketch.accentDark,
    subtext: Sketch.accent,
  },
  incorrect: {
    tint: Sketch.paper,
    border: "#D8DCDf",
    text: Sketch.inkMuted,
    subtext: Sketch.inkLight,
  },
  revealed: {
    tint: "#F5F7FA",
    border: AppSketch.primaryDark,
    text: Sketch.accentDark,
    subtext: Sketch.accentLight,
  },
} as const;

const CONTROL_PANEL_ACCENT = {
  border: "#5A6470",
  fill: "#3F4B58",
} as const;

const TONE_GUIDE_ITEMS = [
  { tone: "mid", label: "mid" },
  { tone: "low", label: "low" },
  { tone: "falling", label: "falling" },
  { tone: "high", label: "high" },
  { tone: "rising", label: "rising" },
] as const;

type Mode = GrammarExerciseMode;
const ALL_MODES: Mode[] = ["breakdown", "wordScraps", "matchThai"];

function getAvailableModes(enabledModes?: Record<Mode, boolean>): Mode[] {
  const availableModes = enabledModes
    ? ALL_MODES.filter((mode) => enabledModes[mode])
    : ALL_MODES;
  return availableModes.length > 0 ? availableModes : ALL_MODES;
}

function randomFromPool(pool: Mode[]): Mode {
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomMode(
  enabledModes?: Record<Mode, boolean>,
  recentModes: Mode[] = [],
): Mode {
  const pool = getAvailableModes(enabledModes);
  if (pool.length <= 1) return pool[0];

  const lastMode = recentModes[recentModes.length - 1];
  const previousMode = recentModes[recentModes.length - 2];

  if (lastMode && previousMode && lastMode === previousMode) {
    const cappedPool = pool.filter((mode) => mode !== lastMode);
    if (cappedPool.length > 0) {
      return randomFromPool(cappedPool);
    }
  }

  return randomFromPool(pool);
}

const MODE_META: Record<Mode, { tag: string; title: string }> = {
  breakdown: { tag: "STUDY", title: "Study the pattern" },
  wordScraps: { tag: "BUILD", title: "Build the sentence" },
  matchThai: { tag: "MATCH", title: "Choose the best sentence" },
};

function getPracticeHeaderTitle(grammarPoint: {
  title?: string;
  focus?: { particle?: string };
  pattern?: string;
} | null) {
  const focusParticle = grammarPoint?.focus?.particle?.trim();
  if (focusParticle && focusParticle.length <= 32) {
    return focusParticle;
  }

  const pattern = grammarPoint?.pattern?.trim();
  if (pattern && pattern.length <= 32) {
    return pattern;
  }

  return grammarPoint?.title || "Practice";
}

function ToneGuideInlineTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const handlePointerDown = (event: MouseEvent) => {
      const shellNode = shellRef.current as
        | { contains?: (target: EventTarget | null) => boolean }
        | null;
      if (shellNode?.contains?.(event.target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <View ref={shellRef} style={st.toneGuideInlineTriggerRow}>
      <SettledPressable
        onPress={() => setIsOpen((value) => !value)}
        style={({ hovered, pressed }: { hovered: boolean; pressed: boolean }) => [
          st.toneGuideButton,
          (hovered || pressed) && st.toneGuideButtonPressed,
        ]}
      >
        <View style={st.toneGuideDots}>
          {TONE_GUIDE_ITEMS.map(({ tone, label }) => (
            <View
              key={label}
              style={[st.toneGuideDot, { backgroundColor: WEB_TONE[tone] }]}
            />
          ))}
        </View>
      </SettledPressable>
      {isOpen ? (
        <View style={st.toneGuidePopover}>
          {TONE_GUIDE_ITEMS.map(({ tone, label }) => (
            <View key={label} style={st.toneGuideRow}>
              <View
                style={[
                  st.toneGuideDot,
                  st.toneGuidePopoverDot,
                  { backgroundColor: WEB_TONE[tone] },
                ]}
              />
              <Text style={st.toneGuidePopoverText}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function getInteractiveStateStyle(
  variant: "light" | "navy",
  hovered: boolean,
  pressed: boolean,
  disabled?: boolean,
) {
  if (Platform.OS !== "web" || disabled || (!hovered && !pressed)) return null;
  return [
    st.webInteractivePressed,
    variant === "navy"
      ? st.webNavyInteractivePressed
      : st.webLightInteractivePressed,
  ];
}

const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";

interface SentenceData {
  thai: string;
  romanization: string;
  english: string;
  breakdown: {
    thai: string;
    english: string;
    tone?: string;
    tones?: string[];
    displayThaiSegments?: string[];
    grammar?: boolean;
    romanization?: string;
    roman?: string;
  }[];
}

interface MatchOption {
  thai: string;
  romanization: string;
  breakdown: SentenceData["breakdown"];
  isCorrect: boolean;
}

type SentenceReportStatus = {
  kind: "success" | "error";
  message: string;
};

type ResultState = "" | "correct" | "wrong" | "revealed";

type StudyExample = SentenceData & {
  romanTokens: string[];
};

type BuilderWord = {
  id: number;
  breakdownIndex: number;
  thai: string;
  english: string;
  roman: string;
  tones: ReturnType<typeof getBreakdownTones>;
  displayThaiSegments?: string[];
  rotation: number;
};

type ToneDisplayItem = {
  thai: string;
  tone?: unknown;
  tones?: unknown;
  romanization?: string;
  roman?: string;
  displayThaiSegments?: string[] | null;
};

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
          fallbackColor={Sketch.ink}
        />
      ))}
    </Text>
  );
}

function buildMatchOptions(
  correct: SentenceData,
  distractors: SentenceData[],
): MatchOption[] {
  const seenThai = new Set<string>([correct.thai]);
  const picked: SentenceData[] = [];

  distractors.forEach((candidate) => {
    if (!candidate.thai || seenThai.has(candidate.thai) || picked.length >= 3) return;
    seenThai.add(candidate.thai);
    picked.push(candidate);
  });

  const fallbackDistractors = distractors.filter(
    (candidate) => candidate.thai && candidate.thai !== correct.thai,
  );

  // Keep the UI at 4 options even if the backend repeats a distractor.
  while (picked.length < 3 && fallbackDistractors.length > 0) {
    picked.push(fallbackDistractors[picked.length % fallbackDistractors.length]);
  }

  const options: MatchOption[] = [
    {
      thai: correct.thai,
      romanization: correct.romanization,
      breakdown: correct.breakdown,
      isCorrect: true,
    },
    ...picked.map((d) => ({
      thai: d.thai,
      romanization: d.romanization,
      breakdown: d.breakdown,
      isCorrect: false,
    })),
  ];
  return options.sort(() => Math.random() - 0.5);
}

const MAX_FREE_TILES = 4;
const STUDY_EXAMPLE_COUNT = 3;
const MATCH_DISTRACTOR_COUNT = 3;
const MATCH_DISTRACTOR_FETCH_ATTEMPTS = MATCH_DISTRACTOR_COUNT * 4;

function computePrefill(
  breakdown: SentenceData["breakdown"],
): (string | null)[] {
  const total = breakdown.length;
  if (total <= MAX_FREE_TILES) return breakdown.map(() => null);
  const numToPrefill = total - MAX_FREE_TILES;
  const eligible = breakdown.map((_, i) => i);
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const prefillIndices = new Set(shuffled.slice(0, numToPrefill));
  return breakdown.map((w, i) => (prefillIndices.has(i) ? w.thai : null));
}

function getBreakdownRomanizations(
  romanization: string,
  breakdown: { romanization?: string; roman?: string }[],
): string[] {
  const tokens = romanization.split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return breakdown.map((item) => item.romanization || item.roman || "");
  }

  const hasExplicitRomanization = breakdown.some(
    (item) => item.romanization || item.roman,
  );

  if (!hasExplicitRomanization && tokens.length === breakdown.length) {
    return breakdown.map((_, index) => tokens[index] ?? "");
  }

  if (!hasExplicitRomanization) {
    return breakdown.map(() => "");
  }

  return breakdown.map(
    (item) => item.romanization || item.roman || "",
  );
}

function toStudyExample(data: SentenceData): StudyExample {
  return {
    ...data,
    romanTokens: getBreakdownRomanizations(data.romanization, data.breakdown),
  };
}

function flattenStudyExampleWords(examples: StudyExample[]) {
  return examples.flatMap((example) =>
    example.breakdown.map((word, index) => ({
      ...word,
      romanization:
        example.romanTokens[index] || word.romanization || word.roman || "",
    })),
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function GrammarExercisesScreen() {
  const { id, mix, source } = useLocalSearchParams<{
    id: string;
    mix?: string;
    source?: string;
  }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const { previous, next } = useAdjacentGrammarPoint(
    typeof id === "string" ? id : null,
  );
  const { playSentence } = useSentenceAudio();
  const { ensurePremiumAccess } = usePremiumAccess();
  const isDesktopWeb = Platform.OS === "web" && width >= 1100;
  const mixSource = Array.isArray(source) ? source[0] : source;
  const hasMixSource = typeof mix === "string" && mix.length > 0;
  const mixParam = typeof mix === "string" ? mix : "";
  const currentPracticeRoute = hasMixSource
    ? `/practice/${id}/exercises?mix=${mixParam}${mixSource ? `&source=${mixSource}` : ""}`
    : `/practice/${id}/exercises`;
  const singleLessonId =
    !hasMixSource && typeof id === "string" && id.length > 0 ? id : null;
  const exerciseBackHref = hasMixSource
    ? mixSource === "bookmarks"
      ? "/explore"
      : mixSource === "progress"
        ? "/"
        : typeof id === "string" && id.length > 0
          ? `/practice/${id}`
          : "/practice/topics"
    : typeof id === "string" && id.length > 0
      ? `/practice/${id}`
      : "/practice/topics";

  const roundRef = useRef(0);
  const mixIdsRef = useRef<string[]>([]);
  const mixIndexRef = useRef(0);
  const currentGrammarIdRef = useRef<string | null>(null);
  const modeHistoryRef = useRef<Mode[]>([]);
  const sentenceReportInputRef = useRef<TextInput | null>(null);
  const enabledModesRef = useRef<GrammarExerciseSettings>(
    DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  );

  const [sentence, setSentence] = useState("");
  const [translation, setTranslation] = useState("");
  const [grammarPoint, setGrammarPoint] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<SentenceData["breakdown"]>([]);
  const [romanTokens, setRomanTokens] = useState<string[]>([]);
  const [studyExamples, setStudyExamples] = useState<StudyExample[]>([]);
  const [selectedStudyIndex, setSelectedStudyIndex] = useState(0);

  const [words, setWords] = useState<BuilderWord[]>([]);
  const [builtSentence, setBuiltSentence] = useState<BuilderWord[]>([]);
  const [prefilled, setPrefilled] = useState<(string | null)[]>([]);

  const [matchOptions, setMatchOptions] = useState<MatchOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [matchRevealed, setMatchRevealed] = useState(false);
  const [expandedMatchOption, setExpandedMatchOption] = useState<number | null>(
    null,
  );

  const [mode, setMode] = useState<Mode>("breakdown");
  const [settingsReady, setSettingsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>("");
  const [enabledModes, setEnabledModes] = useState<GrammarExerciseSettings>(
    DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  );
  const [methodsGuardMessage, setMethodsGuardMessage] = useState<string | null>(
    null,
  );

  const [showRoman, setShowRoman] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [wordBreakdownTTS, setWordBreakdownTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const [autoAddPracticeVocab, setAutoAddPracticeVocab] = useState(true);
  const [sentenceReportOpen, setSentenceReportOpen] = useState(false);
  const [sentenceReportDraft, setSentenceReportDraft] = useState("");
  const [sentenceReportBusy, setSentenceReportBusy] = useState(false);
  const [sentenceReportStatus, setSentenceReportStatus] =
    useState<SentenceReportStatus | null>(null);
  const [sentenceReportTarget, setSentenceReportTarget] =
    useState<SentenceData | null>(null);
  const [sentenceExplanationOpen, setSentenceExplanationOpen] = useState(false);
  const [sentenceExplanationLoading, setSentenceExplanationLoading] = useState(false);
  const [sentenceExplanationError, setSentenceExplanationError] = useState<string | null>(null);
  const [sentenceExplanation, setSentenceExplanation] = useState<string | null>(null);
  const [premiumBlocked, setPremiumBlocked] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [lifetimeRounds, setLifetimeRounds] = useState(0);
  const [sessionRounds, setSessionRounds] = useState(0);
  const { isPremium, loading: premiumLoading } = useSubscription();
  const canPlayBreakdownTiles = isDesktopWeb || wordBreakdownTTS;
  const BreakdownTilePressable = isDesktopWeb ? Pressable : SettledPressable;
  const selectedStudyExample =
    mode === "breakdown"
      ? studyExamples[selectedStudyIndex] || studyExamples[0] || null
      : null;
  const activeBreakdown = selectedStudyExample?.breakdown || breakdown;
  const activeRomanTokens = selectedStudyExample?.romanTokens || romanTokens;
  const activeSentenceReportTarget: SentenceData | null =
    mode === "breakdown"
      ? selectedStudyExample
      : sentence
        ? {
            thai: sentence,
            romanization: romanTokens.join(" ").trim(),
            english: translation,
            breakdown,
          }
        : null;
  const activeSentenceExplanationTarget: SentenceData | null =
    activeSentenceReportTarget;
  const sentenceReportSent = sentenceReportStatus?.kind === "success";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const showSingleLessonUtilities = Boolean(singleLessonId);
  const fadeIn = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    setSentenceReportOpen(false);
    setSentenceReportDraft("");
    setSentenceReportStatus(null);
    setSentenceReportTarget(null);
  }, [grammarPoint?.id, mode, sentence, translation, selectedStudyIndex]);

  useEffect(() => {
    setSentenceExplanationOpen(false);
    setSentenceExplanationLoading(false);
    setSentenceExplanationError(null);
    setSentenceExplanation(null);
  }, [
    grammarPoint?.id,
    mode,
    result,
    matchRevealed,
    activeSentenceExplanationTarget?.english,
    activeSentenceExplanationTarget?.romanization,
    activeSentenceExplanationTarget?.thai,
  ]);

  useEffect(() => {
    if (!sentenceReportOpen) return;
    const timeout = setTimeout(() => {
      sentenceReportInputRef.current?.focus?.();
    }, 40);
    return () => clearTimeout(timeout);
  }, [sentenceReportOpen]);

  const openSentenceReport = useCallback((target: SentenceData | null) => {
    setSentenceReportTarget(target);
    setSentenceReportDraft("");
    setSentenceReportStatus(null);
    setSentenceReportOpen(true);
  }, []);

  const requestSentenceExplanation = useCallback(async () => {
    if (sentenceExplanationLoading) return;

    setSentenceExplanationOpen(true);
    setSentenceExplanationLoading(true);
    setSentenceExplanationError(null);
    setSentenceExplanation(null);

    try {
      if (!grammarPoint) {
        throw new Error("No lesson is ready to explain yet.");
      }

      const explanationReady =
        mode === "wordScraps"
          ? result === "revealed"
          : mode === "matchThai"
            ? matchRevealed && (result === "wrong" || result === "revealed")
            : mode === "breakdown";

      if (!explanationReady || !activeSentenceExplanationTarget) {
        throw new Error(
          mode === "breakdown"
            ? "Pick a study example first, then ask for an explanation."
            : "Reveal an answer first, then ask for an explanation.",
        );
      }

      const explanation = await getSentenceExplanation({
        grammar: {
          id: grammarPoint.id,
          title: grammarPoint.title,
          level: grammarPoint.level,
          stage: grammarPoint.stage,
          pattern: grammarPoint.pattern,
          explanation: grammarPoint.explanation,
          focus: grammarPoint.focus,
        },
        sentence: activeSentenceExplanationTarget,
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
    activeSentenceExplanationTarget,
    grammarPoint,
    matchRevealed,
    mode,
    result,
    sentenceExplanationLoading,
  ]);

  const submitSentenceReport = useCallback(async () => {
    if (sentenceReportBusy) return;

    const message = sentenceReportDraft.trim();
    if (!message) {
      setSentenceReportStatus({
        kind: "error",
        message: "Add a short note before sending.",
      });
      return;
    }

    const contextLines = [
      "[Practice exercise sentence report]",
      `Lesson: ${grammarPoint?.title ?? "Unknown"} (${grammarPoint?.id ?? "unknown"})`,
      `Stage: ${grammarPoint?.stage ?? "unknown"}`,
      `Mode: ${mode}`,
    ];

    if (sentenceReportTarget?.thai) {
      contextLines.push(`Thai: ${sentenceReportTarget.thai}`);
    }
    if (sentenceReportTarget?.romanization) {
      contextLines.push(`Romanization: ${sentenceReportTarget.romanization}`);
    }
    if (sentenceReportTarget?.english) {
      contextLines.push(`English: ${sentenceReportTarget.english}`);
    }
    if (sentenceReportTarget?.breakdown?.length) {
      contextLines.push(
        `Breakdown: ${sentenceReportTarget.breakdown
          .map((item) => `${item.thai}=${item.english}`)
          .join(" | ")}`,
      );
    }
    if (mode === "matchThai" && matchOptions.length) {
      contextLines.push("Match options:");
      matchOptions.forEach((option, index) => {
        contextLines.push(`${index + 1}. ${option.thai}${option.isCorrect ? " [correct]" : ""}`);
      });
    }

    try {
      setSentenceReportBusy(true);
      setSentenceReportStatus(null);

      const data = await submitSupportRequest({
        message: [message, ...contextLines].join("\n\n"),
      });

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
        message:
          error instanceof Error ? error.message : "Failed to send report.",
      });
    } finally {
      setSentenceReportBusy(false);
    }
  }, [
    grammarPoint?.id,
    grammarPoint?.stage,
    grammarPoint?.title,
    matchOptions,
    mode,
    sentenceReportBusy,
    sentenceReportDraft,
    sentenceReportTarget,
  ]);

  function renderSentenceReportTrigger(target?: SentenceData | null) {
    return (
      <Pressable
        onPress={() => openSentenceReport(target ?? activeSentenceReportTarget)}
        style={({ hovered, pressed }) => [
          st.sentenceReportAlertButton,
          getInteractiveStateStyle("light", hovered, pressed),
        ]}
      >
        <Text style={st.sentenceReportAlertText}>!</Text>
      </Pressable>
    );
  }

  const openExerciseTopic = useCallback(
    async (point: (typeof grammarPoints)[number] | null | undefined) => {
      if (!point) return;
      const route = `/practice/${point.id}/exercises`;
      if (!isPremium && isPremiumGrammarPoint(point)) {
        await ensurePremiumAccess("this lesson", route);
        return;
      }
      router.push(route as any);
    },
    [ensurePremiumAccess, isPremium, router],
  );

  useEffect(() => {
    (async () => {
      const [roman, english, tts, practiceVocab, grammarExerciseModes] =
        await Promise.all([
        AsyncStorage.getItem(PREF_ROMANIZATION),
        AsyncStorage.getItem(PREF_ENGLISH),
        AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
        getPracticeWordTrackingEnabled(),
        getGrammarExerciseSettings(),
      ]);
      if (roman !== null) setShowRoman(roman === "true");
      if (english !== null) setShowEnglish(english === "true");
      if (tts !== null) setAutoplayTTS(tts === "true");
      setAutoAddPracticeVocab(practiceVocab);
      enabledModesRef.current = grammarExerciseModes;
      setEnabledModes(grammarExerciseModes);
      setSettingsReady(true);
    })();
  }, []);

  const handleSettingsChange = useCallback((s: SettingsState) => {
    setShowRoman(s.showRoman);
    setShowEnglish(s.showEnglish);
    setAutoplayTTS(s.autoplayTTS);
    setWordBreakdownTTS(s.wordBreakdownTTS);
    setTtsSpeed(s.ttsSpeed);
    setAutoAddPracticeVocab(s.autoAddPracticeVocab);
    enabledModesRef.current = s.grammarExerciseModes;
    setEnabledModes(s.grammarExerciseModes);
    setMethodsGuardMessage(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setSessionRounds(0);

    if (!singleLessonId) {
      setLifetimeRounds(0);
      return () => {
        cancelled = true;
      };
    }

    void getAllProgress()
      .then((progressMap) => {
        if (!cancelled) {
          setLifetimeRounds(progressMap[singleLessonId]?.rounds ?? 0);
        }
      })
      .catch((error) => {
        console.error("Failed to load lesson practice count:", error);
        if (!cancelled) {
          setLifetimeRounds(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [singleLessonId]);

  async function togglePracticeMethod(targetMode: Mode) {
    const currentModes = enabledModesRef.current;
    const enabledCount = getAvailableModes(currentModes).length;
    const turningOffCurrentMode = currentModes[targetMode] && mode === targetMode;

    if (currentModes[targetMode] && enabledCount === 1) {
      setMethodsGuardMessage("Turn on another method before turning this one off.");
      return;
    }

    const nextModes = {
      ...currentModes,
      [targetMode]: !currentModes[targetMode],
    };

    enabledModesRef.current = nextModes;
    setEnabledModes(nextModes);
    setMethodsGuardMessage(null);

    try {
      const savedModes = await setGrammarExerciseSettings(nextModes);
      enabledModesRef.current = savedModes;
      setEnabledModes(savedModes);

      if (turningOffCurrentMode && !savedModes[targetMode]) {
        const nextMode = randomMode(savedModes, modeHistoryRef.current);
        if (nextMode !== mode || !savedModes[mode]) {
          void fetchRound(nextMode);
        }
      }
    } catch (error) {
      console.error("Failed to update practice methods:", error);
      enabledModesRef.current = currentModes;
      setEnabledModes(currentModes);
      setMethodsGuardMessage("Couldn't update your practice methods.");
    }
  }

  const getRandomGrammar = useCallback(() => {
    return grammarPoints[Math.floor(Math.random() * grammarPoints.length)];
  }, [grammarPoints]);

  const findGrammarById = useCallback((gid: string) => {
    return grammarPoints.find((g) => g.id === gid);
  }, [grammarPoints]);

  const getCurrentMixGrammarId = useCallback((): string | null => {
    if (mixIdsRef.current.length === 0) return null;
    return mixIdsRef.current[mixIndexRef.current % mixIdsRef.current.length] ?? null;
  }, []);

  const grammarObject = useCallback(() => {
    if (mixIdsRef.current.length > 0) {
      const currentId = getCurrentMixGrammarId();
      return currentId ? findGrammarById(currentId) ?? null : null;
    }
    return typeof id === "string"
      ? findGrammarById(id) || getRandomGrammar()
      : getRandomGrammar();
  }, [findGrammarById, getCurrentMixGrammarId, getRandomGrammar, id]);

  const fetchSentence = useCallback(async (gid: string): Promise<SentenceData> => {
    const res = await getPractice(gid);
    return {
      thai: res?.thai || "",
      romanization: res?.romanization || "",
      english: res?.english || "",
      breakdown: res?.breakdown || [],
    };
  }, []);

  const fetchStudyExamples = useCallback(async (
    gid: string,
    seed?: SentenceData,
  ): Promise<StudyExample[]> => {
    const examples: StudyExample[] = [];
    const seenThai = new Set<string>();

    const addExample = (candidate: SentenceData | null | undefined) => {
      if (!candidate?.thai || seenThai.has(candidate.thai)) return;
      seenThai.add(candidate.thai);
      examples.push(toStudyExample(candidate));
    };

    if (seed) addExample(seed);

    let attempts = 0;
    const maxAttempts = STUDY_EXAMPLE_COUNT * 4;

    while (examples.length < STUDY_EXAMPLE_COUNT && attempts < maxAttempts) {
      addExample(await fetchSentence(gid));
      attempts += 1;
    }

    const baseExamples = [...examples];
    while (examples.length < STUDY_EXAMPLE_COUNT && baseExamples.length > 0) {
      examples.push(baseExamples[examples.length % baseExamples.length]);
    }

    if (examples.length === 0 && seed) {
      examples.push(toStudyExample(seed));
    }

    return examples.slice(0, STUDY_EXAMPLE_COUNT);
  }, [fetchSentence]);

  const fetchMatchDistractors = useCallback(async (
    gid: string,
    correct: SentenceData,
  ): Promise<SentenceData[]> => {
    const distractors: SentenceData[] = [];
    const seenThai = new Set<string>([correct.thai]);

    const addDistractor = (candidate: SentenceData | null | undefined) => {
      if (!candidate?.thai || seenThai.has(candidate.thai)) return;
      seenThai.add(candidate.thai);
      distractors.push(candidate);
    };

    let attempts = 0;
    while (
      distractors.length < MATCH_DISTRACTOR_COUNT &&
      attempts < MATCH_DISTRACTOR_FETCH_ATTEMPTS
    ) {
      addDistractor(await fetchSentence(gid));
      attempts += 1;
    }

    const baseDistractors = [...distractors];
    while (
      distractors.length < MATCH_DISTRACTOR_COUNT &&
      baseDistractors.length > 0
    ) {
      distractors.push(
        baseDistractors[distractors.length % baseDistractors.length],
      );
    }

    return distractors.slice(0, MATCH_DISTRACTOR_COUNT);
  }, [fetchSentence]);

  const trackWords = useCallback(async (
    wordsToTrack: SentenceData["breakdown"],
    trigger: string,
    romanTokensForWords?: string[],
  ) => {
    if (!autoAddPracticeVocab) return;

    const guest = await isGuestUser();
    if (guest) return;
    try {
      const enriched = wordsToTrack.map((w, i) => ({
        ...w,
        romanization:
          romanTokensForWords?.[i] || w.romanization || w.roman || "",
      }));
      await fetch(`${API_BASE}/track-words`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ words: enriched }),
      });
    } catch (err) {
      console.error("[SRS] trackWords failed:", err);
    }
  }, [autoAddPracticeVocab]);

  function getCurrentGrammarId(): string | null {
    return currentGrammarIdRef.current;
  }

  const recordRound = useCallback((wasCorrect: boolean) => {
    const grammarId = getCurrentGrammarId();
    if (!grammarId) return;
    void saveRound(grammarId, wasCorrect);
    if (singleLessonId && grammarId === singleLessonId) {
      setLifetimeRounds((current) => current + 1);
      setSessionRounds((current) => current + 1);
    }
  }, [singleLessonId]);

  function openCurrentGrammarLesson() {
    const grammarId = getCurrentGrammarId();
    if (!grammarId) return;
    router.push(`/practice/${grammarId}` as any);
  }

  function shuffleNotSame(items: any[], correct: any[]) {
    let s;
    do {
      s = [...items].sort(() => Math.random() - 0.5);
    } while (
      s.length > 1 &&
      JSON.stringify(s.map((w) => w.thai)) ===
        JSON.stringify(correct.map((w) => w.thai))
    );
    return s;
  }

  const fetchRound = useCallback(async (nextMode: Mode) => {
    const round = ++roundRef.current;
    try {
      setLoading(true);
      setLoadError(null);
      setMethodsGuardMessage(null);
      setResult("");
      setBuiltSentence([]);
      setPrefilled([]);
      setWords([]);
      setSelectedOption(null);
      setMatchRevealed(false);
      setExpandedMatchOption(null);

      let gobj: any = null;
      let main: SentenceData | null = null;
      let attempts = 0;
      const maxAttempts = Math.max(1, mixIdsRef.current.length || 1);

      while (attempts < maxAttempts && !main) {
        const candidateGrammar = grammarObject();
        const candidateId = candidateGrammar?.id ?? getCurrentMixGrammarId();

        if (!candidateId) {
          break;
        }

        try {
          const fetchedSentence = await fetchSentence(candidateId);
          gobj = candidateGrammar ?? findGrammarById(candidateId) ?? null;
          main = fetchedSentence;

          if (mixIdsRef.current.length > 0) {
            mixIndexRef.current++;
          }
        } catch (err) {
          console.error(
            `[Round ${round}] skipping unavailable mix grammar "${candidateId}":`,
            err,
          );

          if (mixIdsRef.current.length > 0) {
            mixIdsRef.current = mixIdsRef.current.filter(
              (grammarId) => grammarId !== candidateId,
            );
            mixIndexRef.current =
              mixIdsRef.current.length > 0
                ? mixIndexRef.current % mixIdsRef.current.length
                : 0;
            attempts += 1;
            continue;
          }

          throw err;
        }
      }

      if (!gobj || !main) {
        setMethodsGuardMessage(
          mixSource === "progress"
            ? "Some studied grammar topics are not practice-ready yet, so this mix cannot continue."
            : mixSource === "bookmarks"
              ? "Some saved lessons are not practice-ready yet, so this mix cannot continue."
              : "This lesson does not have practice-ready sentences yet.",
        );
        return;
      }

      currentGrammarIdRef.current = gobj.id;
      setGrammarPoint(gobj);

      if (nextMode === "breakdown") {
        const examples = await fetchStudyExamples(gobj.id, main);
        const firstExample = examples[0] || toStudyExample(main);

        setStudyExamples(examples);
        setSelectedStudyIndex(0);
        setSentence(firstExample.thai);
        setTranslation(firstExample.english);
        setBreakdown(firstExample.breakdown);
        setRomanTokens(firstExample.romanTokens);
        setPrefilled([]);
        setWords([]);
        setBuiltSentence([]);
        setMatchOptions([]);
      } else {
        setStudyExamples([]);
        setSelectedStudyIndex(0);
        setSentence(main.thai);
        setTranslation(main.english);
        setBreakdown(main.breakdown);

        const perWordRoman = getBreakdownRomanizations(
          main.romanization,
          main.breakdown,
        );
        setRomanTokens(perWordRoman);

        const slots = computePrefill(main.breakdown);
        setPrefilled(slots);

        const freeIndices: number[] = [];
        slots.forEach((s, i) => {
          if (s === null) freeIndices.push(i);
        });

        const formatted: BuilderWord[] = freeIndices.map((i, wordIndex) => {
          const w = main.breakdown[i];
          return {
            id: wordIndex,
            breakdownIndex: i,
            thai: w.thai,
            english: w.english.toUpperCase(),
            roman: perWordRoman[i] ?? "",
            tones: getBreakdownTones(w),
            displayThaiSegments: w.displayThaiSegments,
            rotation: Math.random() * 6 - 3,
          };
        });

        setWords(shuffleNotSame(formatted, formatted));
        setBuiltSentence([]);
      }

      if (nextMode === "matchThai") {
        const extras = await fetchMatchDistractors(gobj.id, main);
        setMatchOptions(buildMatchOptions(main, extras));
      }

      setMode(nextMode);
      modeHistoryRef.current = [...modeHistoryRef.current.slice(-1), nextMode];
      fadeIn();
    } catch (err) {
      console.error(`[Round ${round}] fetchRound FAILED:`, err);
      setLoadError(
        err instanceof Error
          ? err.message
          : "We couldn't generate practice right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    fadeIn,
    fetchSentence,
    fetchMatchDistractors,
    fetchStudyExamples,
    findGrammarById,
    getCurrentMixGrammarId,
    grammarObject,
    mixSource,
  ]);

  const continueToNextRound = useCallback(() => {
    void fetchRound(randomMode(enabledModesRef.current, modeHistoryRef.current));
  }, [fetchRound]);

  useEffect(() => {
    if (!settingsReady || premiumLoading) return;

    const requestedGrammar =
      typeof id === "string" ? findGrammarById(id) ?? null : null;
    const requestedMixIds =
      typeof mix === "string" ? mix.split(",").filter(Boolean) : [];

    if (requestedMixIds.length > 0) {
      if (
        !isPremium &&
        requestedMixIds.some((grammarId) =>
          isPremiumGrammarPoint(findGrammarById(grammarId)),
        )
      ) {
        mixIdsRef.current = [];
        mixIndexRef.current = 0;
        currentGrammarIdRef.current = requestedGrammar?.id ?? null;
        setGrammarPoint(requestedGrammar);
        setPremiumBlocked({
          title:
            mixSource === "progress"
              ? "This study mix needs Keystone Access"
              : "These bookmarks need Keystone Access",
          body:
            "This practice set includes Thai lessons beyond the free starting path. Unlock Keystone Access to keep practicing every lesson after the first 6 lessons.",
        });
        return;
      }

      mixIdsRef.current = requestedMixIds;
      mixIndexRef.current = 0;
    } else {
      mixIdsRef.current = [];
      mixIndexRef.current = 0;

      if (
        requestedGrammar &&
        !isPremium &&
        isPremiumGrammarPoint(requestedGrammar)
      ) {
        currentGrammarIdRef.current = requestedGrammar.id;
        setGrammarPoint(requestedGrammar);
        setPremiumBlocked({
          title: "This lesson is in Keystone Access",
          body:
            "Unlock Keystone Access to keep practicing Thai lessons beyond the first 6 lessons, with mixed practice and unlimited bookmarks.",
        });
        return;
      }
    }

    setPremiumBlocked(null);
    modeHistoryRef.current = [];
    void fetchRound(randomMode(enabledModesRef.current, modeHistoryRef.current));
  }, [
    fetchRound,
    findGrammarById,
    id,
    isPremium,
    mix,
    mixSource,
    premiumLoading,
    settingsReady,
  ]);

  function handleWordTap(word: BuilderWord) {
    if (result === "revealed") return;
    setResult("");
    setBuiltSentence((previous) => {
      if (previous.some((item) => item.id === word.id)) {
        return previous;
      }
      return [...previous, word];
    });
  }
  function undoLastWord() {
    if (result === "revealed") return;
    setResult("");
    setBuiltSentence((p) => p.slice(0, -1));
  }
  function resetSentence() {
    if (result === "revealed") return;
    setResult("");
    setBuiltSentence([]);
  }
  function removeBuiltWord(wordId: number) {
    if (result === "revealed") return;
    setResult("");
    setBuiltSentence((previous) =>
      previous.filter((item) => item.id !== wordId),
    );
  }

  const evaluateWordScraps = useCallback(() => {
    if (result !== "") return;
    const fullSentence: string[] = [];
    let userIdx = 0;
    for (let i = 0; i < prefilled.length; i++) {
      if (prefilled[i] !== null) {
        fullSentence.push(prefilled[i]!);
      } else if (userIdx < builtSentence.length) {
        fullSentence.push(builtSentence[userIdx].thai);
        userIdx++;
      }
    }
    const correct = breakdown.map((w) => w.thai);
    const ok = JSON.stringify(correct) === JSON.stringify(fullSentence);
    setResult(ok ? "correct" : "wrong");
    recordRound(ok);
    if (ok) {
      trackWords(breakdown, "wordScraps-correct", romanTokens);
      if (autoplayTTS) {
        void playSentence(sentence, {
          onDone: continueToNextRound,
          speed: ttsSpeed,
        });
      } else {
        setTimeout(continueToNextRound, 1200);
      }
    }
  }, [
    autoplayTTS,
    breakdown,
    builtSentence,
    continueToNextRound,
    playSentence,
    prefilled,
    recordRound,
    result,
    romanTokens,
    sentence,
    trackWords,
    ttsSpeed,
  ]);

  function revealWordScrapsAnswer() {
    if (result === "correct" || result === "revealed") return;
    const orderedWords = [...words].sort(
      (left, right) => left.breakdownIndex - right.breakdownIndex,
    );
    setBuiltSentence(orderedWords);
    setResult("revealed");
  }

  function selectOption(idx: number) {
    if (matchRevealed) return;
    setSelectedOption(idx);
    setMatchRevealed(true);
    const opt = matchOptions[idx];
    const ok = opt.isCorrect;
    setResult(ok ? "correct" : "wrong");
    recordRound(ok);
    if (autoplayTTS) {
      void playSentence(opt.thai, {
        onDone: ok
          ? continueToNextRound
          : undefined,
        speed: ttsSpeed,
      });
    }
    if (ok) {
      trackWords(breakdown, "matchThai-correct", romanTokens);
      if (!autoplayTTS) {
        setTimeout(continueToNextRound, 1400);
      }
    }
  }

  function revealMatchAnswer() {
    if (matchRevealed) return;
    setSelectedOption(null);
    setMatchRevealed(true);
    setExpandedMatchOption(null);
    setResult("revealed");
  }

  function toggleMatchOptionExpanded(idx: number) {
    setExpandedMatchOption((current) => (current === idx ? null : idx));
  }

  const playBreakdownWord = (text: string) => {
    void playSentence(text, { speed: ttsSpeed });
  };

  const meta = MODE_META[mode];
  const currentModeDisabled = !enabledModes[mode];
  const methodsNote = methodsGuardMessage
    ? methodsGuardMessage
    : currentModeDisabled
      ? `${GRAMMAR_EXERCISE_LABELS[mode]} will finish this round, then turn off.`
      : null;
  const selectedWordIds = new Set(builtSentence.map((selected) => selected.id));
  const freeBuilderSlotCount = useMemo(
    () => prefilled.reduce((count, slot) => count + (slot === null ? 1 : 0), 0),
    [prefilled],
  );
  const showLessonShortcut =
    (mixSource === "bookmarks" || mixSource === "progress") && Boolean(grammarPoint?.id);
  const resultPalette =
    result === "correct"
      ? EXERCISE_FEEDBACK_COLORS.correct
      : result === "revealed"
        ? EXERCISE_FEEDBACK_COLORS.revealed
        : EXERCISE_FEEDBACK_COLORS.incorrect;

  useEffect(() => {
    if (mode !== "wordScraps") return;
    if (loading) return;
    if (result !== "") return;
    if (freeBuilderSlotCount === 0) return;
    if (builtSentence.length !== freeBuilderSlotCount) return;

    evaluateWordScraps();
  }, [
    builtSentence,
    evaluateWordScraps,
    freeBuilderSlotCount,
    loading,
    mode,
    result,
  ]);

  const practiceControls = (
    <View
      style={[
        st.methodsPanel,
        !isDesktopWeb && st.methodsPanelMobile,
        isDesktopWeb && st.methodsPanelSidebarDesktop,
      ]}
    >
        <View
          style={[
            st.methodsCard,
            !isDesktopWeb && st.methodsCardMobile,
            isDesktopWeb && st.methodsCardSidebarDesktop,
          ]}
        >
        <View
          style={[
            st.methodsHeaderRow,
            !isDesktopWeb && st.methodsHeaderRowMobile,
            isDesktopWeb && st.methodsHeaderRowSidebar,
          ]}
        >
          <View style={st.methodsHeaderText}>
            <Text style={st.methodsEyebrow}>Practice mode</Text>
          </View>
        </View>
        <View
          style={[
            st.methodsRow,
            !isDesktopWeb && st.methodsRowMobile,
            isDesktopWeb && st.methodsRowDesktopSidebar,
          ]}
        >
          {ALL_MODES.map((practiceMode) => {
            const isEnabled = enabledModes[practiceMode];
            const isCurrent = mode === practiceMode;
            const isCurrentRoundOnly = isCurrent && !isEnabled;
            const showCurrentBadge = isDesktopWeb && isCurrent;

            return (
              <Pressable
                key={practiceMode}
                style={({ hovered, pressed }) => [
                  st.methodChip,
                  !isDesktopWeb && st.methodChipMobile,
                  isCurrent && st.methodChipCurrent,
                  !isEnabled && !isCurrentRoundOnly && st.methodChipDisabled,
                  isDesktopWeb && st.methodChipSidebarDesktop,
                  getInteractiveStateStyle(
                    "light",
                    hovered,
                    pressed,
                    !isEnabled && !isCurrentRoundOnly,
                  ),
                ]}
                onPress={() => void togglePracticeMethod(practiceMode)}
              >
                <View style={[st.methodChipRow, !isDesktopWeb && st.methodChipRowMobile]}>
                  <View style={st.methodChipCopy}>
                    <Text
                      style={[
                        st.methodChipLabel,
                        !isDesktopWeb && st.methodChipLabelMobile,
                        isCurrent && st.methodChipLabelCurrent,
                        !isEnabled &&
                          !isCurrentRoundOnly &&
                          st.methodChipLabelDisabled,
                      ]}
                    >
                      {GRAMMAR_EXERCISE_LABELS[practiceMode]}
                    </Text>
                    {isDesktopWeb && showCurrentBadge ? (
                      <Text style={st.methodChipMeta}>Current</Text>
                    ) : null}
                  </View>
                  {isDesktopWeb ? (
                    <View
                      style={[
                        st.methodToggle,
                        isEnabled && st.methodToggleOn,
                        isCurrentRoundOnly && st.methodTogglePending,
                      ]}
                    >
                      <View
                        style={[
                          st.methodToggleKnob,
                          isEnabled && st.methodToggleKnobOn,
                          isCurrentRoundOnly && st.methodToggleKnobPending,
                        ]}
                      />
                    </View>
                  ) : showCurrentBadge ? (
                    <View
                      style={[
                        st.methodBadge,
                        !isEnabled && st.methodBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          st.methodBadgeText,
                          !isEnabled && st.methodBadgeTextPending,
                        ]}
                      >
                        Current
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        {methodsNote ? (
          <Text
            style={[
              st.methodsNote,
              methodsGuardMessage
                ? st.methodsNoteWarning
                : st.methodsNoteMuted,
            ]}
          >
            {methodsNote}
          </Text>
        ) : null}
        {isDesktopWeb && showSingleLessonUtilities ? renderLessonUtilities() : null}
      </View>
    </View>
  );

  function renderLessonUtilities() {
    if (!showSingleLessonUtilities) return null;
    const mobileTopicNavigation = (
      <View style={[st.lessonNavExerciseRow, st.lessonNavExerciseRowMobileCompact]}>
        <Pressable
          style={({ hovered, pressed }) => [
            st.lessonNavExerciseButton,
            st.lessonNavExerciseButtonMobile,
            st.lessonNavExerciseButtonMobileCompact,
            !previous && st.lessonNavExerciseButtonDisabled,
            getInteractiveStateStyle("light", hovered, pressed, !previous),
          ]}
          onPress={() => void openExerciseTopic(previous)}
          disabled={!previous}
        >
          <Text
            style={[
              st.lessonNavExerciseCompactLabel,
              !previous && st.lessonNavExerciseLabelDisabled,
            ]}
          >
            Previous
          </Text>
          <Text
            numberOfLines={2}
            style={[
              st.lessonNavExerciseCompactTitle,
              !previous && st.lessonNavExerciseTitleDisabled,
            ]}
          >
            {previous ? previous.title : "First topic"}
          </Text>
        </Pressable>

        <Pressable
          style={({ hovered, pressed }) => [
            st.lessonNavExerciseButton,
            st.lessonNavExerciseButtonMobile,
            st.lessonNavExerciseButtonMobileCompact,
            !next && st.lessonNavExerciseButtonDisabled,
            getInteractiveStateStyle("light", hovered, pressed, !next),
          ]}
          onPress={() => void openExerciseTopic(next)}
          disabled={!next}
        >
          <Text
            style={[
              st.lessonNavExerciseCompactLabel,
              !next && st.lessonNavExerciseLabelDisabled,
            ]}
          >
            Next
          </Text>
          <Text
            numberOfLines={2}
            style={[
              st.lessonNavExerciseCompactTitle,
              !next && st.lessonNavExerciseTitleDisabled,
            ]}
          >
            {next ? next.title : "Last topic"}
          </Text>
        </Pressable>
      </View>
    );

    const topicNavigation = (
      <View
        style={[
          st.lessonNavExerciseRow,
          !isDesktopWeb && st.lessonNavExerciseRowMobile,
          isDesktopWeb && st.lessonNavExerciseRowDesktop,
        ]}
      >
        <Pressable
          style={({ hovered, pressed }) => [
            st.lessonNavExerciseButton,
            !isDesktopWeb && st.lessonNavExerciseButtonMobile,
            isDesktopWeb && st.lessonNavExerciseButtonDesktop,
            !previous && st.lessonNavExerciseButtonDisabled,
            getInteractiveStateStyle("light", hovered, pressed, !previous),
          ]}
          onPress={() => void openExerciseTopic(previous)}
          disabled={!previous}
        >
          <Text
            style={[
              st.lessonNavExerciseLabel,
              !previous && st.lessonNavExerciseLabelDisabled,
            ]}
          >
            Previous topic
          </Text>
          <Text
            style={[
              st.lessonNavExerciseTitle,
              !previous && st.lessonNavExerciseTitleDisabled,
            ]}
          >
            {previous ? previous.title : "You're at the first topic"}
          </Text>
        </Pressable>

        <Pressable
          style={({ hovered, pressed }) => [
            st.lessonNavExerciseButton,
            !isDesktopWeb && st.lessonNavExerciseButtonMobile,
            isDesktopWeb && st.lessonNavExerciseButtonDesktop,
            !next && st.lessonNavExerciseButtonDisabled,
            getInteractiveStateStyle("light", hovered, pressed, !next),
          ]}
          onPress={() => void openExerciseTopic(next)}
          disabled={!next}
        >
          <Text
            style={[
              st.lessonNavExerciseLabel,
              !next && st.lessonNavExerciseLabelDisabled,
            ]}
          >
            Next topic
          </Text>
          <Text
            style={[
              st.lessonNavExerciseTitle,
              !next && st.lessonNavExerciseTitleDisabled,
            ]}
          >
            {next ? next.title : "You're at the last topic"}
          </Text>
        </Pressable>
      </View>
    );

    if (!isDesktopWeb) {
      return (
        <View style={st.mobileLessonUtilitiesWrap}>
          <View style={st.mobileLessonUtilitiesCard}>
            <View style={[st.lessonMetaSection, st.lessonMetaSectionMobile]}>
              <View style={st.lessonMetaHeader}>
                <Text style={st.lessonMetaLabel}>Practice tracker</Text>
              </View>
              <View style={[st.trackerRow, st.trackerRowMobileCompact]}>
                <View style={[st.trackerCard, st.trackerCardMobileCompact]}>
                  <Text style={[st.trackerValue, st.trackerValueMobileCompact]}>
                    {lifetimeRounds}
                  </Text>
                  <Text style={[st.trackerCaption, st.trackerCaptionMobileCompact]}>
                    Lifetime
                  </Text>
                </View>
                <View style={[st.trackerCard, st.trackerCardMobileCompact]}>
                  <Text style={[st.trackerValue, st.trackerValueMobileCompact]}>
                    {sessionRounds}
                  </Text>
                  <Text style={[st.trackerCaption, st.trackerCaptionMobileCompact]}>
                    This session
                  </Text>
                </View>
              </View>
              <View style={st.lessonMetaDivider} />
              {mobileTopicNavigation}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View>
        <View>
          <View
            style={[
              st.lessonMetaSection,
            ]}
          >
            <View style={st.lessonMetaHeader}>
              <Text style={st.lessonMetaLabel}>Practice tracker</Text>
              <Text style={st.lessonMetaHint}>Rounds for this lesson</Text>
            </View>
            <View style={st.trackerRow}>
              <View style={st.trackerCard}>
                <Text style={st.trackerValue}>{lifetimeRounds}</Text>
                <Text style={st.trackerCaption}>Lifetime</Text>
              </View>
              <View style={st.trackerCard}>
                <Text style={st.trackerValue}>{sessionRounds}</Text>
                <Text style={st.trackerCaption}>This session</Text>
              </View>
            </View>

            <View style={st.lessonMetaDivider} />

            <View style={st.lessonMetaHeader}>
              <Text style={st.lessonMetaLabel}>Topic navigation</Text>
              <Text style={st.lessonMetaHint}>Move through the course path</Text>
            </View>
            {topicNavigation}
          </View>
        </View>
      </View>
    );
  }

  if (premiumLoading) {
    const loadingScreen = (
      <SafeAreaView
        edges={isDesktopWeb ? ["bottom"] : ["top", "bottom"]}
        style={st.safe}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[st.pageFrame, isDesktopWeb && st.pageFrameDesktop]}>
          <Header
            title="Practice"
            onBack={() => router.replace(exerciseBackHref as any)}
            showBrandMark={false}
            showClose
          />
          <View style={st.loadingWrap}>
            <View style={st.loadingPulse} />
            <Text style={st.loadingLabel}>Checking your access...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
    return isDesktopWeb ? (
      <DesktopAppShell>{loadingScreen}</DesktopAppShell>
    ) : (
      loadingScreen
    );
  }

  if (premiumBlocked) {
    const premiumBlockedScreen = (
      <SafeAreaView
        edges={isDesktopWeb ? ["bottom"] : ["top", "bottom"]}
        style={st.safe}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          testID="keystone-mobile-page-scroll"
          contentContainerStyle={[st.scroll, isDesktopWeb && st.scrollDesktop]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[st.pageFrame, isDesktopWeb && st.pageFrameDesktop]}>
            <Header
              title={
                hasMixSource
                  ? mixSource === "progress"
                    ? "Studied Grammar"
                    : "Quick Practice"
                  : getPracticeHeaderTitle(grammarPoint)
              }
              onBack={() => router.replace(exerciseBackHref as any)}
              showBrandMark={false}
              showClose
            />
            <View style={st.premiumBlockWrap}>
              <PremiumGateCard
                title={premiumBlocked.title}
                body={premiumBlocked.body}
                redirectTo={currentPracticeRoute}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
    return isDesktopWeb ? (
      <DesktopAppShell>{premiumBlockedScreen}</DesktopAppShell>
    ) : (
      premiumBlockedScreen
    );
  }

  const exerciseScreen = (
    <SafeAreaView
      edges={isDesktopWeb ? ["bottom"] : ["top", "bottom"]}
      style={st.safe}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        testID="keystone-mobile-page-scroll"
        contentContainerStyle={[st.scroll, isDesktopWeb && st.scrollDesktop]}
        showsVerticalScrollIndicator={false}
        >
          <View style={[st.pageFrame, isDesktopWeb && st.pageFrameDesktop]}>
          <Header
            title={
              hasMixSource
                ? mixSource === "progress"
                  ? "Studied Grammar"
                  : "Quick Practice"
                : getPracticeHeaderTitle(grammarPoint)
            }
            onBack={() => router.replace(exerciseBackHref as any)}
            showBrandMark={false}
            showClose
            showWordBreakdownTtsSetting
            onSettingsChange={handleSettingsChange}
          />

        {loading ? (
          <View style={st.loadingWrap}>
            <View style={st.loadingPulse} />
            <Text style={st.loadingLabel}>Generating...</Text>
          </View>
        ) : loadError ? (
          <View style={st.loadingWrap}>
            <Text style={st.loadingLabel}>{loadError}</Text>
            <Pressable
              style={({ hovered, pressed }) => [
                st.primaryBtn,
                st.secondaryBtn,
                getInteractiveStateStyle("light", hovered, pressed),
              ]}
              onPress={() =>
                void fetchRound(
                  randomMode(enabledModesRef.current, modeHistoryRef.current),
                )
              }
            >
              <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View
              style={[
                st.practiceWorkspace,
                isDesktopWeb && st.practiceWorkspaceDesktop,
              ]}
            >
              {!isDesktopWeb ? practiceControls : null}
              <View style={[isDesktopWeb && st.practiceMainDesktop]}>

            {/* Mode header */}
            <View style={[st.modeHeader, isDesktopWeb && st.modeHeaderDesktop]}>
              <View style={[st.modeTitleRow, !isDesktopWeb && st.modeTitleRowMobile]}>
                <Text style={[st.modeTitle, !isDesktopWeb && st.modeTitleMobile]}>
                  {meta.title}
                </Text>
                <View
                  style={[
                    st.modeHeaderActions,
                    !isDesktopWeb && st.modeHeaderActionsMobile,
                  ]}
                >
                  {renderSentenceReportTrigger()}
                  <ToneGuideInlineTrigger />
                  {isDesktopWeb && showLessonShortcut ? (
                    <TouchableOpacity
                      style={[
                        st.lessonShortcut,
                        !isDesktopWeb && st.lessonShortcutMobile,
                      ]}
                      onPress={openCurrentGrammarLesson}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          st.lessonShortcutText,
                          !isDesktopWeb && st.lessonShortcutTextMobile,
                        ]}
                      >
                        Open lesson
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              {!isDesktopWeb && showLessonShortcut ? (
                <TouchableOpacity
                  style={[st.lessonShortcut, st.lessonShortcutMobile, st.modeHeaderLessonShortcutMobile]}
                  onPress={openCurrentGrammarLesson}
                  activeOpacity={0.75}
                >
                  <Text style={[st.lessonShortcutText, st.lessonShortcutTextMobile]}>
                    Open lesson
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ── BREAKDOWN (Study) ── */}
            {mode === "breakdown" && (
              <View style={[st.exerciseWrap, isDesktopWeb && st.exerciseWrapDesktop]}>
                <View
                  style={[
                    st.studyExamplesGrid,
                    isDesktopWeb && st.studyExamplesGridDesktop,
                  ]}
                >
                  {studyExamples.map((example, index) => {
                    const isSelected = index === selectedStudyIndex;
                    return (
                      <TouchableOpacity
                        key={`${example.thai}-${index}`}
                        style={[
                          st.studyExampleCard,
                          isDesktopWeb && st.studyExampleCardDesktop,
                          isSelected && st.studyExampleCardSelected,
                        ]}
                        onPress={() => setSelectedStudyIndex(index)}
                        activeOpacity={0.85}
                      >
                        <View style={st.studyExampleHeader}>
                          <Text style={st.studyExampleEyebrow}>
                            Example {index + 1}
                          </Text>
                        <View style={st.studyExampleHeaderActions}>
                            <TouchableOpacity
                              style={st.studyExampleAudio}
                              onPress={() =>
                                void playSentence(example.thai, {
                                  speed: ttsSpeed,
                                })
                              }
                              activeOpacity={0.75}
                            >
                              <Ionicons
                                name="volume-medium-outline"
                                size={16}
                                color={Sketch.inkLight}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {isDesktopWeb ? (
                          <Text style={st.studyExampleSentence}>
                            {example.breakdown.map((word, wordIndex) => (
                              <ToneThaiText
                                key={wordIndex}
                                thai={word.thai}
                                tones={getBreakdownTones(word)}
                                romanization={word.romanization || word.roman}
                                displayThaiSegments={word.displayThaiSegments}
                              />
                            ))}
                          </Text>
                        ) : (
                          <BreakdownToneText
                            breakdown={example.breakdown}
                            style={st.studyExampleSentence}
                          />
                        )}

                        {showRoman && example.romanization ? (
                          <Text style={st.studyExampleRoman}>
                            {example.romanization}
                          </Text>
                        ) : null}

                        {showEnglish && example.english ? (
                          <Text style={st.studyExampleEnglish}>
                            {example.english}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View
                  style={[
                    st.studyBreakdownCard,
                    isDesktopWeb && st.studyBreakdownCardDesktop,
                  ]}
                >
                  <View style={st.studyBreakdownHeader}>
                    <Text style={st.tileSectionLabel}>WORD BREAKDOWN</Text>
                    <Text style={st.studyBreakdownHint}>
                      Tap another example above to inspect it.
                    </Text>
                  </View>
                  <View
                    style={[
                      st.tileRow,
                      isDesktopWeb && st.tileRowDesktop,
                      isDesktopWeb && st.tileRowDesktopCentered,
                    ]}
                  >
                    {activeBreakdown.map((w, i) => (
                      canPlayBreakdownTiles ? (
                        <BreakdownTilePressable
                          key={i}
                          style={({ hovered, pressed }) => [
                            st.wordTile,
                            isDesktopWeb && st.wordTileDesktop,
                            !isDesktopWeb && pressed ? st.wordTilePressed : null,
                            getInteractiveStateStyle("light", hovered, pressed),
                          ]}
                          onPress={() => playBreakdownWord(w.thai)}
                        >
                          <View style={st.wordTileHeader}>
                            {isDesktopWeb ? (
                              <ToneThaiText
                                thai={w.thai}
                                tones={getBreakdownTones(w)}
                                romanization={activeRomanTokens[i]}
                                displayThaiSegments={w.displayThaiSegments}
                                style={st.wordTileThai}
                                fallbackColor={Sketch.ink}
                              />
                            ) : (
                              <ToneThaiText
                                thai={w.thai}
                                tones={getBreakdownTones(w)}
                                romanization={activeRomanTokens[i]}
                                displayThaiSegments={w.displayThaiSegments}
                                style={st.wordTileThai}
                                fallbackColor={Sketch.ink}
                              />
                            )}
                            <ToneDots
                              tones={getBreakdownTones(w)}
                              style={st.toneDots}
                            />
                          </View>
                          {showRoman && activeRomanTokens[i] ? (
                            <Text style={st.wordTileRoman}>
                              {activeRomanTokens[i]}
                            </Text>
                          ) : null}
                          {showEnglish && (
                            <Text style={st.wordTileEng}>
                              {w.english.toUpperCase()}
                            </Text>
                          )}
                        </BreakdownTilePressable>
                      ) : (
                        <View
                          key={i}
                          style={[st.wordTile, isDesktopWeb && st.wordTileDesktop]}
                        >
                          <View style={st.wordTileHeader}>
                            {isDesktopWeb ? (
                              <ToneThaiText
                                thai={w.thai}
                                tones={getBreakdownTones(w)}
                                romanization={activeRomanTokens[i]}
                                displayThaiSegments={w.displayThaiSegments}
                                style={st.wordTileThai}
                                fallbackColor={Sketch.ink}
                              />
                            ) : (
                              <ToneThaiText
                                thai={w.thai}
                                tones={getBreakdownTones(w)}
                                romanization={activeRomanTokens[i]}
                                displayThaiSegments={w.displayThaiSegments}
                                style={st.wordTileThai}
                                fallbackColor={Sketch.ink}
                              />
                            )}
                            <ToneDots
                              tones={getBreakdownTones(w)}
                              style={st.toneDots}
                            />
                          </View>
                          {showRoman && activeRomanTokens[i] ? (
                            <Text style={st.wordTileRoman}>
                              {activeRomanTokens[i]}
                            </Text>
                          ) : null}
                          {showEnglish && (
                            <Text style={st.wordTileEng}>
                              {w.english.toUpperCase()}
                            </Text>
                          )}
                        </View>
                      )
                    ))}
                  </View>
                </View>

                <View style={isDesktopWeb ? st.ctaRowDesktop : st.revealedActionRow}>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      st.primaryBtn,
                      isDesktopWeb && st.primaryBtnDesktop,
                      isDesktopWeb && st.ctaButtonDesktop,
                      !isDesktopWeb && st.revealedActionButton,
                      getInteractiveStateStyle("navy", hovered, pressed),
                    ]}
                    onPress={() => {
                      trackWords(
                        studyExamples.length > 0
                          ? flattenStudyExampleWords(studyExamples)
                          : activeBreakdown,
                        "breakdown-next",
                        studyExamples.length > 0 ? undefined : activeRomanTokens,
                      );
                      recordRound(true);
                      fetchRound(
                        randomMode(enabledModesRef.current, modeHistoryRef.current),
                      );
                    }}
                  >
                    <Text style={st.primaryBtnText}>Continue</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      st.primaryBtn,
                      st.secondaryBtn,
                      isDesktopWeb && st.primaryBtnDesktop,
                      isDesktopWeb && st.ctaButtonDesktop,
                      !isDesktopWeb && st.revealedActionButton,
                      sentenceExplanationLoading && st.primaryBtnDisabled,
                      getInteractiveStateStyle(
                        "light",
                        hovered,
                        pressed,
                        sentenceExplanationLoading,
                      ),
                    ]}
                    onPress={() => {
                      void requestSentenceExplanation();
                    }}
                    disabled={sentenceExplanationLoading}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                      {sentenceExplanationLoading ? "Explaining..." : "Explain"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ── WORDSCRAPS (Build) ── */}
            {mode === "wordScraps" && (
              <View style={[st.exerciseWrap, isDesktopWeb && st.exerciseWrapDesktop]}>
                <View style={[st.buildCard, isDesktopWeb && st.buildCardDesktop]}>
                  <View style={[st.promptCard, isDesktopWeb && st.promptCardDesktopCompact]}>
                    <View
                      style={[
                        st.promptCardHeaderRow,
                        isDesktopWeb && st.promptCardHeaderRowDesktop,
                      ]}
                    >
                      <View style={st.promptCardTextBlock}>
                        <Text style={st.promptLabel}>TRANSLATE INTO THAI</Text>
                        <Text style={st.promptText}>{translation}</Text>
                      </View>
                    </View>
                  </View>

                <View style={st.buildSection}>
                    {isDesktopWeb ? (
                      <Text style={st.buildSectionLabel}>Your answer</Text>
                    ) : null}
                    <View
                  style={[
                    st.builderZone,
                    isDesktopWeb && st.builderZoneDesktop,
                    result === "correct" && st.builderCorrect,
                    result === "revealed" && st.builderRevealed,
                    !isDesktopWeb &&
                      result === "correct" &&
                      st.builderCorrectMobile,
                    !isDesktopWeb &&
                      result === "revealed" &&
                      st.builderRevealedMobile,
                    result === "wrong" && st.builderWrong,
                    !isDesktopWeb &&
                      result === "wrong" &&
                      st.builderWrongMobile,
                  ]}
                >
                  {builtSentence.length === 0 &&
                  prefilled.every((s) => s === null) ? (
                    <Text
                      style={[
                        st.builderPlaceholder,
                        result === "correct" && st.builderPlaceholderResultOk,
                        result === "revealed" &&
                          st.builderPlaceholderResultRevealed,
                        result === "wrong" && st.builderPlaceholderResultBad,
                      ]}
                    >
                      {result === "revealed"
                        ? "Answer shown below"
                        : "Tap words below to build your answer"}
                    </Text>
                  ) : (
                    <View
                      style={[
                        st.builderWords,
                        isDesktopWeb && st.builderWordsDesktop,
                      ]}
                    >
                      {(() => {
                        const chips: React.ReactNode[] = [];
                        let userIdx = 0;
                        for (let i = 0; i < prefilled.length; i++) {
                          if (prefilled[i] !== null) {
                            const lockedWord = breakdown[i];
                            chips.push(
                              <View
                                key={`pre-${i}`}
                                style={[st.wordTile, st.builderTile, st.builderTileLocked]}
                              >
                                <View
                                  style={[
                                    st.builderTileContent,
                                    st.builderTileContentMuted,
                                  ]}
                                >
                                  <View style={st.builderTileHeader}>
                                    <ToneThaiText
                                      thai={lockedWord.thai}
                                      tones={getBreakdownTones(lockedWord)}
                                      romanization={romanTokens[i]}
                                      displayThaiSegments={lockedWord.displayThaiSegments}
                                      style={st.builderTileThai}
                                      fallbackColor={Sketch.inkMuted}
                                    />
                                  </View>
                                  {showRoman && romanTokens[i] ? (
                                    <Text style={st.builderTileRoman}>{romanTokens[i]}</Text>
                                  ) : null}
                                  {showEnglish && lockedWord.english ? (
                                    <Text style={st.builderTileEng}>{lockedWord.english}</Text>
                                  ) : null}
                                </View>
                              </View>,
                            );
                          } else if (userIdx < builtSentence.length) {
                            const builtWord = builtSentence[userIdx];
                            const answerWord = breakdown[builtWord.breakdownIndex];
                            chips.push(
                              <Pressable
                                key={`usr-${i}`}
                                style={({ hovered, pressed }) => [
                                  st.wordTile,
                                  st.builderTile,
                                  !isDesktopWeb && pressed ? st.wordTilePressed : null,
                                  getInteractiveStateStyle(
                                    "light",
                                    hovered,
                                    pressed,
                                    result === "revealed",
                                  ),
                                ]}
                                onPress={() => removeBuiltWord(builtWord.id)}
                                disabled={result === "revealed"}
                              >
                                <View style={st.builderTileContent}>
                                  <View style={st.builderTileHeader}>
                                    <ToneThaiText
                                      thai={builtWord.thai}
                                      tones={builtWord.tones}
                                      romanization={builtWord.roman}
                                      displayThaiSegments={builtWord.displayThaiSegments}
                                      style={st.builderTileThai}
                                      fallbackColor={Sketch.ink}
                                    />
                                  </View>
                                  {showRoman && builtWord.roman ? (
                                    <Text style={st.builderTileRoman}>{builtWord.roman}</Text>
                                  ) : null}
                                  {showEnglish && answerWord?.english ? (
                                    <Text style={st.builderTileEng}>{answerWord.english}</Text>
                                  ) : null}
                                </View>
                              </Pressable>,
                            );
                            userIdx++;
                          } else {
                            chips.push(
                              <View
                                key={`gap-${i}`}
                                style={st.builderSlotEmpty}
                              >
                                <Text style={st.builderSlotEmptyText}>?</Text>
                              </View>,
                            );
                          }
                        }
                        return chips;
                      })()}
                    </View>
                  )}
                    </View>
                  </View>

                {result !== "" && (
                  <View
                    style={[
                      st.resultBanner,
                      result === "correct"
                        ? st.resultOk
                        : result === "revealed"
                          ? st.resultRevealed
                          : st.resultBad,
                      !isDesktopWeb &&
                        (result === "correct"
                          ? st.resultOkMobile
                          : result === "revealed"
                            ? st.resultRevealedMobile
                            : st.resultBadMobile),
                    ]}
                  >
                    <Text
                      style={[
                        st.resultLabel,
                        { color: resultPalette.text },
                      ]}
                    >
                      {result === "correct"
                        ? "Correct"
                        : result === "revealed"
                          ? "Answer shown"
                          : "Incorrect"}
                    </Text>
                  </View>
                )}

                <View style={[st.actionRow, isDesktopWeb && st.actionRowDesktop]}>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      st.actionBtn,
                      getInteractiveStateStyle("light", hovered, pressed, result === "revealed"),
                    ]}
                    onPress={undoLastWord}
                    disabled={result === "revealed"}
                  >
                    <Text style={st.actionBtnText}>Undo</Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      st.actionBtn,
                      getInteractiveStateStyle("light", hovered, pressed, result === "revealed"),
                    ]}
                    onPress={resetSentence}
                    disabled={result === "revealed"}
                  >
                    <Text style={st.actionBtnText}>Reset</Text>
                  </Pressable>
                </View>

                {/* wordScraps tiles — same style as breakdown word tiles */}
                <View style={st.buildDivider} />

                <View style={st.availableWordsHeader}>
                  <Text style={st.buildSectionLabel}>Available words</Text>
                </View>

                <View style={[st.tileRow, isDesktopWeb && st.tileRowDesktop]}>
                  {words.map((word) => {
                    const isUsed = selectedWordIds.has(word.id);
                    return (
                    <Pressable
                      key={word.id}
                      style={({ hovered, pressed }) => [
                        st.wordTile,
                        isDesktopWeb && st.wordTileDesktop,
                        isUsed && st.wordTileUsed,
                        getInteractiveStateStyle(
                          "light",
                          hovered,
                          pressed,
                          isUsed || result === "revealed",
                        ),
                      ]}
                      onPress={() => {
                        if (isUsed || result === "revealed") return;
                        handleWordTap(word);
                        if (autoplayTTS) {
                          playBreakdownWord(word.thai);
                        }
                      }}
                      disabled={isUsed || result === "revealed"}
                    >
                      <View style={st.wordTileHeader}>
                        {isDesktopWeb ? (
                          <ToneThaiText
                            thai={word.thai}
                            tones={word.tones}
                            romanization={word.roman}
                            displayThaiSegments={word.displayThaiSegments}
                            style={st.wordTileThai}
                            fallbackColor={Sketch.ink}
                          />
                        ) : (
                          <ToneThaiText
                            thai={word.thai}
                            tones={word.tones}
                            romanization={word.roman}
                            displayThaiSegments={word.displayThaiSegments}
                            style={st.wordTileThai}
                            fallbackColor={Sketch.ink}
                          />
                        )}
                        <ToneDots tones={word.tones} style={st.toneDots} />
                      </View>
                      {showRoman && word.roman ? (
                        <Text style={st.wordTileRoman}>{word.roman}</Text>
                      ) : null}
                      {showEnglish && (
                        <Text style={st.wordTileEng}>{word.english}</Text>
                      )}
                    </Pressable>
                    );
                  })}
                </View>
                </View>

                {isDesktopWeb ? (
                  <View style={st.ctaRowDesktop}>
                    {result === "revealed" ? (
                      <>
                        <Pressable
                          style={({ hovered, pressed }) => [
                            st.primaryBtn,
                            st.secondaryBtn,
                            st.primaryBtnDesktop,
                            st.ctaButtonDesktop,
                            getInteractiveStateStyle("light", hovered, pressed),
                          ]}
                          onPress={continueToNextRound}
                        >
                          <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                            Continue
                          </Text>
                        </Pressable>
                        <Pressable
                          style={({ hovered, pressed }) => [
                            st.primaryBtn,
                            st.secondaryBtn,
                            st.primaryBtnDesktop,
                            st.ctaButtonDesktop,
                            sentenceExplanationLoading && st.primaryBtnDisabled,
                            getInteractiveStateStyle(
                              "light",
                              hovered,
                              pressed,
                              sentenceExplanationLoading,
                            ),
                          ]}
                          onPress={() => {
                            void requestSentenceExplanation();
                          }}
                          disabled={sentenceExplanationLoading}
                        >
                          <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                            {sentenceExplanationLoading ? "Explaining..." : "Explain"}
                          </Text>
                        </Pressable>
                      </>
                    ) : null}

                    {result !== "correct" && result !== "revealed" ? (
                      <Pressable
                        style={({ hovered, pressed }) => [
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.primaryBtnDesktop,
                          st.ctaButtonDesktop,
                          getInteractiveStateStyle("light", hovered, pressed),
                        ]}
                        onPress={revealWordScrapsAnswer}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Show answer
                        </Text>
                      </Pressable>
                    ) : null}

                    {result !== "correct" && result !== "revealed" ? (
                      <Pressable
                        style={({ hovered, pressed }) => [
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.primaryBtnDesktop,
                          st.ctaButtonDesktop,
                          getInteractiveStateStyle("light", hovered, pressed),
                        ]}
                        onPress={continueToNextRound}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Skip
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : (
                  <>
                    {result === "revealed" && (
                      <View style={st.revealedActionRow}>
                        <Pressable
                          style={({ hovered, pressed }) => [
                            st.primaryBtn,
                            st.secondaryBtn,
                            st.revealedActionButton,
                            isDesktopWeb && st.primaryBtnDesktop,
                            getInteractiveStateStyle("light", hovered, pressed),
                          ]}
                          onPress={continueToNextRound}
                        >
                          <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                            Continue
                          </Text>
                        </Pressable>
                        <Pressable
                          style={({ hovered, pressed }) => [
                            st.primaryBtn,
                            st.secondaryBtn,
                            st.revealedActionButton,
                            isDesktopWeb && st.primaryBtnDesktop,
                            sentenceExplanationLoading && st.primaryBtnDisabled,
                            getInteractiveStateStyle(
                              "light",
                              hovered,
                              pressed,
                              sentenceExplanationLoading,
                            ),
                          ]}
                          onPress={() => {
                            void requestSentenceExplanation();
                          }}
                          disabled={sentenceExplanationLoading}
                        >
                          <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                            {sentenceExplanationLoading ? "Explaining..." : "Explain"}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {result !== "correct" && result !== "revealed" && (
                      <View style={st.mobilePrimaryActionStack}>
                        <Pressable
                          style={({ hovered, pressed }) => [
                            st.primaryBtn,
                            st.secondaryBtn,
                            st.mobilePrimaryActionButton,
                            getInteractiveStateStyle("light", hovered, pressed),
                          ]}
                          onPress={revealWordScrapsAnswer}
                        >
                          <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                            Show answer
                          </Text>
                        </Pressable>

                        <Pressable
                          style={({ pressed }) => [
                            st.mobileInlineActionButton,
                            pressed && st.mobileInlineActionButtonPressed,
                          ]}
                          onPress={continueToNextRound}
                        >
                          <Text style={st.mobileInlineActionText}>Skip</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* ── MATCHTHAI ── */}
            {mode === "matchThai" && (
              <View style={[st.exerciseWrap, isDesktopWeb && st.exerciseWrapDesktop]}>
                <View style={[st.matchCard, isDesktopWeb && st.matchCardDesktop]}>
                  <View
                    style={[
                      st.promptCard,
                      isDesktopWeb && st.promptCardDesktopCompact,
                    ]}
                  >
                    <View
                      style={[
                        st.promptCardHeaderRow,
                        isDesktopWeb && st.promptCardHeaderRowDesktop,
                      ]}
                    >
                      <View style={st.promptCardTextBlock}>
                        <Text style={st.promptLabel}>CHOOSE THE SENTENCE FOR</Text>
                        <Text style={st.promptText}>{translation}</Text>
                      </View>
                    </View>
                  </View>

                  {isDesktopWeb ? (
                    <Text style={st.matchHelperText}>Select the correct answer</Text>
                  ) : null}

                  <View style={[st.matchList, isDesktopWeb && st.matchListDesktop]}>
                  {matchOptions.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = opt.isCorrect;
                    const isExpanded = expandedMatchOption === idx;
                    const optRomanTokens = getBreakdownRomanizations(
                      opt.romanization,
                      opt.breakdown,
                    );

                    let borderColor = Sketch.inkFaint;
                    let bgColor = AppSketch.surface;
                    let optionBorderWidth = 1;

                    if (matchRevealed) {
                      if (isCorrect) {
                        borderColor = EXERCISE_FEEDBACK_COLORS.correct.border;
                        bgColor = AppSketch.surface;
                        optionBorderWidth = 2;
                      } else if (result === "revealed") {
                        borderColor = Sketch.inkFaint;
                        bgColor = AppSketch.surface;
                      } else if (isSelected && !isCorrect) {
                        borderColor = EXERCISE_FEEDBACK_COLORS.incorrect.border;
                        bgColor = EXERCISE_FEEDBACK_COLORS.incorrect.tint;
                      } else {
                        bgColor = Sketch.paperDark;
                      }
                    } else if (isSelected) {
                      borderColor = MUTED_FEEDBACK_ACCENTS.selectedBorder;
                      bgColor = AppSketch.surface;
                    }

                    const sentenceBgColor = isCorrect && matchRevealed
                      ? "transparent"
                      : result === "revealed" && matchRevealed
                        ? isDesktopWeb
                          ? Sketch.cardBg
                          : "transparent"
                      : isSelected && matchRevealed && !isCorrect
                        ? isDesktopWeb
                          ? EXERCISE_FEEDBACK_COLORS.incorrect.tint
                          : "transparent"
                        : isSelected
                          ? Sketch.cardBg
                          : Sketch.paperDark;
                    const sentenceRomanColor =
                      matchRevealed && isCorrect
                        ? EXERCISE_FEEDBACK_COLORS.correct.subtext
                        : result === "revealed"
                          ? EXERCISE_FEEDBACK_COLORS.revealed.subtext
                          : Sketch.inkMuted;

                    return (
                      <View
                        key={idx}
                        style={[
                          st.optionCard,
                          isDesktopWeb && st.optionCardDesktop,
                          {
                            borderColor,
                            backgroundColor: bgColor,
                            borderWidth: optionBorderWidth,
                          },
                        ]}
                      >
                        <View
                          style={[
                            st.matchSentenceButton,
                            {
                              backgroundColor: sentenceBgColor,
                            },
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              st.matchSentenceTapArea,
                              isDesktopWeb && st.matchSentenceTapAreaDesktop,
                            ]}
                            onPress={() => selectOption(idx)}
                            activeOpacity={matchRevealed ? 1 : 0.85}
                            disabled={matchRevealed}
                          >
                            {opt.breakdown.length > 0 ? (
                              isDesktopWeb ? (
                                <Text
                                  style={[
                                    st.matchSentenceText,
                                    isDesktopWeb && st.matchSentenceTextDesktop,
                                  ]}
                                >
                                  {opt.breakdown.map((item, itemIndex) => (
                                    <ToneThaiText
                                      key={`${idx}-${itemIndex}-${item.thai}`}
                                      thai={item.thai}
                                      tones={getBreakdownTones(item)}
                                      romanization={
                                        item.romanization || item.roman
                                      }
                                      displayThaiSegments={item.displayThaiSegments}
                                    />
                                  ))}
                                </Text>
                              ) : (
                                <BreakdownToneText
                                  breakdown={opt.breakdown}
                                  style={st.matchSentenceText}
                                />
                              )
                            ) : (
                              <Text
                                style={[
                                  st.matchSentenceText,
                                  isDesktopWeb && st.matchSentenceTextDesktop,
                                ]}
                              >
                                {opt.thai}
                              </Text>
                            )}
                            {showRoman && opt.romanization ? (
                              <Text
                                style={[
                                  st.matchSentenceRoman,
                                  isDesktopWeb && st.matchSentenceRomanDesktop,
                                  { color: sentenceRomanColor },
                                ]}
                              >
                                {opt.romanization}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                          <View style={st.matchOptionControls}>
                            <Pressable
                              style={({ hovered, pressed }) => [
                                st.matchExpandButton,
                                isExpanded && st.matchExpandButtonActive,
                                getInteractiveStateStyle("light", hovered, pressed),
                              ]}
                              onPress={() => toggleMatchOptionExpanded(idx)}
                            >
                              <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={18}
                                color={isExpanded ? Sketch.ink : Sketch.inkLight}
                              />
                            </Pressable>
                          </View>
                        </View>

                        {isExpanded && (
                          <View style={st.matchDetailsPanel}>
                            <View
                              style={[
                                st.matchTileRow,
                                isDesktopWeb && st.matchTileRowDesktopCentered,
                              ]}
                            >
                                {opt.breakdown.map((w, wi) => (
                                  canPlayBreakdownTiles ? (
                                    <BreakdownTilePressable
                                      key={wi}
                                      style={({ hovered, pressed }) => [
                                        st.matchWordTile,
                                        isDesktopWeb && st.matchWordTileDesktop,
                                        !isDesktopWeb && pressed
                                          ? st.matchWordTilePressed
                                          : null,
                                        getInteractiveStateStyle(
                                          "light",
                                          hovered,
                                          pressed,
                                        ),
                                      ]}
                                      onPress={() => playBreakdownWord(w.thai)}
                                    >
                                    <View
                                      style={[
                                        st.matchWordTileHeader,
                                        isDesktopWeb &&
                                          st.matchWordTileHeaderDesktop,
                                      ]}
                                    >
                                      {isDesktopWeb ? (
                                        <ToneThaiText
                                          thai={w.thai}
                                          tones={getBreakdownTones(w)}
                                          romanization={optRomanTokens[wi]}
                                          displayThaiSegments={w.displayThaiSegments}
                                          style={st.matchWordTileThai}
                                          fallbackColor={Sketch.ink}
                                        />
                                      ) : (
                                        <ToneThaiText
                                          thai={w.thai}
                                          tones={getBreakdownTones(w)}
                                          romanization={optRomanTokens[wi]}
                                          displayThaiSegments={w.displayThaiSegments}
                                          style={st.matchWordTileThai}
                                          fallbackColor={Sketch.ink}
                                        />
                                      )}
                                      <ToneDots
                                        tones={getBreakdownTones(w)}
                                        style={st.toneDots}
                                      />
                                    </View>
                                    {showRoman && optRomanTokens[wi] ? (
                                      <Text style={st.matchWordTileRoman}>
                                        {optRomanTokens[wi]}
                                      </Text>
                                    ) : null}
                                    {showEnglish && (
                                      <Text style={st.matchWordTileEng}>
                                        {w.english.toUpperCase()}
                                      </Text>
                                    )}
                                  </BreakdownTilePressable>
                                ) : (
                                  <View
                                    key={wi}
                                    style={[
                                      st.matchWordTile,
                                      isDesktopWeb && st.matchWordTileDesktop,
                                    ]}
                                  >
                                    <View
                                      style={[
                                        st.matchWordTileHeader,
                                        isDesktopWeb &&
                                          st.matchWordTileHeaderDesktop,
                                      ]}
                                    >
                                      {isDesktopWeb ? (
                                        <ToneThaiText
                                          thai={w.thai}
                                          tones={getBreakdownTones(w)}
                                          romanization={optRomanTokens[wi]}
                                          displayThaiSegments={w.displayThaiSegments}
                                          style={st.matchWordTileThai}
                                          fallbackColor={Sketch.ink}
                                        />
                                      ) : (
                                        <ToneThaiText
                                          thai={w.thai}
                                          tones={getBreakdownTones(w)}
                                          romanization={optRomanTokens[wi]}
                                          displayThaiSegments={w.displayThaiSegments}
                                          style={st.matchWordTileThai}
                                          fallbackColor={Sketch.ink}
                                        />
                                      )}
                                      <ToneDots
                                        tones={getBreakdownTones(w)}
                                        style={st.toneDots}
                                      />
                                    </View>
                                    {showRoman && optRomanTokens[wi] ? (
                                      <Text style={st.matchWordTileRoman}>
                                        {optRomanTokens[wi]}
                                      </Text>
                                    ) : null}
                                    {showEnglish && (
                                      <Text style={st.matchWordTileEng}>
                                        {w.english.toUpperCase()}
                                      </Text>
                                    )}
                                  </View>
                                )
                              ))}
                            </View>
                          </View>
                        )}

                      </View>
                    );
                  })}
                </View>

                {result !== "" && (
                  <View
                    style={[
                      st.resultBanner,
                      result === "correct"
                        ? st.resultOk
                        : result === "revealed"
                          ? st.resultRevealed
                          : st.resultBad,
                      !isDesktopWeb &&
                        (result === "correct"
                          ? st.resultOkMobile
                          : result === "revealed"
                            ? st.resultRevealedMobile
                            : st.resultBadMobile),
                    ]}
                  >
                    <Text
                      style={[
                        st.resultLabel,
                        { color: resultPalette.text },
                      ]}
                    >
                      {result === "correct"
                        ? "Correct"
                        : result === "revealed"
                          ? "Answer shown"
                          : "Incorrect"}
                    </Text>
                  </View>
                )}

                  {!isDesktopWeb ? <View style={st.availableWordsHeader}><View /></View> : null}
                </View>

                {matchRevealed && (result === "wrong" || result === "revealed") && (
                  isDesktopWeb ? (
                    <View style={st.ctaRowDesktop}>
                      <Pressable
                        style={({ hovered, pressed }) => [
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.primaryBtnDesktop,
                          st.ctaButtonDesktop,
                          getInteractiveStateStyle("light", hovered, pressed),
                        ]}
                        onPress={continueToNextRound}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Continue
                        </Text>
                      </Pressable>
                      <Pressable
                        style={({ hovered, pressed }) => [
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.primaryBtnDesktop,
                          st.ctaButtonDesktop,
                          sentenceExplanationLoading && st.primaryBtnDisabled,
                          getInteractiveStateStyle(
                            "light",
                            hovered,
                            pressed,
                            sentenceExplanationLoading,
                          ),
                        ]}
                        onPress={() => {
                          void requestSentenceExplanation();
                        }}
                        disabled={sentenceExplanationLoading}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          {sentenceExplanationLoading ? "Explaining..." : "Explain"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={st.revealedActionRow}>
                      <Pressable
                        style={({ hovered, pressed }) => [
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.revealedActionButton,
                          getInteractiveStateStyle("light", hovered, pressed),
                        ]}
                        onPress={continueToNextRound}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Continue
                        </Text>
                      </Pressable>
                      <Pressable
                        style={({ hovered, pressed }) => [
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.revealedActionButton,
                          sentenceExplanationLoading && st.primaryBtnDisabled,
                          getInteractiveStateStyle(
                            "light",
                            hovered,
                            pressed,
                            sentenceExplanationLoading,
                          ),
                        ]}
                        onPress={() => {
                          void requestSentenceExplanation();
                        }}
                        disabled={sentenceExplanationLoading}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          {sentenceExplanationLoading ? "Explaining..." : "Explain"}
                        </Text>
                      </Pressable>
                    </View>
                  )
                )}

                {!matchRevealed && (
                  <View
                    style={[
                      !isDesktopWeb && st.mobilePrimaryActionStack,
                      st.matchActionRow,
                      isDesktopWeb && st.matchActionRowDesktop,
                    ]}
                  >
                    <Pressable
                      style={({ hovered, pressed }) => [
                        st.primaryBtn,
                        st.secondaryBtn,
                        !isDesktopWeb && st.mobilePrimaryActionButton,
                        isDesktopWeb && st.primaryBtnDesktop,
                        isDesktopWeb && st.matchActionButtonDesktop,
                        getInteractiveStateStyle("light", hovered, pressed),
                      ]}
                      onPress={revealMatchAnswer}
                    >
                      <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                        Show answer
                      </Text>
                    </Pressable>
                    {isDesktopWeb ? (
                      <Pressable
                        style={({ hovered, pressed }) => [
                          st.primaryBtn,
                          st.secondaryBtn,
                          isDesktopWeb && st.primaryBtnDesktop,
                          isDesktopWeb && st.matchActionButtonDesktop,
                          getInteractiveStateStyle("light", hovered, pressed),
                        ]}
                        onPress={continueToNextRound}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Skip
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [
                          st.mobileInlineActionButton,
                          pressed && st.mobileInlineActionButtonPressed,
                        ]}
                        onPress={continueToNextRound}
                      >
                        <Text style={st.mobileInlineActionText}>Skip</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}
              {!isDesktopWeb ? renderLessonUtilities() : null}
              </View>
              {isDesktopWeb ? practiceControls : null}
            </View>
          </Animated.View>
        )}
        </View>
      </ScrollView>

      <Modal
        visible={sentenceReportOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSentenceReportOpen(false)}
      >
        <Pressable
          style={st.reportModalBackdrop}
          onPress={() => setSentenceReportOpen(false)}
        >
          <Pressable style={st.reportModalCard} onPress={() => {}}>
            <View style={st.reportModalHeader}>
              <Text style={st.reportModalTitle}>Report sentence issue</Text>
              <Pressable
                onPress={() => setSentenceReportOpen(false)}
                style={({ hovered, pressed }) => [
                  st.reportModalClose,
                  getInteractiveStateStyle("light", hovered, pressed),
                ]}
              >
                <Ionicons name="close" size={18} color={Sketch.ink} />
              </Pressable>
            </View>

            {!sentenceReportSent ? (
              <TextInput
                ref={sentenceReportInputRef}
                value={sentenceReportDraft}
                onChangeText={setSentenceReportDraft}
                  placeholder="Example: Tone color is wrong, audio doesn't match, or translation is unnatural."
                placeholderTextColor="#8D8D8D"
                style={st.reportModalInput}
                editable={!sentenceReportBusy}
                multiline
                textAlignVertical="top"
              />
            ) : null}

            {sentenceReportStatus ? (
              <Text
                style={[
                  st.sentenceReportStatus,
                  sentenceReportStatus.kind === "success" &&
                    st.sentenceReportStatusSuccess,
                  sentenceReportStatus.kind === "error" &&
                    st.sentenceReportStatusError,
                ]}
              >
                {sentenceReportStatus.message}
              </Text>
            ) : null}

            <View style={st.reportModalActions}>
              <Pressable
                onPress={() => setSentenceReportOpen(false)}
                disabled={sentenceReportBusy}
                style={({ hovered, pressed }) => [
                  st.reportModalSecondaryButton,
                  getInteractiveStateStyle(
                    "light",
                    hovered,
                    pressed,
                    sentenceReportBusy,
                  ),
                ]}
              >
                <Text style={st.reportModalSecondaryButtonText}>
                  {sentenceReportSent ? "Close" : "Cancel"}
                </Text>
              </Pressable>
              {!sentenceReportSent ? (
                <Pressable
                  onPress={() => {
                    void submitSentenceReport();
                  }}
                  disabled={sentenceReportBusy}
                  style={({ hovered, pressed }) => [
                    st.reportModalSendButton,
                    getInteractiveStateStyle(
                      "navy",
                      hovered,
                      pressed,
                      sentenceReportBusy,
                    ),
                  ]}
                >
                  <Text style={st.reportModalSendButtonText}>
                    {sentenceReportBusy ? "Sending..." : "Send"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
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
  return isDesktopWeb ? (
    <DesktopAppShell>{exerciseScreen}</DesktopAppShell>
  ) : (
    exerciseScreen
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { paddingBottom: 64 },
  scrollDesktop: { paddingBottom: 88 },
  pageFrame: {
    width: "100%",
  },
  pageFrameDesktop: {
    width: "100%",
      maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 12,
  },

  loadingWrap: { alignItems: "center", paddingTop: 120, gap: 14 },
  premiumBlockWrap: { paddingTop: 18 },
  loadingPulse: {
    width: 40,
    height: 40,
    borderRadius: AppRadius.lg,
    backgroundColor: Sketch.inkFaint,
  },
  loadingLabel: { fontSize: 14, color: Sketch.inkMuted, fontWeight: "600" },
  practiceWorkspace: {
    width: "100%",
  },
  practiceWorkspaceDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  practiceMainDesktop: {
    flex: 1,
    minWidth: 0,
  },

  methodsPanel: {
    width: "100%",
  },
  methodsPanelMobile: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  methodsPanelDesktop: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingHorizontal: 0,
    paddingTop: 18,
  },
  methodsPanelSidebarDesktop: {
      width: 252,
      paddingHorizontal: 0,
      paddingTop: 96,
      flexShrink: 0,
    },
  methodsCard: {
    gap: 14,
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.lg,
    padding: 16,
    boxShadow: WEB_CARD_SHADOW as any,
    overflow: "visible",
    position: "relative",
    zIndex: 1,
  },
  methodsCardMobile: {
    padding: 14,
    gap: 10,
  },
  methodsCardSidebarDesktop: {
    gap: 12,
    padding: 14,
    zIndex: 20,
  },
  methodsHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    position: "relative",
    zIndex: 4,
    overflow: "visible",
  },
  methodsHeaderRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 0,
  },
  methodsHeaderRowSidebar: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
  },
  methodsHeaderText: {
    flex: 1,
    gap: 2,
  },
  methodsEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    fontFamily: WEB_BODY_FONT,
  },
  methodsSubcopy: {
    fontSize: 13,
    lineHeight: 18,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  methodsActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    position: "relative",
    zIndex: 5,
    overflow: "visible",
  },
  methodsActionsMobile: {
    width: "100%",
    justifyContent: "flex-end",
  },
  methodsActionsSidebar: {
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
  },
  methodsMeta: {
    fontSize: 12,
    color: Sketch.inkMuted,
    fontWeight: "500",
    fontFamily: WEB_BODY_FONT,
  },
  methodsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  methodsRowMobile: {
    gap: 8,
  },
  methodsRowDesktopSidebar: {
    flexDirection: "column",
    flexWrap: "nowrap",
    gap: 8,
  },
  methodChip: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.md,
    backgroundColor: AppSketch.surface,
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  methodChipMobile: {
    flex: 0,
    flexBasis: "31%",
    minWidth: 0,
    paddingHorizontal: 10,
  },
  methodChipDesktop: {
    cursor: "pointer",
  },
  methodChipSidebarDesktop: {
    width: "100%",
    minHeight: 58,
    flex: 0,
  },
  methodChipCurrent: {
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  methodChipDisabled: {
    backgroundColor: AppSketch.surface,
    borderColor: AppSketch.border,
    opacity: 0.6,
  },
  methodChipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  methodChipRowMobile: {
    justifyContent: "center",
  },
  methodChipCopy: {
    flex: 1,
    gap: 2,
  },
  methodChipMeta: {
    fontSize: 11,
    color: Sketch.inkMuted,
    fontWeight: "500",
    fontFamily: WEB_BODY_FONT,
  },
  methodChipLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  methodChipLabelMobile: {
    textAlign: "center",
  },
  methodChipLabelCurrent: {
    color: Sketch.accentDark,
  },
  methodChipLabelDisabled: {
    color: Sketch.inkMuted,
  },
  methodBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.full,
  },
  methodBadgePending: {
    borderColor: Sketch.inkMuted,
    backgroundColor: Sketch.paper,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.accentDark,
    letterSpacing: 0.2,
  },
  methodBadgeTextPending: {
    color: Sketch.inkMuted,
  },
  methodToggle: {
    width: 42,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.borderLight,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  methodToggleOn: {
    borderColor: CONTROL_PANEL_ACCENT.border,
    backgroundColor: CONTROL_PANEL_ACCENT.fill,
    alignItems: "flex-end",
  },
  methodTogglePending: {
    borderColor: AppSketch.border,
  },
  methodToggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  methodToggleKnobOn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  methodToggleKnobPending: {
    backgroundColor: "#FFFFFF",
    borderColor: AppSketch.border,
  },
  methodsNote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  methodsNoteMuted: {
    color: Sketch.inkMuted,
  },
  methodsNoteWarning: {
    color: Sketch.red,
  },
  displayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppSketch.border,
  },
  displayRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: 10,
  },
  displayRowDesktop: {
    alignItems: "center",
  },
  displayRowSidebarDesktop: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexDirection: "column",
    gap: 10,
  },
  displayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  displayChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
    flex: 1,
  },
  displayChipRowMobile: {
    justifyContent: "flex-start",
    width: "100%",
    flex: 0,
  },
  displayChipRowSidebarDesktop: {
    width: "100%",
    flexDirection: "column",
    flexWrap: "nowrap",
    justifyContent: "flex-start",
    gap: 8,
    flex: 0,
  },
  displayChip: {
    minHeight: 34,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.md,
    backgroundColor: AppSketch.surface,
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  displayChipMobile: {
    flex: 1,
    minWidth: 0,
  },
  displayChipDesktop: {
    cursor: "pointer",
  },
  displayChipSidebarDesktop: {
    width: "100%",
    minHeight: 38,
  },
  displayOptionList: {
    width: "100%",
    gap: 10,
  },
  displayOptionRow: {
    width: "100%",
    minHeight: 44,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.md,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  displayOptionRowActive: {
    borderColor: AppSketch.border,
  },
  displayOptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  displayOptionLabelActive: {
    color: Sketch.ink,
  },
  displayOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  displayOptionCheckActive: {
    borderColor: CONTROL_PANEL_ACCENT.border,
    backgroundColor: CONTROL_PANEL_ACCENT.fill,
  },
  displayChipActive: {
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  displayChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  displayChipTextActive: {
    color: Sketch.accentDark,
  },
  lessonMetaSection: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: AppSketch.border,
    gap: 12,
  },
  lessonMetaSectionMobile: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  lessonMetaHeader: {
    gap: 2,
  },
  lessonMetaLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  lessonMetaHint: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  },
  trackerRow: {
    flexDirection: "row",
    gap: 10,
  },
  trackerRowMobileCompact: {
    gap: 8,
  },
  mobileLessonUtilitiesWrap: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 10,
  },
  mobileLessonUtilitiesCard: {
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.lg,
    padding: 14,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  trackerCard: {
    flex: 1,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  trackerCardMobileCompact: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 2,
  },
  trackerValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Sketch.accentDark,
    fontFamily: WEB_DISPLAY_FONT,
  },
  trackerValueMobileCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  trackerCaption: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  trackerCaptionMobileCompact: {
    fontSize: 11,
  },
  lessonMetaDivider: {
    height: 1,
    backgroundColor: AppSketch.border,
  },
  lessonNavExerciseRow: {
    gap: 10,
  },
  lessonNavExerciseRowMobile: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  lessonNavExerciseRowMobileCompact: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  lessonNavExerciseRowDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  lessonNavExerciseButton: {
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  lessonNavExerciseButtonMobile: {
    flex: 1,
    minWidth: 0,
  },
  lessonNavExerciseButtonMobileCompact: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },
  lessonNavExerciseButtonDesktop: {
    flex: 1,
  },
  lessonNavExerciseButtonDisabled: {
    backgroundColor: AppSketch.surface,
    opacity: 0.6,
  },
  lessonNavExerciseLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  lessonNavExerciseLabelDisabled: {
    color: Sketch.inkMuted,
  },
  lessonNavExerciseTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  lessonNavExerciseCompactLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 0.5,
    fontFamily: WEB_BODY_FONT,
  },
  lessonNavExerciseCompactTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  lessonNavExerciseTitleDisabled: {
    color: Sketch.inkMuted,
  },

  modeHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    position: "relative",
    zIndex: 8,
    overflow: "visible",
  },
  modeHeaderDesktop: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingHorizontal: 0,
    paddingTop: 18,
    paddingBottom: 2,
  },
  modeTagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modeTag: {
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1.5,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.2,
  },
  modeTitleMobile: {
    flex: 1,
    minWidth: 0,
  },
  modeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    position: "relative",
    zIndex: 9,
    overflow: "visible",
  },
  modeTitleRowMobile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  modeHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  modeHeaderActionsMobile: {
    width: "auto",
    justifyContent: "flex-end",
    gap: 8,
  },
  lessonShortcut: {
    paddingVertical: 2,
  },
  lessonShortcutMobile: {
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  lessonShortcutText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accentDark,
    letterSpacing: 0.1,
  },
  lessonShortcutTextMobile: {
    color: Sketch.ink,
  },
  modeHeaderLessonShortcutMobile: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
  exerciseWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 18,
  },
  exerciseWrapDesktop: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingHorizontal: 0,
    paddingTop: 22,
    gap: 24,
  },

  studyCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 22,
    alignItems: "center",
    ...sketchShadow(2),
  },
  studyCardDesktop: {
    width: "100%",
    padding: 26,
    alignItems: "flex-start",
  },
  speakerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    marginBottom: 16,
    alignSelf: "center",
  },
  speakerBtnDesktop: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  speakerIcon: { fontSize: 18 }, // kept for safety, unused
  studySentence: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: Sketch.ink,
    lineHeight: 34,
    marginBottom: 6,
  },
  studySentenceDesktop: {
    fontSize: 34,
    lineHeight: 46,
    textAlign: "left",
    marginBottom: 10,
    maxWidth: 820,
  },
  studyRoman: {
    fontSize: 13,
    color: Sketch.inkMuted,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  studyRomanDesktop: {
    textAlign: "left",
    fontSize: 15,
    marginBottom: 18,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: Sketch.inkFaint,
    borderRadius: AppRadius.full,
    marginBottom: 16,
  },
  studyEnglish: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.inkLight,
    textAlign: "center",
    lineHeight: 22,
  },
  studyEnglishDesktop: {
    textAlign: "left",
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 780,
  },
  studyExamplesGrid: {
    gap: 12,
  },
  studyExamplesGridDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  studyExampleCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 10,
    ...sketchShadow(1),
  },
  studyExampleCardDesktop: {
    flex: 1,
    minHeight: 188,
  },
  studyExampleCardSelected: {
    borderColor: Sketch.ink,
  },
  studyExampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  studyExampleHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  studyExampleEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  studyExampleAudio: {
    width: 32,
    height: 32,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.cardBg,
  },
  studyExampleSentence: {
    fontSize: 24,
    lineHeight: 33,
    fontWeight: "700",
    color: Sketch.ink,
  },
  studyExampleRoman: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  studyExampleEnglish: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
  studyBreakdownCard: {
    gap: 12,
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    ...sketchShadow(1),
  },
  studyBreakdownCardDesktop: {
    padding: 18,
  },
  studyBreakdownHeader: {
    gap: 4,
  },
  studyBreakdownHint: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.inkMuted,
  },

  tileSection: { gap: 10 },
  tileSectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
  },

  // ── Shared word tile — used in breakdown, wordScraps, and matchThai ──
  tileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignSelf: "flex-start",
  },
  tileRowDesktop: {
    width: "100%",
    gap: 12,
    justifyContent: "flex-start",
  },
  tileRowDesktopCentered: {
    justifyContent: "center",
  },
  matchTileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignSelf: "stretch",
    justifyContent: "flex-start",
  },
  matchTileRowDesktopCentered: {
    justifyContent: "center",
  },
  wordTile: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    alignSelf: "flex-start",
    minWidth: 64,
    maxWidth: "100%",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  wordTileDesktop: {
    minWidth: 128,
    paddingVertical: 12,
    paddingHorizontal: 16,
    cursor: "pointer",
  },
  wordTilePressed: {
    ...LIGHT_BUTTON_PRESSED,
  },
  wordTileUsed: {
    opacity: 0.38,
  },
  wordTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  wordTileThai: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
    flexShrink: 1,
    fontFamily: WEB_THAI_FONT,
  },
  matchWordTile: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    alignSelf: "flex-start",
    minWidth: 0,
    maxWidth: "100%",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  matchWordTileDesktop: {
    minWidth: 92,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    cursor: "pointer",
  },
  matchWordTilePressed: {
    ...LIGHT_BUTTON_PRESSED,
  },
  matchWordTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  matchWordTileHeaderDesktop: {
    alignSelf: "center",
  },
  matchWordTileThai: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
    flexShrink: 1,
    fontFamily: WEB_THAI_FONT,
  },
  matchWordTileRoman: {
    fontSize: 9,
    fontWeight: "500",
    color: Sketch.inkMuted,
    opacity: 0.9,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  matchWordTileEng: {
    fontSize: 8,
    fontWeight: "600",
    color: Sketch.inkLight,
    opacity: 0.9,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  wordTileRoman: {
    fontSize: 10,
    fontWeight: "500",
    color: Sketch.inkMuted,
    opacity: 0.9,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  wordTileEng: {
    fontSize: 9,
    fontWeight: "600",
    color: Sketch.inkLight,
    opacity: 0.9,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  toneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
  },
  toneDots: {
    marginLeft: 2,
  },

  primaryBtn: {
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.primaryDark,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  primaryBtnDesktop: {
    alignSelf: "flex-start",
    minWidth: 240,
    paddingHorizontal: 28,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.1,
    fontFamily: WEB_BODY_FONT,
  },
  secondaryBtn: {
    backgroundColor: AppSketch.surface,
    borderColor: AppSketch.border,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  webInteractivePressed: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
  },
  webLightInteractivePressed: {
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  webNavyInteractivePressed: {
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  secondaryBtnText: {
    color: Sketch.ink,
  },
  promptCard: {
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  promptCardDesktop: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "flex-start",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  promptCardDesktopCompact: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    paddingVertical: 18,
    paddingHorizontal: 18,
    overflow: "visible",
    position: "relative",
    zIndex: 8,
  },
  promptCardHeaderRow: {
    gap: 12,
  },
  promptCardHeaderRowDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    overflow: "visible",
  },
  promptCardTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  promptCardActionCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: WEB_BODY_FONT,
  },
  promptText: {
    fontSize: 17,
    fontWeight: "600",
    color: Sketch.ink,
    lineHeight: 24,
    fontFamily: WEB_DISPLAY_FONT,
  },
  buildCard: {
    gap: 16,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    padding: 18,
    boxShadow: WEB_CARD_SHADOW as any,
    overflow: "visible",
    position: "relative",
    zIndex: 1,
  },
  buildCardDesktop: {
    gap: 18,
    padding: 18,
  },
  buildSection: {
    gap: 10,
  },
  buildSectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  },
  availableWordsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    position: "relative",
    zIndex: 5,
    overflow: "visible",
  },
  buildDivider: {
    height: 1,
    backgroundColor: AppSketch.border,
  },

  progressTrack: {
    height: 6,
    backgroundColor: Sketch.inkFaint,
    borderRadius: AppRadius.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.ink,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Sketch.accent,
    borderRadius: AppRadius.full,
  },

  builderZone: {
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.lg,
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  builderZoneDesktop: {
    width: "100%",
    minHeight: 72,
  },
  builderCorrect: {
    borderColor: EXERCISE_FEEDBACK_COLORS.correct.border,
    borderStyle: "solid",
    backgroundColor: AppSketch.surface,
    borderWidth: 2,
  },
  builderCorrectMobile: {
    backgroundColor: AppSketch.surface,
  },
  builderRevealed: {
    borderColor: EXERCISE_FEEDBACK_COLORS.revealed.border,
    borderStyle: "solid",
    backgroundColor: AppSketch.surface,
    borderWidth: 2,
  },
  builderRevealedMobile: {
    backgroundColor: AppSketch.surface,
  },
  builderWrong: {
    borderColor: EXERCISE_FEEDBACK_COLORS.incorrect.border,
    borderStyle: "solid",
    backgroundColor: Sketch.cardBg,
  },
  builderWrongMobile: {
    backgroundColor: EXERCISE_FEEDBACK_COLORS.incorrect.tint,
  },
  builderPlaceholder: {
    fontSize: 14,
    color: Sketch.inkMuted,
    fontWeight: "500",
    fontFamily: WEB_BODY_FONT,
  },
  builderPlaceholderResultOk: {
    color: EXERCISE_FEEDBACK_COLORS.correct.text,
    fontWeight: "600",
  },
  builderPlaceholderResultRevealed: {
    color: EXERCISE_FEEDBACK_COLORS.revealed.text,
    fontWeight: "600",
  },
  builderPlaceholderResultBad: {
    color: EXERCISE_FEEDBACK_COLORS.incorrect.text,
    fontWeight: "600",
  },
  builderWords: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 8,
  },
  builderWordsDesktop: {
    width: "100%",
    justifyContent: "center",
    alignSelf: "center",
  },
  builderTile: {
    alignItems: "center",
    justifyContent: "center",
  },
  builderTileLocked: {
    backgroundColor: "#F5F5F5",
  },
  builderTileContent: {
    alignItems: "center",
    alignSelf: "center",
  },
  builderTileContentMuted: {
    opacity: 0.58,
  },
  builderTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  builderTileThai: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
    fontFamily: WEB_THAI_FONT,
  },
  builderTileRoman: {
    fontSize: 10,
    fontWeight: "500",
    color: Sketch.inkMuted,
    opacity: 0.9,
    marginTop: 4,
    letterSpacing: 0.3,
    textAlign: "center",
    alignSelf: "center",
  },
  builderTileEng: {
    fontSize: 9,
    fontWeight: "600",
    color: Sketch.inkLight,
    opacity: 0.9,
    marginTop: 3,
    letterSpacing: 0.5,
    textAlign: "center",
    alignSelf: "center",
  },
  builderChip: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: AppSketch.border,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  builderChipText: {
    fontSize: 22,
    fontWeight: "800",
    color: Sketch.ink,
    fontFamily: WEB_THAI_FONT,
  },
  builderChipLocked: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: AppSketch.border,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  builderChipLockedText: {
    fontSize: 22,
    fontWeight: "800",
    color: Sketch.inkMuted,
    fontFamily: WEB_THAI_FONT,
  },
  builderSlotEmpty: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: AppSketch.border,
    minWidth: 44,
    alignItems: "center" as const,
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  builderSlotEmptyText: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "800",
    color: Sketch.inkFaint,
    textAlign: "center",
    fontFamily: WEB_THAI_FONT,
  },

  actionRow: { flexDirection: "row", gap: 10 },
  actionRowDesktop: {
    width: "100%",
    justifyContent: "space-between",
  },
  ctaRowDesktop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginTop: 4,
    position: "relative",
    zIndex: 0,
  },
  ctaButtonDesktop: {
    flex: 1,
    minWidth: 0,
    marginTop: 0,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppSketch.border,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },

  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: AppRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: AppSketch.surface,
  },
  resultOk: {
    backgroundColor: AppSketch.surface,
    borderColor: EXERCISE_FEEDBACK_COLORS.correct.border,
    borderWidth: 2,
  },
  resultOkMobile: {
    backgroundColor: AppSketch.surface,
  },
  resultRevealed: {
    backgroundColor: AppSketch.surface,
    borderColor: AppSketch.border,
    borderWidth: 1,
  },
  resultRevealedMobile: {
    backgroundColor: AppSketch.surface,
  },
  resultBad: {
    backgroundColor: Sketch.cardBg,
    borderColor: EXERCISE_FEEDBACK_COLORS.incorrect.border,
  },
  resultBadMobile: {
    backgroundColor: EXERCISE_FEEDBACK_COLORS.incorrect.tint,
  },
  resultLabel: { fontSize: 14, fontWeight: "700", letterSpacing: 0.1 },

  matchCard: {
    gap: 16,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    padding: 18,
    boxShadow: WEB_CARD_SHADOW as any,
    overflow: "visible",
    position: "relative",
    zIndex: 1,
  },
  matchCardDesktop: {
    gap: 18,
    padding: 18,
  },
  matchHelperText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  },
  matchList: {
    gap: 12,
  },
  matchListDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 12,
  },
  optionsGrid: { gap: 10 },
  optionsGridDesktop: {
    width: "100%",
    gap: 12,
  },
  optionCard: {
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    padding: 14,
    gap: 8,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  optionCardDesktop: {
    width: "48.9%",
    maxWidth: "48.9%",
    minHeight: 0,
    alignSelf: "flex-start",
  },
  matchSentenceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    borderRadius: AppRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 0,
  },
  matchSentenceButtonDesktop: {
    alignItems: "center",
  },
  matchSentenceTapArea: {
    flex: 1,
    gap: 4,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  matchSentenceTapAreaDesktop: {
    alignItems: "flex-start",
  },
  matchSentenceText: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "left",
    width: "100%",
    fontFamily: WEB_THAI_FONT,
  },
  matchSentenceTextDesktop: {
    textAlign: "left",
  },
  matchSentenceRoman: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "left",
    width: "100%",
    fontFamily: WEB_BODY_FONT,
  },
  matchSentenceRomanDesktop: {
    textAlign: "left",
  },
  matchOptionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    alignSelf: "center",
  },
  matchExpandButton: {
    width: 32,
    height: 32,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  matchExpandButtonActive: {
    borderColor: MUTED_FEEDBACK_ACCENTS.selectedBorder,
    backgroundColor: Sketch.cardBg,
  },
  matchDetailsPanel: {
    paddingTop: 10,
  },
  matchActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  mobilePrimaryActionStack: {
    width: "100%",
    alignItems: "stretch",
    gap: 4,
  },
  mobilePrimaryActionButton: {
    width: "100%",
    alignSelf: "stretch",
  },
  mobileInlineActionButton: {
    alignSelf: "center",
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileInlineActionButtonPressed: {
    opacity: 0.55,
  },
  mobileInlineActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 0.1,
    fontFamily: WEB_BODY_FONT,
  },
  secondaryActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryActionButton: {
    flex: 1,
    minWidth: 0,
  },
  revealedActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  revealedActionButton: {
    flex: 1,
    minWidth: 0,
  },
  matchActionRowDesktop: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    position: "relative",
    zIndex: 0,
  },
  matchActionButtonDesktop: {
    flex: 1,
    minWidth: 0,
  },
  toneGuideShell: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 120,
  },
  toneGuideStandaloneLabel: {
    color: Sketch.inkMuted,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
    fontFamily: WEB_BODY_FONT,
    transform: [{ translateY: 1 }],
  },
  toneGuideInlineTriggerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    position: "relative",
    overflow: "visible",
  },
  toneGuideButton: {
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  toneGuideHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  toneGuideButtonPressed: {
    ...(Platform.OS === "web"
      ? {
          transform: WEB_DEPRESSED_TRANSFORM as any,
          boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
        }
      : LIGHT_BUTTON_PRESSED),
  },
  toneGuidePopover: {
    position: "absolute",
    top: 46,
    right: 0,
    zIndex: 300,
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    boxShadow: "0 12px 26px rgba(16, 42, 67, 0.08)" as any,
  },
  toneGuideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toneGuidePopoverDot: {
    borderWidth: 1,
    borderColor: "rgba(16, 42, 67, 0.08)",
  },
  toneGuidePopoverText: {
    color: Sketch.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500",
    fontFamily: WEB_BODY_FONT,
  },
  sentenceReportAlertButton: {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  sentenceReportAlertText: {
    color: Sketch.ink,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "800",
    fontFamily: WEB_DISPLAY_FONT,
  },
  sentenceReportStatus: {
    color: Sketch.inkMuted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: WEB_BODY_FONT,
  },
  sentenceReportStatusSuccess: {
    color: Sketch.ink,
  },
  sentenceReportStatusError: {
    color: Sketch.inkMuted,
  },
  reportModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16,42,67,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  reportModalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  reportModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reportModalTitle: {
    color: Sketch.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    fontFamily: WEB_DISPLAY_FONT,
  },
  reportModalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  reportModalInput: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Sketch.ink,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: WEB_BODY_FONT,
  },
  reportModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },
  reportModalSecondaryButton: {
    height: 40,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  reportModalSecondaryButtonText: {
    color: Sketch.ink,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  reportModalSendButton: {
    height: 40,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppSketch.primaryDark,
    backgroundColor: AppSketch.primary,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
  },
  reportModalSendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  toneGuideDots: {
    flexDirection: "row",
    gap: 6,
  },
  toneGuideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

});
