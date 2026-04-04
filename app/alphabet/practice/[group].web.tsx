import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { alphabet } from "@/src/data/alphabet";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { MUTED_FEEDBACK_ACCENTS } from "@/src/utils/toneAccent";

const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_TTS_SPEED = "pref_tts_speed";

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
const GROUP_META: Record<number, { title: string; badge: string }> = {
  1: { title: "Mid Class", badge: "Group 1" },
  2: { title: "High Class", badge: "Group 2" },
  3: { title: "Low Class I", badge: "Group 3" },
  4: { title: "Low Class II", badge: "Group 4" },
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
) {
  if (items.length <= 1) return items[0];
  const pool = items.filter((item) => !isSameItem(item, currentItem));
  return pickRandom(pool.length > 0 ? pool : items);
}

function generateOptions(
  correct: AlphabetLetter,
  pool: AlphabetLetter[],
  allLetters: AlphabetLetter[],
) {
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

export default function AlphabetPracticeWeb() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { playSentence } = useSentenceAudio();

  const letters = (alphabet as AlphabetLetter[]).filter(
    (item) => item.group === Number(group),
  );
  const allLetters = alphabet as AlphabetLetter[];
  const groupInfo = GROUP_META[Number(group)] ?? GROUP_META[1];
  const [mode, setMode] = useState<Mode>("study");
  const [currentItem, setCurrentItem] = useState<AlphabetLetter>(letters[0]);
  const [options, setOptions] = useState<AlphabetLetter[]>([]);
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
    setOptions(generateOptions(currentItem, letters, allLetters));
  }, [allLetters, currentItem, letters]);

  useEffect(() => {
    if (!revealed || mode === "study") return;
    autoAdvanceRef.current = setTimeout(() => setupRound(mode), 800);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [mode, revealed, setupRound]);

  const modeTitle = useMemo(() => {
    if (mode === "study") return "See the letter and hear its Thai name.";
    if (mode === "match") return "Pick the consonant that matches the sound.";
    return "Look at the consonant and choose its sound.";
  }, [mode]);

  function speak(text: string) {
    void playSentence(text, { speed: ttsSpeed });
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        widthVariant="wide"
        eyebrow={groupInfo.badge}
        title={`${groupInfo.title} Practice`}
        subtitle="Practice letter recognition, hear Thai audio, and move through short reading drills."
        toolbar={
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={AppSketch.ink} />
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
                caption="Hear the Thai name, inspect the example, then continue."
              />
              <View style={styles.studyCard}>
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => speak(currentItem.name)}
                  activeOpacity={0.82}
                >
                  <Ionicons name="volume-medium-outline" size={18} color={AppSketch.ink} />
                </TouchableOpacity>
                <Text style={styles.studyGlyph}>{currentItem.letter}</Text>
                <Text style={styles.studyName}>{currentItem.name}</Text>
                <Text style={styles.studyRoman}>{currentItem.romanization}</Text>
                <View style={styles.exampleCard}>
                  <Text style={styles.exampleThai}>{currentItem.example.thai}</Text>
                  <Text style={styles.exampleMeta}>
                    {currentItem.example.romanization} - {currentItem.example.english}
                  </Text>
                </View>
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
                    ? "Choose the consonant that matches the target sound."
                    : "Look at the consonant and choose the correct sound."
                }
              />
              <View style={styles.promptCard}>
                <Text style={styles.promptLabel}>
                  {mode === "match" ? "Target sound" : "Target letter"}
                </Text>
                <Text style={styles.promptValue}>
                  {mode === "match" ? currentItem.sound : currentItem.letter}
                </Text>
              </View>
              <View style={styles.optionGrid}>
                {options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect =
                    mode === "match"
                      ? option.letter === currentItem.letter
                      : option.sound === currentItem.sound;
                  const borderColor = revealed
                    ? isCorrect
                      ? MUTED_FEEDBACK_ACCENTS.successBorder
                      : isSelected
                        ? MUTED_FEEDBACK_ACCENTS.errorBorder
                        : AppSketch.border
                    : isSelected
                      ? MUTED_FEEDBACK_ACCENTS.selectedBorder
                      : AppSketch.border;
                  const backgroundColor = AppSketch.surface;

                  return (
                    <TouchableOpacity
                      key={`${option.letter}-${index}`}
                      style={[styles.optionCard, { borderColor, backgroundColor }]}
                      onPress={() => {
                        if (revealed) return;
                        setSelectedOption(index);
                        setRevealed(true);
                        if (autoplayTTS) {
                          speak(mode === "match" ? option.name : currentItem.name);
                        }
                      }}
                      activeOpacity={0.82}
                      disabled={revealed}
                    >
                      <Text style={styles.optionGlyph}>
                        {mode === "match" ? option.letter : option.sound}
                      </Text>
                      <Text style={styles.optionMeta}>
                        {mode === "match" ? option.name : option.romanization}
                      </Text>
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
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
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
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
  },
  modeChipActive: {
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.background,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  modeChipTextActive: {
    color: AppSketch.primary,
  },
  studyCard: {
    minHeight: 320,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: AppRadius.lg,
    ...appShadow("sm"),
  },
  speakerButton: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
  },
  studyGlyph: {
    fontSize: 88,
    lineHeight: 96,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  studyName: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  studyRoman: {
    fontSize: 16,
    color: AppSketch.inkMuted,
  },
  exampleCard: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.background,
    padding: 18,
    minWidth: 340,
    gap: 6,
    alignItems: "center",
    borderRadius: AppRadius.md,
  },
  exampleThai: {
    fontSize: 28,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  exampleMeta: {
    fontSize: 14,
    lineHeight: 22,
    color: AppSketch.inkMuted,
    textAlign: "center",
  },
  promptCard: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
    borderRadius: AppRadius.lg,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  promptValue: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "700",
    color: AppSketch.ink,
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
    borderRadius: AppRadius.lg,
  },
  optionGlyph: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    color: AppSketch.ink,
    textAlign: "center",
  },
  optionMeta: {
    fontSize: 14,
    lineHeight: 22,
    color: AppSketch.inkMuted,
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
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.md,
    ...appShadow("sm"),
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
