import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

// ── Mode infrastructure ──────────────────────────────────────────────────────
type Mode = "study" | "match" | "recall";
const ALL_MODES: Mode[] = ["study", "match", "recall"];

function randomMode(): Mode {
  return ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)];
}

const MODE_META: Record<Mode, { tag: string; title: string }> = {
  study: { tag: "STUDY", title: "Flash card" },
  match: { tag: "MATCH", title: "Sound to letter" },
  recall: { tag: "RECALL", title: "Letter to sound" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOptions(
  correct: AlphabetLetter,
  pool: AlphabetLetter[],
  allLetters: AlphabetLetter[],
): AlphabetLetter[] {
  // distractors must have different sounds to avoid ambiguity
  let candidates = pool.filter(
    (l) => l.letter !== correct.letter && l.sound !== correct.sound,
  );
  // if not enough in group, pull from full alphabet
  if (candidates.length < 3) {
    candidates = allLetters.filter(
      (l) => l.letter !== correct.letter && l.sound !== correct.sound,
    );
  }
  const distractors = shuffle(candidates).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AlphabetPractice() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const letters: AlphabetLetter[] = alphabet.filter(
    (l) => l.group === Number(group),
  );
  const allLetters: AlphabetLetter[] = alphabet as AlphabetLetter[];

  const [mode, setMode] = useState<Mode>(randomMode);
  const [currentItem, setCurrentItem] = useState<AlphabetLetter>(
    () => pickRandom(letters),
  );
  const [options, setOptions] = useState<AlphabetLetter[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<"" | "correct" | "wrong">("");

  function playSound(text: string) {
    Speech.stop();
    Speech.speak(text, { language: "th-TH", rate: 0.8 });
  }

  function setupRound(nextMode: Mode) {
    const item = pickRandom(letters);
    setCurrentItem(item);
    setMode(nextMode);
    setSelectedOption(null);
    setRevealed(false);
    setResult("");

    if (nextMode === "match" || nextMode === "recall") {
      setOptions(generateOptions(item, letters, allLetters));
    }
  }

  useEffect(() => {
    setupRound(mode);
  }, []);

  // ── MATCH: user taps a letter option ───────────────────────────────────────
  function handleMatchSelect(index: number) {
    if (revealed) return;
    setSelectedOption(index);
    setRevealed(true);

    const picked = options[index];
    playSound(picked.name);

    if (picked.letter === currentItem.letter) {
      setResult("correct");
    } else {
      setResult("wrong");
    }
  }

  // ── RECALL: user taps a sound option ───────────────────────────────────────
  function handleRecallSelect(index: number) {
    if (revealed) return;
    setSelectedOption(index);
    setRevealed(true);

    if (options[index].sound === currentItem.sound) {
      setResult("correct");
    } else {
      setResult("wrong");
    }
  }

  function handleContinue() {
    setupRound(randomMode());
  }

  const meta = MODE_META[mode];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
      <Header
        title="Alphabet Practice"
        onBack={() => router.back()}
        showClose
      />

      <ScrollView contentContainerStyle={st.scroll}>
        {/* ── Mode header ─────────────────────────────────────────── */}
        <View style={st.modeHeader}>
          <View style={st.modeTagRow}>
            <View style={st.modeTag}>
              <Text style={st.modeTagText}>{meta.tag}</Text>
            </View>
          </View>
          <Text style={st.modeTitle}>{meta.title}</Text>
        </View>

        <View style={st.exerciseWrap}>
          {/* ── STUDY mode ──────────────────────────────────────── */}
          {mode === "study" && (
            <>
              <View style={st.studyCard}>
                <TouchableOpacity
                  style={st.speakerBtn}
                  onPress={() => playSound(currentItem.name)}
                >
                  <Text style={st.speakerIcon}>🔊</Text>
                </TouchableOpacity>

                <Text style={st.charLarge}>{currentItem.letter}</Text>
                <Text style={st.studyName}>{currentItem.name}</Text>
                <Text style={st.studyRoman}>{currentItem.romanization}</Text>

                <View style={st.divider} />

                <Text style={st.studySound}>
                  Sound: "{currentItem.sound}"
                </Text>

                <View style={st.exampleSection}>
                  <Text style={st.exampleThai}>
                    {currentItem.example.thai}
                  </Text>
                  <Text style={st.exampleDetail}>
                    {currentItem.example.romanization} —{" "}
                    {currentItem.example.english}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={st.primaryBtn}
                onPress={handleContinue}
              >
                <Text style={st.primaryBtnText}>Got it — Next</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── MATCH mode (sound → letter) ─────────────────────── */}
          {mode === "match" && (
            <>
              <View style={st.promptCard}>
                <Text style={st.promptLabel}>WHICH LETTER MAKES THIS SOUND?</Text>
                <Text style={st.promptText}>"{currentItem.sound}"</Text>
              </View>

              <View style={st.optionsGrid}>
                {options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = opt.letter === currentItem.letter;

                  let borderColor = "#E8E8E4";
                  if (revealed && isCorrect) borderColor = "#5EBA7D";
                  else if (revealed && isSelected && !isCorrect)
                    borderColor = "#E8607A";
                  else if (isSelected) borderColor = "#42A5F5";

                  return (
                    <TouchableOpacity
                      key={opt.letter}
                      style={[st.optionCard, { borderColor }]}
                      onPress={() => handleMatchSelect(i)}
                      disabled={revealed}
                    >
                      <Text style={st.optionCharText}>{opt.letter}</Text>
                      {revealed && (
                        <Text style={st.optionSubText}>{opt.name}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {revealed && (
                <>
                  <View
                    style={[
                      st.resultBanner,
                      result === "correct" ? st.resultOk : st.resultBad,
                    ]}
                  >
                    <Text style={st.resultEmoji}>
                      {result === "correct" ? "✅" : "❌"}
                    </Text>
                    <Text style={st.resultLabel}>
                      {result === "correct"
                        ? "Correct!"
                        : `The answer was "${currentItem.letter}"`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={st.primaryBtn}
                    onPress={handleContinue}
                  >
                    <Text style={st.primaryBtnText}>Continue</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* ── RECALL mode (letter → sound) ────────────────────── */}
          {mode === "recall" && (
            <>
              <View style={st.promptCard}>
                <Text style={st.promptLabel}>WHAT SOUND DOES THIS LETTER MAKE?</Text>
                <Text style={st.promptCharLarge}>{currentItem.letter}</Text>
              </View>

              <View style={st.optionsGrid}>
                {options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = opt.sound === currentItem.sound;

                  let borderColor = "#E8E8E4";
                  if (revealed && isCorrect) borderColor = "#5EBA7D";
                  else if (revealed && isSelected && !isCorrect)
                    borderColor = "#E8607A";
                  else if (isSelected) borderColor = "#42A5F5";

                  return (
                    <TouchableOpacity
                      key={`${opt.letter}-${i}`}
                      style={[st.optionCard, { borderColor }]}
                      onPress={() => handleRecallSelect(i)}
                      disabled={revealed}
                    >
                      <Text style={st.optionSoundText}>"{opt.sound}"</Text>
                      <Text style={st.optionSubText}>{opt.romanization}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {revealed && (
                <>
                  <View
                    style={[
                      st.resultBanner,
                      result === "correct" ? st.resultOk : st.resultBad,
                    ]}
                  >
                    <Text style={st.resultEmoji}>
                      {result === "correct" ? "✅" : "❌"}
                    </Text>
                    <Text style={st.resultLabel}>
                      {result === "correct"
                        ? "Correct!"
                        : `The answer was "${currentItem.sound}"`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={st.primaryBtn}
                    onPress={handleContinue}
                  >
                    <Text style={st.primaryBtnText}>Continue</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const R = 14;
const SHADOW = {
  shadowColor: "#1A1A1A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 3,
} as const;

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F6F3" },
  scroll: { paddingBottom: 64 },

  modeHeader: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 4,
  },
  modeTagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modeTag: {
    backgroundColor: "#1A1A1A",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 2,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },

  exerciseWrap: {
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 16,
  },

  // ── Study mode ───────────────────────────────────────────────
  studyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: R + 4,
    padding: 28,
    alignItems: "center",
    ...SHADOW,
  },
  speakerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F4F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  speakerIcon: { fontSize: 18 },
  charLarge: {
    fontSize: 64,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  studyName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  studyRoman: {
    fontSize: 14,
    color: "#A0A09A",
    fontWeight: "500",
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  divider: {
    width: 36,
    height: 2,
    backgroundColor: "#EEEEE8",
    borderRadius: 1,
    marginBottom: 18,
  },
  studySound: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 18,
  },
  exampleSection: {
    alignItems: "center",
    gap: 4,
  },
  exampleThai: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  exampleDetail: {
    fontSize: 14,
    color: "#A0A09A",
    fontWeight: "500",
  },

  // ── Prompt card ──────────────────────────────────────────────
  promptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: R,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    ...SHADOW,
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C5C5BE",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  promptText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  promptCharLarge: {
    fontSize: 56,
    fontWeight: "900",
    color: "#1A1A1A",
    marginTop: 4,
  },

  // ── Option cards ─────────────────────────────────────────────
  optionsGrid: { gap: 10 },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: R,
    borderWidth: 2,
    borderColor: "#E8E8E4",
    padding: 18,
    alignItems: "center",
    ...SHADOW,
  },
  optionCharText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  optionSoundText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  optionSubText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A0A09A",
    marginTop: 4,
  },

  // ── Result banner ────────────────────────────────────────────
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  resultOk: { backgroundColor: "#F0FAF2" },
  resultBad: { backgroundColor: "#FEF5EC" },
  resultEmoji: { fontSize: 20 },
  resultLabel: { fontSize: 14, fontWeight: "700" },

  // ── Buttons ──────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
