import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
import Header, { SettingsState } from "../../../src/components/Header";
import { alphabet } from "../../../src/data/alphabet";
import { MUTED_FEEDBACK_ACCENTS } from "../../../src/utils/toneAccent";

type AlphabetLetter = {
  letter: string;
  name: string;
  romanization: string;
  sound: string;
  example: {
    thai: string;
    romanization: string;
    english: string;
  };
  group: number;
};

type Mode = "study" | "match" | "recall";

const ALL_MODES: Mode[] = ["study", "match", "recall"];
const ACCENT = Sketch.orange;

const GROUP_META: Record<
  number,
  { title: string; accent: string; badge: string }
> = {
  1: { title: "Mid Class", accent: Sketch.yellow, badge: "Group 1" },
  2: { title: "High Class", accent: Sketch.blue, badge: "Group 2" },
  3: { title: "Low Class I", accent: Sketch.red, badge: "Group 3" },
  4: { title: "Low Class II", accent: Sketch.green, badge: "Group 4" },
};

const MODE_META: Record<
  Mode,
  {
    label: string;
    title: string;
    subtitle: string;
  }
> = {
  study: {
    label: "Study",
    title: "See the letter and hear the full Thai name.",
    subtitle: "Best for visual recognition and first-pass memorization.",
  },
  match: {
    label: "Match",
    title: "Pick the letter that matches the sound.",
    subtitle: "You hear or see the sound first, then choose the consonant.",
  },
  recall: {
    label: "Recall",
    title: "Look at the letter and choose its sound.",
    subtitle: "A faster recognition check once the shapes feel familiar.",
  },
};

function shuffle<T>(items: T[]): T[] {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickNextItem<T>(
  items: T[],
  currentItem: T,
  isSameItem: (left: T, right: T) => boolean,
): T {
  if (items.length <= 1) {
    return items[0];
  }

  const pool = items.filter((item) => !isSameItem(item, currentItem));
  return pickRandom(pool.length > 0 ? pool : items);
}

function pickNextMode(currentMode?: Mode): Mode {
  const pool = currentMode
    ? ALL_MODES.filter((mode) => mode !== currentMode)
    : ALL_MODES;
  return pickRandom(pool);
}

function generateOptions(
  correct: AlphabetLetter,
  pool: AlphabetLetter[],
  allLetters: AlphabetLetter[],
): AlphabetLetter[] {
  let candidates = pool.filter(
    (item) => item.letter !== correct.letter && item.sound !== correct.sound,
  );

  if (candidates.length < 3) {
    candidates = allLetters.filter(
      (item) => item.letter !== correct.letter && item.sound !== correct.sound,
    );
  }

  return shuffle([correct, ...shuffle(candidates).slice(0, 3)]);
}

export default function AlphabetPractice() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const letters = (alphabet as AlphabetLetter[]).filter(
    (item) => item.group === Number(group),
  );
  const allLetters = alphabet as AlphabetLetter[];
  const groupInfo = GROUP_META[Number(group)] ?? GROUP_META[1];

  const initialMode = pickNextMode();
  const initialItem = pickRandom(letters);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [currentItem, setCurrentItem] = useState<AlphabetLetter>(initialItem);
  const [options, setOptions] = useState<AlphabetLetter[]>(
    initialMode === "study"
      ? []
      : generateOptions(initialItem, letters, allLetters),
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<SettingsState["ttsSpeed"]>("slow");

  const playSound = useCallback(
    (text: string) => {
      const rate =
        ttsSpeed === "fast" ? 1.05 : ttsSpeed === "normal" ? 0.92 : 0.82;
      Speech.stop();
      Speech.speak(text, { language: "th-TH", rate });
    },
    [ttsSpeed],
  );

  const setupRound = useCallback(
    (nextMode: Mode) => {
      const nextItem = pickNextItem(
        letters,
        currentItem,
        (left, right) => left.letter === right.letter,
      );
      setMode(nextMode);
      setCurrentItem(nextItem);
      setSelectedOption(null);
      setRevealed(false);
      setOptions(
        nextMode === "study"
          ? []
          : generateOptions(nextItem, letters, allLetters),
      );
    },
    [allLetters, currentItem, letters],
  );

  useEffect(() => {
    if (!revealed || mode === "study") return;

    autoAdvanceRef.current = setTimeout(() => {
      setupRound(mode);
    }, 800);

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [mode, revealed, setupRound]);

  function handleModePress(nextMode: Mode) {
    setupRound(nextMode);
  }

  function handleMatchSelect(index: number) {
    if (revealed) return;

    const picked = options[index];
    setSelectedOption(index);
    setRevealed(true);
    if (autoplayTTS) {
      playSound(picked.name);
    }
  }

  function handleRecallSelect(index: number) {
    if (revealed) return;

    setSelectedOption(index);
    setRevealed(true);
    if (autoplayTTS) {
      playSound(currentItem.name);
    }
  }

  function handleContinue() {
    setupRound(mode);
  }

  const modeInfo = MODE_META[mode];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Alphabet Practice"
        onBack={() => router.back()}
        showClose
        onSettingsChange={(settings) => {
          setAutoplayTTS(settings.autoplayTTS);
          setTtsSpeed(settings.ttsSpeed);
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.practiceHeader}>
          <Text style={styles.practiceMeta}>
            {groupInfo.badge} • {groupInfo.title}
          </Text>
          <View style={styles.modeRow}>
            {ALL_MODES.map((item) => {
              const active = item === mode;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                  onPress={() => handleModePress(item)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      active && styles.modeChipTextActive,
                    ]}
                  >
                    {MODE_META[item].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.promptCard}>
          <View style={styles.promptMetaRow}>
            <Text style={styles.promptBadge}>{groupInfo.badge}</Text>
            <Text style={styles.promptMetaDivider}>|</Text>
            <Text style={styles.promptGroupTitle}>{groupInfo.title}</Text>
          </View>
          <Text style={styles.promptEyebrow}>{MODE_META[mode].label}</Text>
          <Text style={styles.promptTitle}>{modeInfo.title}</Text>
          <Text style={styles.promptSubtitle}>{modeInfo.subtitle}</Text>
        </View>

        {mode === "study" ? (
          <>
            <TouchableOpacity
              style={styles.studyCard}
              onPress={() => playSound(currentItem.name)}
              activeOpacity={0.9}
            >
              <View style={styles.studyCardTop}>
                <View style={styles.soundBadge}>
                  <Text style={styles.soundBadgeText}>
                    {currentItem.sound.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    playSound(currentItem.name);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="volume-medium-outline"
                    size={18}
                    color={Sketch.ink}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.studyGlyph}>{currentItem.letter}</Text>
              <Text style={styles.studyName}>{currentItem.name}</Text>
              <Text style={styles.studyRoman}>{currentItem.romanization}</Text>

              <View style={styles.exampleCard}>
                <Text style={styles.exampleLabel}>Example</Text>
                <Text style={styles.exampleThai}>
                  {currentItem.example.thai}
                </Text>
                <Text style={styles.exampleDetail}>
                  {currentItem.example.romanization} ·{" "}
                  {currentItem.example.english}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: ACCENT, borderColor: ACCENT },
              ]}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {mode === "match" ? (
          <>
            <View style={styles.exerciseCard}>
              <Text style={styles.questionLabel}>Target sound</Text>
              <Text style={styles.questionText}>{currentItem.sound}</Text>
            </View>

            <View style={styles.optionGrid}>
              {options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrect = option.letter === currentItem.letter;
                const borderColor = revealed
                  ? isCorrect
                    ? MUTED_FEEDBACK_ACCENTS.successBorder
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.errorBorder
                      : Sketch.inkFaint
                  : isSelected
                    ? MUTED_FEEDBACK_ACCENTS.selectedBorder
                    : Sketch.inkFaint;
                const backgroundColor = revealed
                  ? isCorrect
                    ? MUTED_FEEDBACK_ACCENTS.successTint
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.errorTint
                      : Sketch.cardBg
                  : isSelected
                    ? MUTED_FEEDBACK_ACCENTS.selectedTint
                    : Sketch.cardBg;

                return (
                  <TouchableOpacity
                    key={option.letter}
                    style={[
                      styles.optionCard,
                      { borderColor, backgroundColor },
                    ]}
                    onPress={() => handleMatchSelect(index)}
                    activeOpacity={0.85}
                    disabled={revealed}
                  >
                    <Text style={styles.optionGlyph}>{option.letter}</Text>
                    <Text style={styles.optionLabel}>{option.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}

        {mode === "recall" ? (
          <>
            <View style={styles.exerciseCard}>
              <Text style={styles.questionLabel}>Target letter</Text>
              <Text style={styles.questionGlyph}>{currentItem.letter}</Text>
            </View>

            <View style={styles.optionGrid}>
              {options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrect = option.sound === currentItem.sound;
                const borderColor = revealed
                  ? isCorrect
                    ? MUTED_FEEDBACK_ACCENTS.successBorder
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.errorBorder
                      : Sketch.inkFaint
                  : isSelected
                    ? MUTED_FEEDBACK_ACCENTS.selectedBorder
                    : Sketch.inkFaint;
                const backgroundColor = revealed
                  ? isCorrect
                    ? MUTED_FEEDBACK_ACCENTS.successTint
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.errorTint
                      : Sketch.cardBg
                  : isSelected
                    ? MUTED_FEEDBACK_ACCENTS.selectedTint
                    : Sketch.cardBg;

                return (
                  <TouchableOpacity
                    key={`${option.letter}-${index}`}
                    style={[
                      styles.optionCard,
                      { borderColor, backgroundColor },
                    ]}
                    onPress={() => handleRecallSelect(index)}
                    activeOpacity={0.85}
                    disabled={revealed}
                  >
                    <Text style={styles.optionSound}>{option.sound}</Text>
                    <Text style={styles.optionLabel}>
                      {option.romanization}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 14,
  },
  practiceHeader: {
    gap: 14,
    marginBottom: 8,
    alignItems: "center",
  },
  practiceMeta: {
    display: "none",
  },
  promptMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  promptBadge: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: ACCENT,
    textAlign: "center",
  },
  promptMetaDivider: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkFaint,
  },
  promptGroupTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
  },
  modeChip: {
    paddingBottom: 6,
  },
  modeChipActive: {
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  modeChipTextActive: {
    fontWeight: "700",
    color: ACCENT,
  },
  promptCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    gap: 6,
    ...sketchShadow(4),
  },
  promptEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    lineHeight: 27,
  },
  promptSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  studyCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 22,
    gap: 10,
    ...sketchShadow(4),
  },
  studyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  soundBadge: {
    minHeight: 20,
    justifyContent: "center",
  },
  soundBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: ACCENT,
  },
  speakerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paperDark,
  },
  studyGlyph: {
    fontSize: 72,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  studyName: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  studyRoman: {
    fontSize: 15,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  exampleCard: {
    marginTop: 6,
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 4,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  exampleThai: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  exampleDetail: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  exerciseCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
    ...sketchShadow(4),
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  questionText: {
    fontSize: 36,
    fontWeight: "700",
    color: Sketch.ink,
  },
  questionGlyph: {
    fontSize: 70,
    fontWeight: "700",
    color: Sketch.ink,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  optionCard: {
    width: "48%",
    minHeight: 126,
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...sketchShadow(3),
  },
  optionGlyph: {
    fontSize: 44,
    fontWeight: "700",
    color: Sketch.ink,
  },
  optionSound: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
  },
  optionLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  resultBanner: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  resultBannerOk: {
    backgroundColor: MUTED_FEEDBACK_ACCENTS.successTint,
    borderColor: MUTED_FEEDBACK_ACCENTS.successBorder,
  },
  resultBannerBad: {
    backgroundColor: MUTED_FEEDBACK_ACCENTS.errorTint,
    borderColor: MUTED_FEEDBACK_ACCENTS.errorBorder,
  },
  resultBannerText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...sketchShadow(4),
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
