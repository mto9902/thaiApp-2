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

import { Sketch } from "@/constants/theme";
import Header, { SettingsState } from "../../../src/components/Header";
import VowelText from "../../../src/components/VowelText";
import { vowels } from "../../../src/data/vowels";
import { MUTED_FEEDBACK_ACCENTS } from "../../../src/utils/toneAccent";

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
    subtitle:
      "Great for understanding where the vowel appears around the consonant.",
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

function generateOptions(correct: Vowel, pool: Vowel[], allVowels: Vowel[]) {
  let candidates = pool.filter(
    (item) => item.example !== correct.example && item.sound !== correct.sound,
  );

  if (candidates.length < 3) {
    candidates = allVowels.filter(
      (item) =>
        item.example !== correct.example && item.sound !== correct.sound,
    );
  }

  return shuffle([correct, ...shuffle(candidates).slice(0, 3)]);
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
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<SettingsState["ttsSpeed"]>("slow");

  const speak = useCallback(
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
        groupVowels,
        currentItem,
        (left, right) => left.example === right.example,
      );
      setMode(nextMode);
      setCurrentItem(nextItem);
      setSelectedOption(null);
      setRevealed(false);
      setOptions(
        nextMode === "study"
          ? []
          : generateOptions(nextItem, groupVowels, allVowels),
      );
    },
    [allVowels, currentItem, groupVowels],
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

  function handleModePress(nextMode: Mode) {
    setupRound(nextMode);
  }

  function handleMatchSelect(index: number) {
    if (revealed) return;

    const picked = options[index];
    setSelectedOption(index);
    setRevealed(true);
    if (autoplayTTS) {
      speak(picked.example);
    }
  }

  function handleRecallSelect(index: number) {
    if (revealed) return;

    setSelectedOption(index);
    setRevealed(true);
    if (autoplayTTS) {
      speak(currentItem.example);
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
        title="Vowel Practice"
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
          <Text style={styles.promptEyebrow}>{modeInfo.label}</Text>
          <Text style={styles.promptTitle}>{modeInfo.title}</Text>
          <Text style={styles.promptSubtitle}>{modeInfo.subtitle}</Text>
        </View>

        {mode === "study" ? (
          <>
            <TouchableOpacity
              style={styles.studyCard}
              onPress={() => speak(currentItem.example)}
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
                    speak(currentItem.example);
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

              <VowelText
                example={currentItem.example}
                style={styles.studyGlyph}
                vowelColor={ACCENT}
                consonantColor={Sketch.inkLight}
              />
              <Text style={styles.studyName}>{currentItem.name}</Text>
              <Text style={styles.studySymbol}>{currentItem.symbol}</Text>
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
                const isCorrect = option.example === currentItem.example;
                const backgroundColor = revealed
                  ? isCorrect
                    ? MUTED_FEEDBACK_ACCENTS.successTint
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.errorTint
                      : Sketch.cardBg
                  : isSelected
                    ? MUTED_FEEDBACK_ACCENTS.selectedTint
                    : Sketch.cardBg;
                const borderColor = revealed
                  ? isCorrect
                    ? MUTED_FEEDBACK_ACCENTS.successBorder
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.errorBorder
                      : Sketch.inkFaint
                  : isSelected
                    ? MUTED_FEEDBACK_ACCENTS.selectedBorder
                    : Sketch.inkFaint;

                return (
                  <TouchableOpacity
                    key={`${option.example}-${index}`}
                    style={[
                      styles.optionCard,
                      { borderColor, backgroundColor },
                    ]}
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
                const backgroundColor = revealed
                  ? isCorrect
                    ? MUTED_FEEDBACK_ACCENTS.successTint
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.errorTint
                      : Sketch.cardBg
                  : isSelected
                    ? MUTED_FEEDBACK_ACCENTS.selectedTint
                    : Sketch.cardBg;
                const borderColor = revealed
                  ? isCorrect
                    ? MUTED_FEEDBACK_ACCENTS.successBorder
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.errorBorder
                      : Sketch.inkFaint
                  : isSelected
                    ? MUTED_FEEDBACK_ACCENTS.selectedBorder
                    : Sketch.inkFaint;

                return (
                  <TouchableOpacity
                    key={`${option.example}-${index}`}
                    style={[
                      styles.optionCard,
                      { borderColor, backgroundColor },
                    ]}
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
    borderRadius: 0,
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
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    gap: 6,
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
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 22,
    gap: 10,
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
    borderRadius: 0,
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
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
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
    borderRadius: 0,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
