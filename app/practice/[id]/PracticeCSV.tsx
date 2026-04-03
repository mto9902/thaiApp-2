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

import { Sketch, SketchRadius, sketchShadow } from "@/constants/theme";
import { getPractice } from "../../../src/api/getPractice";
import { API_BASE } from "../../../src/config";
import { useGrammarCatalog } from "../../../src/grammar/GrammarCatalogProvider";
import { useSentenceAudio } from "../../../src/hooks/useSentenceAudio";
import { isPremiumGrammarPoint } from "../../../src/subscription/premium";
import { useSubscription } from "../../../src/subscription/SubscriptionProvider";
import { saveRound } from "../../../src/utils/grammarProgress";
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
  getPrimaryBreakdownTone,
} from "../../../src/utils/breakdownTones";
import { getPracticeWordTrackingEnabled } from "../../../src/utils/practiceWordPreference";
import {
  getToneAccent,
  MUTED_FEEDBACK_ACCENTS,
} from "../../../src/utils/toneAccent";
import { getAuthToken } from "../../../src/utils/authStorage";

// ── Constants ──────────────────────────────────────────────────────────────────
function toneColor(tone?: string): string {
  return tone ? getToneAccent(tone) : Sketch.inkMuted;
}

function getBreakdownTextColor(item: { tone?: string; tones?: string[] }): string {
  const primaryTone = getPrimaryBreakdownTone(item);
  return primaryTone ? toneColor(primaryTone) : Sketch.ink;
}

const MATTE_RESULT_COLORS = {
  successTint: "#EDF2E8",
  successBg: "#A2B28F",
  successBorder: "#8FA080",
  successText: "#32402E",
  successSubtext: "#40503B",
  errorTint: "#F5E8E6",
  errorBg: "#C18B86",
  errorBorder: "#AF7A76",
  errorText: "#4E3231",
  errorSubtext: "#634543",
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

type BuilderWord = {
  id: number;
  breakdownIndex: number;
  thai: string;
  english: string;
  roman: string;
  tones: ReturnType<typeof getBreakdownTones>;
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
  const { playSentence } = useSentenceAudio();
  const isDesktopWeb = Platform.OS === "web" && width >= 1100;
  const mixSource = Array.isArray(source) ? source[0] : source;
  const hasMixSource = typeof mix === "string" && mix.length > 0;
  const mixParam = typeof mix === "string" ? mix : "";
  const currentPracticeRoute = hasMixSource
    ? `/practice/${id}/exercises?mix=${mixParam}${mixSource ? `&source=${mixSource}` : ""}`
    : `/practice/${id}/exercises`;

  const roundRef = useRef(0);
  const mixIdsRef = useRef<string[]>([]);
  const mixIndexRef = useRef(0);
  const currentGrammarIdRef = useRef<string | null>(null);
  const modeHistoryRef = useRef<Mode[]>([]);
  const enabledModesRef = useRef<GrammarExerciseSettings>(
    DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  );

  const [sentence, setSentence] = useState("");
  const [romanization, setRomanization] = useState("");
  const [translation, setTranslation] = useState("");
  const [grammarPoint, setGrammarPoint] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<SentenceData["breakdown"]>([]);
  const [romanTokens, setRomanTokens] = useState<string[]>([]);

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
  const [result, setResult] = useState<"" | "correct" | "wrong">("");
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
  const { isPremium, loading: premiumLoading } = useSubscription();
  const canPlayBreakdownTiles = isDesktopWeb || wordBreakdownTTS;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  function fadeIn() {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

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

  async function togglePracticeMethod(targetMode: Mode) {
    const currentModes = enabledModesRef.current;
    const enabledCount = getAvailableModes(currentModes).length;

    if (currentModes[targetMode] && enabledCount === 1) {
      setMethodsGuardMessage("Keep at least one method on.");
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
    fetchRound(randomMode(enabledModesRef.current, modeHistoryRef.current));
  }, [id, isPremium, mix, mixSource, premiumLoading, settingsReady]);

  function getRandomGrammar() {
    return grammarPoints[Math.floor(Math.random() * grammarPoints.length)];
  }
  function findGrammarById(gid: string) {
    return grammarPoints.find((g) => g.id === gid);
  }
  function grammarObject() {
    if (mixIdsRef.current.length > 0) {
      const currentId =
        mixIdsRef.current[mixIndexRef.current % mixIdsRef.current.length];
      return findGrammarById(currentId) || getRandomGrammar();
    }
    return typeof id === "string"
      ? findGrammarById(id) || getRandomGrammar()
      : getRandomGrammar();
  }

  async function fetchSentence(gid: string): Promise<SentenceData> {
    const res = await getPractice(gid);
    return {
      thai: res?.thai || "",
      romanization: res?.romanization || "",
      english: res?.english || "",
      breakdown: res?.breakdown || [],
    };
  }

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
        romanization: romanTokensForWords?.[i] || "",
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

  const fetchRound = async (nextMode: Mode) => {
    const round = ++roundRef.current;
    try {
      setLoading(true);
      setMethodsGuardMessage(null);
      setResult("");
      setSelectedOption(null);
      setMatchRevealed(false);
      setExpandedMatchOption(null);

      const gobj = grammarObject();
      const main = await fetchSentence(gobj.id);

      currentGrammarIdRef.current = gobj.id;
      setSentence(main.thai);
      setRomanization(main.romanization);
      setTranslation(main.english);
      setGrammarPoint(gobj);
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
          rotation: Math.random() * 6 - 3,
        };
      });

      setWords(shuffleNotSame(formatted, formatted));
      setBuiltSentence([]);

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

      if (mixIdsRef.current.length > 0) {
        mixIndexRef.current++;
      }
    } catch (err) {
      console.error(`[Round ${round}] fetchRound FAILED:`, err);
    } finally {
      setLoading(false);
    }
  };

  function handleWordTap(word: BuilderWord) {
    setResult("");
    setBuiltSentence((previous) => {
      if (previous.some((item) => item.id === word.id)) {
        return previous;
      }
      return [...previous, word];
    });
  }
  function undoLastWord() {
    setResult("");
    setBuiltSentence((p) => p.slice(0, -1));
  }
  function resetSentence() {
    setResult("");
    setBuiltSentence([]);
  }
  function removeBuiltWord(wordId: number) {
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
      const goNext = () =>
        fetchRound(randomMode(enabledModesRef.current, modeHistoryRef.current));
      if (autoplayTTS) {
        void playSentence(sentence, { onDone: goNext, speed: ttsSpeed });
      } else {
        setTimeout(goNext, 1200);
      }
    }
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
          ? () =>
              fetchRound(
                randomMode(enabledModesRef.current, modeHistoryRef.current),
              )
          : undefined,
        speed: ttsSpeed,
      });
    }
    if (ok) {
      trackWords(breakdown, "matchThai-correct", romanTokens);
      if (!autoplayTTS) {
        setTimeout(
          () =>
            fetchRound(randomMode(enabledModesRef.current, modeHistoryRef.current)),
          1400,
        );
      }
    }
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
  const availableWords = words.filter(
    (word) => !builtSentence.some((selected) => selected.id === word.id),
  );
  const showLessonShortcut =
    (mixSource === "bookmarks" || mixSource === "progress") && Boolean(grammarPoint?.id);

  if (premiumLoading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[st.pageFrame, isDesktopWeb && st.pageFrameDesktop]}>
          <Header
            title="Practice"
            onBack={() => router.back()}
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
              onBack={() => router.back()}
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
            onBack={() => router.back()}
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
            <View style={[st.methodsPanel, isDesktopWeb && st.methodsPanelDesktop]}>
              <View style={st.methodsCard}>
                <View style={st.methodsHeaderRow}>
                  <Text style={st.methodsEyebrow}>METHODS</Text>
                  <Text style={st.methodsMeta}>Also in settings</Text>
                </View>
                <View style={st.methodsRow}>
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
                          isDesktopWeb && st.methodChipDesktop,
                        ]}
                        onPress={() => void togglePracticeMethod(practiceMode)}
                        activeOpacity={0.85}
                      >
                        <View style={st.methodChipRow}>
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
                          {showCurrentBadge ? (
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
                <View style={st.displayRow}>
                  <Text style={st.displayLabel}>Display</Text>
                  <View style={st.displayChipRow}>
                    <TouchableOpacity
                      style={[
                        st.displayChip,
                        showRoman && st.displayChipActive,
                        isDesktopWeb && st.displayChipDesktop,
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
                        isDesktopWeb && st.displayChipDesktop,
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
                </View>
              </View>
            </View>

            {/* Mode header */}
            <View style={[st.modeHeader, isDesktopWeb && st.modeHeaderDesktop]}>
              <View style={st.modeTagRow}>
                <View style={st.modeTag}>
                  <Text style={st.modeTagText}>{meta.tag}</Text>
                </View>
                <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
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
                <View style={[st.studyCard, isDesktopWeb && st.studyCardDesktop]}>
                  <TouchableOpacity
                    style={[st.speakerBtn, isDesktopWeb && st.speakerBtnDesktop]}
                    onPress={() => void playSentence(sentence, { speed: ttsSpeed })}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="volume-medium-outline"
                      size={20}
                      color={Sketch.inkLight}
                    />
                  </TouchableOpacity>

                  <Text style={[st.studySentence, isDesktopWeb && st.studySentenceDesktop]}>
                    {breakdown.map((w, i) => (
                      <Text key={i} style={{ color: getBreakdownTextColor(w) }}>
                        {w.thai}
                      </Text>
                    ))}
                  </Text>
                  {showRoman && (
                    <Text style={[st.studyRoman, isDesktopWeb && st.studyRomanDesktop]}>
                      {romanization}
                    </Text>
                  )}
                  <View style={st.divider} />
                  {showEnglish && (
                    <Text style={[st.studyEnglish, isDesktopWeb && st.studyEnglishDesktop]}>
                      {translation}
                    </Text>
                  )}
                </View>

                <View style={st.tileSection}>
                  <Text style={st.tileSectionLabel}>WORD BREAKDOWN</Text>
                  <View style={[st.tileRow, isDesktopWeb && st.tileRowDesktop]}>
                    {breakdown.map((w, i) => (
                      canPlayBreakdownTiles ? (
                        <TouchableOpacity
                          key={i}
                          style={[st.wordTile, isDesktopWeb && st.wordTileDesktop]}
                          onPress={() => playBreakdownWord(w.thai)}
                          activeOpacity={0.8}
                        >
                          <View style={st.wordTileHeader}>
                            <Text style={st.wordTileThai}>{w.thai}</Text>
                            <ToneDots
                              tones={getBreakdownTones(w)}
                              style={st.toneDots}
                            />
                          </View>
                          {showRoman && romanTokens[i] ? (
                            <Text style={st.wordTileRoman}>{romanTokens[i]}</Text>
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
                            <Text style={st.wordTileThai}>{w.thai}</Text>
                            <ToneDots
                              tones={getBreakdownTones(w)}
                              style={st.toneDots}
                            />
                          </View>
                          {showRoman && romanTokens[i] ? (
                            <Text style={st.wordTileRoman}>{romanTokens[i]}</Text>
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
                    trackWords(breakdown, "breakdown-next", romanTokens);
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
                <View style={[st.promptCard, isDesktopWeb && st.promptCardDesktop]}>
                  <Text style={st.promptLabel}>TRANSLATE INTO THAI</Text>
                  <Text style={st.promptText}>{translation}</Text>
                </View>

                <View
                  style={[
                    st.builderZone,
                    isDesktopWeb && st.builderZoneDesktop,
                    result === "correct" && st.builderCorrect,
                    !isDesktopWeb &&
                      result === "correct" &&
                      st.builderCorrectMobile,
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
                        result === "wrong" && st.builderPlaceholderResultBad,
                      ]}
                    >
                      Tap words below to build...
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
                                activeOpacity={0.8}
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

                {result !== "" && (
                  <View
                    style={[
                      st.resultBanner,
                      result === "correct" ? st.resultOk : st.resultBad,
                      !isDesktopWeb &&
                        (result === "correct"
                          ? st.resultOkMobile
                          : st.resultBadMobile),
                    ]}
                  >
                    <Text
                      style={[
                        st.resultLabel,
                        {
                          color:
                            result === "correct"
                              ? MATTE_RESULT_COLORS.successText
                              : MATTE_RESULT_COLORS.errorText,
                        },
                      ]}
                    >
                      {result === "correct" ? "Correct" : "Incorrect"}
                    </Text>
                  </View>
                )}

                <View style={[st.actionRow, isDesktopWeb && st.actionRowDesktop]}>
                  <TouchableOpacity
                    style={st.actionBtn}
                    onPress={undoLastWord}
                    activeOpacity={0.7}
                  >
                    <Text style={st.actionBtnText}>Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={st.actionBtn}
                    onPress={resetSentence}
                    activeOpacity={0.7}
                  >
                    <Text style={st.actionBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>

                {/* wordScraps tiles — same style as breakdown word tiles */}
                <View style={[st.tileRow, isDesktopWeb && st.tileRowDesktop]}>
                  {availableWords.map((word) => (
                    <TouchableOpacity
                      key={word.id}
                      style={[st.wordTile, isDesktopWeb && st.wordTileDesktop]}
                      onPress={() => {
                        handleWordTap(word);
                        if (autoplayTTS) {
                          playBreakdownWord(word.thai);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={st.wordTileHeader}>
                        <Text style={st.wordTileThai}>{word.thai}</Text>
                        <ToneDots tones={word.tones} style={st.toneDots} />
                      </View>
                      {showRoman && word.roman ? (
                        <Text style={st.wordTileRoman}>{word.roman}</Text>
                      ) : null}
                      {showEnglish && (
                        <Text style={st.wordTileEng}>{word.english}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {isDesktopWeb ? (
                  <View style={st.ctaRowDesktop}>
                    <TouchableOpacity
                      style={[
                        st.primaryBtn,
                        st.primaryBtnDesktop,
                        st.ctaButtonDesktop,
                        result === "correct" && st.primaryBtnDisabled,
                      ]}
                      onPress={checkWordScraps}
                      activeOpacity={result === "correct" ? 1 : 0.85}
                      disabled={result === "correct"}
                    >
                      <Text style={st.primaryBtnText}>Check Answer</Text>
                    </TouchableOpacity>

                    {result !== "correct" ? (
                      <TouchableOpacity
                        style={[
                          st.primaryBtn,
                          st.secondaryBtn,
                          st.primaryBtnDesktop,
                          st.ctaButtonDesktop,
                        ]}
                        onPress={() =>
                          fetchRound(
                            randomMode(
                              enabledModesRef.current,
                              modeHistoryRef.current,
                            ),
                          )
                        }
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
                        result === "correct" && st.primaryBtnDisabled,
                      ]}
                      onPress={checkWordScraps}
                      activeOpacity={result === "correct" ? 1 : 0.85}
                      disabled={result === "correct"}
                    >
                      <Text style={st.primaryBtnText}>Check Answer</Text>
                    </TouchableOpacity>

                    {result !== "correct" && (
                      <TouchableOpacity
                        style={[
                          st.primaryBtn,
                          st.secondaryBtn,
                          isDesktopWeb && st.primaryBtnDesktop,
                        ]}
                        onPress={() =>
                          fetchRound(
                            randomMode(
                              enabledModesRef.current,
                              modeHistoryRef.current,
                            ),
                          )
                        }
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
                <View style={[st.promptCard, isDesktopWeb && st.promptCardDesktop]}>
                  <Text style={st.promptLabel}>CHOOSE THE SENTENCE FOR</Text>
                  <Text style={st.promptText}>{translation}</Text>
                </View>

                <View style={[st.optionsGrid, isDesktopWeb && st.optionsGridDesktop]}>
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
                        borderColor = MATTE_RESULT_COLORS.successBorder;
                        if (!isDesktopWeb) {
                          bgColor = MATTE_RESULT_COLORS.successTint;
                        }
                      } else if (isSelected && !isCorrect) {
                        borderColor = MATTE_RESULT_COLORS.errorBorder;
                        if (!isDesktopWeb) {
                          bgColor = MATTE_RESULT_COLORS.errorTint;
                        }
                      } else {
                        bgColor = Sketch.paperDark;
                      }
                    } else if (isSelected) {
                      borderColor = MUTED_FEEDBACK_ACCENTS.selectedBorder;
                      bgColor = MUTED_FEEDBACK_ACCENTS.selectedTint;
                    }

                    const sentenceBgColor = isCorrect && matchRevealed
                      ? isDesktopWeb
                        ? Sketch.paperDark
                        : "transparent"
                      : isSelected && matchRevealed && !isCorrect
                        ? isDesktopWeb
                          ? Sketch.paperDark
                          : "transparent"
                        : isSelected
                          ? MUTED_FEEDBACK_ACCENTS.selectedTint
                          : Sketch.paperDark;
                    const sentenceTextColor = isCorrect && matchRevealed
                      ? MATTE_RESULT_COLORS.successText
                      : isSelected && matchRevealed && !isCorrect
                        ? MATTE_RESULT_COLORS.errorText
                        : Sketch.ink;
                    const sentenceRomanColor = isCorrect && matchRevealed
                      ? MATTE_RESULT_COLORS.successSubtext
                      : isSelected && matchRevealed && !isCorrect
                        ? MATTE_RESULT_COLORS.errorSubtext
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
                                { color: sentenceTextColor },
                              ]}
                            >
                              {opt.thai}
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
                              color={
                                isExpanded
                                  ? MUTED_FEEDBACK_ACCENTS.selected
                                  : Sketch.inkLight
                              }
                            />
                          </TouchableOpacity>
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
                                      <Text style={st.matchWordTileThai}>{w.thai}</Text>
                                      <ToneDots
                                        tones={getBreakdownTones(w)}
                                        style={st.toneDots}
                                      />
                                    </View>
                                    {showRoman && optRomanTokens[wi] ? (
                                      <Text style={st.wordTileRoman}>
                                        {optRomanTokens[wi]}
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
                                      <Text style={st.matchWordTileThai}>{w.thai}</Text>
                                      <ToneDots
                                        tones={getBreakdownTones(w)}
                                        style={st.toneDots}
                                      />
                                    </View>
                                    {showRoman && optRomanTokens[wi] ? (
                                      <Text style={st.wordTileRoman}>
                                        {optRomanTokens[wi]}
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
                        )}

                      </View>
                    );
                  })}
                </View>

                {result !== "" && (
                  <View
                    style={[
                      st.resultBanner,
                      result === "correct" ? st.resultOk : st.resultBad,
                      !isDesktopWeb &&
                        (result === "correct"
                          ? st.resultOkMobile
                          : st.resultBadMobile),
                    ]}
                  >
                    <Text
                      style={[
                        st.resultLabel,
                        {
                          color:
                            result === "correct"
                              ? MATTE_RESULT_COLORS.successText
                              : MATTE_RESULT_COLORS.errorText,
                        },
                      ]}
                    >
                      {result === "correct" ? "Correct" : "Incorrect"}
                    </Text>
                  </View>
                )}

                {matchRevealed && result === "wrong" && (
                  <TouchableOpacity
                    style={[
                      st.primaryBtn,
                      st.secondaryBtn,
                      isDesktopWeb && st.primaryBtnDesktop,
                    ]}
                    onPress={() =>
                      fetchRound(
                        randomMode(enabledModesRef.current, modeHistoryRef.current),
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                      {"Continue ->"}
                    </Text>
                  </TouchableOpacity>
                )}

                {!matchRevealed && (
                  <TouchableOpacity
                    style={[
                      st.primaryBtn,
                      st.secondaryBtn,
                      isDesktopWeb && st.primaryBtnDesktop,
                    ]}
                    onPress={() =>
                      fetchRound(
                        randomMode(enabledModesRef.current, modeHistoryRef.current),
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                      Skip
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 12,
  },

  loadingWrap: { alignItems: "center", paddingTop: 120, gap: 14 },
  premiumBlockWrap: { paddingTop: 18 },
  loadingPulse: {
    width: 40,
    height: 40,
    borderRadius: SketchRadius.card,
    backgroundColor: Sketch.inkFaint,
  },
  loadingLabel: { fontSize: 14, color: Sketch.inkMuted, fontWeight: "600" },

  methodsPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  methodsPanelDesktop: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingHorizontal: 0,
    paddingTop: 24,
  },
  methodsCard: {
    gap: 10,
  },
  methodsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  methodsEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
  },
  methodsMeta: {
    fontSize: 12,
    color: Sketch.inkMuted,
    fontWeight: "500",
  },
  methodsRow: {
    flexDirection: "row",
    gap: 10,
  },
  methodChip: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: SketchRadius.control,
    backgroundColor: Sketch.cardBg,
    justifyContent: "center",
  },
  methodChipDesktop: {
    cursor: "pointer",
  },
  methodChipCurrent: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
  },
  methodChipDisabled: {
    backgroundColor: Sketch.paper,
    borderColor: "#EBEBE8",
  },
  methodChipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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
    borderRadius: SketchRadius.badge,
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
    paddingTop: 2,
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
  displayChip: {
    minHeight: 34,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: SketchRadius.control,
    backgroundColor: Sketch.paper,
    justifyContent: "center",
  },
  displayChipDesktop: {
    cursor: "pointer",
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

  modeHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  modeHeaderDesktop: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingHorizontal: 0,
    paddingTop: 26,
    paddingBottom: 2,
  },
  modeTagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modeTag: {
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.badge,
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
    color: Sketch.orange,
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
    borderRadius: SketchRadius.card,
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
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.control,
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
    borderRadius: SketchRadius.track,
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
    gap: 8,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  wordTile: {
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.control,
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
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    alignSelf: "flex-start",
    minWidth: 64,
    maxWidth: "100%",
  },
  matchWordTileDesktop: {
    minWidth: 128,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    cursor: "pointer",
  },
  matchWordTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  matchWordTileHeaderDesktop: {
    alignSelf: "center",
  },
  matchWordTileThai: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
    flexShrink: 1,
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
    backgroundColor: Sketch.orange,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: Sketch.orange,
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
    backgroundColor: Sketch.paperDark,
    borderColor: Sketch.inkFaint,
  },
  secondaryBtnText: {
    color: Sketch.inkLight,
  },
  promptCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 16,
    paddingHorizontal: 18,
    ...sketchShadow(2),
  },
  promptCardDesktop: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
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

  progressTrack: {
    height: 6,
    backgroundColor: Sketch.inkFaint,
    borderRadius: SketchRadius.track,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.ink,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Sketch.orange,
    borderRadius: SketchRadius.track,
  },

  builderZone: {
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
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
    minHeight: 110,
  },
  builderCorrect: {
    borderColor: MATTE_RESULT_COLORS.successBorder,
    borderStyle: "solid",
    backgroundColor: Sketch.paperDark,
  },
  builderCorrectMobile: {
    backgroundColor: MATTE_RESULT_COLORS.successTint,
  },
  builderWrong: {
    borderColor: MATTE_RESULT_COLORS.errorBorder,
    borderStyle: "solid",
    backgroundColor: Sketch.paperDark,
  },
  builderWrongMobile: {
    backgroundColor: MATTE_RESULT_COLORS.errorTint,
  },
  builderPlaceholder: {
    fontSize: 14,
    color: Sketch.inkMuted,
    fontWeight: "500",
  },
  builderPlaceholderResultOk: {
    color: MATTE_RESULT_COLORS.successText,
    fontWeight: "600",
  },
  builderPlaceholderResultBad: {
    color: MATTE_RESULT_COLORS.errorText,
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
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.control,
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
    borderRadius: SketchRadius.control,
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
    borderRadius: SketchRadius.control,
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
    justifyContent: "center",
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
    borderRadius: SketchRadius.control,
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
    borderRadius: SketchRadius.control,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  resultOk: {
    backgroundColor: Sketch.cardBg,
    borderColor: MATTE_RESULT_COLORS.successBorder,
  },
  resultOkMobile: {
    backgroundColor: MATTE_RESULT_COLORS.successTint,
  },
  resultBad: {
    backgroundColor: Sketch.cardBg,
    borderColor: MATTE_RESULT_COLORS.errorBorder,
  },
  resultBadMobile: {
    backgroundColor: MATTE_RESULT_COLORS.errorTint,
  },
  resultLabel: { fontSize: 14, fontWeight: "700", letterSpacing: 0.1 },

  optionsGrid: { gap: 10 },
  optionsGridDesktop: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  optionCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 12,
    gap: 8,
    ...sketchShadow(2),
  },
  optionCardDesktop: {
    width: "49.1%",
    minHeight: 0,
    alignSelf: "flex-start",
  },
  matchSentenceButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: SketchRadius.control,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 0,
  },
  matchSentenceTapArea: {
    flex: 1,
    gap: 2,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  matchSentenceTapAreaDesktop: {
    alignItems: "center",
  },
  matchSentenceText: {
    fontSize: 20,
    fontWeight: "800",
    color: Sketch.ink,
    textAlign: "left",
    width: "100%",
  },
  matchSentenceTextDesktop: {
    textAlign: "center",
  },
  matchSentenceRoman: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "left",
    width: "100%",
  },
  matchSentenceRomanDesktop: {
    textAlign: "center",
  },
  matchExpandButton: {
    width: 32,
    height: 32,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  matchExpandButtonActive: {
    borderColor: MUTED_FEEDBACK_ACCENTS.selectedBorder,
    backgroundColor: MUTED_FEEDBACK_ACCENTS.selectedTint,
  },
  matchDetailsPanel: {
    paddingTop: 6,
  },

});
