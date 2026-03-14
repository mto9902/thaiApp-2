import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import VowelText from "../../../src/components/VowelText";
import { vowels } from "../../../src/data/vowels";

type Vowel = {
  symbol: string;
  example: string;
  name: string;
  sound: string;
  group: number;
};

type Mode = "study" | "match" | "recall";

const ALL_MODES: Mode[] = ["study", "match", "recall"];
const ACCENT = Sketch.orange;

const GROUP_META: Record<
  number,
  { title: string; accent: string; badge: string }
> = {
  1: { title: "Before Consonant", accent: Sketch.green, badge: "Group 1" },
  2: { title: "After Consonant", accent: Sketch.blue, badge: "Group 2" },
  3: { title: "Above Consonant", accent: Sketch.orange, badge: "Group 3" },
  4: { title: "Below Consonant", accent: Sketch.purple, badge: "Group 4" },
  5: { title: "Around Consonant I", accent: Sketch.pink, badge: "Group 5" },
  6: { title: "Around Consonant II", accent: Sketch.red, badge: "Group 6" },
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
    title: "See the pattern and hear the vowel shape in context.",
    subtitle: "Great for understanding where the vowel appears around the consonant.",
  },
  match: {
    label: "Match",
    title: "Choose the vowel pattern that matches the sound.",
    subtitle: "This mode leans on visual pattern recognition first.",
  },
  recall: {
    label: "Recall",
    title: "Look at the pattern and choose the sound.",
    subtitle: "Use this once the placement feels familiar and you want speed.",
  },
};

function isValidVowel(vowel: Vowel) {
  return vowel.sound !== "..." && vowel.name !== "...";
}

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

function generateOptions(correct: Vowel, pool: Vowel[], allVowels: Vowel[]) {
  let candidates = pool.filter(
    (item) => item.example !== correct.example && item.sound !== correct.sound,
  );

  if (candidates.length < 3) {
    candidates = allVowels.filter(
      (item) => item.example !== correct.example && item.sound !== correct.sound,
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

export default function VowelPractice() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const groupVowels = (vowels as Vowel[])
    .filter((item) => item.group === Number(group))
    .filter(isValidVowel);
  const allVowels = (vowels as Vowel[]).filter(isValidVowel);
  const groupInfo = GROUP_META[Number(group)] ?? GROUP_META[1];
  const fallbackItem = groupVowels[0] ?? allVowels[0];
  const optionPool = groupVowels.length > 0 ? groupVowels : allVowels;
  const initialMode = pickNextMode();
  const initialItem = fallbackItem!;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [currentItem, setCurrentItem] = useState<Vowel>(initialItem);
  const [options, setOptions] = useState<Vowel[]>(
    initialMode === "study"
      ? []
      : generateOptions(initialItem, optionPool, allVowels),
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<"" | "correct" | "wrong">("");

  if (!fallbackItem || groupVowels.length === 0) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Vowel Practice" onBack={() => router.back()} showClose />
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No practice data here yet.</Text>
            <Text style={styles.emptySubtitle}>
              This group is still browse-only for now.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  function speak(text: string) {
    Speech.stop();
    Speech.speak(text, { language: "th-TH", rate: 0.82 });
  }

  function setupRound(nextMode: Mode) {
    const nextItem = pickRandom(groupVowels);
    setMode(nextMode);
    setCurrentItem(nextItem);
    setSelectedOption(null);
    setRevealed(false);
    setResult("");
    setOptions(
      nextMode === "study"
        ? []
        : generateOptions(nextItem, groupVowels, allVowels),
    );
  }

  function handleModePress(nextMode: Mode) {
    setupRound(nextMode);
  }

  function handleMatchSelect(index: number) {
    if (revealed) return;

    const picked = options[index];
    const isCorrect = picked.example === currentItem.example;

    setSelectedOption(index);
    setRevealed(true);
    setResult(isCorrect ? "correct" : "wrong");
    speak(picked.example);
  }

  function handleRecallSelect(index: number) {
    if (revealed) return;

    const isCorrect = options[index].sound === currentItem.sound;
    setSelectedOption(index);
    setRevealed(true);
    setResult(isCorrect ? "correct" : "wrong");
  }

  function handleContinue() {
    setupRound(mode);
  }

  const modeInfo = MODE_META[mode];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Vowel Practice" onBack={() => router.back()} showClose />

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
                  style={[
                    styles.modeChip,
                    active && {
                      backgroundColor: `${ACCENT}14`,
                      borderColor: ACCENT,
                    },
                  ]}
                  onPress={() => handleModePress(item)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      active && { color: ACCENT },
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
          <Text style={styles.promptEyebrow}>{modeInfo.label}</Text>
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
                    { backgroundColor: `${ACCENT}12` },
                  ]}
                >
                  <Text
                    style={[styles.soundBadgeText, { color: ACCENT }]}
                  >
                    {currentItem.sound.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => speak(currentItem.example)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="volume-medium-outline"
                    size={18}
                    color={Sketch.ink}
                  />
                </TouchableOpacity>
              </View>

              <VowelText
                example={currentItem.example}
                style={styles.studyGlyph}
                vowelColor={ACCENT}
                consonantColor={Sketch.inkLight}
              />
              <Text style={styles.studyName}>{currentItem.name}</Text>
              <Text style={styles.studySymbol}>{currentItem.symbol}</Text>
            </View>

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
                const isCorrect = option.example === currentItem.example;
                const borderColor = revealed
                  ? isCorrect
                    ? Sketch.green
                    : isSelected
                      ? Sketch.red
                      : Sketch.inkFaint
                  : isSelected
                    ? ACCENT
                    : Sketch.inkFaint;

                return (
                  <TouchableOpacity
                    key={`${option.example}-${index}`}
                    style={[styles.optionCard, { borderColor }]}
                    onPress={() => handleMatchSelect(index)}
                    activeOpacity={0.85}
                    disabled={revealed}
                  >
                    <VowelText
                      example={option.example}
                      style={styles.optionGlyph}
                      vowelColor={ACCENT}
                      consonantColor={Sketch.inkLight}
                    />
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
                      ? "Correct. That sound matches this vowel pattern."
                      : `Correct answer: ${currentItem.example}`
                  }
                />
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: ACCENT,
                      borderColor: ACCENT,
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
              <Text style={styles.questionLabel}>Target pattern</Text>
              <VowelText
                example={currentItem.example}
                style={styles.questionGlyph}
                vowelColor={ACCENT}
                consonantColor={Sketch.inkLight}
              />
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
                    ? ACCENT
                    : Sketch.inkFaint;

                return (
                  <TouchableOpacity
                    key={`${option.example}-${index}`}
                    style={[styles.optionCard, { borderColor }]}
                    onPress={() => handleRecallSelect(index)}
                    activeOpacity={0.85}
                    disabled={revealed}
                  >
                    <Text style={styles.optionSound}>{option.sound}</Text>
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
                      ? "Correct. You identified the sound."
                      : `Correct answer: ${currentItem.sound}`
                  }
                />
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: ACCENT,
                      borderColor: ACCENT,
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
  emptyWrap: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 22,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
  practiceHeader: {
    gap: 10,
    marginBottom: 2,
  },
  practiceMeta: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: ACCENT,
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
    fontSize: 58,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
    lineHeight: 68,
  },
  studyName: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  studySymbol: {
    fontSize: 14,
    color: Sketch.inkMuted,
    textAlign: "center",
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
    fontSize: 58,
    fontWeight: "700",
    color: Sketch.ink,
    lineHeight: 68,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  optionCard: {
    width: "48%",
    minHeight: 130,
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
    fontSize: 36,
    fontWeight: "700",
    color: Sketch.ink,
    lineHeight: 42,
  },
  optionSound: {
    fontSize: 24,
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
    ...sketchShadow(4),
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
