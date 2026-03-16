import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Sketch } from "@/constants/theme";
import VowelText from "@/src/components/VowelText";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { vowels } from "@/src/data/vowels";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { MUTED_FEEDBACK_ACCENTS } from "@/src/utils/toneAccent";

const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_TTS_SPEED = "pref_tts_speed";

type Vowel = {
  symbol: string;
  example: string;
  name: string;
  sound: string;
  group: number;
};

type Mode = "study" | "match" | "recall";

const ALL_MODES: Mode[] = ["study", "match", "recall"];
const GROUP_META: Record<number, { title: string; badge: string }> = {
  1: { title: "Before Consonant", badge: "Group 1" },
  2: { title: "After Consonant", badge: "Group 2" },
  3: { title: "Above Consonant", badge: "Group 3" },
  4: { title: "Below Consonant", badge: "Group 4" },
  5: { title: "Around Consonant I", badge: "Group 5" },
  6: { title: "Around Consonant II", badge: "Group 6" },
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
) {
  if (items.length <= 1) return items[0];
  const pool = items.filter((item) => !isSameItem(item, currentItem));
  return pickRandom(pool.length > 0 ? pool : items);
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

export default function VowelPracticeWeb() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { playSentence } = useSentenceAudio();

  const groupVowels = (vowels as Vowel[])
    .filter((item) => item.group === Number(group))
    .filter(isValidVowel);
  const allVowels = (vowels as Vowel[]).filter(isValidVowel);
  const groupInfo = GROUP_META[Number(group)] ?? GROUP_META[1];
  const [mode, setMode] = useState<Mode>("study");
  const [currentItem, setCurrentItem] = useState<Vowel>(groupVowels[0] ?? allVowels[0]);
  const [options, setOptions] = useState<Vowel[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const [autoplay, speed] = await Promise.all([
        AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
        AsyncStorage.getItem(PREF_TTS_SPEED),
      ]);
      setAutoplayTTS(autoplay !== null ? autoplay === "true" : false);
      setTtsSpeed((speed as "slow" | "normal" | "fast") || "slow");
    })();
  }, []);

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
    setOptions(generateOptions(currentItem, groupVowels, allVowels));
  }, [allVowels, currentItem, groupVowels]);

  useEffect(() => {
    if (!revealed || mode === "study") return;
    autoAdvanceRef.current = setTimeout(() => setupRound(mode), 800);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [mode, revealed, setupRound]);

  const modeTitle = useMemo(() => {
    if (mode === "study") return "See the pattern and hear the full Thai example.";
    if (mode === "match") return "Choose the pattern that matches the sound.";
    return "Look at the pattern and choose its sound.";
  }, [mode]);

  function speak(text: string) {
    void playSentence(text, { speed: ttsSpeed });
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow={groupInfo.badge}
        title={`${groupInfo.title} Practice`}
        subtitle="Practice vowel patterns, hear Thai audio, and build confidence with reading drills."
        toolbar={
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={Sketch.ink} />
            <Text style={styles.toolbarButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.pageStack}>
          <DesktopPanel>
            <DesktopSectionTitle title="Mode" caption={modeTitle} />
            <View style={styles.modeRow}>
              {ALL_MODES.map((item) => {
                const active = item === mode;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.modeChip, active && styles.modeChipActive]}
                    onPress={() => setupRound(item)}
                    activeOpacity={0.82}
                  >
                    <Text
                      style={[styles.modeChipText, active && styles.modeChipTextActive]}
                    >
                      {item === "study"
                        ? "Study"
                        : item === "match"
                          ? "Match"
                          : "Recall"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </DesktopPanel>

          {mode === "study" ? (
            <DesktopPanel>
              <DesktopSectionTitle
                title="Study card"
                caption="Hear the Thai example, inspect the pattern, then continue."
              />
              <View style={styles.studyCard}>
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => speak(currentItem.example)}
                  activeOpacity={0.82}
                >
                  <Ionicons name="volume-medium-outline" size={18} color={Sketch.ink} />
                </TouchableOpacity>
                <VowelText
                  example={currentItem.example}
                  style={styles.studyGlyph}
                  vowelColor={Sketch.accent}
                  consonantColor={Sketch.inkLight}
                />
                <Text style={styles.studyName}>{currentItem.name}</Text>
                <Text style={styles.studySymbol}>{currentItem.symbol}</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setupRound(mode)}
                activeOpacity={0.82}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </DesktopPanel>
          ) : (
            <DesktopPanel>
              <DesktopSectionTitle
                title={mode === "match" ? "Match the sound" : "Recall the sound"}
                caption={
                  mode === "match"
                    ? "Choose the vowel pattern that matches the target sound."
                    : "Look at the pattern and choose the correct sound."
                }
              />
              <View style={styles.promptCard}>
                <Text style={styles.promptLabel}>
                  {mode === "match" ? "Target sound" : "Target pattern"}
                </Text>
                {mode === "match" ? (
                  <Text style={styles.promptValue}>{currentItem.sound}</Text>
                ) : (
                  <VowelText
                    example={currentItem.example}
                    style={styles.promptGlyph}
                    vowelColor={Sketch.accent}
                    consonantColor={Sketch.inkLight}
                  />
                )}
              </View>
              <View style={styles.optionGrid}>
                {options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect =
                    mode === "match"
                      ? option.example === currentItem.example
                      : option.sound === currentItem.sound;
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
                      key={`${option.example}-${index}`}
                      style={[styles.optionCard, { borderColor, backgroundColor }]}
                      onPress={() => {
                        if (revealed) return;
                        setSelectedOption(index);
                        setRevealed(true);
                        if (autoplayTTS) {
                          speak(mode === "match" ? option.example : currentItem.example);
                        }
                      }}
                      activeOpacity={0.82}
                      disabled={revealed}
                    >
                      {mode === "match" ? (
                        <VowelText
                          example={option.example}
                          style={styles.optionGlyph}
                          vowelColor={Sketch.accent}
                          consonantColor={Sketch.inkLight}
                        />
                      ) : (
                        <Text style={styles.optionSound}>{option.sound}</Text>
                      )}
                      <Text style={styles.optionMeta}>{option.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </DesktopPanel>
          )}
        </View>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: { gap: 28 },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  modeChipActive: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  modeChipTextActive: {
    color: Sketch.accent,
  },
  studyCard: {
    minHeight: 320,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  speakerButton: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  studyGlyph: {
    fontSize: 78,
    lineHeight: 88,
    textAlign: "center",
  },
  studyName: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  studySymbol: {
    fontSize: 15,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  promptCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  promptValue: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "700",
    color: Sketch.ink,
  },
  promptGlyph: {
    fontSize: 60,
    lineHeight: 68,
    textAlign: "center",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  optionCard: {
    width: "48.9%",
    minHeight: 150,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  optionGlyph: {
    fontSize: 42,
    lineHeight: 48,
    textAlign: "center",
  },
  optionSound: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: Sketch.ink,
  },
  optionMeta: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  primaryButton: {
    alignSelf: "flex-start",
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
