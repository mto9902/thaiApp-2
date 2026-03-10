import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import GenerateButton from "../../../src/components/GenerateButton";
import Header from "../../../src/components/Header";
import ToneGuide, { ToneGuideButton } from "../../../src/components/ToneGuide";
import WordCard from "../../../src/components/WordCard";

import { getPractice } from "../../../src/api/getPractice";
import { grammarPoints } from "../../../src/data/grammar";

// ── Tone colors ────────────────────────────────────────────────────────────────
const TONE_COLORS: Record<string, string> = {
  mid: "#42A5F5",
  low: "#AB47BC",
  falling: "#FF4081",
  high: "#FF9800",
  rising: "#66BB6A",
};
function toneColor(tone?: string): string {
  return TONE_COLORS[tone ?? ""] ?? "#42A5F5";
}

// ── Exercise flow ──────────────────────────────────────────────────────────────
// 1. breakdown      → study the sentence + word tiles
// 2. wordScraps     → arrange shuffled tiles into correct order
// 3. matchThai      → pick the correct Thai sentence from 4 options
type Mode = "breakdown" | "wordScraps" | "matchThai";
const FLOW: Mode[] = ["breakdown", "wordScraps", "matchThai"];

// ── Step indicator labels ──────────────────────────────────────────────────────
const STEP_LABELS: Record<Mode, string> = {
  breakdown: "Study",
  wordScraps: "Build",
  matchThai: "Match",
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface SentenceData {
  thai: string;
  romanization: string;
  english: string;
  breakdown: { thai: string; english: string; tone?: string }[];
}

interface MatchOption {
  thai: string; // full sentence string
  breakdown: SentenceData["breakdown"];
  isCorrect: boolean;
  swappedIndex: number | null; // which word was swapped (-1 = correct)
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function buildMatchOptions(
  correct: SentenceData,
  distractors: SentenceData[],
): MatchOption[] {
  const options: MatchOption[] = [
    {
      thai: correct.thai,
      breakdown: correct.breakdown,
      isCorrect: true,
      swappedIndex: null,
    },
  ];

  // For each distractor, swap one word at a different position
  distractors.slice(0, 3).forEach((d, i) => {
    const swapIdx = i % correct.breakdown.length;
    const newBreakdown = correct.breakdown.map((w, j) =>
      j === swapIdx && d.breakdown[j] ? { ...d.breakdown[j] } : { ...w },
    );
    options.push({
      thai: newBreakdown.map((w) => w.thai).join(""),
      breakdown: newBreakdown,
      isCorrect: false,
      swappedIndex: swapIdx,
    });
  });

  // Shuffle
  return options.sort(() => Math.random() - 0.5);
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PracticeCSV() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ── Sentence state
  const [sentence, setSentence] = useState("");
  const [romanization, setRomanization] = useState("");
  const [translation, setTranslation] = useState("");
  const [grammarPoint, setGrammarPoint] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<SentenceData["breakdown"]>([]);

  // ── WordScraps state
  const [words, setWords] = useState<any[]>([]);
  const [builtSentence, setBuiltSentence] = useState<string[]>([]);

  // ── MatchThai state
  const [matchOptions, setMatchOptions] = useState<MatchOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [matchRevealed, setMatchRevealed] = useState(false);

  // ── Shared state
  const [mode, setMode] = useState<Mode>("breakdown");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"" | "correct" | "wrong">("");
  const [toneGuideVisible, setToneGuideVisible] = useState(false);

  useEffect(() => {
    fetchRound("breakdown");
  }, [id]);

  // ── Grammar helpers ──────────────────────────────────────────────────────────
  function getRandomGrammar() {
    return grammarPoints[Math.floor(Math.random() * grammarPoints.length)];
  }
  function findGrammarById(gid: string) {
    return grammarPoints.find((g) => g.id === gid);
  }
  function grammarObject() {
    return typeof id === "string"
      ? findGrammarById(id) || getRandomGrammar()
      : getRandomGrammar();
  }

  // ── Fetch helpers ────────────────────────────────────────────────────────────
  async function fetchSentence(gid: string): Promise<SentenceData> {
    const res = await getPractice(gid);
    return {
      thai: res?.thai || "",
      romanization: res?.romanization || "",
      english: res?.english || "",
      breakdown: res?.breakdown || [],
    };
  }

  function shuffleNotSame(words: any[], correct: any[]) {
    let s;
    do {
      s = [...words].sort(() => Math.random() - 0.5);
    } while (
      s.length > 1 &&
      JSON.stringify(s.map((w) => w.thai)) ===
        JSON.stringify(correct.map((w) => w.thai))
    );
    return s;
  }

  // ── Main fetch & setup ───────────────────────────────────────────────────────
  const fetchRound = async (nextMode: Mode) => {
    try {
      setLoading(true);
      setResult("");
      setSelectedOption(null);
      setMatchRevealed(false);

      const gobj = grammarObject();
      const main = await fetchSentence(gobj.id);

      setSentence(main.thai);
      setRomanization(main.romanization);
      setTranslation(main.english);
      setGrammarPoint(gobj);
      setBreakdown(main.breakdown);

      // SRS — only on breakdown (first study)
      if (nextMode === "breakdown") {
        await fetch("http://192.168.1.121:3000/track-words", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
          },
          body: JSON.stringify({ words: main.breakdown }),
        });
      }

      // WordScraps tiles
      const formatted = main.breakdown.map((w) => ({
        thai: w.thai,
        english: w.english.toUpperCase(),
        color: toneColor(w.tone),
        rotation: Math.random() * 6 - 3,
      }));
      setWords(shuffleNotSame(formatted, main.breakdown));
      setBuiltSentence([]);

      // MatchThai — fetch 3 extra sentences for distractors
      if (nextMode === "matchThai") {
        const extras = await Promise.all([
          fetchSentence(gobj.id),
          fetchSentence(gobj.id),
          fetchSentence(gobj.id),
        ]);
        setMatchOptions(buildMatchOptions(main, extras));
      }

      setMode(nextMode);
    } catch (err) {
      console.error("fetchRound failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Next exercise in flow ────────────────────────────────────────────────────
  function nextExercise() {
    const idx = FLOW.indexOf(mode);
    const next = FLOW[(idx + 1) % FLOW.length];
    fetchRound(next);
  }

  // ── WordScraps actions ───────────────────────────────────────────────────────
  function handleWordTap(word: string) {
    setBuiltSentence((p) => [...p, word]);
  }
  function undoLastWord() {
    setBuiltSentence((p) => p.slice(0, -1));
  }
  function resetSentence() {
    setBuiltSentence([]);
  }

  function checkWordScraps() {
    const correct = breakdown.map((w) => w.thai);
    const ok = JSON.stringify(correct) === JSON.stringify(builtSentence);
    setResult(ok ? "correct" : "wrong");
    if (ok) setTimeout(() => fetchRound("matchThai"), 1200);
  }

  // ── MatchThai actions ────────────────────────────────────────────────────────
  function selectOption(idx: number) {
    if (matchRevealed) return;
    setSelectedOption(idx);
    setMatchRevealed(true);
    const ok = matchOptions[idx].isCorrect;
    setResult(ok ? "correct" : "wrong");
    if (ok) setTimeout(() => fetchRound("breakdown"), 1400);
  }

  // ── Speech ───────────────────────────────────────────────────────────────────
  const speak = (t: string) => {
    Speech.stop();
    Speech.speak(t, { language: "th-TH", rate: 0.9 });
  };

  // ── Step progress ────────────────────────────────────────────────────────────
  const stepIdx = FLOW.indexOf(mode);
  const wordProgress =
    breakdown.length > 0 ? builtSentence.length / breakdown.length : 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={s.container}>
        <Header
          title={grammarPoint?.title || "Practice"}
          onBack={() => router.back()}
        />

        {/* ── Step indicator ── */}
        <View style={s.stepRow}>
          {FLOW.map((m, i) => (
            <View key={m} style={s.stepItem}>
              <View
                style={[
                  s.stepDot,
                  i <= stepIdx && s.stepDotActive,
                  i < stepIdx && s.stepDotDone,
                ]}
              >
                {i < stepIdx ? (
                  <Text style={s.stepDotText}>✓</Text>
                ) : (
                  <Text
                    style={[s.stepDotText, i > stepIdx && { color: "#BBB" }]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[s.stepLabel, i === stepIdx && s.stepLabelActive]}>
                {STEP_LABELS[m]}
              </Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={s.loadingContainer}>
            <Text style={s.loadingText}>Loading…</Text>
          </View>
        ) : (
          <>
            {/* ════════════════════════════════════════════════════
                EXERCISE 1 — Breakdown (Study)
            ════════════════════════════════════════════════════ */}
            {mode === "breakdown" && (
              <View style={s.section}>
                <Text style={s.eyebrow}>STUDY</Text>
                <Text style={s.sectionTitle}>Read & listen</Text>

                <View style={s.card}>
                  <Text style={s.cardMeta}>📢 PRACTICE THIS</Text>
                  <Text style={s.sentence}>{sentence}</Text>

                  <TouchableOpacity
                    style={s.soundBtn}
                    onPress={() => speak(sentence)}
                  >
                    <Text style={s.soundBtnText}>🔊</Text>
                  </TouchableOpacity>

                  <Text style={s.romanization}>{romanization}</Text>

                  <View style={s.dashedBox}>
                    <Text style={s.dashedBoxText}>{translation}</Text>
                  </View>

                  <View style={s.wordTiles}>
                    {breakdown.map((w, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          s.wordTile,
                          { backgroundColor: toneColor(w.tone) },
                        ]}
                        onPress={() => speak(w.thai)}
                      >
                        <Text style={s.wordTileThai}>{w.thai}</Text>
                        <Text style={s.wordTileEng}>
                          {w.english.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <GenerateButton
                  title="Next →"
                  onPress={() => fetchRound("wordScraps")}
                />
              </View>
            )}

            {/* ════════════════════════════════════════════════════
                EXERCISE 2 — WordScraps (Build)
            ════════════════════════════════════════════════════ */}
            {mode === "wordScraps" && (
              <View style={s.section}>
                {/* Top bar */}
                <View style={s.topBar}>
                  <View>
                    <Text style={s.eyebrow}>SENTENCE BUILDER</Text>
                    <Text style={s.sectionTitle}>Arrange the words</Text>
                  </View>
                  <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
                </View>

                {/* Prompt */}
                <View style={s.promptCard}>
                  <Text style={s.promptLabel}>TRANSLATE INTO THAI</Text>
                  <Text style={s.promptText}>{translation}</Text>
                </View>

                {/* Progress bar */}
                <View style={s.progressTrack}>
                  <View
                    style={[
                      s.progressFill,
                      { width: `${Math.round(wordProgress * 100)}%` as any },
                    ]}
                  />
                </View>

                {/* Builder zone */}
                <View style={s.builderZone}>
                  {builtSentence.length === 0 ? (
                    <Text style={s.builderPlaceholder}>
                      Tap words below to build…
                    </Text>
                  ) : (
                    <View style={s.builderWords}>
                      {builtSentence.map((w, i) => (
                        <View key={i} style={s.builderChip}>
                          <Text style={s.builderChipText}>{w}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Result banner */}
                {result !== "" && (
                  <View
                    style={[
                      s.resultBanner,
                      result === "correct" ? s.resultCorrect : s.resultWrong,
                    ]}
                  >
                    <Text style={s.resultEmoji}>
                      {result === "correct" ? "🎉" : "😅"}
                    </Text>
                    <Text
                      style={[
                        s.resultText,
                        { color: result === "correct" ? "#2E7D32" : "#E65100" },
                      ]}
                    >
                      {result === "correct"
                        ? "Correct!"
                        : "Not quite — try again"}
                    </Text>
                  </View>
                )}

                {/* Undo / Reset */}
                <View style={s.actionRow}>
                  <TouchableOpacity style={s.ghostBtn} onPress={undoLastWord}>
                    <Text style={s.ghostBtnText}>⬅ Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.ghostBtn} onPress={resetSentence}>
                    <Text style={s.ghostBtnText}>↺ Reset</Text>
                  </TouchableOpacity>
                </View>

                {/* Word tiles */}
                <View style={s.wordCardsGrid}>
                  {words.map((word, idx) => (
                    <WordCard
                      key={idx}
                      thai={word.thai}
                      english={word.english}
                      backgroundColor={word.color}
                      rotation={word.rotation}
                      onPress={() => {
                        speak(word.thai);
                        handleWordTap(word.thai);
                      }}
                    />
                  ))}
                </View>

                <GenerateButton
                  title="Check Answer"
                  onPress={checkWordScraps}
                />
              </View>
            )}

            {/* ════════════════════════════════════════════════════
                EXERCISE 3 — MatchThai (Pick the correct sentence)
            ════════════════════════════════════════════════════ */}
            {mode === "matchThai" && (
              <View style={s.section}>
                <View style={s.topBar}>
                  <View>
                    <Text style={s.eyebrow}>MATCH</Text>
                    <Text style={s.sectionTitle}>Which Thai is correct?</Text>
                  </View>
                  <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
                </View>

                {/* English prompt */}
                <View style={s.promptCard}>
                  <Text style={s.promptLabel}>FIND THE THAI FOR</Text>
                  <Text style={s.promptText}>{translation}</Text>
                </View>

                {/* Options */}
                <View style={s.optionsGrid}>
                  {matchOptions.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = opt.isCorrect;

                    let cardStyle = s.optionCard;
                    let borderColor = "#E8E8E8";
                    let bgColor = "#fff";

                    if (matchRevealed) {
                      if (isCorrect) {
                        borderColor = "#66BB6A";
                        bgColor = "#F1FBF1";
                      } else if (isSelected && !isCorrect) {
                        borderColor = "#FF4081";
                        bgColor = "#FFF0F4";
                      }
                    } else if (isSelected) {
                      borderColor = "#42A5F5";
                      bgColor = "#F0F8FF";
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          s.optionCard,
                          { borderColor, backgroundColor: bgColor },
                        ]}
                        onPress={() => selectOption(idx)}
                        activeOpacity={matchRevealed ? 1 : 0.7}
                      >
                        {/* Word tiles per option */}
                        <View style={s.optionTiles}>
                          {opt.breakdown.map((w, wi) => {
                            // highlight swapped word in red after reveal
                            const isSwapped =
                              matchRevealed &&
                              !opt.isCorrect &&
                              wi === opt.swappedIndex;
                            return (
                              <TouchableOpacity
                                key={wi}
                                style={[
                                  s.optionTile,
                                  {
                                    backgroundColor: isSwapped
                                      ? "#FF4081"
                                      : toneColor(w.tone),
                                  },
                                ]}
                                onPress={() => speak(w.thai)}
                              >
                                <Text style={s.optionTileThai}>{w.thai}</Text>
                                <Text style={s.optionTileEng}>
                                  {w.english.toUpperCase()}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Full Thai string */}
                        <Text style={s.optionThai}>{opt.thai}</Text>

                        {/* Reveal badge */}
                        {matchRevealed && isCorrect && (
                          <View style={s.correctBadge}>
                            <Text style={s.correctBadgeText}>✓ Correct</Text>
                          </View>
                        )}
                        {matchRevealed && isSelected && !isCorrect && (
                          <View style={s.wrongBadge}>
                            <Text style={s.wrongBadgeText}>✗ Wrong</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Result banner */}
                {result !== "" && (
                  <View
                    style={[
                      s.resultBanner,
                      result === "correct" ? s.resultCorrect : s.resultWrong,
                    ]}
                  >
                    <Text style={s.resultEmoji}>
                      {result === "correct" ? "🎉" : "😅"}
                    </Text>
                    <Text
                      style={[
                        s.resultText,
                        { color: result === "correct" ? "#2E7D32" : "#E65100" },
                      ]}
                    >
                      {result === "correct"
                        ? "Correct! Moving on…"
                        : "Look carefully at each word"}
                    </Text>
                  </View>
                )}

                {/* Continue button — only show on wrong so user can move on */}
                {matchRevealed && result === "wrong" && (
                  <GenerateButton
                    title="Continue →"
                    onPress={() => fetchRound("breakdown")}
                  />
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ToneGuide
        visible={toneGuideVisible}
        onClose={() => setToneGuideVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F5F5" },
  container: { paddingBottom: 48 },

  // ── Loading ────────────────────────────────────────────────
  loadingContainer: { alignItems: "center", paddingTop: 80 },
  loadingText: { fontSize: 15, color: "#AAA", fontWeight: "600" },

  // ── Step indicator ─────────────────────────────────────────
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 0,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  stepDotActive: { backgroundColor: "#42A5F5" },
  stepDotDone: { backgroundColor: "#66BB6A" },
  stepDotText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  stepLabel: { fontSize: 11, fontWeight: "600", color: "#BBB" },
  stepLabelActive: { color: "#42A5F5" },

  // ── Shared section ─────────────────────────────────────────
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#BBB",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  // ── Breakdown card ─────────────────────────────────────────
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardMeta: {
    fontSize: 11,
    fontWeight: "700",
    color: "#BBB",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  sentence: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 16,
    color: "#111",
  },
  soundBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  soundBtnText: { fontSize: 20 },
  romanization: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  dashedBox: {
    borderWidth: 1.5,
    borderColor: "#EEE",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  dashedBoxText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },
  wordTiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  wordTile: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
    minWidth: 60,
  },
  wordTileThai: { fontSize: 18, fontWeight: "800", color: "#fff" },
  wordTileEng: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    opacity: 0.85,
    marginTop: 2,
  },

  // ── Prompt card (shared by WordScraps + Match) ─────────────
  promptCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#CCC",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  promptText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    lineHeight: 26,
  },

  // ── Progress bar ───────────────────────────────────────────
  progressTrack: {
    height: 4,
    backgroundColor: "#EEE",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#66BB6A",
    borderRadius: 2,
  },

  // ── Builder zone ───────────────────────────────────────────
  builderZone: {
    backgroundColor: "#fff",
    borderRadius: 16,
    minHeight: 76,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8E8E8",
    borderStyle: "dashed",
  },
  builderPlaceholder: { fontSize: 14, color: "#CCC", fontWeight: "500" },
  builderWords: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  builderChip: {
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  builderChipText: { fontSize: 22, fontWeight: "800", color: "#111" },

  // ── Action row (undo/reset) ────────────────────────────────
  actionRow: { flexDirection: "row", gap: 10 },
  ghostBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
  },
  ghostBtnText: { fontSize: 13, fontWeight: "700", color: "#555" },

  // ── Word cards grid ────────────────────────────────────────
  wordCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  // ── Result banner ──────────────────────────────────────────
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  resultCorrect: { backgroundColor: "#E8F5E9" },
  resultWrong: { backgroundColor: "#FFF3E0" },
  resultEmoji: { fontSize: 22 },
  resultText: { fontSize: 15, fontWeight: "700" },

  // ── Match options ──────────────────────────────────────────
  optionsGrid: { gap: 12 },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionTiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  optionTile: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  optionTileThai: { fontSize: 16, fontWeight: "800", color: "#fff" },
  optionTileEng: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    opacity: 0.85,
    marginTop: 1,
  },
  optionThai: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  correctBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#66BB6A",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  correctBadgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  wrongBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FF4081",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  wrongBadgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
});
