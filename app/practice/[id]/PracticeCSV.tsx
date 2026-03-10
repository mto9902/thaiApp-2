import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";

import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Header from "../../../src/components/Header";
import ToneGuide, { ToneGuideButton } from "../../../src/components/ToneGuide";
import WordCard from "../../../src/components/WordCard";

import { getPractice } from "../../../src/api/getPractice";
import { grammarPoints } from "../../../src/data/grammar";

// ── Constants ──────────────────────────────────────────────────────────────────
const TONE_COLORS: Record<string, string> = {
  mid: "#5B9BD5",
  low: "#9B72CF",
  falling: "#E8607A",
  high: "#F0983E",
  rising: "#5EBA7D",
};

function toneColor(tone?: string): string {
  return TONE_COLORS[tone ?? ""] ?? "#5B9BD5";
}

// ── Exercise modes ─────────────────────────────────────────────────────────────
type Mode = "breakdown" | "wordScraps" | "matchThai";
const ALL_MODES: Mode[] = ["breakdown", "wordScraps", "matchThai"];

function randomMode(): Mode {
  return ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)];
}

const MODE_META: Record<Mode, { tag: string; title: string }> = {
  breakdown: { tag: "STUDY", title: "Read & listen" },
  wordScraps: { tag: "BUILD", title: "Arrange the words" },
  matchThai: { tag: "MATCH", title: "Find the correct Thai" },
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface SentenceData {
  thai: string;
  romanization: string;
  english: string;
  breakdown: { thai: string; english: string; tone?: string }[];
}

interface MatchOption {
  thai: string;
  breakdown: SentenceData["breakdown"];
  isCorrect: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function buildMatchOptions(
  correct: SentenceData,
  distractors: SentenceData[],
): MatchOption[] {
  const unique = distractors.filter((d) => d.thai !== correct.thai);
  const picked = unique.slice(0, 3);

  console.log(
    `[MatchThai] Building options: 1 correct + ${picked.length} distractors (${distractors.length - picked.length} dupes removed)`,
  );

  const options: MatchOption[] = [
    { thai: correct.thai, breakdown: correct.breakdown, isCorrect: true },
    ...picked.map((d) => ({
      thai: d.thai,
      breakdown: d.breakdown,
      isCorrect: false,
    })),
  ];
  return options.sort(() => Math.random() - 0.5);
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PracticeCSV() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ── Round counter (for logging)
  const roundRef = useRef(0);

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

  // ── Fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  function fadeIn() {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  useEffect(() => {
    console.log(`[PracticeCSV] Mounted — grammar id: ${id ?? "random"}`);
    fetchRound(randomMode());
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
    const t0 = Date.now();
    const res = await getPractice(gid);
    const data: SentenceData = {
      thai: res?.thai || "",
      romanization: res?.romanization || "",
      english: res?.english || "",
      breakdown: res?.breakdown || [],
    };
    console.log(
      `[API] getPractice("${gid}") → ${data.breakdown.length} words, ${Date.now() - t0}ms`,
    );
    return data;
  }

  // ── SRS tracking ─────────────────────────────────────────────────────────────
  async function trackWords(
    wordsToTrack: SentenceData["breakdown"],
    trigger: string,
  ) {
    const vocabList = wordsToTrack.map((w) => w.thai);
    console.log(
      `[SRS] Tracking ${wordsToTrack.length} vocab → [${vocabList.join(", ")}] (trigger: ${trigger})`,
    );
    try {
      const t0 = Date.now();
      const resp = await fetch("http://192.168.1.121:3000/track-words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
        },
        body: JSON.stringify({ words: wordsToTrack }),
      });
      console.log(`[SRS] Response: ${resp.status} — ${Date.now() - t0}ms`);
    } catch (err) {
      console.error("[SRS] trackWords failed:", err);
    }
  }

  function shuffleNotSame(items: any[], correct: any[]) {
    let s;
    do {
      s = [...items].sort(() => Math.random() - 0.5);
    } while (
      s.length > 1 &&
      JSON.stringify(s.map((w) => w.thai)) ===
        JSON.stringify(correct.map((w) => w.thai))
    );
    return s;
  }

  // ── Main fetch & setup ───────────────────────────────────────────────────────
  const fetchRound = async (nextMode: Mode) => {
    const round = ++roundRef.current;
    console.log(`\n══════════════════════════════════════`);
    console.log(`[Round ${round}] Starting → mode: ${nextMode}`);
    console.log(`══════════════════════════════════════`);

    try {
      setLoading(true);
      setResult("");
      setSelectedOption(null);
      setMatchRevealed(false);

      const gobj = grammarObject();
      console.log(`[Round ${round}] Grammar: "${gobj.title}" (id: ${gobj.id})`);

      const main = await fetchSentence(gobj.id);
      console.log(
        `[Round ${round}] Sentence: "${main.thai}" → "${main.english}"`,
      );
      console.log(
        `[Round ${round}] Breakdown: ${main.breakdown.map((w) => `${w.thai}(${w.tone ?? "?"})`).join(" · ")}`,
      );

      setSentence(main.thai);
      setRomanization(main.romanization);
      setTranslation(main.english);
      setGrammarPoint(gobj);
      setBreakdown(main.breakdown);

      // WordScraps tiles
      const formatted = main.breakdown.map((w) => ({
        thai: w.thai,
        english: w.english.toUpperCase(),
        color: toneColor(w.tone),
        rotation: Math.random() * 4 - 2,
      }));
      setWords(shuffleNotSame(formatted, main.breakdown));
      setBuiltSentence([]);

      // MatchThai — fetch distractors
      if (nextMode === "matchThai") {
        console.log(`[Round ${round}] Fetching 3 distractors…`);
        const extras = await Promise.all([
          fetchSentence(gobj.id),
          fetchSentence(gobj.id),
          fetchSentence(gobj.id),
        ]);
        setMatchOptions(buildMatchOptions(main, extras));
      }

      setMode(nextMode);
      fadeIn();
    } catch (err) {
      console.error(`[Round ${round}] fetchRound FAILED:`, err);
    } finally {
      setLoading(false);
    }
  };

  // ── Next exercise (random) ───────────────────────────────────────────────────
  function nextExercise() {
    fetchRound(randomMode());
  }

  // ── WordScraps actions ───────────────────────────────────────────────────────
  function handleWordTap(word: string) {
    setBuiltSentence((p) => {
      const next = [...p, word];
      console.log(
        `[WordScraps] Tapped "${word}" → built: [${next.join(", ")}] (${next.length}/${breakdown.length})`,
      );
      return next;
    });
  }
  function undoLastWord() {
    setBuiltSentence((p) => {
      const next = p.slice(0, -1);
      console.log(`[WordScraps] Undo → built: [${next.join(", ")}]`);
      return next;
    });
  }
  function resetSentence() {
    console.log("[WordScraps] Reset");
    setBuiltSentence([]);
  }

  function checkWordScraps() {
    const correct = breakdown.map((w) => w.thai);
    const ok = JSON.stringify(correct) === JSON.stringify(builtSentence);
    console.log(
      `[WordScraps] Check: ${ok ? "✅ CORRECT" : "❌ WRONG"} — expected [${correct.join(", ")}] got [${builtSentence.join(", ")}]`,
    );
    setResult(ok ? "correct" : "wrong");
    if (ok) {
      trackWords(breakdown, "wordScraps-correct");
      setTimeout(() => fetchRound(randomMode()), 1200);
    }
  }

  // ── MatchThai actions ────────────────────────────────────────────────────────
  function selectOption(idx: number) {
    if (matchRevealed) return;
    setSelectedOption(idx);
    setMatchRevealed(true);
    const opt = matchOptions[idx];
    const ok = opt.isCorrect;
    console.log(
      `[MatchThai] Selected option ${idx}: "${opt.thai}" — ${ok ? "✅ CORRECT" : "❌ WRONG"}`,
    );
    setResult(ok ? "correct" : "wrong");
    if (ok) {
      trackWords(breakdown, "matchThai-correct");
      setTimeout(() => fetchRound(randomMode()), 1400);
    }
  }

  // ── Speech ───────────────────────────────────────────────────────────────────
  const speak = (t: string) => {
    Speech.stop();
    Speech.speak(t, { language: "th-TH", rate: 0.9 });
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const wordProgress =
    breakdown.length > 0 ? builtSentence.length / breakdown.length : 0;
  const meta = MODE_META[mode];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={grammarPoint?.title || "Practice"}
          onBack={() => router.back()}
        />

        {loading ? (
          <View style={s.loadingWrap}>
            <View style={s.loadingPulse} />
            <Text style={s.loadingLabel}>Generating…</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* ── Mode header ── */}
            <View style={s.modeHeader}>
              <View style={s.modeTagRow}>
                <View style={s.modeTag}>
                  <Text style={s.modeTagText}>{meta.tag}</Text>
                </View>
                <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
              </View>
              <Text style={s.modeTitle}>{meta.title}</Text>
            </View>

            {/* ══════════════════════════════════════════════
                BREAKDOWN (Study)
            ══════════════════════════════════════════════ */}
            {mode === "breakdown" && (
              <View style={s.exerciseWrap}>
                <View style={s.studyCard}>
                  <TouchableOpacity
                    style={s.speakerBtn}
                    onPress={() => speak(sentence)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.speakerIcon}>🔊</Text>
                  </TouchableOpacity>

                  <Text style={s.studySentence}>
                    {breakdown.map((w, i) => (
                      <Text key={i} style={{ color: toneColor(w.tone) }}>
                        {w.thai}
                      </Text>
                    ))}
                  </Text>
                  <Text style={s.studyRoman}>{romanization}</Text>

                  <View style={s.divider} />

                  <Text style={s.studyEnglish}>{translation}</Text>
                </View>

                {/* Word breakdown */}
                <View style={s.tileSection}>
                  <Text style={s.tileSectionLabel}>WORD BREAKDOWN</Text>
                  <View style={s.tileRow}>
                    {breakdown.map((w, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          s.studyTile,
                          { backgroundColor: toneColor(w.tone) },
                        ]}
                        onPress={() => speak(w.thai)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.studyTileThai}>{w.thai}</Text>
                        <Text style={s.studyTileEng}>
                          {w.english.toUpperCase()}
                        </Text>
                        {w.tone && (
                          <View style={s.tonePill}>
                            <Text style={s.tonePillText}>{w.tone}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={() => {
                    trackWords(breakdown, "breakdown-next");
                    fetchRound(randomMode());
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={s.primaryBtnText}>Got it — Next →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════════════════
                WORDSCRAPS (Build)
            ══════════════════════════════════════════════ */}
            {mode === "wordScraps" && (
              <View style={s.exerciseWrap}>
                <View style={s.promptCard}>
                  <Text style={s.promptLabel}>TRANSLATE INTO THAI</Text>
                  <Text style={s.promptText}>{translation}</Text>
                </View>

                {/* Progress */}
                <View style={s.progressTrack}>
                  <View
                    style={[
                      s.progressFill,
                      { width: `${Math.round(wordProgress * 100)}%` as any },
                    ]}
                  />
                </View>

                {/* Builder zone */}
                <View
                  style={[
                    s.builderZone,
                    result === "correct" && s.builderCorrect,
                    result === "wrong" && s.builderWrong,
                  ]}
                >
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

                {/* Result */}
                {result !== "" && (
                  <View
                    style={[
                      s.resultBanner,
                      result === "correct" ? s.resultOk : s.resultBad,
                    ]}
                  >
                    <Text style={s.resultEmoji}>
                      {result === "correct" ? "🎉" : "😅"}
                    </Text>
                    <Text
                      style={[
                        s.resultLabel,
                        {
                          color: result === "correct" ? "#2E7D32" : "#BF360C",
                        },
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
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={undoLastWord}
                    activeOpacity={0.7}
                  >
                    <Text style={s.actionBtnText}>← Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={resetSentence}
                    activeOpacity={0.7}
                  >
                    <Text style={s.actionBtnText}>↺ Reset</Text>
                  </TouchableOpacity>
                </View>

                {/* Tiles */}
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

                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={checkWordScraps}
                  activeOpacity={0.85}
                >
                  <Text style={s.primaryBtnText}>Check Answer</Text>
                </TouchableOpacity>

                {result !== "correct" && (
                  <TouchableOpacity
                    style={[s.primaryBtn, s.secondaryBtn]}
                    onPress={() => {
                      console.log("[WordScraps] Skipped");
                      fetchRound(randomMode());
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.primaryBtnText, s.secondaryBtnText]}>
                      Skip →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ══════════════════════════════════════════════
                MATCHTHAI (Pick correct sentence)
            ══════════════════════════════════════════════ */}
            {mode === "matchThai" && (
              <View style={s.exerciseWrap}>
                <View style={s.promptCard}>
                  <Text style={s.promptLabel}>FIND THE THAI FOR</Text>
                  <Text style={s.promptText}>{translation}</Text>
                </View>

                <View style={s.optionsGrid}>
                  {matchOptions.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = opt.isCorrect;

                    let borderColor = "#E8E8E4";
                    let bgColor = "#FFFFFF";

                    if (matchRevealed) {
                      if (isCorrect) {
                        borderColor = "#5EBA7D";
                        bgColor = "#F4FBF6";
                      } else if (isSelected && !isCorrect) {
                        borderColor = "#E8607A";
                        bgColor = "#FEF5F6";
                      } else {
                        bgColor = "#FAFAF8";
                      }
                    } else if (isSelected) {
                      borderColor = "#5B9BD5";
                      bgColor = "#F6FAFD";
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          s.optionCard,
                          { borderColor, backgroundColor: bgColor },
                        ]}
                        onPress={() => selectOption(idx)}
                        activeOpacity={matchRevealed ? 1 : 0.75}
                      >
                        <View style={s.optionTiles}>
                          {opt.breakdown.map((w, wi) => (
                            <TouchableOpacity
                              key={wi}
                              style={[
                                s.optionTile,
                                { backgroundColor: toneColor(w.tone) },
                              ]}
                              onPress={() => speak(w.thai)}
                            >
                              <Text style={s.optionTileThai}>{w.thai}</Text>
                              <Text style={s.optionTileEng}>
                                {w.english.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {matchRevealed && isCorrect && (
                          <View style={s.badge}>
                            <Text style={[s.badgeText, { color: "#2E7D32" }]}>
                              ✓ Correct
                            </Text>
                          </View>
                        )}
                        {matchRevealed && isSelected && !isCorrect && (
                          <View style={[s.badge, s.badgeWrong]}>
                            <Text style={[s.badgeText, { color: "#BF360C" }]}>
                              ✗ Wrong
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Result */}
                {result !== "" && (
                  <View
                    style={[
                      s.resultBanner,
                      result === "correct" ? s.resultOk : s.resultBad,
                    ]}
                  >
                    <Text style={s.resultEmoji}>
                      {result === "correct" ? "🎉" : "😅"}
                    </Text>
                    <Text
                      style={[
                        s.resultLabel,
                        {
                          color: result === "correct" ? "#2E7D32" : "#BF360C",
                        },
                      ]}
                    >
                      {result === "correct"
                        ? "Correct! Moving on…"
                        : "Look carefully at each word"}
                    </Text>
                  </View>
                )}

                {matchRevealed && result === "wrong" && (
                  <TouchableOpacity
                    style={[s.primaryBtn, s.secondaryBtn]}
                    onPress={() => fetchRound(randomMode())}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.primaryBtnText, s.secondaryBtnText]}>
                      Continue →
                    </Text>
                  </TouchableOpacity>
                )}

                {!matchRevealed && (
                  <TouchableOpacity
                    style={[s.primaryBtn, s.secondaryBtn]}
                    onPress={() => {
                      console.log("[MatchThai] Skipped");
                      fetchRound(randomMode());
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.primaryBtnText, s.secondaryBtnText]}>
                      Skip →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
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
const R = 14;
const SHADOW = {
  shadowColor: "#1A1A1A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 3,
} as const;

const s = StyleSheet.create({
  // ── Layout ─────────────────────────────────────────────────
  safe: { flex: 1, backgroundColor: "#F7F6F3" },
  scroll: { paddingBottom: 64 },

  // ── Loading ────────────────────────────────────────────────
  loadingWrap: { alignItems: "center", paddingTop: 120, gap: 14 },
  loadingPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8E8E4",
  },
  loadingLabel: { fontSize: 14, color: "#AAA", fontWeight: "600" },

  // ── Mode header ────────────────────────────────────────────
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

  // ── Exercise wrapper ───────────────────────────────────────
  exerciseWrap: {
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 16,
  },

  // ── Study card ─────────────────────────────────────────────
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
    marginBottom: 20,
  },
  speakerIcon: { fontSize: 18 },
  studySentence: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    color: "#1A1A1A",
    lineHeight: 42,
    marginBottom: 6,
  },
  studyRoman: {
    fontSize: 14,
    color: "#A0A09A",
    textAlign: "center",
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
  studyEnglish: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
  },

  // ── Tile section ───────────────────────────────────────────
  tileSection: { gap: 10 },
  tileSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B5B5AE",
    letterSpacing: 2,
  },
  tileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  studyTile: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: 64,
  },
  studyTileThai: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  studyTileEng: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    opacity: 0.8,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  tonePill: {
    marginTop: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  tonePillText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },

  // ── Primary button ─────────────────────────────────────────
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
  secondaryBtn: {
    backgroundColor: "#F0F0ED",
  },
  secondaryBtnText: {
    color: "#555",
  },

  // ── Prompt card ────────────────────────────────────────────
  promptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: R,
    paddingVertical: 18,
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 26,
  },

  // ── Progress bar ───────────────────────────────────────────
  progressTrack: {
    height: 3,
    backgroundColor: "#E8E8E4",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#5EBA7D",
    borderRadius: 2,
  },

  // ── Builder zone ───────────────────────────────────────────
  builderZone: {
    backgroundColor: "#FFFFFF",
    borderRadius: R,
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8E8E4",
    borderStyle: "dashed",
  },
  builderCorrect: {
    borderColor: "#5EBA7D",
    borderStyle: "solid",
    backgroundColor: "#F7FDF9",
  },
  builderWrong: {
    borderColor: "#E8607A",
    borderStyle: "solid",
    backgroundColor: "#FFF8F8",
  },
  builderPlaceholder: {
    fontSize: 14,
    color: "#C5C5BE",
    fontWeight: "500",
  },
  builderWords: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  builderChip: {
    backgroundColor: "#F4F4F0",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  builderChipText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
  },

  // ── Action row ─────────────────────────────────────────────
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8E8E4",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
  },

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
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  resultOk: { backgroundColor: "#F0FAF2" },
  resultBad: { backgroundColor: "#FEF5EC" },
  resultEmoji: { fontSize: 20 },
  resultLabel: { fontSize: 14, fontWeight: "700" },

  // ── Match options ──────────────────────────────────────────
  optionsGrid: { gap: 10 },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: R,
    borderWidth: 2,
    borderColor: "#E8E8E4",
    padding: 16,
    gap: 10,
    ...SHADOW,
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
    opacity: 0.8,
    marginTop: 1,
  },

  // ── Badges ─────────────────────────────────────────────────
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F0FAF2",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeWrong: { backgroundColor: "#FEF5F6" },
  badgeText: { fontSize: 12, fontWeight: "800" },
});
