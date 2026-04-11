import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import {
  DESKTOP_PAGE_WIDTH,
  MOBILE_WEB_BREAKPOINT,
} from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT,
  WEB_BRAND,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
  WEB_SENTENCE_SHADOW,
} from "@/src/components/web/designSystem";
import VowelText from "@/src/components/VowelText";
import { vowels } from "@/src/data/vowels";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import VowelPracticeMobileScreen from "@/src/screens/mobile/VowelPracticeMobileScreen";
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

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

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
  const { width } = useWindowDimensions();
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
      setOptions(nextMode === "study" ? [] : generateOptions(nextItem, groupVowels, allVowels));
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

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <VowelPracticeMobileScreen />;
  }

  function speak(text: string) {
    void playSentence(text, { speed: ttsSpeed });
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopAppShell>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>{groupInfo.badge}</Text>
                <Text style={styles.title}>{`${groupInfo.title} Practice`}</Text>
                <Text style={styles.subtitle}>
                  Practice vowel patterns, hear Thai audio, and build confidence with
                  reading drills.
                </Text>
              </View>
              <Pressable
                onPress={() => router.back()}
                style={({ hovered, pressed }) => [
                  styles.secondaryButton,
                  (hovered || pressed) && styles.lightButtonActive,
                ]}
              >
                <Ionicons name="arrow-back" size={18} color={BRAND.ink} />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionHeading}>Mode</Text>
                  <Text style={styles.sectionSubheading}>{modeTitle}</Text>
                </View>
              </View>
              <View style={styles.modeRow}>
                {ALL_MODES.map((item) => {
                  const active = item === mode;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setupRound(item)}
                      style={({ hovered, pressed }) => [
                        styles.modeChip,
                        active && styles.modeChipActive,
                        (hovered || pressed) && styles.modeChipHover,
                      ]}
                    >
                      <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                        {item === "study" ? "Study" : item === "match" ? "Match" : "Recall"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {mode === "study" ? (
              <View style={styles.surfaceCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionHeading}>Study card</Text>
                    <Text style={styles.sectionSubheading}>
                      Hear the Thai example, inspect the pattern, then continue.
                    </Text>
                  </View>
                </View>
                <View style={styles.studyCard}>
                  <Pressable
                    onPress={() => speak(currentItem.example)}
                    style={({ hovered, pressed }) => [
                      styles.speakerButton,
                      (hovered || pressed) && styles.lightButtonActive,
                    ]}
                  >
                    <Ionicons name="volume-medium-outline" size={18} color={BRAND.ink} />
                  </Pressable>
                  <VowelText
                    example={currentItem.example}
                    style={styles.studyGlyph}
                    vowelColor={BRAND.navy}
                    consonantColor={BRAND.ink}
                  />
                  <Text style={styles.studyName}>{currentItem.name}</Text>
                  <Text style={styles.studySymbol}>{currentItem.symbol}</Text>
                </View>
                <Pressable
                  onPress={() => setupRound(mode)}
                  style={({ hovered, pressed }) => [
                    styles.primaryButton,
                    (hovered || pressed) && styles.primaryButtonActive,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.surfaceCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionHeading}>
                      {mode === "match" ? "Match the sound" : "Recall the sound"}
                    </Text>
                    <Text style={styles.sectionSubheading}>
                      {mode === "match"
                        ? "Choose the vowel pattern that matches the target sound."
                        : "Look at the pattern and choose the correct sound."}
                    </Text>
                  </View>
                </View>
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
                      vowelColor={BRAND.navy}
                      consonantColor={BRAND.ink}
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
                    const isMutedIncorrect = revealed && isSelected && !isCorrect;
                    const optionStateStyle = revealed
                      ? isCorrect
                        ? {
                            borderColor: BRAND.navy,
                            borderWidth: 2,
                            backgroundColor: BRAND.paper,
                          }
                        : isSelected
                          ? {
                              borderColor: BRAND.edge,
                              borderWidth: 1,
                              backgroundColor: BRAND.panel,
                            }
                          : {
                              borderColor: BRAND.line,
                              borderWidth: 1,
                              backgroundColor: BRAND.paper,
                            }
                      : isSelected
                        ? {
                            borderColor: MUTED_FEEDBACK_ACCENTS.selectedBorder,
                            borderWidth: 1,
                            backgroundColor: BRAND.paper,
                          }
                        : {
                            borderColor: BRAND.line,
                            borderWidth: 1,
                            backgroundColor: BRAND.paper,
                          };

                    return (
                      <Pressable
                        key={`${option.example}-${index}`}
                        onPress={() => {
                          if (revealed) return;
                          setSelectedOption(index);
                          setRevealed(true);
                          if (autoplayTTS) {
                            speak(mode === "match" ? option.example : currentItem.example);
                          }
                        }}
                        disabled={revealed}
                        style={({ hovered, pressed }) => [
                          styles.optionCard,
                          optionStateStyle,
                          (hovered || pressed) && !revealed && styles.optionCardHover,
                        ]}
                      >
                        {mode === "match" ? (
                          <VowelText
                            example={option.example}
                            style={[
                              styles.optionGlyph,
                              isMutedIncorrect && styles.optionGlyphMuted,
                            ]}
                            vowelColor={BRAND.navy}
                            consonantColor={isMutedIncorrect ? BRAND.muted : BRAND.ink}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.optionSound,
                              isMutedIncorrect && styles.optionSoundMuted,
                            ]}
                          >
                            {option.sound}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.optionMeta,
                            isMutedIncorrect && styles.optionMetaMuted,
                          ]}
                        >
                          {option.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </DesktopAppShell>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: BRAND.bg },
  pageContent: { paddingHorizontal: 28, paddingVertical: 28 },
  shell: { width: "100%", maxWidth: DESKTOP_PAGE_WIDTH, alignSelf: "center", gap: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  headerCopy: { flex: 1, gap: 8 },
  eyebrow: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  title: {
    color: BRAND.ink,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1,
    fontFamily: DISPLAY_FONT,
  },
  subtitle: {
    maxWidth: 760,
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 26,
    fontFamily: BODY_FONT,
  },
  secondaryButton: {
    minHeight: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  secondaryButtonText: {
    color: BRAND.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  lightButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  primaryButton: {
    alignSelf: "flex-start",
    minWidth: 220,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D2237",
    backgroundColor: BRAND.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: BODY_FONT,
  },
  surfaceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 20,
    gap: 14,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  sectionHeaderText: { flex: 1, gap: 4 },
  sectionHeading: {
    color: BRAND.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sectionSubheading: {
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: BODY_FONT,
  },
  modeRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    borderRadius: WEB_RADIUS.md,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  modeChipHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  modeChipActive: {
    borderColor: BRAND.navy,
    backgroundColor: BRAND.paper,
  },
  modeChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  modeChipTextActive: {
    color: BRAND.navy,
  },
  studyCard: {
    minHeight: 216,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingVertical: 22,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: WEB_RADIUS.lg,
    boxShadow: WEB_SENTENCE_SHADOW as any,
  },
  speakerButton: {
    alignSelf: "flex-start",
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    borderRadius: WEB_RADIUS.md,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  studyGlyph: {
    fontSize: 64,
    lineHeight: 72,
    textAlign: "center",
  },
  studyName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
    textAlign: "center",
    fontFamily: DISPLAY_FONT,
  },
  studySymbol: {
    fontSize: 14,
    lineHeight: 18,
    color: BRAND.inkSoft,
    textAlign: "center",
    fontFamily: BODY_FONT,
  },
  promptCard: {
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
    borderRadius: WEB_RADIUS.lg,
    boxShadow: WEB_SENTENCE_SHADOW as any,
  },
  promptLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: BRAND.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: BODY_FONT,
  },
  promptValue: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  promptGlyph: {
    fontSize: 52,
    lineHeight: 58,
    textAlign: "center",
  },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionCard: {
    width: "48.9%",
    minHeight: 118,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: WEB_RADIUS.lg,
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  optionCardHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: "0 1px 0 0 #d4d4d4, 0 1px 0 0 #d4d4d4, 0 2px 3px rgba(16, 42, 67, 0.04)" as any,
  },
  optionGlyph: {
    fontSize: 36,
    lineHeight: 40,
    textAlign: "center",
  },
  optionGlyphMuted: {
    opacity: 0.75,
  },
  optionSound: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  optionSoundMuted: {
    color: BRAND.muted,
  },
  optionMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.inkSoft,
    textAlign: "center",
    fontFamily: BODY_FONT,
  },
  optionMetaMuted: {
    color: BRAND.muted,
  },
});
