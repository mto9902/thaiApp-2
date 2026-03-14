import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
import Header from "../../../src/components/Header";
import { alphabet } from "../../../src/data/alphabet";

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

function ResultBanner({
  result,
  text,
}: {
  result: "correct" | "wrong";
  text: string;
}) {
  return (
    <View
      style={[
        styles.resultBanner,
        result === "correct" ? styles.resultBannerOk : styles.resultBannerBad,
      ]}
    >
      <Ionicons
        name={result === "correct" ? "checkmark-circle" : "close-circle"}
        size={18}
        color={result === "correct" ? Sketch.green : Sketch.red}
      />
      <Text style={styles.resultBannerText}>{text}</Text>
    </View>
  );
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
  const [result, setResult] = useState<"" | "correct" | "wrong">("");

  function playSound(text: string) {
    Speech.stop();
    Speech.speak(text, { language: "th-TH", rate: 0.82 });
  }

  function setupRound(nextMode: Mode) {
    const nextItem = pickRandom(letters);
    setMode(nextMode);
    setCurrentItem(nextItem);
    setSelectedOption(null);
    setRevealed(false);
    setResult("");
    setOptions(
      nextMode === "study"
        ? []
        : generateOptions(nextItem, letters, allLetters),
    );
  }

  function handleModePress(nextMode: Mode) {
    setupRound(nextMode);
  }

  function handleMatchSelect(index: number) {
    if (revealed) return;

    const picked = options[index];
    const isCorrect = picked.letter === currentItem.letter;

    setSelectedOption(index);
    setRevealed(true);
    setResult(isCorrect ? "correct" : "wrong");
    playSound(picked.name);
  }

  function handleRecallSelect(index: number) {
    if (revealed) return;

    const isCorrect = options[index].sound === currentItem.sound;
    setSelectedOption(index);
    setRevealed(true);
    setResult(isCorrect ? "correct" : "wrong");
  }

  function handleContinue() {
    setupRound(pickNextMode(mode));
  }

  const modeInfo = MODE_META[mode];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Alphabet Practice" onBack={() => router.back()} showClose />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroBadge,
                { backgroundColor: `${groupInfo.accent}14` },
              ]}
            >
              <Text style={[styles.heroBadgeText, { color: groupInfo.accent }]}>
                {groupInfo.badge}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.heroSoundButton}
              onPress={() => playSound(currentItem.name)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="volume-medium-outline"
                size={18}
                color={Sketch.ink}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>{groupInfo.title} practice</Text>
          <Text style={styles.heroSubtitle}>
            Switch modes any time, or keep tapping continue to shuffle through
            all three exercise styles.
          </Text>

          <View style={styles.modeRow}>
            {ALL_MODES.map((item) => {
              const active = item === mode;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.modeChip,
                    active && {
                      backgroundColor: `${groupInfo.accent}14`,
                      borderColor: groupInfo.accent,
                    },
                  ]}
                  onPress={() => handleModePress(item)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      active && { color: groupInfo.accent },
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
          <Text style={styles.promptEyebrow}>{MODE_META[mode].label}</Text>
          <Text style={styles.promptTitle}>{modeInfo.title}</Text>
          <Text style={styles.promptSubtitle}>{modeInfo.subtitle}</Text>
        </View>

        {mode === "study" ? (
          <>
            <View style={styles.studyCard}>
              <View style={styles.studyCardTop}>
                <View
                  style={[
                    styles.soundBadge,
                    { backgroundColor: `${groupInfo.accent}12` },
                  ]}
                >
                  <Text
                    style={[styles.soundBadgeText, { color: groupInfo.accent }]}
                  >
                    {currentItem.sound.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => playSound(currentItem.name)}
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
                <Text style={styles.exampleThai}>{currentItem.example.thai}</Text>
                <Text style={styles.exampleDetail}>
                  {currentItem.example.romanization} · {currentItem.example.english}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: groupInfo.accent, borderColor: groupInfo.accent },
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
                    ? Sketch.green
                    : isSelected
                      ? Sketch.red
                      : Sketch.inkFaint
                  : isSelected
                    ? groupInfo.accent
                    : Sketch.inkFaint;

                return (
                  <TouchableOpacity
                    key={option.letter}
                    style={[styles.optionCard, { borderColor }]}
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

            {revealed && result ? (
              <>
                <ResultBanner
                  result={result}
                  text={
                    result === "correct"
                      ? "Correct. That sound maps to this consonant."
                      : `Correct answer: ${currentItem.letter}`
                  }
                />
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: groupInfo.accent,
                      borderColor: groupInfo.accent,
                    },
                  ]}
                  onPress={handleContinue}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : null}
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
                    ? Sketch.green
                    : isSelected
                      ? Sketch.red
                      : Sketch.inkFaint
                  : isSelected
                    ? groupInfo.accent
                    : Sketch.inkFaint;

                return (
                  <TouchableOpacity
                    key={`${option.letter}-${index}`}
                    style={[styles.optionCard, { borderColor }]}
                    onPress={() => handleRecallSelect(index)}
                    activeOpacity={0.85}
                    disabled={revealed}
                  >
                    <Text style={styles.optionSound}>{option.sound}</Text>
                    <Text style={styles.optionLabel}>{option.romanization}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {revealed && result ? (
              <>
                <ResultBanner
                  result={result}
                  text={
                    result === "correct"
                      ? "Correct. You recognized the sound quickly."
                      : `Correct answer: ${currentItem.sound}`
                  }
                />
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: groupInfo.accent,
                      borderColor: groupInfo.accent,
                    },
                  ]}
                  onPress={handleContinue}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : null}
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
  heroCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 14,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  heroSoundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Sketch.inkLight,
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkLight,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  soundBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  resultBannerOk: {
    borderColor: `${Sketch.green}55`,
  },
  resultBannerBad: {
    borderColor: `${Sketch.red}55`,
  },
  resultBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.ink,
  },
  primaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
