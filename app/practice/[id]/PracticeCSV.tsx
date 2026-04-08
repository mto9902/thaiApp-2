import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { isGuestUser } from "../../../src/utils/auth";

import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header, { SettingsState } from "../../../src/components/Header";
import PremiumGateCard from "../../../src/components/PremiumGateCard";
import ToneDots from "../../../src/components/ToneDots";
import ToneGuide, { ToneGuideButton } from "../../../src/components/ToneGuide";
import ToneThaiText from "../../../src/components/ToneThaiText";

import { Sketch, sketchShadow } from "@/constants/theme";
import { AppRadius } from "@/constants/theme-app";
import { DESKTOP_PAGE_WIDTHS } from "@/src/components/web/desktopLayout";
import { getPractice } from "../../../src/api/getPractice";
import { API_BASE } from "../../../src/config";
import { useGrammarCatalog } from "../../../src/grammar/GrammarCatalogProvider";
import { useAdjacentGrammarPoint } from "../../../src/grammar/useAdjacentGrammarPoint";
import { useSentenceAudio } from "../../../src/hooks/useSentenceAudio";
import { isPremiumGrammarPoint } from "../../../src/subscription/premium";
import { useSubscription } from "../../../src/subscription/SubscriptionProvider";
import { getProgress, saveRound } from "../../../src/utils/grammarProgress";
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
    border: Sketch.accent,
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
    border: "#C7D1DC",
    text: Sketch.accentDark,
    subtext: Sketch.accentLight,
  },
} as const;

const CONTROL_PANEL_ACCENT = {
  border: "#5A6470",
  fill: "#3F4B58",
} as const;

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

function buildMatchOptions(
  correct: SentenceData,
  distractors: SentenceData[],
): MatchOption[] {
  const unique = distractors.filter((d) => d.thai !== correct.thai);
  const picked = unique.slice(0, 3);
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
  const [result, setResult] = useState<ResultState>("");
  const [toneGuideVisible, setToneGuideVisible] = useState(false);
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
  const [premiumBlocked, setPremiumBlocked] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [lifetimeRounds, setLifetimeRounds] = useState(0);
  const [sessionRounds, setSessionRounds] = useState(0);
  const { isPremium, loading: premiumLoading } = useSubscription();
  const canPlayBreakdownTiles = isDesktopWeb || wordBreakdownTTS;
  const selectedStudyExample =
    mode === "breakdown"
      ? studyExamples[selectedStudyIndex] || studyExamples[0] || null
      : null;
  const activeBreakdown = selectedStudyExample?.breakdown || breakdown;
  const activeRomanTokens = selectedStudyExample?.romanTokens || romanTokens;

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

    void getProgress(singleLessonId)
      .then((progress) => {
        if (!cancelled) {
          setLifetimeRounds(progress?.rounds ?? 0);
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

  async function toggleDisplaySetting(target: "roman" | "english") {
    const isRoman = target === "roman";
    const storageKey = isRoman ? PREF_ROMANIZATION : PREF_ENGLISH;
    const currentValue = isRoman ? showRoman : showEnglish;
    const nextValue = !currentValue;

    if (isRoman) {
      setShowRoman(nextValue);
    } else {
      setShowEnglish(nextValue);
    }

    try {
      await AsyncStorage.setItem(storageKey, String(nextValue));
    } catch (error) {
      console.error("Failed to update display setting:", error);
      if (isRoman) {
        setShowRoman(currentValue);
      } else {
        setShowEnglish(currentValue);
      }
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

  async function trackWords(
    wordsToTrack: SentenceData["breakdown"],
    trigger: string,
    romanTokensForWords?: string[],
  ) {
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
  }

  function getCurrentGrammarId(): string | null {
    return currentGrammarIdRef.current;
  }

  function recordRound(wasCorrect: boolean) {
    const grammarId = getCurrentGrammarId();
    if (!grammarId) return;
    void saveRound(grammarId, wasCorrect);
    if (singleLessonId && grammarId === singleLessonId) {
      setLifetimeRounds((current) => current + 1);
      setSessionRounds((current) => current + 1);
    }
  }

  function continueToNextRound() {
    void fetchRound(randomMode(enabledModesRef.current, modeHistoryRef.current));
  }

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
      setMethodsGuardMessage(null);
      setResult("");
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
        const extras = await Promise.all([
          fetchSentence(gobj.id),
          fetchSentence(gobj.id),
          fetchSentence(gobj.id),
        ]);
        setMatchOptions(buildMatchOptions(main, extras));
      }

      setMode(nextMode);
      modeHistoryRef.current = [...modeHistoryRef.current.slice(-1), nextMode];
      fadeIn();
    } catch (err) {
      console.error(`[Round ${round}] fetchRound FAILED:`, err);
    } finally {
      setLoading(false);
    }
  }, [
    fadeIn,
    fetchSentence,
    fetchStudyExamples,
    findGrammarById,
    getCurrentMixGrammarId,
    grammarObject,
    mixSource,
  ]);

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

  function checkWordScraps() {
    if (result === "correct") return;
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
  }

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
  const showLessonShortcut =
    (mixSource === "bookmarks" || mixSource === "progress") && Boolean(grammarPoint?.id);
  const resultPalette =
    result === "correct"
      ? EXERCISE_FEEDBACK_COLORS.correct
      : result === "revealed"
        ? EXERCISE_FEEDBACK_COLORS.revealed
        : EXERCISE_FEEDBACK_COLORS.incorrect;
  const practiceControls = (
    <View
      style={[
        st.methodsPanel,
        isDesktopWeb ? st.methodsPanelSidebarDesktop : st.methodsPanelDesktop,
      ]}
    >
      <View
        style={[
          st.methodsCard,
          isDesktopWeb && st.methodsCardSidebarDesktop,
          !isDesktopWeb && st.methodsCardDesktop,
        ]}
      >
        <View
          style={[
            st.methodsHeaderRow,
            isDesktopWeb && st.methodsHeaderRowSidebar,
          ]}
        >
          <View style={st.methodsHeaderText}>
            <Text style={st.methodsEyebrow}>Practice controls</Text>
            <Text style={st.methodsSubcopy}>
              Choose how this lesson appears.
            </Text>
          </View>
          <View
            style={[
              st.methodsActions,
              isDesktopWeb && st.methodsActionsSidebar,
            ]}
          >
            <Text style={st.methodsMeta}>Saved in settings</Text>
            <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
          </View>
        </View>
        <View
          style={[st.methodsRow, isDesktopWeb && st.methodsRowDesktopSidebar]}
        >
          {ALL_MODES.map((practiceMode) => {
            const isEnabled = enabledModes[practiceMode];
            const isCurrent = mode === practiceMode;
            const isCurrentRoundOnly = isCurrent && !isEnabled;
            const showCurrentBadge = isCurrent;

            return (
              <TouchableOpacity
                key={practiceMode}
                style={[
                  st.methodChip,
                  isCurrent && st.methodChipCurrent,
                  !isEnabled && !isCurrentRoundOnly && st.methodChipDisabled,
                  isDesktopWeb && st.methodChipSidebarDesktop,
                ]}
                onPress={() => void togglePracticeMethod(practiceMode)}
                activeOpacity={0.85}
              >
                <View style={st.methodChipRow}>
                  <View style={st.methodChipCopy}>
                    <Text
                      style={[
                        st.methodChipLabel,
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
              </TouchableOpacity>
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
        <View
          style={[
            st.displayRow,
            isDesktopWeb && st.displayRowSidebarDesktop,
          ]}
        >
          <Text style={st.displayLabel}>Display</Text>
          {isDesktopWeb ? (
            <View style={st.displayOptionList}>
              <TouchableOpacity
                style={[
                  st.displayOptionRow,
                  showRoman && st.displayOptionRowActive,
                ]}
                onPress={() => void toggleDisplaySetting("roman")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    st.displayOptionLabel,
                    showRoman && st.displayOptionLabelActive,
                  ]}
                >
                  Romanization
                </Text>
                  <View
                    style={[
                      st.displayOptionCheck,
                      showRoman && st.displayOptionCheckActive,
                    ]}
                  >
                    {showRoman ? (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    ) : null}
                  </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  st.displayOptionRow,
                  showEnglish && st.displayOptionRowActive,
                ]}
                onPress={() => void toggleDisplaySetting("english")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    st.displayOptionLabel,
                    showEnglish && st.displayOptionLabelActive,
                  ]}
                >
                  Translation
                </Text>
                  <View
                    style={[
                      st.displayOptionCheck,
                      showEnglish && st.displayOptionCheckActive,
                    ]}
                  >
                    {showEnglish ? (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    ) : null}
                  </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                st.displayChipRow,
                isDesktopWeb && st.displayChipRowSidebarDesktop,
              ]}
            >
              <TouchableOpacity
                style={[
                  st.displayChip,
                  showRoman && st.displayChipActive,
                  isDesktopWeb && st.displayChipSidebarDesktop,
                ]}
                onPress={() => void toggleDisplaySetting("roman")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    st.displayChipText,
                    showRoman && st.displayChipTextActive,
                  ]}
                >
                  Romanization
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  st.displayChip,
                  showEnglish && st.displayChipActive,
                  isDesktopWeb && st.displayChipSidebarDesktop,
                ]}
                onPress={() => void toggleDisplaySetting("english")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    st.displayChipText,
                    showEnglish && st.displayChipTextActive,
                  ]}
                >
                  Translation
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {showSingleLessonUtilities ? (
          <View style={st.lessonMetaSection}>
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
            <View style={st.lessonNavExerciseRow}>
              <TouchableOpacity
                style={[
                  st.lessonNavExerciseButton,
                  !previous && st.lessonNavExerciseButtonDisabled,
                ]}
                onPress={() =>
                  previous && router.push(`/practice/${previous.id}/exercises`)
                }
                activeOpacity={previous ? 0.85 : 1}
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
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  st.lessonNavExerciseButton,
                  !next && st.lessonNavExerciseButtonDisabled,
                ]}
                onPress={() => next && router.push(`/practice/${next.id}/exercises`)}
                activeOpacity={next ? 0.85 : 1}
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
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (premiumLoading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
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
  }

  if (premiumBlocked) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
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
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
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
              <View style={st.modeTagRow}>
                <View style={st.modeTag}>
                  <Text style={st.modeTagText}>{meta.tag}</Text>
                </View>
              </View>
              <View style={st.modeTitleRow}>
                <Text style={st.modeTitle}>{meta.title}</Text>
                {showLessonShortcut ? (
                  <TouchableOpacity
                    style={st.lessonShortcut}
                    onPress={openCurrentGrammarLesson}
                    activeOpacity={0.75}
                  >
                    <Text style={st.lessonShortcutText}>Open lesson</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
                  <View style={[st.tileRow, isDesktopWeb && st.tileRowDesktop]}>
                    {activeBreakdown.map((w, i) => (
                      canPlayBreakdownTiles ? (
                        <TouchableOpacity
                          key={i}
                          style={[st.wordTile, isDesktopWeb && st.wordTileDesktop]}
                          onPress={() => playBreakdownWord(w.thai)}
                          activeOpacity={0.8}
                        >
                          <View style={st.wordTileHeader}>
                            <ToneThaiText
                              thai={w.thai}
                              tones={getBreakdownTones(w)}
                              romanization={activeRomanTokens[i]}
                              displayThaiSegments={w.displayThaiSegments}
                              style={st.wordTileThai}
                              fallbackColor={Sketch.ink}
                            />
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
                        </TouchableOpacity>
                      ) : (
                        <View
                          key={i}
                          style={[st.wordTile, isDesktopWeb && st.wordTileDesktop]}
                        >
                          <View style={st.wordTileHeader}>
                            <ToneThaiText
                              thai={w.thai}
                              tones={getBreakdownTones(w)}
                              romanization={activeRomanTokens[i]}
                              displayThaiSegments={w.displayThaiSegments}
                              style={st.wordTileThai}
                              fallbackColor={Sketch.ink}
                            />
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

                <TouchableOpacity
                  style={[st.primaryBtn, isDesktopWeb && st.primaryBtnDesktop]}
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
                  activeOpacity={0.85}
                >
                  <Text style={st.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── WORDSCRAPS (Build) ── */}
            {mode === "wordScraps" && (
              <View style={[st.exerciseWrap, isDesktopWeb && st.exerciseWrapDesktop]}>
                <View style={[st.buildCard, isDesktopWeb && st.buildCardDesktop]}>
                  <View style={[st.promptCard, isDesktopWeb && st.promptCardDesktopCompact]}>
                  <Text style={st.promptLabel}>TRANSLATE INTO THAI</Text>
                  <Text style={st.promptText}>{translation}</Text>
                  </View>

                  <View style={st.buildSection}>
                    <Text style={st.buildSectionLabel}>Your answer</Text>
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
                            chips.push(
                              <View
                                key={`pre-${i}`}
                                style={st.builderChipLocked}
                              >
                                <Text style={st.builderChipLockedText}>
                                  {prefilled[i]}
                                </Text>
                              </View>,
                            );
                          } else if (userIdx < builtSentence.length) {
                            const builtWord = builtSentence[userIdx];
                            chips.push(
                              <TouchableOpacity
                                key={`usr-${i}`}
                                style={st.builderChip}
                                onPress={() => removeBuiltWord(builtWord.id)}
                                activeOpacity={result === "revealed" ? 1 : 0.8}
                                disabled={result === "revealed"}
                              >
                                <Text style={st.builderChipText}>
                                  {builtWord.thai}
                                </Text>
                              </TouchableOpacity>,
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
                  <TouchableOpacity
                    style={st.actionBtn}
                    onPress={undoLastWord}
                    activeOpacity={result === "revealed" ? 1 : 0.7}
                    disabled={result === "revealed"}
                  >
                    <Text style={st.actionBtnText}>Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={st.actionBtn}
                    onPress={resetSentence}
                    activeOpacity={result === "revealed" ? 1 : 0.7}
                    disabled={result === "revealed"}
                  >
                    <Text style={st.actionBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>

                {/* wordScraps tiles — same style as breakdown word tiles */}
                <View style={st.buildDivider} />

                <View style={st.availableWordsHeader}>
                  <Text style={st.buildSectionLabel}>Available words</Text>
                  <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
                </View>

                <View style={[st.tileRow, isDesktopWeb && st.tileRowDesktop]}>
                  {words.map((word) => {
                    const isUsed = selectedWordIds.has(word.id);
                    return (
                    <TouchableOpacity
                      key={word.id}
                      style={[
                        st.wordTile,
                        isDesktopWeb && st.wordTileDesktop,
                        isUsed && st.wordTileUsed,
                      ]}
                      onPress={() => {
                        if (isUsed || result === "revealed") return;
                        handleWordTap(word);
                        if (autoplayTTS) {
                          playBreakdownWord(word.thai);
                        }
                      }}
                      activeOpacity={isUsed || result === "revealed" ? 1 : 0.8}
                      disabled={isUsed || result === "revealed"}
                    >
                      <View style={st.wordTileHeader}>
                        <ToneThaiText
                          thai={word.thai}
                          tones={word.tones}
                          romanization={word.roman}
                          displayThaiSegments={word.displayThaiSegments}
                          style={st.wordTileThai}
                          fallbackColor={Sketch.ink}
                        />
                        <ToneDots tones={word.tones} style={st.toneDots} />
                      </View>
                      {showRoman && word.roman ? (
                        <Text style={st.wordTileRoman}>{word.roman}</Text>
                      ) : null}
                      {showEnglish && (
                        <Text style={st.wordTileEng}>{word.english}</Text>
                      )}
                    </TouchableOpacity>
                    );
                  })}
                </View>
                </View>

                {isDesktopWeb ? (
                  <View style={st.ctaRowDesktop}>
                    <TouchableOpacity
                      style={[
                        st.primaryBtn,
                        st.primaryBtnDesktop,
                        st.ctaButtonDesktop,
                        (result === "correct" || result === "revealed") &&
                          st.primaryBtnDisabled,
                      ]}
                      onPress={checkWordScraps}
                      activeOpacity={
                        result === "correct" || result === "revealed" ? 1 : 0.85
                      }
                      disabled={result === "correct" || result === "revealed"}
                    >
                      <Text style={st.primaryBtnText}>Check Answer</Text>
                    </TouchableOpacity>

                    {result === "revealed" ? (
                      <TouchableOpacity
                        style={[
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.primaryBtnDesktop,
                          st.ctaButtonDesktop,
                        ]}
                        onPress={continueToNextRound}
                        activeOpacity={0.85}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Continue
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {result !== "correct" && result !== "revealed" ? (
                      <TouchableOpacity
                        style={[
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.primaryBtnDesktop,
                          st.ctaButtonDesktop,
                        ]}
                        onPress={revealWordScrapsAnswer}
                        activeOpacity={0.85}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Show answer
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {result !== "correct" && result !== "revealed" ? (
                      <TouchableOpacity
                        style={[
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.primaryBtnDesktop,
                          st.ctaButtonDesktop,
                        ]}
                        onPress={continueToNextRound}
                        activeOpacity={0.85}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Skip
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[
                        st.primaryBtn,
                        isDesktopWeb && st.primaryBtnDesktop,
                        (result === "correct" || result === "revealed") &&
                          st.primaryBtnDisabled,
                      ]}
                      onPress={checkWordScraps}
                      activeOpacity={
                        result === "correct" || result === "revealed" ? 1 : 0.85
                      }
                      disabled={result === "correct" || result === "revealed"}
                    >
                      <Text style={st.primaryBtnText}>Check Answer</Text>
                    </TouchableOpacity>

                    {result === "revealed" && (
                      <TouchableOpacity
                        style={[
                          st.primaryBtn,
                          st.secondaryBtn,
                          isDesktopWeb && st.primaryBtnDesktop,
                        ]}
                        onPress={continueToNextRound}
                        activeOpacity={0.85}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Continue
                        </Text>
                      </TouchableOpacity>
                    )}

                    {result !== "correct" && result !== "revealed" && (
                      <TouchableOpacity
                        style={[
                          st.primaryBtn,
                          st.secondaryBtn,
                          isDesktopWeb && st.primaryBtnDesktop,
                        ]}
                        onPress={revealWordScrapsAnswer}
                        activeOpacity={0.85}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Show answer
                        </Text>
                      </TouchableOpacity>
                    )}

                    {result !== "correct" && result !== "revealed" && (
                      <TouchableOpacity
                        style={[
                          st.primaryBtn,
                          st.secondaryBtn,
                          isDesktopWeb && st.primaryBtnDesktop,
                        ]}
                        onPress={continueToNextRound}
                        activeOpacity={0.85}
                      >
                        <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                          Skip
                        </Text>
                      </TouchableOpacity>
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
                  <Text style={st.promptLabel}>CHOOSE THE SENTENCE FOR</Text>
                  <Text style={st.promptText}>{translation}</Text>
                  </View>

                  <Text style={st.matchHelperText}>Select the correct answer</Text>

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
                    let bgColor = Sketch.cardBg;

                    if (matchRevealed) {
                      if (isCorrect) {
                        borderColor = EXERCISE_FEEDBACK_COLORS.correct.border;
                        bgColor = EXERCISE_FEEDBACK_COLORS.correct.tint;
                      } else if (result === "revealed") {
                        borderColor = Sketch.inkFaint;
                        bgColor = Sketch.cardBg;
                      } else if (isSelected && !isCorrect) {
                        borderColor = EXERCISE_FEEDBACK_COLORS.incorrect.border;
                        bgColor = EXERCISE_FEEDBACK_COLORS.incorrect.tint;
                      } else {
                        bgColor = Sketch.paperDark;
                      }
                    } else if (isSelected) {
                      borderColor = MUTED_FEEDBACK_ACCENTS.selectedBorder;
                      bgColor = Sketch.cardBg;
                    }

                    const sentenceBgColor = isCorrect && matchRevealed
                      ? isDesktopWeb
                        ? EXERCISE_FEEDBACK_COLORS.correct.tint
                        : "transparent"
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
                          { borderColor, backgroundColor: bgColor },
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
                            <Text
                              style={[
                                st.matchSentenceText,
                                isDesktopWeb && st.matchSentenceTextDesktop,
                              ]}
                            >
                              {opt.breakdown.length > 0
                                ? opt.breakdown.map((item, itemIndex) => (
                                    <ToneThaiText
                                      key={`${idx}-${itemIndex}-${item.thai}`}
                                      thai={item.thai}
                                      tones={getBreakdownTones(item)}
                                      romanization={
                                        item.romanization || item.roman
                                      }
                                      displayThaiSegments={item.displayThaiSegments}
                                    />
                                  ))
                                : opt.thai}
                            </Text>
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
                            <TouchableOpacity
                              style={[
                                st.matchExpandButton,
                                isExpanded && st.matchExpandButtonActive,
                              ]}
                              onPress={() => toggleMatchOptionExpanded(idx)}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={18}
                                color={isExpanded ? Sketch.ink : Sketch.inkLight}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {isExpanded && (
                          <View style={st.matchDetailsPanel}>
                            <View style={st.matchTileRow}>
                                {opt.breakdown.map((w, wi) => (
                                  canPlayBreakdownTiles ? (
                                    <TouchableOpacity
                                      key={wi}
                                      style={[
                                        st.matchWordTile,
                                        isDesktopWeb && st.matchWordTileDesktop,
                                      ]}
                                      onPress={() => playBreakdownWord(w.thai)}
                                      activeOpacity={0.8}
                                    >
                                    <View
                                      style={[
                                        st.matchWordTileHeader,
                                        isDesktopWeb &&
                                          st.matchWordTileHeaderDesktop,
                                      ]}
                                    >
                                      <ToneThaiText
                                        thai={w.thai}
                                        tones={getBreakdownTones(w)}
                                        romanization={optRomanTokens[wi]}
                                        displayThaiSegments={w.displayThaiSegments}
                                        style={st.matchWordTileThai}
                                        fallbackColor={Sketch.ink}
                                      />
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
                                  </TouchableOpacity>
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
                                      <ToneThaiText
                                        thai={w.thai}
                                        tones={getBreakdownTones(w)}
                                        romanization={optRomanTokens[wi]}
                                        displayThaiSegments={w.displayThaiSegments}
                                        style={st.matchWordTileThai}
                                        fallbackColor={Sketch.ink}
                                      />
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

                  <View style={st.availableWordsHeader}>
                    <View />
                    <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
                  </View>
                </View>

                {matchRevealed && (result === "wrong" || result === "revealed") && (
                  <TouchableOpacity
                    style={[
                      st.primaryBtn,
                      st.secondaryBtn,
                      isDesktopWeb && st.primaryBtnDesktop,
                    ]}
                    onPress={continueToNextRound}
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                      Continue
                    </Text>
                  </TouchableOpacity>
                )}

                {!matchRevealed && (
                  <View
                    style={[
                      st.matchActionRow,
                      isDesktopWeb && st.matchActionRowDesktop,
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        st.primaryBtn,
                        st.secondaryBtn,
                        isDesktopWeb && st.primaryBtnDesktop,
                        isDesktopWeb && st.matchActionButtonDesktop,
                      ]}
                      onPress={revealMatchAnswer}
                      activeOpacity={0.85}
                    >
                      <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                        Show answer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        st.primaryBtn,
                        st.secondaryBtn,
                        isDesktopWeb && st.primaryBtnDesktop,
                        isDesktopWeb && st.matchActionButtonDesktop,
                      ]}
                      onPress={continueToNextRound}
                      activeOpacity={0.85}
                    >
                      <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                        Skip
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
              </View>
              {isDesktopWeb ? practiceControls : null}
            </View>
          </Animated.View>
        )}
        </View>
      </ScrollView>

      <ToneGuide
        visible={toneGuideVisible}
        onClose={() => setToneGuideVisible(false)}
      />
    </SafeAreaView>
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
    maxWidth: DESKTOP_PAGE_WIDTHS.wide,
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
    paddingHorizontal: 20,
    paddingTop: 14,
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
    backgroundColor: Sketch.cardBg,
    borderWidth: 1,
    borderColor: "#E6E1D8",
    borderRadius: AppRadius.lg,
    padding: 16,
    ...sketchShadow(1),
  },
  methodsCardDesktop: {
    padding: 18,
  },
  methodsCardSidebarDesktop: {
    gap: 12,
    padding: 14,
  },
  methodsHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
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
  },
  methodsSubcopy: {
    fontSize: 13,
    lineHeight: 18,
    color: Sketch.inkMuted,
  },
  methodsActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  },
  methodsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
    borderColor: "#DED8CE",
    borderRadius: AppRadius.md,
    backgroundColor: Sketch.cardBg,
    justifyContent: "center",
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
    borderColor: CONTROL_PANEL_ACCENT.border,
    backgroundColor: Sketch.cardBg,
  },
  methodChipDisabled: {
    backgroundColor: Sketch.paper,
    borderColor: "#E6E1D8",
  },
  methodChipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  methodChipCopy: {
    flex: 1,
    gap: 2,
  },
  methodChipMeta: {
    fontSize: 11,
    color: Sketch.inkMuted,
    fontWeight: "500",
  },
  methodChipLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
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
    borderColor: "#D8D4CE",
    backgroundColor: "#E7E4DF",
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  methodToggleOn: {
    borderColor: CONTROL_PANEL_ACCENT.border,
    backgroundColor: CONTROL_PANEL_ACCENT.fill,
    alignItems: "flex-end",
  },
  methodTogglePending: {
    borderColor: "#D8D4CE",
  },
  methodToggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D4CE",
  },
  methodToggleKnobOn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  methodToggleKnobPending: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8D4CE",
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
    borderTopColor: Sketch.inkFaint,
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
  },
  displayChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
    flex: 1,
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
    borderColor: Sketch.inkFaint,
    borderRadius: AppRadius.md,
    backgroundColor: Sketch.paper,
    justifyContent: "center",
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
    borderColor: "#DED8CE",
    borderRadius: AppRadius.md,
    backgroundColor: Sketch.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  displayOptionRowActive: {
    borderColor: CONTROL_PANEL_ACCENT.border,
  },
  displayOptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.ink,
  },
  displayOptionLabelActive: {
    color: Sketch.ink,
  },
  displayOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D8D4CE",
    backgroundColor: Sketch.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  displayOptionCheckActive: {
    borderColor: CONTROL_PANEL_ACCENT.border,
    backgroundColor: CONTROL_PANEL_ACCENT.fill,
  },
  displayChipActive: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
  },
  displayChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  displayChipTextActive: {
    color: Sketch.accentDark,
  },
  lessonMetaSection: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E6E1D8",
    gap: 12,
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
  },
  lessonMetaHint: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
  trackerRow: {
    flexDirection: "row",
    gap: 10,
  },
  trackerCard: {
    flex: 1,
    backgroundColor: Sketch.paper,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
  },
  trackerValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Sketch.accentDark,
  },
  trackerCaption: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  lessonMetaDivider: {
    height: 1,
    backgroundColor: "#E6E1D8",
  },
  lessonNavExerciseRow: {
    gap: 10,
  },
  lessonNavExerciseButton: {
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  lessonNavExerciseButtonDisabled: {
    backgroundColor: Sketch.cardBg,
  },
  lessonNavExerciseLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Sketch.accent,
  },
  lessonNavExerciseLabelDisabled: {
    color: Sketch.inkMuted,
  },
  lessonNavExerciseTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    color: Sketch.ink,
  },
  lessonNavExerciseTitleDisabled: {
    color: Sketch.inkMuted,
  },

  modeHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
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
  modeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  lessonShortcut: {
    paddingVertical: 2,
  },
  lessonShortcutText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accentDark,
    letterSpacing: 0.1,
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
  matchTileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignSelf: "stretch",
    justifyContent: "flex-start",
  },
  wordTile: {
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    alignSelf: "flex-start",
    minWidth: 64,
    maxWidth: "100%",
  },
  wordTileDesktop: {
    minWidth: 128,
    paddingVertical: 12,
    paddingHorizontal: 16,
    cursor: "pointer",
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
  },
  matchWordTile: {
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    alignSelf: "flex-start",
    minWidth: 0,
    maxWidth: "100%",
  },
  matchWordTileDesktop: {
    minWidth: 92,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    cursor: "pointer",
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
    backgroundColor: Sketch.accent,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: Sketch.accent,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
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
  },
  secondaryBtn: {
    backgroundColor: Sketch.cardBg,
    borderColor: Sketch.inkFaint,
  },
  secondaryBtnText: {
    color: Sketch.inkLight,
  },
  promptCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 16,
    paddingHorizontal: 18,
    ...sketchShadow(2),
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
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  promptText: {
    fontSize: 17,
    fontWeight: "600",
    color: Sketch.ink,
    lineHeight: 24,
  },
  buildCard: {
    gap: 16,
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    ...sketchShadow(2),
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
  },
  availableWordsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  buildDivider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
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
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.lg,
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8D8D4",
  },
  builderZoneDesktop: {
    width: "100%",
    minHeight: 72,
  },
  builderCorrect: {
    borderColor: EXERCISE_FEEDBACK_COLORS.correct.border,
    borderStyle: "solid",
    backgroundColor: Sketch.cardBg,
  },
  builderCorrectMobile: {
    backgroundColor: EXERCISE_FEEDBACK_COLORS.correct.tint,
  },
  builderRevealed: {
    borderColor: EXERCISE_FEEDBACK_COLORS.revealed.border,
    borderStyle: "solid",
    backgroundColor: Sketch.cardBg,
  },
  builderRevealedMobile: {
    backgroundColor: EXERCISE_FEEDBACK_COLORS.revealed.tint,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  builderWordsDesktop: {
    justifyContent: "flex-start",
    alignSelf: "stretch",
  },
  builderChip: {
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.md,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Sketch.ink,
  },
  builderChipText: {
    fontSize: 22,
    fontWeight: "800",
    color: Sketch.ink,
  },
  builderChipLocked: {
    backgroundColor: Sketch.paper,
    borderRadius: AppRadius.md,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#D4D4CF",
  },
  builderChipLockedText: {
    fontSize: 22,
    fontWeight: "800",
    color: Sketch.inkMuted,
  },
  builderSlotEmpty: {
    backgroundColor: Sketch.paper,
    borderRadius: AppRadius.md,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#D4D4CF",
    minWidth: 44,
    alignItems: "center" as const,
  },
  builderSlotEmptyText: {
    fontSize: 22,
    fontWeight: "800",
    color: Sketch.inkFaint,
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
  },
  ctaButtonDesktop: {
    flex: 1,
    minWidth: 0,
    marginTop: 0,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.md,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkLight,
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
  },
  resultOk: {
    backgroundColor: Sketch.cardBg,
    borderColor: EXERCISE_FEEDBACK_COLORS.correct.border,
  },
  resultOkMobile: {
    backgroundColor: EXERCISE_FEEDBACK_COLORS.correct.tint,
  },
  resultRevealed: {
    backgroundColor: Sketch.cardBg,
    borderColor: EXERCISE_FEEDBACK_COLORS.revealed.border,
  },
  resultRevealedMobile: {
    backgroundColor: EXERCISE_FEEDBACK_COLORS.revealed.tint,
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
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    ...sketchShadow(2),
  },
  matchCardDesktop: {
    gap: 18,
    padding: 18,
  },
  matchHelperText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkLight,
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
    backgroundColor: Sketch.cardBg,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 14,
    gap: 8,
    ...sketchShadow(1),
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
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  matchExpandButtonActive: {
    borderColor: MUTED_FEEDBACK_ACCENTS.selectedBorder,
    backgroundColor: Sketch.cardBg,
  },
  matchDetailsPanel: {
    paddingTop: 10,
  },
  matchActionRow: {
    gap: 10,
  },
  matchActionRowDesktop: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  matchActionButtonDesktop: {
    flex: 1,
    minWidth: 0,
  },

});
