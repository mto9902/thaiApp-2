import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import KimiIcon from "@/src/components/app/KimiIcon";
import SentenceExplanationModal from "@/src/components/mobile/SentenceExplanationModal";
import ToneDots from "@/src/components/ToneDots";
import ToneThaiText from "@/src/components/ToneThaiText";
import { DESKTOP_PAGE_WIDTH } from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT as BODY_FONT,
  WEB_BRAND as BRAND,
  WEB_CARD_SHADOW as CARD_SHADOW,
  WEB_DISPLAY_FONT as DISPLAY_FONT,
  WEB_FONT_HREF as FONT_HREF,
  WEB_INLINE_BUTTON_SHADOW as INLINE_BUTTON_SHADOW,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED as LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW as LIGHT_BUTTON,
  WEB_NAVY_BUTTON_PRESSED as NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW as NAVY_BUTTON,
  WEB_SENTENCE_SHADOW as SENTENCE_SHADOW,
  WEB_THAI_FONT as THAI_FONT,
  WEB_TONE as TONE,
} from "@/src/components/web/designSystem";
import { API_BASE } from "@/src/config";
import { GrammarPoint } from "@/src/data/grammar";
import {
  CEFR_LEVEL_META,
  PUBLIC_CEFR_LEVELS,
  PublicCefrLevel,
} from "@/src/data/grammarLevels";
import {
  GRAMMAR_STAGE_META,
  GrammarStage,
  PUBLIC_GRAMMAR_STAGES,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { useDashboardMiniExercise } from "@/src/hooks/useDashboardMiniExercise";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import {
  getBreakdownRomanizations,
  PracticeBreakdownItem,
  PracticeBuilderWord,
  PracticeSentenceData,
} from "@/src/practice/miniExerciseHelpers";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { getSentenceExplanation } from "@/src/api/getSentenceExplanation";
import { submitSupportRequest } from "@/src/api/submitSupportRequest";
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
  email?: string | null;
  display_name?: string | null;
};

type LockedNavigationPrompt = {
  direction: "previous" | "next";
  point: GrammarPoint;
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

function isPublicCefrLevel(level: string): level is PublicCefrLevel {
  return (PUBLIC_CEFR_LEVELS as readonly string[]).includes(level);
}

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function formatDelay(nextDueAt: string) {
  const ms = Math.max(new Date(nextDueAt).getTime() - Date.now(), 0);
  const mins = Math.ceil(ms / 60000);
  if (mins <= 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hours = Math.ceil(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.ceil(hours / 24)}d`;
}

function shuffleIds(ids: string[]) {
  return [...ids].sort(() => Math.random() - 0.5);
}

function summarize(text: string) {
  const one = text.trim().split(/(?<=[.!?])\s+/)[0] || text.trim();
  return one.length <= 120 ? one : `${one.slice(0, 117).trim()}...`;
}

function getItemRomanization(item: { romanization?: string; roman?: string }) {
  return item.romanization || item.roman || "";
}

function ToneGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    function handlePointerDown(event: MouseEvent) {
      const shell = shellRef.current as { contains?: (target: EventTarget | null) => boolean } | null;
      if (shell?.contains?.(event.target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <View ref={shellRef} style={styles.toneGuideShell}>
      <Text style={styles.toneGuideStandaloneLabel}>Tone guide</Text>
      <Pressable
        onPress={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        style={({ hovered, pressed }) => [
          styles.toneGuideButton,
          (hovered || pressed) && styles.squishHover,
        ]}
      >
        <View style={styles.toneDots}>
          {TONE_GUIDE_ITEMS.map(({ tone, label }) => (
            <View key={label} style={[styles.toneDot, { backgroundColor: TONE[tone] }]} />
          ))}
        </View>
      </Pressable>
      {isOpen ? (
        <View style={styles.toneGuidePopover}>
          {TONE_GUIDE_ITEMS.map(({ tone, label }) => (
            <View key={label} style={styles.toneGuideRow}>
              <View style={[styles.toneDot, styles.toneGuidePopoverDot, { backgroundColor: TONE[tone] }]} />
              <Text style={styles.toneGuidePopoverText}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function LevelPicker({
  selectedLevel,
  options,
  disabled = false,
  onSelect,
}: {
  selectedLevel: PublicCefrLevel;
  options: LevelPickerOption[];
  disabled?: boolean;
  onSelect: (option: LevelPickerOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    function handlePointerDown(event: MouseEvent) {
      const shell = shellRef.current as { contains?: (target: EventTarget | null) => boolean } | null;
      if (shell?.contains?.(event.target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <View ref={shellRef} style={styles.levelBadgeShell}>
      <Pressable
        disabled={disabled}
        onPress={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        style={({ hovered, pressed }) => [
          styles.levelBadge,
          (hovered || pressed) && !disabled && styles.squishHover,
          disabled && styles.levelBadgeDisabled,
        ]}
      >
        <Text selectable={false} style={styles.levelBadgeText}>
          {selectedLevel}
        </Text>
      </Pressable>
      {isOpen ? (
        <View style={styles.levelBadgePopover}>
          {options.map((option) => {
            const isActive = option.level === selectedLevel;
            return (
              <Pressable
                key={option.level}
                onPress={() => {
                  setIsOpen(false);
                  onSelect(option);
                }}
                style={({ hovered, pressed }) => [
                  styles.levelBadgeOption,
                  isActive && styles.levelBadgeOptionActive,
                  option.locked && styles.levelBadgeOptionLocked,
                  (hovered || pressed) && styles.levelBadgeOptionHover,
                ]}
              >
                <Text
                  selectable={false}
                  style={[
                    styles.levelBadgeOptionLabel,
                    option.locked && styles.levelBadgeOptionLabelLocked,
                  ]}
                >
                  {option.level}
                </Text>
                <Text
                  selectable={false}
                  style={[
                    styles.levelBadgeOptionTitle,
                    option.locked && styles.levelBadgeOptionTitleLocked,
                  ]}
                >
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function SurfaceButton({
  label,
  variant,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  variant: "primary" | "secondary";
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ hovered, pressed }) => [
        styles.button,
        variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary,
        style,
        (hovered || pressed) &&
          !disabled &&
          (variant === "primary" ? styles.buttonPrimaryActive : styles.buttonSecondaryActive),
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        selectable={false}
        style={[
          styles.buttonText,
          variant === "primary" ? styles.buttonTextPrimary : styles.buttonTextSecondary,
          disabled && styles.buttonTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MiniUtilityButton({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ hovered, pressed }) => [
        styles.utilityButton,
        (hovered || pressed) && !disabled && styles.utilityButtonHover,
        disabled && styles.utilityButtonDisabled,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={disabled ? "#8D8D8D" : BRAND.ink} />
      ) : null}
      <Text
        selectable={false}
        style={[styles.utilityButtonText, disabled && styles.utilityButtonTextDisabled]}
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
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.displayToggle,
        active && styles.displayToggleActive,
        (hovered || pressed) && styles.utilityButtonHover,
      ]}
    >
      <Text
        style={[
          styles.displayToggleText,
          active && styles.displayToggleTextActive,
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.displayToggleCheck,
          active && styles.displayToggleCheckActive,
        ]}
      >
        {active ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
      </View>
    </Pressable>
  );
}

function ToneSentence({
  sentence,
  style,
}: {
  sentence: { breakdown: PracticeBreakdownItem[] };
  style?: object;
}) {
  return (
    <Text style={[styles.thaiSentence, style]}>
      {sentence.breakdown.map((item, index) => (
        <ToneThaiText
          key={`${item.thai}-${index}`}
          thai={item.thai}
          tones={getBreakdownTones(item)}
          romanization={item.romanization || item.roman}
          displayThaiSegments={item.displayThaiSegments}
        />
      ))}
    </Text>
  );
}

function BuildAnswerBoard({
  prefilled,
  breakdown,
  romanTokens,
  builtSentence,
  showRoman,
  showEnglish,
  onRemoveWord,
}: {
  prefilled: (string | null)[];
  breakdown: PracticeBreakdownItem[];
  romanTokens: string[];
  builtSentence: PracticeBuilderWord[];
  showRoman: boolean;
  showEnglish: boolean;
  onRemoveWord: (wordId: number) => void;
}) {
  let builtCursor = 0;

  return (
    <View style={styles.answerBoard}>
      {prefilled.map((prefilledThai, index) => {
        const isPrefilled = prefilledThai !== null;
        const item = breakdown[index];
        const builtWord = isPrefilled ? null : (builtSentence[builtCursor] ?? null);

        if (!isPrefilled) {
          builtCursor += 1;
        }

        const slotThai = isPrefilled ? prefilledThai : builtWord?.thai ?? null;
        const tones = isPrefilled
          ? getBreakdownTones(item)
          : builtWord?.tones ?? [];
        const romanization = isPrefilled
          ? romanTokens[index] || getItemRomanization(item ?? {})
          : builtWord?.roman ?? "";
        const english = isPrefilled
          ? item?.english?.toUpperCase() ?? ""
          : builtWord?.english ?? "";
        const displayThaiSegments = isPrefilled
          ? item?.displayThaiSegments
          : builtWord?.displayThaiSegments;

        return (
          <Pressable
            key={`slot-${index}`}
            disabled={!slotThai || !builtWord}
            onPress={() => builtWord && onRemoveWord(builtWord.id)}
            style={({ hovered, pressed }) => [
              styles.matchWordTile,
              styles.answerWordTile,
              !slotThai && styles.answerWordTileEmpty,
              isPrefilled && styles.answerWordTilePrefilled,
              slotThai && !isPrefilled && (hovered || pressed) && styles.cardDepressHover,
            ]}
          >
            {slotThai ? (
              <>
                <ToneThaiText
                  thai={slotThai}
                  tones={tones}
                  romanization={romanization}
                  displayThaiSegments={displayThaiSegments}
                  style={[
                    styles.matchWordTileThai,
                    styles.answerWordTileThai,
                    isPrefilled && styles.answerWordTilePrefilledText,
                  ]}
                  fallbackColor={BRAND.ink}
                />
                {showRoman && romanization ? (
                  <Text
                    style={[
                      styles.matchWordTileRoman,
                      styles.answerWordTileText,
                      isPrefilled && styles.answerWordTilePrefilledText,
                    ]}
                  >
                    {romanization}
                  </Text>
                ) : null}
                {showEnglish && english ? (
                  <Text
                    style={[
                      styles.matchWordTileEnglish,
                      styles.answerWordTileText,
                      isPrefilled && styles.answerWordTilePrefilledText,
                    ]}
                  >
                    {english}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.answerChipPlaceholderText}>...</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SandboxDashboardWeb() {
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
  const [lockedNavigationPrompt, setLockedNavigationPrompt] =
    useState<LockedNavigationPrompt | null>(null);
  const [sentenceReportOpen, setSentenceReportOpen] = useState(false);
  const [sentenceReportDraft, setSentenceReportDraft] = useState("");
  const [sentenceReportBusy, setSentenceReportBusy] = useState(false);
  const [sentenceReportStatus, setSentenceReportStatus] =
    useState<SentenceReportStatus | null>(null);
  const [sentenceExplanationOpen, setSentenceExplanationOpen] = useState(false);
  const [sentenceExplanationLoading, setSentenceExplanationLoading] = useState(false);
  const [sentenceExplanationError, setSentenceExplanationError] = useState<string | null>(null);
  const [sentenceExplanation, setSentenceExplanation] = useState<string | null>(null);
  const [expandedMatchOptionIndex, setExpandedMatchOptionIndex] = useState<number | null>(null);
  const [showPracticeMixModal, setShowPracticeMixModal] = useState(false);
  const [selectedPracticeMixLevels, setSelectedPracticeMixLevels] = useState<
    PracticeMixFilterLevel[]
  >(["All"]);
  const sentenceReportInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector('link[data-keystone-sandbox-fonts="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    link.setAttribute("data-keystone-sandbox-fonts", "true");
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDisplayPrefs() {
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
        console.error("Failed to load sandbox display prefs:", error);
      }
    }

    void loadDisplayPrefs();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDisplaySetting = useCallback(async (target: "roman" | "english") => {
    const isRoman = target === "roman";
    const currentValue = isRoman ? showRoman : showEnglish;
    const nextValue = !currentValue;
    const key = isRoman ? PREF_ROMANIZATION : PREF_ENGLISH;

    if (isRoman) {
      setShowRoman(nextValue);
    } else {
      setShowEnglish(nextValue);
    }

    try {
      await AsyncStorage.setItem(key, String(nextValue));
    } catch (error) {
      console.error("Failed to save sandbox display prefs:", error);
      if (isRoman) {
        setShowRoman(currentValue);
      } else {
        setShowEnglish(currentValue);
      }
    }
  }, [showEnglish, showRoman]);

  const toggleWordAudio = useCallback(async () => {
    const nextValue = !wordAudioEnabled;
    setWordAudioEnabled(nextValue);

    try {
      await AsyncStorage.setItem(PREF_WORD_BREAKDOWN_TTS, String(nextValue));
    } catch (error) {
      console.error("Failed to save sandbox word audio pref:", error);
      setWordAudioEnabled(!nextValue);
    }
  }, [wordAudioEnabled]);

  const checkAuth = useCallback(async () => {
    if (!(await canAccessApp())) router.replace("/login");
  }, [router]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const loadProgress = useCallback(async () => {
    try {
      setProgress(await getAllProgress());
    } catch (err) {
      console.error("Failed to load sandbox progress:", err);
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
    } catch (err) {
      console.error("Failed to load sandbox profile:", err);
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
      accessibleGrammar.find((point) => !isGrammarPracticed(progress[point.id])) ??
      null,
    [accessibleGrammar, progress],
  );

  const mini = useDashboardMiniExercise({
    grammarPoints: visibleGrammar,
    progress,
    isPremium,
  });
  const { resetToExplanation } = mini;

  useFocusEffect(
    useCallback(() => {
      resetToExplanation();
    }, [resetToExplanation]),
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
  const previousLessonLocked = Boolean(
    previousLesson && !isPremium && isPremiumGrammarPoint(previousLesson),
  );
  const nextLessonLocked = Boolean(
    nextLessonInSequence && !isPremium && isPremiumGrammarPoint(nextLessonInSequence),
  );
  const currentStageMeta = selectedLesson ? GRAMMAR_STAGE_META[selectedLesson.stage] : null;
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
            firstUnpracticedAccessible ??
            accessiblePoints[0] ??
            visiblePoints[0] ??
            null,
        };
      }),
    [accessibleGrammar, progress, visibleGrammar],
  );
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
  const levelProgress = useMemo(
    () =>
      PUBLIC_CEFR_LEVELS.map((level) => {
        const points = visibleGrammar.filter((point) => point.level === level);
        const practiced = points.filter((point) => isGrammarPracticed(progress[point.id])).length;
        return {
          level,
          shortLabel: CEFR_LEVEL_META[level].shortLabel,
          total: points.length,
          practiced,
          percent: points.length ? Math.round((practiced / points.length) * 100) : 0,
        };
      }),
    [progress, visibleGrammar],
  );
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
      return {
        id: stage,
        label: GRAMMAR_STAGE_META[stage].id,
        status,
      };
    });
  }, [progress, selectedLesson?.stage, visibleGrammar]);

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

  const profileName = isGuest
    ? "Guest User"
    : getProfileDisplayName(profile) || "Keystone learner";
  const profileEmail = isGuest ? "Sign in to sync progress" : profile?.email || "No email available";
  const previewSentence = mini.previewSentence;
  const activeSentence = mini.activeSentence;
  const exerciseBusy = mini.exerciseLoading || mini.transitionPending;
  const canPlayExerciseAudio =
    mini.phase === "explanation" ||
    mini.result === "correct" ||
    mini.result === "revealed" ||
    (mini.currentMode === "matchThai" &&
      mini.matchRevealed &&
      mini.result === "wrong");
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
        mini.phase,
        mini.currentMode,
        mini.result,
        previewSentence?.thai ?? "",
        activeSentence?.thai ?? "",
        mini.matchOptions.find((option) => option.isCorrect)?.thai ?? "",
        mini.selectedOptionIndex ?? "none",
      ].join("::"),
    [
      activeSentence?.thai,
      mini.currentMode,
      mini.matchOptions,
      mini.phase,
      previewSentence?.thai,
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

  const handleLockedNavigationCta = useCallback(async () => {
    if (!lockedNavigationPrompt) return;
    await ensurePremiumAccess(
      "continue learning",
      `/practice/${lockedNavigationPrompt.point.id}`,
    );
  }, [ensurePremiumAccess, lockedNavigationPrompt]);

  const handlePreviousNavigation = useCallback(() => {
    if (exerciseBusy || !previousLesson) return;
    if (previousLessonLocked) {
      setLockedNavigationPrompt({
        direction: "previous",
        point: previousLesson,
      });
      return;
    }
    setLockedNavigationPrompt(null);
    mini.goToPreviousGrammar();
  }, [
    exerciseBusy,
    mini,
    previousLesson,
    previousLessonLocked,
  ]);

  const handleNextNavigation = useCallback(() => {
    if (exerciseBusy || !nextLessonInSequence) return;
    if (nextLessonLocked) {
      setLockedNavigationPrompt({
        direction: "next",
        point: nextLessonInSequence,
      });
      return;
    }
    setLockedNavigationPrompt(null);
    mini.goToNextGrammar();
  }, [
    exerciseBusy,
    mini,
    nextLessonInSequence,
    nextLessonLocked,
  ]);

  const handleLevelSelection = useCallback(
    async (option: LevelPickerOption) => {
      if (exerciseBusy || !option.targetPoint) return;
      setLockedNavigationPrompt(null);

      if (option.locked || (!isPremium && isPremiumGrammarPoint(option.targetPoint))) {
        await ensurePremiumAccess(`${option.level} grammar`, "/");
        return;
      }

      mini.selectGrammar(option.targetPoint.id);
    },
    [ensurePremiumAccess, exerciseBusy, isPremium, mini],
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

  const handleStartPracticeMix = useCallback(() => {
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

  useEffect(() => {
    setLockedNavigationPrompt(null);
  }, [selectedLesson?.id, isPremium]);
  const selectedWordIds = useMemo(
    () => new Set(mini.buildState.builtSentence.map((word) => word.id)),
    [mini.buildState.builtSentence],
  );
  const sentenceReportSent = sentenceReportStatus?.kind === "success";
  const showSolvedSentence =
    mini.phase === "exercise" &&
    (mini.result === "correct" || mini.result === "revealed") &&
    activeSentence;

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
      "[Sandbox sentence report]",
      `Lesson: ${selectedLesson?.title ?? "Unknown"} (${selectedLesson?.id ?? "unknown"})`,
      `Stage: ${selectedLesson?.stage ?? "unknown"}`,
      `Phase: ${mini.phase}`,
      `Mode: ${mini.currentMode}`,
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
    if (mini.currentMode === "matchThai" && mini.matchOptions.length) {
      contextLines.push("Match options:");
      mini.matchOptions.forEach((option, index) => {
        const parts = [option.thai];
        if (option.romanization) parts.push(option.romanization);
        if (option.english) parts.push(option.english);
        contextLines.push(`${index + 1}. ${parts.join(" | ")}`);
      });
    }

    try {
      setSentenceReportBusy(true);
      setSentenceReportStatus(null);

      const data = await submitSupportRequest({
        email: profile?.email,
        message: `${message}\n\n${contextLines.join("\n")}`,
      });

      setSentenceReportDraft("");
      setSentenceReportStatus({
        kind: "success",
        message:
          data?.deliveredByEmail === false
            ? "Thank you for your input. We are always trying to make our content better, and your note has been saved for review."
            : "Thank you for your input. We are always trying to make our content better, and this kind of report really helps us improve it.",
      });
    } catch (err) {
      setSentenceReportStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Failed to send report.",
      });
    } finally {
      setSentenceReportBusy(false);
    }
  }, [
    mini.currentMode,
    mini.matchOptions,
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

      const targetSentence =
        mini.phase === "explanation"
          ? previewSentence
          : mini.currentMode === "matchThai" && mini.matchRevealed
            ? mini.matchOptions.find((option) => option.isCorrect) ?? activeSentence
            : activeSentence;

      const canExplainCurrentMiniSentence =
        mini.phase === "explanation"
          ? Boolean(previewSentence)
          : mini.result === "revealed" ||
            (mini.currentMode === "matchThai" &&
              mini.matchRevealed &&
              mini.result === "wrong");

      if (!targetSentence || !canExplainCurrentMiniSentence) {
        throw new Error("Load a sentence first, then ask for an explanation.");
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
        sentence: targetSentence,
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
    mini.currentMode,
    mini.matchOptions,
    mini.matchRevealed,
    mini.phase,
    mini.result,
    previewSentence,
    selectedLesson,
    sentenceExplanationLoading,
  ]);

  function renderSentenceReportTrigger() {
    return (
      <Pressable
        onPress={() => setSentenceReportOpen(true)}
        style={({ hovered, pressed }) => [
          styles.sentenceReportAlertButton,
          (hovered || pressed) && styles.utilityButtonHover,
        ]}
      >
        <Text style={styles.sentenceReportAlertText}>!</Text>
      </Pressable>
    );
  }

  function renderExplanationSection() {
    return (
      <>
        <View style={styles.sentenceCard}>
          <View style={styles.sentenceTop}>
            <View style={styles.sentenceTopContent}>
              <Text style={styles.cardLabel}>Example sentence</Text>

              {previewSentence ? (
                <>
                  <ToneSentence sentence={previewSentence} />
                  {showRoman && previewSentence.romanization ? (
                    <Text style={styles.romanText}>{previewSentence.romanization}</Text>
                  ) : null}
                  {showEnglish && previewSentence.english ? (
                    <Text style={styles.translationText}>{previewSentence.english}</Text>
                  ) : null}
                </>
              ) : (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>
                    {mini.previewLoading ? "Loading lesson preview..." : "Preview unavailable"}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.sentenceTopActions}>
              {renderSentenceReportTrigger()}
              <Pressable
                onPress={() => {
                  if (previewSentence?.thai) void playSentence(previewSentence.thai);
                }}
                disabled={!previewSentence?.thai}
                style={({ hovered, pressed }) => [
                  styles.audioButton,
                  (hovered || pressed) && previewSentence?.thai && styles.squishHover,
                  !previewSentence?.thai && styles.audioButtonDisabled,
                ]}
              >
                <Ionicons name="volume-high-outline" size={22} color={BRAND.ink} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.wordRow}>
          {(previewSentence?.breakdown ?? []).map((item, index) => (
            <Pressable
              key={`${item.thai}-${index}`}
              onPress={() => {
                if (item.thai) void playSentence(item.thai);
              }}
              style={({ hovered, pressed }) => [
                styles.matchWordTile,
                (hovered || pressed) && styles.cardDepressHover,
              ]}
            >
              <View style={styles.matchWordTileHeader}>
                <ToneThaiText
                  thai={item.thai}
                  tones={getBreakdownTones(item)}
                  romanization={getItemRomanization(item)}
                  displayThaiSegments={item.displayThaiSegments}
                  style={styles.matchWordTileThai}
                  fallbackColor={BRAND.ink}
                />
                <ToneDots
                  tones={getBreakdownTones(item)}
                  style={styles.matchWordToneDots}
                />
              </View>
              {showRoman && getItemRomanization(item) ? (
                <Text style={styles.matchWordTileRoman}>
                  {getItemRomanization(item)}
                </Text>
              ) : null}
              {showEnglish && item.english ? (
                <Text style={styles.matchWordTileEnglish}>
                  {item.english.toUpperCase()}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        {exerciseBusy ? (
          <View style={styles.explanationActionRow}>
            <Text style={styles.pendingText}>Preparing the next round...</Text>
          </View>
        ) : null}
      </>
    );
  }

  function renderBuildExercise() {
    const buildRomanTokens = activeSentence
      ? getBreakdownRomanizations(activeSentence.romanization, activeSentence.breakdown)
      : [];

    return (
      <>
        <View style={styles.sentenceCard}>
          <View style={styles.sentenceTop}>
            <View style={styles.sentenceTopContent}>
              <Text style={styles.cardLabel}>Build the sentence</Text>

              {showSolvedSentence ? (
                <>
                  <ToneSentence sentence={activeSentence as PracticeSentenceData} />
                  {showRoman && activeSentence?.romanization ? (
                    <Text style={styles.romanText}>{activeSentence.romanization}</Text>
                  ) : null}
                  {showEnglish && activeSentence?.english ? (
                    <Text style={styles.translationText}>{activeSentence.english}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <BuildAnswerBoard
                    prefilled={mini.buildState.prefilled}
                    breakdown={activeSentence?.breakdown ?? []}
                    romanTokens={buildRomanTokens}
                    builtSentence={mini.buildState.builtSentence}
                    showRoman={showRoman}
                    showEnglish={showEnglish}
                    onRemoveWord={mini.removeBuiltWord}
                  />
                  <View style={styles.sentenceFooterCopy}>
                    <Text style={styles.exerciseHelperLabel}>Translate into Thai</Text>
                    <Text style={styles.translationPrompt}>{activeSentence?.english}</Text>
                    <Text style={styles.exerciseHint}>
                      Tap the word cards below to build the answer.
                    </Text>
                  </View>
                </>
              )}
            </View>
            <View style={styles.sentenceTopActions}>
              {renderSentenceReportTrigger()}
              <Pressable
                onPress={() => {
                  if (audioSentence?.thai) void playSentence(audioSentence.thai);
                }}
                disabled={!audioSentence?.thai}
                style={({ hovered, pressed }) => [
                  styles.audioButton,
                  (hovered || pressed) && audioSentence?.thai && styles.squishHover,
                  !audioSentence?.thai && styles.audioButtonDisabled,
                ]}
              >
                <Ionicons name="volume-high-outline" size={22} color={BRAND.ink} />
              </Pressable>
            </View>
          </View>

          {mini.result === "correct" ? (
            <View style={[styles.feedbackBanner, styles.feedbackBannerCorrect]}>
              <View style={styles.feedbackIconWrap}>
                <Ionicons name="checkmark-circle" size={18} color={BRAND.navy} />
              </View>
              <View style={styles.feedbackTextWrap}>
                <Text style={styles.feedbackTitle}>Correct</Text>
                <Text style={styles.feedbackBody}>Nice. The next round is on its way.</Text>
              </View>
            </View>
          ) : null}

          {mini.result === "wrong" ? (
            <View style={[styles.feedbackBanner, styles.feedbackBannerWrong]}>
              <View style={styles.feedbackIconWrap}>
                <Ionicons name="close-circle" size={18} color={BRAND.inkSoft} />
              </View>
              <View style={styles.feedbackTextWrap}>
                <Text style={styles.feedbackTitle}>Not quite</Text>
                <Text style={styles.feedbackBody}>
                  Check the word order, show the answer, or skip to the next round.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.bottomSentenceActions}>
            {mini.result !== "correct" && mini.result !== "revealed" ? (
              <SurfaceButton
                label="Show answer"
                variant="secondary"
                onPress={mini.revealBuildAnswer}
                disabled={exerciseBusy}
                style={styles.inlineSentenceButton}
              />
            ) : null}
            {mini.result === "" ? (
              <SurfaceButton
                label="Skip"
                variant="secondary"
                onPress={mini.continueToNextRound}
                disabled={exerciseBusy}
                style={styles.inlineSentenceButton}
              />
            ) : null}
            {mini.result === "wrong" || mini.result === "revealed" ? (
              mini.result === "revealed" ? (
                <>
                  <SurfaceButton
                    label="Got it"
                    variant="primary"
                    onPress={mini.continueToNextRound}
                    disabled={exerciseBusy}
                    style={styles.inlineSentenceButton}
                  />
                  <SurfaceButton
                    label={sentenceExplanationLoading ? "Explaining..." : "Explain"}
                    variant="secondary"
                    onPress={() => void requestSentenceExplanation()}
                    disabled={exerciseBusy || sentenceExplanationLoading}
                    style={styles.inlineSentenceButton}
                  />
                </>
              ) : (
                <SurfaceButton
                  label="Skip"
                  variant="primary"
                  onPress={mini.continueToNextRound}
                  disabled={exerciseBusy}
                  style={styles.inlineSentenceButton}
                />
              )
            ) : null}
          </View>

        </View>

        <View style={styles.wordRow}>
          {mini.buildState.words.map((word) => (
            <Pressable
              key={`${word.thai}-${word.id}`}
              onPress={() => {
                if (wordAudioEnabled && word.thai) {
                  void playSentence(word.thai);
                }
                mini.handleWordTap(word);
              }}
              disabled={
                selectedWordIds.has(word.id) ||
                mini.result === "correct" ||
                exerciseBusy
              }
              style={({ hovered, pressed }) => [
                styles.matchWordTile,
                selectedWordIds.has(word.id) && styles.wordChipUsed,
                (hovered || pressed) &&
                  !selectedWordIds.has(word.id) &&
                  mini.result !== "correct" &&
                  styles.cardDepressHover,
              ]}
            >
              <View style={styles.matchWordTileHeader}>
                <ToneThaiText
                  thai={word.thai}
                  tones={getBreakdownTones(word)}
                  romanization={getItemRomanization(word)}
                  displayThaiSegments={word.displayThaiSegments}
                  style={styles.matchWordTileThai}
                  fallbackColor={BRAND.ink}
                />
                <ToneDots
                  tones={getBreakdownTones(word)}
                  style={styles.matchWordToneDots}
                />
              </View>
              {showRoman && getItemRomanization(word) ? (
                <Text style={styles.matchWordTileRoman}>
                  {getItemRomanization(word)}
                </Text>
              ) : null}
              {showEnglish && word.english ? (
                <Text style={styles.matchWordTileEnglish}>
                  {word.english.toUpperCase()}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionActionRow}>
          {exerciseBusy ? (
            <Text style={styles.pendingText}>Preparing the next round...</Text>
          ) : null}
        </View>
      </>
    );
  }

  function renderMatchExercise() {
    const revealedOption = mini.matchRevealed
      ? mini.matchOptions.find((option) => option.isCorrect) ?? null
      : null;

    return (
      <>
        <View style={styles.sentenceCard}>
          <View style={styles.sentenceTop}>
            {revealedOption ? (
              <View style={styles.sentenceTopContent}>
                <ToneSentence sentence={revealedOption} style={styles.miniThaiSentence} />
                {showRoman && revealedOption.romanization ? (
                  <Text style={styles.romanText}>{revealedOption.romanization}</Text>
                ) : null}
                {showEnglish && activeSentence?.english ? (
                  <Text style={styles.translationText}>{activeSentence.english}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.sentenceTopContent}>
                <Text style={styles.exerciseHelperLabel}>Which sentence means</Text>
                <Text style={styles.matchPrompt}>{activeSentence?.english}</Text>
                <Text style={styles.exerciseHint}>
                  Choose the most appropriate sentence below.
                </Text>
              </View>
            )}
            <View style={styles.sentenceTopActions}>
              {renderSentenceReportTrigger()}
              <Pressable
                onPress={() => {
                  if (audioSentence?.thai) void playSentence(audioSentence.thai);
                }}
                disabled={!audioSentence?.thai}
                style={({ hovered, pressed }) => [
                  styles.audioButton,
                  (hovered || pressed) && audioSentence?.thai && styles.squishHover,
                  !audioSentence?.thai && styles.audioButtonDisabled,
                ]}
              >
                <Ionicons name="volume-high-outline" size={22} color={BRAND.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.bottomSentenceActions}>
            {!mini.matchRevealed ? (
              <SurfaceButton
                label="Show answer"
                variant="secondary"
                onPress={mini.revealMatchAnswer}
                disabled={exerciseBusy}
                style={styles.inlineSentenceButton}
              />
            ) : null}
            {!mini.matchRevealed ? (
              <SurfaceButton
                label="Skip"
                variant="secondary"
                onPress={mini.continueToNextRound}
                disabled={exerciseBusy}
                style={styles.inlineSentenceButton}
              />
            ) : null}
            {mini.matchRevealed && mini.result !== "correct" ? (
              mini.result === "revealed" ? (
                <>
                  <SurfaceButton
                    label="Got it"
                    variant="primary"
                    onPress={mini.continueToNextRound}
                    disabled={exerciseBusy}
                    style={styles.inlineSentenceButton}
                  />
                  <SurfaceButton
                    label={sentenceExplanationLoading ? "Explaining..." : "Explain"}
                    variant="secondary"
                    onPress={() => void requestSentenceExplanation()}
                    disabled={exerciseBusy || sentenceExplanationLoading}
                    style={styles.inlineSentenceButton}
                  />
                </>
              ) : mini.currentMode === "matchThai" ? (
                <>
                  <SurfaceButton
                    label={sentenceExplanationLoading ? "Explaining..." : "Explain"}
                    variant="secondary"
                    onPress={() => void requestSentenceExplanation()}
                    disabled={exerciseBusy || sentenceExplanationLoading}
                    style={styles.inlineSentenceButton}
                  />
                  <SurfaceButton
                    label="Skip"
                    variant="primary"
                    onPress={mini.continueToNextRound}
                    disabled={exerciseBusy}
                    style={styles.inlineSentenceButton}
                  />
                </>
              ) : (
                <SurfaceButton
                  label="Skip"
                  variant="primary"
                  onPress={mini.continueToNextRound}
                  disabled={exerciseBusy}
                  style={styles.inlineSentenceButton}
                />
              )
            ) : null}
          </View>

        </View>

        <View style={styles.matchChoiceList}>
          {mini.matchOptions.map((option, index) => {
            const isSelected = mini.selectedOptionIndex === index;
            const revealedCorrect = mini.matchRevealed && option.isCorrect;
            const revealedWrong = mini.matchRevealed && isSelected && !option.isCorrect;
            const isExpanded = expandedMatchOptionIndex === index;
            const optionRomanTokens = getBreakdownRomanizations(
              option.romanization,
              option.breakdown,
            );

            return (
              <View
                key={`${option.thai}-${index}`}
                style={[
                  styles.matchChoiceCard,
                  isSelected && styles.matchChoiceCardSelected,
                  revealedCorrect && styles.matchChoiceCardCorrect,
                  revealedWrong && styles.matchChoiceCardWrong,
                ]}
              >
                <View style={styles.matchChoiceTopRow}>
                  <Pressable
                    onPress={() => {
                      if (wordAudioEnabled && option.thai) {
                        void playSentence(option.thai);
                      }
                      mini.selectMatchOption(index);
                    }}
                    disabled={mini.matchRevealed || exerciseBusy}
                    style={styles.matchChoiceSelectArea}
                  >
                    {option.breakdown.length > 0 ? (
                      <Text style={styles.matchChoiceSentence}>
                        {option.breakdown.map((item, itemIndex) => (
                          <ToneThaiText
                            key={`${index}-${itemIndex}-${item.thai}`}
                            thai={item.thai}
                            tones={getBreakdownTones(item)}
                            romanization={item.romanization || item.roman}
                            displayThaiSegments={item.displayThaiSegments}
                          />
                        ))}
                      </Text>
                    ) : (
                      <Text style={styles.matchChoiceSentence}>{option.thai}</Text>
                    )}
                    {showRoman && option.romanization ? (
                      <Text style={styles.matchChoiceRoman}>{option.romanization}</Text>
                    ) : null}
                  </Pressable>

                  {option.breakdown.length > 0 ? (
                    <Pressable
                      onPress={() => toggleMatchOptionExpanded(index)}
                      style={({ hovered, pressed }) => [
                        styles.matchExpandButton,
                        isExpanded && styles.matchExpandButtonActive,
                        (hovered || pressed) && styles.utilityButtonHover,
                      ]}
                    >
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={isExpanded ? BRAND.ink : BRAND.inkSoft}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {isExpanded ? (
                  <View style={styles.matchDetailsPanel}>
                    <View style={styles.matchTileRow}>
                      {option.breakdown.map((word, wordIndex) => (
                        <Pressable
                          key={`${option.thai}-${wordIndex}-${word.thai}`}
                          onPress={() => {
                            if (wordAudioEnabled && word.thai) {
                              void playSentence(word.thai);
                            }
                          }}
                          style={({ hovered, pressed }) => [
                            styles.matchWordTile,
                            (hovered || pressed) && wordAudioEnabled && styles.cardDepressHover,
                          ]}
                        >
                          <View style={styles.matchWordTileHeader}>
                            <ToneThaiText
                              thai={word.thai}
                              tones={getBreakdownTones(word)}
                              romanization={optionRomanTokens[wordIndex]}
                              displayThaiSegments={word.displayThaiSegments}
                              style={styles.matchWordTileThai}
                              fallbackColor={BRAND.ink}
                            />
                            <ToneDots
                              tones={getBreakdownTones(word)}
                              style={styles.matchWordToneDots}
                            />
                          </View>
                          {showRoman && optionRomanTokens[wordIndex] ? (
                            <Text style={styles.matchWordTileRoman}>
                              {optionRomanTokens[wordIndex]}
                            </Text>
                          ) : null}
                          {showEnglish && word.english ? (
                            <Text style={styles.matchWordTileEnglish}>
                              {word.english.toUpperCase()}
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.sectionActionRow}>
          {exerciseBusy ? (
            <Text style={styles.pendingText}>Preparing the next round...</Text>
          ) : null}
        </View>
      </>
    );
  }

  function renderLockedNavigationOverlay() {
    if (!lockedNavigationPrompt) return null;

    return (
      <View style={styles.lockedExerciseOverlay}>
        <View style={styles.lockedExerciseOverlayContent}>
          <Text style={styles.lockedNavigationTitle}>
            Get Keystone Access to continue learning
          </Text>
          <Text style={styles.lockedNavigationBody}>
            The {lockedNavigationPrompt.direction} grammar point,{" "}
            {lockedNavigationPrompt.point.title}, is part of Keystone Access.
          </Text>
          <View style={styles.lockedNavigationActions}>
            <SurfaceButton
              label="Get Keystone Access"
              variant="primary"
              onPress={() => void handleLockedNavigationCta()}
              style={styles.unlockButton}
            />
            <MiniUtilityButton
              label="Not now"
              onPress={() => setLockedNavigationPrompt(null)}
            />
          </View>
        </View>
      </View>
    );
  }

  if (!mini.hydrated || !selectedLesson) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Dashboard sandbox</Text>
          <Text style={styles.emptyBody}>Waiting for grammar catalog data to load.</Text>
        </View>
      </ScrollView>
    );
  }

  const tools = [
    {
      title: "Saved Bookmarks",
      detail: "Open bookmarks and saved grammar",
      icon: "bookmark-outline" as const,
      route: "/explore",
    },
    {
      title: "Practice Mix",
      detail:
        practicedGrammar.length > 0
          ? `${practicedGrammar.length} studied topics ready`
          : "Unlocks after your first completed lesson",
      icon: "shuffle-outline" as const,
      route: "/progress",
    },
    {
      title: "Alphabet Trainer",
      detail: "Alphabet drills and focused recall",
      icon: "school-outline" as const,
      route: "/trainer/",
    },
  ];

  const foundations = [
    { title: "Alphabet", detail: "Consonants and sound groups", icon: "alphabet" as const, route: "/alphabet/" },
    { title: "Numbers", detail: "Counting, time, and quantities", icon: "numbers" as const, route: "/numbers/" },
  ];

  return (
    <>
      <Modal
        visible={showPracticeMixModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPracticeMixModal(false)}
      >
        <View style={styles.practiceMixModalOverlay}>
          <Pressable
            style={styles.practiceMixModalBackdrop}
            onPress={() => setShowPracticeMixModal(false)}
          />
          <View style={styles.practiceMixModalCard}>
            <View style={styles.practiceMixModalHeader}>
              <View style={styles.practiceMixModalHeading}>
                <Text style={styles.practiceMixModalTitle}>Choose practice mix</Text>
                <Text style={styles.practiceMixModalSubtitle}>
                  Pick which studied grammar topics to include in this mixed practice round.
                </Text>
              </View>
              <Pressable
                onPress={() => setShowPracticeMixModal(false)}
                style={({ hovered, pressed }) => [
                  styles.practiceMixIconButton,
                  (hovered || pressed) && styles.utilityButtonHover,
                ]}
              >
                <Ionicons name="close" size={18} color={BRAND.ink} />
              </Pressable>
            </View>

            <View style={styles.practiceMixFilterWrap}>
              {(["All", ...PUBLIC_CEFR_LEVELS] as PracticeMixFilterLevel[]).map((level) => {
                const count =
                  level === "All" ? practicedGrammar.length : practiceMixCountsByLevel[level];
                const selected = selectedPracticeMixLevels.includes(level);
                const disabled = count === 0;

                return (
                  <Pressable
                    key={level}
                    onPress={() => togglePracticeMixLevel(level)}
                    disabled={disabled}
                    style={({ hovered, pressed }) => [
                      styles.practiceMixFilterChip,
                      selected && styles.practiceMixFilterChipActive,
                      disabled && styles.practiceMixFilterChipDisabled,
                      !disabled && (hovered || pressed) && styles.utilityButtonHover,
                    ]}
                  >
                    <Text
                      style={[
                        styles.practiceMixFilterChipText,
                        selected && styles.practiceMixFilterChipTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                    <Text
                      style={[
                        styles.practiceMixFilterChipCount,
                        selected && styles.practiceMixFilterChipTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.practiceMixModalFooter}>
              <View style={styles.practiceMixModalSummaryRow}>
                <Text style={styles.practiceMixModalSummaryLabel}>Selected set</Text>
                <Text style={styles.practiceMixModalSummaryValue}>
                  {filteredPracticeMixGrammar.length} studied topic
                  {filteredPracticeMixGrammar.length === 1 ? "" : "s"}
                </Text>
              </View>

              <SurfaceButton
                label={`Practice ${filteredPracticeMixGrammar.length} topic${
                  filteredPracticeMixGrammar.length === 1 ? "" : "s"
                }`}
                variant="primary"
                onPress={handleStartPracticeMix}
                disabled={filteredPracticeMixGrammar.length === 0}
                style={styles.practiceMixModalPrimaryButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.shell}>
        <View style={styles.dashboardGrid}>
          <View style={styles.mainColumn}>
            <View style={styles.previewCard}>
            <View style={styles.previewTop}>
                <View style={styles.previewControls}>
                  <View style={styles.displayToggleRow}>
                    <DisplayToggle
                      label="Romanization"
                      active={showRoman}
                      onPress={() => void toggleDisplaySetting("roman")}
                    />
                    <DisplayToggle
                      label="Translation"
                      active={showEnglish}
                      onPress={() => void toggleDisplaySetting("english")}
                    />
                    <DisplayToggle
                      label="Word Audio (Beta)"
                      active={wordAudioEnabled}
                      onPress={() => void toggleWordAudio()}
                    />
                  </View>
                  <ToneGuide />
                </View>
            </View>

              <View style={styles.demoPointRow}>
                <LevelPicker
                  selectedLevel={selectedLesson.level}
                  options={levelPickerOptions}
                  disabled={exerciseBusy}
                  onSelect={(option) => void handleLevelSelection(option)}
                />
                <View style={styles.infoBar}>
                  <View style={styles.infoBarRow}>
                    <View style={styles.infoBarCopy}>
                      <Text style={styles.cardLabel}>Grammar point</Text>
                      <Text style={styles.infoBarText}>{selectedLesson.pattern}</Text>
                    </View>
                    <View style={styles.pointNavGroup}>
                      <MiniUtilityButton
                        label="Previous"
                        icon="chevron-back-outline"
                        onPress={handlePreviousNavigation}
                        disabled={!previousLesson || exerciseBusy}
                      />
                      <MiniUtilityButton
                        label="Next"
                        icon="chevron-forward-outline"
                        onPress={handleNextNavigation}
                        disabled={!nextLessonInSequence || exerciseBusy}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.supportGrid}>
                <View style={styles.supportCard}>
                  <Text style={styles.cardLabel}>Lesson title</Text>
                  <Text style={styles.supportTitle}>{selectedLesson.title}</Text>
                  <Text style={styles.supportBody}>
                    {currentStageMeta?.title || selectedLesson.stage}
                  </Text>
                </View>
                <View style={styles.supportCard}>
                  <Text style={styles.cardLabel}>What it means</Text>
                  <Text style={styles.supportTitle}>{selectedLesson.focus.meaning}</Text>
                  <Text style={styles.supportBody}>
                    {summarize(selectedLesson.explanation)}
                  </Text>
                </View>
              </View>

              {lockedNavigationPrompt
                ? renderLockedNavigationOverlay()
                : mini.phase === "explanation"
                  ? renderExplanationSection()
                  : mini.currentMode === "wordScraps"
                    ? renderBuildExercise()
                    : renderMatchExercise()}

              <Modal
                visible={sentenceReportOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setSentenceReportOpen(false)}
              >
                <Pressable
                  style={styles.reportModalBackdrop}
                  onPress={() => setSentenceReportOpen(false)}
                >
                  <Pressable style={styles.reportModalCard} onPress={() => {}}>
                    <View style={styles.reportModalHeader}>
                      <Text style={styles.reportModalTitle}>Report sentence issue</Text>
                      <Pressable
                        onPress={() => setSentenceReportOpen(false)}
                        style={({ hovered, pressed }) => [
                          styles.reportModalClose,
                          (hovered || pressed) && styles.utilityButtonHover,
                        ]}
                      >
                        <Ionicons name="close" size={18} color={BRAND.ink} />
                      </Pressable>
                    </View>
                    {!sentenceReportSent ? (
                      <TextInput
                        ref={sentenceReportInputRef}
                        value={sentenceReportDraft}
                        onChangeText={setSentenceReportDraft}
                    placeholder="Example: Tone color is wrong, audio doesn't match, or translation is unnatural."
                        placeholderTextColor="#8D8D8D"
                        style={styles.reportModalInput}
                        editable={!sentenceReportBusy}
                        multiline
                        textAlignVertical="top"
                      />
                    ) : null}
                    {sentenceReportStatus ? (
                      <Text
                        style={[
                          styles.sentenceReportStatus,
                          sentenceReportStatus.kind === "success" &&
                            styles.sentenceReportStatusSuccess,
                          sentenceReportStatus.kind === "error" && styles.sentenceReportStatusError,
                        ]}
                      >
                        {sentenceReportStatus.message}
                      </Text>
                    ) : null}
                    <View style={styles.reportModalActions}>
                      <MiniUtilityButton
                        label={sentenceReportSent ? "Close" : "Cancel"}
                        onPress={() => setSentenceReportOpen(false)}
                        disabled={sentenceReportBusy}
                      />
                      {!sentenceReportSent ? (
                        <SurfaceButton
                          label={sentenceReportBusy ? "Sending..." : "Send"}
                          variant="primary"
                          onPress={() => {
                            void submitSentenceReport();
                          }}
                          disabled={sentenceReportBusy}
                          style={styles.reportModalSendButton}
                        />
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

              {mini.errorMessage ? (
                <Text style={styles.inlineErrorText}>{mini.errorMessage}</Text>
              ) : null}

              <View style={styles.miniUtilityBar}>
                {mini.phase === "explanation" && !lockedNavigationPrompt ? (
                  <View style={styles.explanationUtilityGroup}>
                    <SurfaceButton
                      label={mini.previewLoading ? "Loading..." : "Next Example"}
                      variant="primary"
                      onPress={mini.nextPreviewSentence}
                      disabled={exerciseBusy || mini.previewLoading || !previewSentence}
                      style={styles.explanationUtilityButton}
                    />
                    <SurfaceButton
                      label={sentenceExplanationLoading ? "Explaining..." : "Explain"}
                      variant="secondary"
                      onPress={() => void requestSentenceExplanation()}
                      disabled={exerciseBusy || sentenceExplanationLoading || !previewSentence}
                      style={styles.explanationUtilityButton}
                    />
                  </View>
                ) : (
                  <View />
                )}
                <View style={styles.utilityGroup}>
                  {mini.phase === "explanation" && !lockedNavigationPrompt ? (
                    <SurfaceButton
                      label="Start practice"
                      variant="primary"
                      onPress={mini.startMiniPractice}
                      disabled={!mini.canStartMiniPractice || exerciseBusy}
                      style={styles.footerPrimaryButton}
                    />
                  ) : null}
                  <MiniUtilityButton
                    label="Full lesson"
                    onPress={() => void openLesson(selectedLesson)}
                    disabled={exerciseBusy}
                  />
                </View>
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.headerRow}>
                <View style={styles.headerCopy}>
                  <Text style={styles.cardLabel}>Current progress</Text>
                  <Text style={styles.sectionHeading}>
                    {currentStageMeta?.title || selectedLesson.title}
                  </Text>
                  <Text style={styles.sectionSubheading}>
                    Next lesson: {selectedLesson.title}
                  </Text>
                </View>
                <View style={styles.percentBlock}>
                  <Text style={styles.percentText}>{overallProgress}%</Text>
                  <Text style={styles.percentMeta}>course complete</Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Current path</Text>
                  <Text style={styles.metricValue}>
                    {currentStageMeta?.shortTitle || "Path"}
                  </Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Stage progress</Text>
                  <Text style={styles.metricValue}>
                    {stageProgress}% · {currentStagePracticed}/{currentStagePoints.length}
                  </Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Studied grammar</Text>
                  <Text style={styles.metricValue}>{practicedGrammar.length} topics</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
              </View>

              <View style={styles.stageRail}>
                {stageRail.map((stage) => (
                  <View key={stage.id} style={styles.stageNode}>
                    <View
                      style={[
                        styles.stageDot,
                        stage.status === "complete" && styles.stageDotComplete,
                        stage.status === "current" && styles.stageDotCurrent,
                      ]}
                    >
                      {stage.status === "visited" ? <View style={styles.stageDotInner} /> : null}
                    </View>
                    <Text
                      style={[
                        styles.stageText,
                        stage.status === "current" && styles.stageTextCurrent,
                        stage.status === "complete" && styles.stageTextActive,
                      ]}
                    >
                      {stage.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerCopy}>
                  Continue with the next grammar point whenever you are ready.
                </Text>
                <Pressable
                  onPress={() => void openLesson(selectedLesson)}
                  style={({ hovered, pressed }) => [
                    styles.inlineLink,
                    (hovered || pressed) && styles.inlineLinkActive,
                  ]}
                >
                  <Text style={styles.inlineLinkText}>Open lesson</Text>
                  <Ionicons name="arrow-forward" size={18} color={BRAND.ink} />
                </Pressable>
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <Text style={styles.sectionHeading}>Study tools</Text>
              <Text style={styles.sectionSubheading}>
                Use these tools whenever you want extra practice.
              </Text>
              <View style={styles.tileGrid}>
                {tools.map((tool) => {
                  const isPracticeMixTile = tool.title === "Practice Mix";
                  const isDisabled = isPracticeMixTile && practicedGrammar.length === 0;
                  return (
                    <Pressable
                      key={tool.title}
                      disabled={isDisabled}
                      onPress={() => {
                        if (isPracticeMixTile) {
                          openPracticeMixChooser();
                          return;
                        }
                        router.push(tool.route as any);
                      }}
                      style={({ hovered, pressed }) => [
                        styles.tile,
                        isDisabled && styles.tileDisabled,
                        !isDisabled && (hovered || pressed) && styles.cardDepressHover,
                      ]}
                    >
                      <View style={styles.tileIcon}>
                        <Ionicons name={tool.icon} size={18} color={BRAND.black} />
                      </View>
                      <View style={styles.tileCopy}>
                        <Text style={styles.tileTitle}>{tool.title}</Text>
                        <Text style={styles.tileDetail}>{tool.detail}</Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={isDisabled ? BRAND.muted : BRAND.ink}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <Text style={styles.sectionHeading}>Alphabet + numbers</Text>
              <Text style={styles.sectionSubheading}>
                Use these reading tools when you want focused script practice.
              </Text>
              <View style={styles.tileGrid}>
                {foundations.map((tool) => (
                  <Pressable
                    key={tool.title}
                    onPress={() => router.push(tool.route as any)}
                    style={({ hovered, pressed }) => [
                      styles.tile,
                      (hovered || pressed) && styles.cardDepressHover,
                    ]}
                  >
                    <View style={styles.tileIcon}>
                      {tool.title === "Alphabet" ? (
                        <Text style={styles.tileThaiGlyph}>ก</Text>
                      ) : tool.icon === "alphabet" || tool.icon === "numbers" ? (
                        <KimiIcon name={tool.icon} size={18} color={BRAND.black} />
                      ) : (
                        <Ionicons name={tool.icon} size={18} color={BRAND.black} />
                      )}
                    </View>
                    <View style={styles.tileCopy}>
                      <Text style={styles.tileTitle}>{tool.title}</Text>
                      <Text style={styles.tileDetail}>{tool.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={BRAND.ink} />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.surfaceCard}>
              <Text style={styles.cardLabel}>Review queue</Text>
              <Text style={styles.reviewBig}>
                {reviewsDue > 0 ? `${reviewsDue} cards` : "Vocabulary ready"}
              </Text>
              <Text style={styles.sectionSubheading}>{reviewStatus}</Text>
              <SurfaceButton
                label={isGuest ? "Sign in" : "Open review"}
                variant="primary"
                onPress={() => router.push((isGuest ? "/login" : "/review/") as any)}
              />
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.accountRow}>
                <View style={styles.accountIdentity}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={18} color={BRAND.black} />
                  </View>
                  <View style={styles.accountCopy}>
                    <Text numberOfLines={1} style={styles.accountName}>
                      {profileName}
                    </Text>
                    <Text numberOfLines={2} style={styles.accountEmail}>
                      {profileEmail}
                    </Text>
                  </View>
                </View>
                <View style={styles.accountBadge}>
                  <Text style={styles.accountBadgeText}>
                    {isPremium ? "Keystone Access" : "Standard"}
                  </Text>
                </View>
              </View>

              <View style={styles.accountStats}>
                <View style={styles.accountStat}>
                  <Text style={styles.accountStatValue}>{todayCount}</Text>
                  <Text style={styles.accountStatText}>New today</Text>
                </View>
                <View style={styles.accountDivider} />
                <View style={styles.accountStat}>
                  <Text style={styles.accountStatValue}>{practicedGrammar.length}</Text>
                  <Text style={styles.accountStatText}>Practiced</Text>
                </View>
                <View style={styles.accountDivider} />
                <View style={styles.accountStat}>
                  <Text style={styles.accountStatValue}>{selectedLesson.stage}</Text>
                  <Text style={styles.accountStatText}>Stage</Text>
                </View>
              </View>

              <View style={styles.sideActions}>
                <Pressable
                  onPress={() => router.push("/profile" as any)}
                  style={({ hovered, pressed }) => [
                    styles.toneGuide,
                    (hovered || pressed) && styles.squishHover,
                  ]}
                >
                  <Ionicons name="person-outline" size={16} color={BRAND.black} />
                  <Text style={styles.toneGuideText}>Profile</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/settings" as any)}
                  style={({ hovered, pressed }) => [
                    styles.toneGuide,
                    (hovered || pressed) && styles.squishHover,
                  ]}
                >
                  <Ionicons name="settings-outline" size={16} color={BRAND.black} />
                  <Text style={styles.toneGuideText}>Settings</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <Text style={styles.sectionHeading}>Course progress</Text>
              <Text style={styles.sectionSubheading}>
                See where you are in the course at a glance.
              </Text>
              <Text style={styles.percentText}>{overallProgress}%</Text>
              <Text style={styles.percentMeta}>complete so far</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
              </View>
              <View style={styles.levelStack}>
                {levelProgress.map((level) => (
                  <View key={level.level} style={styles.levelCard}>
                    <View style={styles.levelTop}>
                      <View>
                        <Text style={styles.levelTitle}>{level.level}</Text>
                        <Text style={styles.levelName}>{level.shortLabel}</Text>
                      </View>
                      <Text style={styles.levelPercent}>{level.percent}%</Text>
                    </View>
                    <View style={styles.levelTrack}>
                      <View style={[styles.levelFill, { width: `${level.percent}%` }]} />
                    </View>
                    <Text style={styles.levelMeta}>
                      {level.practiced}/{level.total} topics
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: BRAND.bg },
  pageContent: { paddingHorizontal: 28, paddingVertical: 36 },
  shell: { width: "100%", maxWidth: DESKTOP_PAGE_WIDTH, alignSelf: "center", gap: 24 },
  topActionStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    alignItems: "center",
  },
  dashboardGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  mainColumn: { flex: 1, minWidth: 0, gap: 24 },
  sideColumn: { width: 320, gap: 24 },
  previewCard: {
    position: "relative",
    zIndex: 2,
    overflow: "visible",
    backgroundColor: BRAND.paper,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 20,
    gap: 14,
    boxShadow: CARD_SHADOW as any,
  },
  previewTop: {
    zIndex: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  previewControls: {
    zIndex: 8,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  displayToggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  demoPointRow: {
    position: "relative",
    zIndex: 4,
    overflow: "visible",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  infoBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoBarCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  pointNavGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  levelBadgeShell: {
    position: "relative",
    zIndex: 4,
  },
  levelBadge: {
    width: 70,
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: SENTENCE_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  levelBadgeDisabled: {
    opacity: 0.5,
  },
  levelBadgeText: {
    color: BRAND.ink,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  levelBadgePopover: {
    position: "absolute",
    top: 82,
    left: 0,
    zIndex: 40,
    minWidth: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    boxShadow: "0 12px 26px rgba(16, 42, 67, 0.08)" as any,
  },
  levelBadgeOption: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  levelBadgeOptionHover: {
    backgroundColor: "#F5F5F5",
  },
  levelBadgeOptionActive: {
    backgroundColor: BRAND.panel,
  },
  levelBadgeOptionLocked: {
    opacity: 0.58,
  },
  levelBadgeOptionLabel: {
    color: BRAND.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  levelBadgeOptionLabelLocked: {
    color: BRAND.muted,
  },
  levelBadgeOptionTitle: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: BODY_FONT,
  },
  levelBadgeOptionTitleLocked: {
    color: BRAND.muted,
  },
  infoBar: {
    flex: 1,
    position: "relative",
    zIndex: 3,
    overflow: "visible",
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
  },
  infoBarText: {
    color: BRAND.ink,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  supportGrid: {
    position: "relative",
    zIndex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  supportCard: {
    flex: 1,
    minWidth: 280,
    position: "relative",
    zIndex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  supportTitle: {
    color: BRAND.ink,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  supportBody: {
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: BODY_FONT,
  },
  sentenceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
    boxShadow: SENTENCE_SHADOW as any,
  },
  sentenceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  sentenceTopContent: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  sentenceTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardLabel: {
    color: BRAND.muted,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  audioButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: BRAND.line,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  audioButtonDisabled: { opacity: 0.4 },
  thaiSentence: {
    color: BRAND.ink,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "800",
    fontFamily: THAI_FONT,
    letterSpacing: -0.9,
  },
  miniThaiSentence: {
    color: BRAND.ink,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    fontFamily: THAI_FONT,
    letterSpacing: -0.7,
  },
  romanText: {
    color: BRAND.ink,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  translationText: {
    color: BRAND.ink,
    fontSize: 17,
    lineHeight: 28,
    fontFamily: BODY_FONT,
  },
  loadingState: {
    minHeight: 120,
    justifyContent: "center",
  },
  loadingText: {
    color: BRAND.inkSoft,
    fontSize: 16,
    lineHeight: 28,
    fontFamily: BODY_FONT,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackBannerCorrect: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.navy,
    borderWidth: 2,
  },
  feedbackBannerWrong: {
    backgroundColor: "#F7F7F7",
    borderColor: "#E3E3E3",
  },
  feedbackBannerNeutral: {
    backgroundColor: "#FAFAFA",
    borderColor: BRAND.line,
  },
  feedbackIconWrap: {
    paddingTop: 1,
  },
  feedbackTextWrap: {
    flex: 1,
    gap: 2,
  },
  feedbackTitle: {
    color: BRAND.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  feedbackBody: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: BODY_FONT,
  },
  exerciseHelperLabel: {
    color: BRAND.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  translationPrompt: {
    color: BRAND.ink,
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT,
  },
  matchPrompt: {
    color: BRAND.ink,
    fontSize: 21,
    lineHeight: 30,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT,
  },
  exerciseHint: {
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 25,
    fontFamily: BODY_FONT,
  },
  sentenceFooterCopy: {
    gap: 6,
  },
  bottomSentenceActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "flex-start",
    justifyContent: "flex-start",
    gap: 10,
  },
  sentenceReportAlertButton: {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  sentenceReportAlertText: {
    color: BRAND.ink,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sentenceReportStatus: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: BODY_FONT,
  },
  sentenceReportStatusSuccess: {
    color: BRAND.ink,
  },
  sentenceReportStatusError: {
    color: BRAND.inkSoft,
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
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
    boxShadow: SENTENCE_SHADOW as any,
  },
  reportModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reportModalTitle: {
    color: BRAND.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  reportModalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: LIGHT_BUTTON as any,
  },
  reportModalContext: {
    color: BRAND.ink,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  reportModalInput: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: BRAND.ink,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: BODY_FONT,
  },
  reportModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },
  reportModalSendButton: {
    height: 40,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  practiceMixModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    padding: 28,
  },
  practiceMixModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  practiceMixModalCard: {
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 24,
    paddingVertical: 22,
    gap: 20,
    boxShadow: CARD_SHADOW as any,
  },
  practiceMixModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  practiceMixModalHeading: {
    flex: 1,
    gap: 8,
  },
  practiceMixModalTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
    fontFamily: DISPLAY_FONT,
  },
  practiceMixModalSubtitle: {
    maxWidth: 460,
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  practiceMixIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  practiceMixFilterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  practiceMixFilterChip: {
    width: 84,
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  practiceMixFilterChipActive: {
    borderColor: BRAND.navy,
    backgroundColor: BRAND.paper,
  },
  practiceMixFilterChipDisabled: {
    opacity: 0.45,
  },
  practiceMixFilterChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  practiceMixFilterChipCount: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  practiceMixFilterChipTextActive: {
    color: BRAND.navy,
  },
  practiceMixModalFooter: {
    gap: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
  },
  practiceMixModalSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  practiceMixModalSummaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.inkSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  practiceMixModalSummaryValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  practiceMixModalPrimaryButton: {
    width: "100%",
    minWidth: 0,
  },
  inlineSentenceButton: {
    height: 40,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 0,
    boxShadow: INLINE_BUTTON_SHADOW as any,
  },
  answerBoard: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  answerWordTile: {
    minHeight: 66,
    justifyContent: "center",
  },
  answerWordTileEmpty: {
    minWidth: 68,
    backgroundColor: BRAND.paper,
    opacity: 0.7,
  },
  answerWordTilePrefilled: {
    backgroundColor: "#F7F7F7",
    borderColor: "#E6E8EB",
  },
  answerWordTileThai: {
    textAlign: "center",
  },
  answerWordTileText: {
    textAlign: "center",
  },
  answerWordTilePrefilledText: {
    opacity: 0.72,
  },
  answerChipPlaceholderText: {
    color: BRAND.muted,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: BODY_FONT,
  },
  wordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  wordChipUsed: {
    opacity: 0.42,
  },
  sectionActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  explanationActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    paddingTop: 4,
  },
  explanationUtilityGroup: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 10,
    alignItems: "center",
    minWidth: 0,
  },
  explanationUtilityButton: {
    width: 138,
    minWidth: 138,
    minHeight: 40,
    height: 40,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  pendingText: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    fontFamily: BODY_FONT,
  },
  lockedExerciseOverlay: {
    minHeight: 320,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "center",
    boxShadow: SENTENCE_SHADOW as any,
  },
  lockedExerciseOverlayContent: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    alignItems: "center",
    gap: 14,
  },
  lockedNavigationCard: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 18,
    paddingVertical: 16,
    boxShadow: SENTENCE_SHADOW as any,
  },
  lockedNavigationCopy: {
    width: "100%",
    maxWidth: 560,
    alignItems: "center",
    gap: 4,
  },
  lockedNavigationTitle: {
    color: BRAND.ink,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
    textAlign: "center",
  },
  lockedNavigationBody: {
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: BODY_FONT,
    textAlign: "center",
  },
  lockedNavigationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  unlockButton: {
    minHeight: 40,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  miniUtilityBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    paddingTop: 6,
  },
  utilityGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  utilityStackColumn: {
    width: "100%",
    gap: 10,
  },
  footerSecondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerSecondaryButton: {
    flex: 1,
    minWidth: 0,
  },
  utilityButton: {
    minHeight: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  utilityButtonHover: {
    transform: [{ translateY: 1.6 }],
    boxShadow: LIGHT_BUTTON_PRESSED as any,
  },
  utilityButtonDisabled: {
    opacity: 0.48,
  },
  utilityButtonText: {
    color: BRAND.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  utilityButtonTextDisabled: {
    color: "#8D8D8D",
  },
  footerPrimaryButton: {
    minHeight: 40,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  displayToggle: {
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  displayToggleActive: {
    backgroundColor: BRAND.panel,
  },
  displayToggleText: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  displayToggleTextActive: {
    color: BRAND.ink,
  },
  displayToggleCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    justifyContent: "center",
    alignItems: "center",
  },
  displayToggleCheckActive: {
    borderColor: BRAND.navy,
    backgroundColor: BRAND.navy,
  },
  inlineErrorText: {
    color: "#B4534B",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    fontFamily: BODY_FONT,
  },
  matchChoiceList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 12,
  },
  matchChoiceCard: {
    width: "48.9%",
    maxWidth: "48.9%",
    minWidth: 0,
    alignSelf: "flex-start",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: BRAND.paper,
    padding: 14,
    gap: 8,
    boxShadow: CARD_SHADOW as any,
  },
  matchChoiceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 0,
  },
  matchChoiceSelectArea: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  matchExpandButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  matchExpandButtonActive: {
    borderColor: "#C5CFD6",
    backgroundColor: BRAND.paper,
  },
  matchDetailsPanel: {
    paddingTop: 10,
  },
  matchTileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  matchWordTile: {
    minWidth: 92,
    maxWidth: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    alignSelf: "flex-start",
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  matchWordTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
  },
  matchWordTileThai: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.ink,
    flexShrink: 1,
    fontFamily: THAI_FONT,
  },
  matchWordToneDots: {
    marginLeft: 2,
  },
  matchWordTileRoman: {
    color: BRAND.muted,
    fontSize: 9,
    fontWeight: "500",
    opacity: 0.9,
    marginTop: 3,
    letterSpacing: 0.2,
    fontFamily: BODY_FONT,
  },
  matchWordTileEnglish: {
    color: BRAND.muted,
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.9,
    marginTop: 2,
    letterSpacing: 0.4,
    fontFamily: BODY_FONT,
  },
  matchChoiceCardSelected: {
    borderColor: "#C5CFD6",
  },
  matchChoiceCardCorrect: {
    backgroundColor: BRAND.paper,
    borderColor: "#1F2D3F",
    borderWidth: 2,
  },
  matchChoiceCardWrong: {
    backgroundColor: "#F9F9F7",
    borderColor: "#D8DCDf",
  },
  matchChoiceSentence: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
    textAlign: "left",
    width: "100%",
    fontFamily: THAI_FONT,
  },
  matchChoiceRoman: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    textAlign: "left",
    width: "100%",
    fontFamily: BODY_FONT,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  buttonPrimary: {
    backgroundColor: BRAND.navy,
    borderWidth: 1,
    borderColor: "#0D2237",
    boxShadow: NAVY_BUTTON as any,
  },
  buttonSecondary: { backgroundColor: "#F5F5F5", boxShadow: LIGHT_BUTTON as any },
  buttonPrimaryActive: {
    transform: [{ translateY: 1.6 }],
    boxShadow: NAVY_BUTTON_PRESSED as any,
  },
  buttonSecondaryActive: {
    transform: [{ translateY: 1.6 }],
    boxShadow: LIGHT_BUTTON_PRESSED as any,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  buttonTextPrimary: { color: "#FFFFFF" },
  buttonTextSecondary: { color: "#404040" },
  buttonTextDisabled: { color: "#7F7F7F" },
  toneGuideShell: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 12,
  },
  toneGuideStandaloneLabel: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
    fontFamily: BODY_FONT,
    transform: [{ translateY: 1 }],
  },
  toneGuideButton: {
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  toneGuidePopover: {
    position: "absolute",
    top: 46,
    right: 0,
    zIndex: 80,
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
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
    color: BRAND.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500",
    fontFamily: BODY_FONT,
  },
  toneGuide: {
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  squishHover: {
    transform: [{ translateY: 1.6 }],
    boxShadow: LIGHT_BUTTON_PRESSED as any,
  },
  cardDepressHover: {
    transform: [{ translateY: 1.6 }],
    boxShadow: "0 1px 0 0 #d4d4d4, 0 1px 0 0 #d4d4d4, 0 2px 3px rgba(16, 42, 67, 0.04)" as any,
  },
  toneGuideText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  toneDots: { flexDirection: "row", gap: 6 },
  toneDot: { width: 8, height: 8, borderRadius: 4 },
  surfaceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 24,
    gap: 14,
    boxShadow: CARD_SHADOW as any,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
  },
  headerCopy: { flex: 1, gap: 8 },
  sectionHeading: {
    color: BRAND.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sectionSubheading: {
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: BODY_FONT,
  },
  percentBlock: {
    minWidth: 116,
    alignItems: "flex-end",
    gap: 6,
  },
  percentText: {
    color: BRAND.ink,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  percentMeta: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: BODY_FONT,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  metricLabel: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  metricValue: {
    color: BRAND.ink,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E8EBEF",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: BRAND.navy,
  },
  stageRail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  stageNode: {
    flex: 1,
    alignItems: "center",
    gap: 10,
  },
  stageDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#D7DCE1",
    backgroundColor: BRAND.paper,
    justifyContent: "center",
    alignItems: "center",
  },
  stageDotComplete: {
    backgroundColor: BRAND.navy,
    borderColor: BRAND.navy,
  },
  stageDotCurrent: {
    borderColor: BRAND.navy,
  },
  stageDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A8B4C2",
  },
  stageText: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: BODY_FONT,
    textAlign: "center",
  },
  stageTextCurrent: {
    color: BRAND.ink,
    fontWeight: "700",
  },
  stageTextActive: {
    color: BRAND.ink,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  footerCopy: {
    flex: 1,
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: BODY_FONT,
  },
  inlineLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  inlineLinkActive: {
    transform: [{ translateY: 1.6 }],
    opacity: 0.88,
  },
  inlineLinkText: {
    color: BRAND.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  tile: {
    flex: 1,
    minWidth: 240,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    boxShadow: SENTENCE_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  tileDisabled: {
    opacity: 0.48,
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    justifyContent: "center",
    alignItems: "center",
  },
  tileThaiGlyph: {
    color: BRAND.black,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: BODY_FONT,
    fontWeight: "800",
  },
  tileCopy: {
    flex: 1,
    gap: 3,
  },
  tileTitle: {
    color: BRAND.black,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  tileDetail: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: BODY_FONT,
  },
  reviewBig: {
    color: BRAND.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 14,
  },
  accountIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    justifyContent: "center",
    alignItems: "center",
  },
  accountName: {
    color: BRAND.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT,
  },
  accountEmail: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: BODY_FONT,
  },
  accountBadge: {
    minHeight: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: LIGHT_BUTTON as any,
    flexShrink: 0,
    marginTop: 2,
  },
  accountBadgeText: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: BODY_FONT,
  },
  accountStats: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
  },
  accountStat: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  accountStatValue: {
    color: BRAND.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  accountStatText: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: BODY_FONT,
  },
  accountDivider: {
    width: 1,
    backgroundColor: BRAND.line,
  },
  sideActions: {
    gap: 10,
  },
  levelStack: {
    gap: 12,
  },
  levelCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  levelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  levelTitle: {
    color: BRAND.ink,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  levelName: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: BODY_FONT,
  },
  levelPercent: {
    color: BRAND.ink,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT,
  },
  levelTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E2E7ED",
    overflow: "hidden",
  },
  levelFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: BRAND.navy,
  },
  levelMeta: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: BODY_FONT,
  },
  emptyState: {
    width: "100%",
    maxWidth: 860,
    alignSelf: "center",
    paddingVertical: 120,
    gap: 10,
  },
  emptyTitle: {
    color: BRAND.ink,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT,
  },
  emptyBody: {
    color: BRAND.inkSoft,
    fontSize: 18,
    lineHeight: 30,
    fontFamily: BODY_FONT,
  },
});
