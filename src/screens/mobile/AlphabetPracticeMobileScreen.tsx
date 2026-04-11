import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Header, { type SettingsState } from "@/src/components/Header";
import { alphabet } from "@/src/data/alphabet";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import {
  BRAND,
  SURFACE_SHADOW,
  SurfaceButton,
  SurfaceIconButton,
  SettledPressable,
  SURFACE_PRESSED,
} from "@/src/screens/mobile/readingSurface";
import { ReadingHero, ReadingSurfaceCard } from "@/src/screens/mobile/readingLayout";

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

const GROUP_META: Record<number, { title: string; badge: string }> = {
  1: { title: "Mid Class", badge: "Group 1" },
  2: { title: "High Class", badge: "Group 2" },
  3: { title: "Low Class I", badge: "Group 3" },
  4: { title: "Low Class II", badge: "Group 4" },
};

function shuffle<T>(items: T[]) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function pickRandom<T>(items: T[]) {
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

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <SettledPressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.modeButton,
        active ? styles.modeButtonActive : null,
        pressed ? SURFACE_PRESSED : null,
      ]}
    >
      <Text style={[styles.modeButtonText, active ? styles.modeButtonTextActive : null]}>
        {label}
      </Text>
    </SettledPressable>
  );
}

function OptionCard({
  title,
  subtitle,
  state,
  onPress,
  fullWidth,
}: {
  title: string;
  subtitle: string;
  state: "idle" | "correct" | "incorrect" | "revealed";
  onPress: () => void;
  fullWidth: boolean;
}) {
  return (
    <SettledPressable
      onPress={state === "idle" ? onPress : undefined}
      disabled={state !== "idle"}
      style={({ pressed }: { pressed: boolean }) => [
        styles.optionCard,
        fullWidth ? styles.fullCell : styles.halfCell,
        state === "correct" ? styles.optionCardCorrect : null,
        state === "revealed" ? styles.optionCardRevealed : null,
        state === "incorrect" ? styles.optionCardIncorrect : null,
        state === "idle" && pressed ? SURFACE_PRESSED : null,
      ]}
    >
      <Text style={styles.optionPrimary}>{title}</Text>
      <Text style={styles.optionSecondary}>{subtitle}</Text>
    </SettledPressable>
  );
}

export default function AlphabetPracticeMobileScreen() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();

  const letters = (alphabet as AlphabetLetter[]).filter(
    (item) => item.group === Number(group),
  );
  const allLetters = alphabet as AlphabetLetter[];
  const groupInfo = GROUP_META[Number(group)] ?? GROUP_META[1];
  const initialItem = letters[0] ?? allLetters[0];
  const [mode, setMode] = useState<Mode>("study");
  const [currentItem, setCurrentItem] = useState<AlphabetLetter>(
    initialItem ?? allLetters[0]!,
  );
  const [options, setOptions] = useState<AlphabetLetter[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useTwoColumns = width >= 385;

  useEffect(() => {
    setOptions(generateOptions(currentItem, letters, allLetters));
  }, [allLetters, currentItem, letters]);

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
      setOptions(nextMode === "study" ? [] : generateOptions(nextItem, letters, allLetters));
    },
    [allLetters, currentItem, letters],
  );

  useEffect(() => {
    if (!revealed || mode === "study") return;
    autoAdvanceRef.current = setTimeout(() => setupRound(mode), 850);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [mode, revealed, setupRound]);

  const modeLabel = useMemo(() => {
    if (mode === "study") return "Study";
    if (mode === "match") return "Match";
    return "Recall";
  }, [mode]);

  function handleSettingsChange(settings: SettingsState) {
    setAutoplayTTS(settings.autoplayTTS);
    setTtsSpeed(settings.ttsSpeed);
  }

  function speak(text: string) {
    void playSentence(text, { speed: ttsSpeed });
  }

  function optionState(option: AlphabetLetter, index: number) {
    if (selectedOption === null) return "idle" as const;
    const isCorrect =
      mode === "match"
        ? option.letter === currentItem.letter
        : option.sound === currentItem.sound;

    if (isCorrect) return "correct" as const;
    if (selectedOption === index) return "incorrect" as const;
    return "revealed" as const;
  }

  function handleMatchSelect(index: number) {
    if (revealed) return;
    const picked = options[index];
    setSelectedOption(index);
    setRevealed(true);
    if (autoplayTTS) speak(picked.name);
  }

  function handleRecallSelect(index: number) {
    if (revealed) return;
    setSelectedOption(index);
    setRevealed(true);
    if (autoplayTTS) speak(currentItem.name);
  }

  if (!initialItem) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header
          title="Alphabet Practice"
          onBack={() => router.back()}
          showClose
          showBrandMark={false}
        />
        <View style={styles.emptyWrap}>
          <ReadingSurfaceCard>
            <Text style={styles.emptyTitle}>No letters found.</Text>
            <Text style={styles.emptySubtitle}>
              This consonant group does not have practice items yet.
            </Text>
          </ReadingSurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={`${groupInfo.title} Practice`}
        onBack={() => router.back()}
        showClose
        showBrandMark={false}
        onSettingsChange={handleSettingsChange}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReadingHero
          eyebrow={groupInfo.badge}
          title={`${groupInfo.title} practice`}
          subtitle="Short drills for letter shape and sound."
        />

        <ReadingSurfaceCard>
          <Text style={styles.sectionLabel}>Practice mode</Text>
          <View style={styles.modeRow}>
            <ModeButton
              label="Study"
              active={mode === "study"}
              onPress={() => setupRound("study")}
            />
            <ModeButton
              label="Match"
              active={mode === "match"}
              onPress={() => setupRound("match")}
            />
            <ModeButton
              label="Recall"
              active={mode === "recall"}
              onPress={() => setupRound("recall")}
            />
          </View>
        </ReadingSurfaceCard>

        <ReadingSurfaceCard>
          <View style={styles.roundHeader}>
            <View style={styles.roundCopy}>
              <Text style={styles.sectionLabel}>{modeLabel}</Text>
              <Text style={styles.roundTitle}>
                {mode === "study"
                  ? "Hear the letter"
                  : mode === "match"
                    ? "Choose the letter"
                    : "Choose the sound"}
              </Text>
            </View>
            <SurfaceIconButton
              icon="volume-medium-outline"
              onPress={() => speak(currentItem.name)}
            />
          </View>

          {mode === "study" ? (
            <>
              <View style={styles.studyCard}>
                <Text style={styles.studyGlyph}>{currentItem.letter}</Text>
                <Text style={styles.studyName}>{currentItem.name}</Text>
                <Text style={styles.studyRoman}>{currentItem.romanization}</Text>
              </View>

              <View style={styles.exampleCard}>
                <Text style={styles.exampleEyebrow}>Example</Text>
                <Text style={styles.exampleThai}>{currentItem.example.thai}</Text>
                <Text style={styles.exampleMeta}>
                  {currentItem.example.romanization} • {currentItem.example.english}
                </Text>
              </View>

              <SurfaceButton
                label="Continue"
                variant="primary"
                onPress={() => setupRound(mode)}
              />
            </>
          ) : (
            <>
              <View style={styles.promptCard}>
                <Text style={styles.promptLabel}>
                  {mode === "match" ? "Target sound" : "Target letter"}
                </Text>
                <Text style={styles.promptValue}>
                  {mode === "match" ? currentItem.sound : currentItem.letter}
                </Text>
              </View>

              <View style={styles.optionsGrid}>
                {options.map((option, index) => (
                  <OptionCard
                    key={`${option.letter}-${index}`}
                    title={mode === "match" ? option.letter : option.sound}
                    subtitle={mode === "match" ? option.name : option.romanization}
                    state={optionState(option, index)}
                    onPress={() =>
                      mode === "match"
                        ? handleMatchSelect(index)
                        : handleRecallSelect(index)
                    }
                    fullWidth={!useTwoColumns}
                  />
                ))}
              </View>
            </>
          )}
        </ReadingSurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
    color: BRAND.ink,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.inkSoft,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    ...SURFACE_SHADOW,
  },
  modeButtonActive: {
    borderColor: BRAND.navy,
    borderWidth: 2,
    backgroundColor: BRAND.paper,
  },
  modeButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: BRAND.ink,
  },
  modeButtonTextActive: {
    color: BRAND.navy,
  },
  roundHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  roundCopy: {
    flex: 1,
    gap: 2,
  },
  roundTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    color: BRAND.ink,
  },
  studyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 4,
    ...SURFACE_SHADOW,
  },
  studyGlyph: {
    fontSize: 62,
    lineHeight: 68,
    fontWeight: "800",
    color: BRAND.ink,
  },
  studyName: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
  },
  studyRoman: {
    fontSize: 14,
    lineHeight: 19,
    color: BRAND.inkSoft,
  },
  exampleCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 14,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  exampleEyebrow: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  exampleThai: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
  },
  exampleMeta: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.inkSoft,
  },
  promptCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 4,
    ...SURFACE_SHADOW,
  },
  promptLabel: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  promptValue: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: BRAND.ink,
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  optionCard: {
    minHeight: 86,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    ...SURFACE_SHADOW,
  },
  optionCardCorrect: {
    borderColor: BRAND.navy,
    borderWidth: 2,
    backgroundColor: BRAND.paper,
  },
  optionCardRevealed: {
    borderColor: "#CBD2D9",
    borderWidth: 1.5,
    backgroundColor: "#F8FAFC",
  },
  optionCardIncorrect: {
    borderColor: "#CBD2D9",
    borderWidth: 1.5,
    backgroundColor: "#F3F4F6",
  },
  halfCell: {
    width: "47.3%",
  },
  fullCell: {
    width: "100%",
  },
  optionPrimary: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
    textAlign: "center",
  },
  optionSecondary: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    textAlign: "center",
  },
});
