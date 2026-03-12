import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { isGuestUser } from "../../../src/utils/auth";
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
import { saveRound } from "../../../src/utils/grammarProgress";

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

// ── Preference keys ──────────────────────────────────────────────────────────
const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";

// ── Types ──────────────────────────────────────────────────────────────────────
interface SentenceData {
  thai: string;
  romanization: string;
  english: string;
  breakdown: {
    thai: string;
    english: string;
    tone?: string;
    grammar?: boolean;
  }[];
}

interface MatchOption {
  thai: string;
  romanization: string;
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
    {
      thai: correct.thai,
      romanization: correct.romanization,
      breakdown: correct.breakdown,
      isCorrect: true,
    },
    ...picked.map((d) => ({
      thai: d.thai,
      romanization: d.romanization,
      breakdown: d.breakdown,
      isCorrect: false,
    })),
  ];
  return options.sort(() => Math.random() - 0.5);
}

const MAX_FREE_TILES = 4;

function computePrefill(
  breakdown: SentenceData["breakdown"],
): (string | null)[] {
  const total = breakdown.length;

  if (total <= MAX_FREE_TILES) {
    return breakdown.map(() => null);
  }

  const numToPrefill = total - MAX_FREE_TILES;

  const eligible = breakdown
    .map((w, i) => ({ i, grammar: !!w.grammar }))
    .filter((x) => !x.grammar)
    .map((x) => x.i);

  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const prefillIndices = new Set(shuffled.slice(0, numToPrefill));

  return breakdown.map((w, i) => (prefillIndices.has(i) ? w.thai : null));
}

/** Split sentence-level romanization into per-word tokens aligned to breakdown */
function splitRomanization(
  romanization: string,
  breakdownLength: number,
): string[] {
  const tokens = romanization.split(/\s+/);
  // Pad with empty strings if mismatch
  return Array.from({ length: breakdownLength }, (_, i) => tokens[i] ?? "");
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PracticeCSV() {
  const { id, mix } = useLocalSearchParams<{ id: string; mix?: string }>();
  const router = useRouter();

  const roundRef = useRef(0);
  const mixIdsRef = useRef<string[]>([]);
  const mixIndexRef = useRef(0);

  const [sentence, setSentence] = useState("");
  const [romanization, setRomanization] = useState("");
  const [translation, setTranslation] = useState("");
  const [grammarPoint, setGrammarPoint] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<SentenceData["breakdown"]>([]);
  const [romanTokens, setRomanTokens] = useState<string[]>([]);

  const [words, setWords] = useState<any[]>([]);
  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [prefilled, setPrefilled] = useState<(string | null)[]>([]);

  const [matchOptions, setMatchOptions] = useState<MatchOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [matchRevealed, setMatchRevealed] = useState(false);

  const [mode, setMode] = useState<Mode>("breakdown");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"" | "correct" | "wrong">("");
  const [toneGuideVisible, setToneGuideVisible] = useState(false);

  const [showRoman, setShowRoman] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [autoplayTTS, setAutoplayTTS] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  function fadeIn() {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  // Load toggle preferences
  useEffect(() => {
    (async () => {
      const [roman, english, tts] = await Promise.all([
        AsyncStorage.getItem(PREF_ROMANIZATION),
        AsyncStorage.getItem(PREF_ENGLISH),
        AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
      ]);
      if (roman !== null) setShowRoman(roman === "true");
      if (english !== null) setShowEnglish(english === "true");
      if (tts !== null) setAutoplayTTS(tts === "true");
    })();
  }, []);

  function toggleRoman() {
    setShowRoman((prev) => {
      const next = !prev;
      AsyncStorage.setItem(PREF_ROMANIZATION, String(next));
      return next;
    });
  }
  function toggleEnglish() {
    setShowEnglish((prev) => {
      const next = !prev;
      AsyncStorage.setItem(PREF_ENGLISH, String(next));
      return next;
    });
  }
  function toggleAutoplayTTS() {
    setAutoplayTTS((prev) => {
      const next = !prev;
      AsyncStorage.setItem(PREF_AUTOPLAY_TTS, String(next));
      return next;
    });
  }

  useEffect(() => {
    if (mix) {
      mixIdsRef.current = mix.split(",");
      mixIndexRef.current = 0;
      console.log(
        `[PracticeCSV] Mounted — Quick Mix: ${mixIdsRef.current.length} grammar IDs`,
      );
    } else {
      mixIdsRef.current = [];
      console.log(`[PracticeCSV] Mounted — grammar id: ${id ?? "random"}`);
    }
    fetchRound(randomMode());
  }, [id, mix]);

  function getRandomGrammar() {
    return grammarPoints[Math.floor(Math.random() * grammarPoints.length)];
  }
  function findGrammarById(gid: string) {
    return grammarPoints.find((g) => g.id === gid);
  }
  function grammarObject() {
    if (mixIdsRef.current.length > 0) {
      const currentId =
        mixIdsRef.current[mixIndexRef.current % mixIdsRef.current.length];
      return findGrammarById(currentId) || getRandomGrammar();
    }
    return typeof id === "string"
      ? findGrammarById(id) || getRandomGrammar()
      : getRandomGrammar();
  }

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

  async function trackWords(
    wordsToTrack: SentenceData["breakdown"],
    trigger: string,
  ) {
    const guest = await isGuestUser();
    if (guest) return;

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

      // Split sentence romanization into per-word tokens
      const perWordRoman = splitRomanization(
        main.romanization,
        main.breakdown.length,
      );
      setRomanTokens(perWordRoman);

      const slots = computePrefill(main.breakdown);
      setPrefilled(slots);

      // Build free word tiles with romanization attached
      const freeIndices: number[] = [];
      slots.forEach((s, i) => {
        if (s === null) freeIndices.push(i);
      });

      const formatted = freeIndices.map((i) => {
        const w = main.breakdown[i];
        return {
          thai: w.thai,
          english: w.english.toUpperCase(),
          roman: perWordRoman[i] ?? "",
          color: toneColor(w.tone),
          rotation: Math.random() * 4 - 2,
          isGrammar: !!w.grammar,
        };
      });

      const freeWords = freeIndices.map((i) => main.breakdown[i]);
      setWords(shuffleNotSame(formatted, formatted));
      setBuiltSentence([]);

      const prefilledCount = slots.filter((s) => s !== null).length;
      console.log(
        `[Round ${round}] WordScraps: ${main.breakdown.length} words, ${prefilledCount} pre-filled, ${freeWords.length} free tiles`,
      );

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

      if (mixIdsRef.current.length > 0) {
        mixIndexRef.current++;
      }
    } catch (err) {
      console.error(`[Round ${round}] fetchRound FAILED:`, err);
    } finally {
      setLoading(false);
    }
  };

  function nextExercise() {
    fetchRound(randomMode());
  }

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
    const fullSentence: string[] = [];
    let userIdx = 0;
    for (let i = 0; i < prefilled.length; i++) {
      if (prefilled[i] !== null) {
        fullSentence.push(prefilled[i]!);
      } else if (userIdx < builtSentence.length) {
        fullSentence.push(builtSentence[userIdx]);
        userIdx++;
      }
    }

    const correct = breakdown.map((w) => w.thai);
    const ok = JSON.stringify(correct) === JSON.stringify(fullSentence);
    console.log(
      `[WordScraps] Check: ${ok ? "✅ CORRECT" : "❌ WRONG"} — expected [${correct.join(", ")}] got [${fullSentence.join(", ")}]`,
    );
    setResult(ok ? "correct" : "wrong");
    saveRound(grammarObject().id, ok);
    if (ok) {
      trackWords(breakdown, "wordScraps-correct");
      setTimeout(() => fetchRound(randomMode()), 1200);
    }
  }

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
    saveRound(grammarObject().id, ok);
    if (ok) {
      trackWords(breakdown, "matchThai-correct");
      setTimeout(() => fetchRound(randomMode()), 1400);
    }
  }

  const speak = (t: string) => {
    Speech.stop();
    Speech.speak(t, { language: "th-TH", rate: 0.9 });
  };

  const freeTileCount = prefilled.filter((s) => s === null).length;
  const wordProgress =
    freeTileCount > 0 ? builtSentence.length / freeTileCount : 0;
  const meta = MODE_META[mode];

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={
            mixIdsRef.current.length > 0
              ? "Quick Mix"
              : grammarPoint?.title || "Practice"
          }
          onBack={() => router.back()}
          showClose
        />

        {loading ? (
          <View style={st.loadingWrap}>
            <View style={st.loadingPulse} />
            <Text style={st.loadingLabel}>Generating…</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* ── Mode header ── */}
            <View style={st.modeHeader}>
              <View style={st.modeTagRow}>
                <View style={st.modeTag}>
                  <Text style={st.modeTagText}>{meta.tag}</Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View style={st.toggleBar}>
                    <TouchableOpacity
                      style={[st.togglePill, showRoman && st.togglePillActive]}
                      onPress={toggleRoman}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          st.togglePillText,
                          showRoman && st.togglePillTextActive,
                        ]}
                      >
                        Aa
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        st.togglePill,
                        showEnglish && st.togglePillActive,
                      ]}
                      onPress={toggleEnglish}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          st.togglePillText,
                          showEnglish && st.togglePillTextActive,
                        ]}
                      >
                        EN
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        st.togglePill,
                        autoplayTTS && st.togglePillActive,
                      ]}
                      onPress={toggleAutoplayTTS}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          st.togglePillText,
                          autoplayTTS && st.togglePillTextActive,
                        ]}
                      >
                        {autoplayTTS ? "\uD83D\uDD0A" : "\uD83D\uDD07"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
                </View>
              </View>
              <Text style={st.modeTitle}>{meta.title}</Text>
            </View>

            {/* ══════════════════════════════════════════════
                BREAKDOWN (Study)
            ══════════════════════════════════════════════ */}
            {mode === "breakdown" && (
              <View style={st.exerciseWrap}>
                <View style={st.studyCard}>
                  <TouchableOpacity
                    style={st.speakerBtn}
                    onPress={() => speak(sentence)}
                    activeOpacity={0.7}
                  >
                    <Text style={st.speakerIcon}>🔊</Text>
                  </TouchableOpacity>

                  <Text style={st.studySentence}>
                    {breakdown.map((w, i) => (
                      <Text key={i} style={{ color: toneColor(w.tone) }}>
                        {w.thai}
                      </Text>
                    ))}
                  </Text>
                  {showRoman && (
                    <Text style={st.studyRoman}>{romanization}</Text>
                  )}

                  <View style={st.divider} />

                  {showEnglish && (
                    <Text style={st.studyEnglish}>{translation}</Text>
                  )}
                </View>

                {/* Word breakdown */}
                <View style={st.tileSection}>
                  <Text style={st.tileSectionLabel}>WORD BREAKDOWN</Text>
                  <View style={st.tileRow}>
                    {breakdown.map((w, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          st.studyTile,
                          { backgroundColor: toneColor(w.tone) },
                          w.grammar && st.grammarTile,
                        ]}
                        onPress={() => autoplayTTS && speak(w.thai)}
                        activeOpacity={0.8}
                      >
                        {w.grammar && (
                          <View style={st.grammarBadge}>
                            <Text style={st.grammarBadgeIcon}>🧩</Text>
                          </View>
                        )}
                        <Text style={st.studyTileThai}>{w.thai}</Text>
                        {showRoman && romanTokens[i] ? (
                          <Text style={st.studyTileRoman}>
                            {romanTokens[i]}
                          </Text>
                        ) : null}
                        {showEnglish && (
                          <Text style={st.studyTileEng}>
                            {w.english.toUpperCase()}
                          </Text>
                        )}
                        {w.tone && (
                          <View style={st.tonePill}>
                            <Text style={st.tonePillText}>{w.tone}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={st.primaryBtn}
                  onPress={() => {
                    trackWords(breakdown, "breakdown-next");
                    saveRound(grammarObject().id, true);
                    fetchRound(randomMode());
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={st.primaryBtnText}>Got it — Next →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════════════════
                WORDSCRAPS (Build)
            ══════════════════════════════════════════════ */}
            {mode === "wordScraps" && (
              <View style={st.exerciseWrap}>
                <View style={st.promptCard}>
                  <Text style={st.promptLabel}>TRANSLATE INTO THAI</Text>
                  <Text style={st.promptText}>{translation}</Text>
                </View>

                {/* Progress */}
                <View style={st.progressTrack}>
                  <View
                    style={[
                      st.progressFill,
                      { width: `${Math.round(wordProgress * 100)}%` as any },
                    ]}
                  />
                </View>

                {/* Builder zone */}
                <View
                  style={[
                    st.builderZone,
                    result === "correct" && st.builderCorrect,
                    result === "wrong" && st.builderWrong,
                  ]}
                >
                  {builtSentence.length === 0 &&
                  prefilled.every((s) => s === null) ? (
                    <Text style={st.builderPlaceholder}>
                      Tap words below to build…
                    </Text>
                  ) : (
                    <View style={st.builderWords}>
                      {(() => {
                        const chips: React.ReactNode[] = [];
                        let userIdx = 0;
                        for (let i = 0; i < prefilled.length; i++) {
                          if (prefilled[i] !== null) {
                            chips.push(
                              <View
                                key={`pre-${i}`}
                                style={st.builderChipLocked}
                              >
                                <Text style={st.builderChipLockedText}>
                                  {prefilled[i]}
                                </Text>
                              </View>,
                            );
                          } else if (userIdx < builtSentence.length) {
                            chips.push(
                              <View key={`usr-${i}`} style={st.builderChip}>
                                <Text style={st.builderChipText}>
                                  {builtSentence[userIdx]}
                                </Text>
                              </View>,
                            );
                            userIdx++;
                          } else {
                            chips.push(
                              <View
                                key={`gap-${i}`}
                                style={st.builderSlotEmpty}
                              >
                                <Text style={st.builderSlotEmptyText}>?</Text>
                              </View>,
                            );
                          }
                        }
                        return chips;
                      })()}
                    </View>
                  )}
                </View>

                {/* Result */}
                {result !== "" && (
                  <View
                    style={[
                      st.resultBanner,
                      result === "correct" ? st.resultOk : st.resultBad,
                    ]}
                  >
                    <Text style={st.resultEmoji}>
                      {result === "correct" ? "🎉" : "😅"}
                    </Text>
                    <Text
                      style={[
                        st.resultLabel,
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
                <View style={st.actionRow}>
                  <TouchableOpacity
                    style={st.actionBtn}
                    onPress={undoLastWord}
                    activeOpacity={0.7}
                  >
                    <Text style={st.actionBtnText}>← Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={st.actionBtn}
                    onPress={resetSentence}
                    activeOpacity={0.7}
                  >
                    <Text style={st.actionBtnText}>↺ Reset</Text>
                  </TouchableOpacity>
                </View>

                {/* Tiles */}
                <View style={st.wordCardsGrid}>
                  {words.map((word, idx) => (
                    <WordCard
                      key={idx}
                      thai={word.thai}
                      english={showEnglish ? word.english : ""}
                      romanization={showRoman ? word.roman : ""}
                      backgroundColor={word.color}
                      rotation={word.rotation}
                      isGrammar={word.isGrammar}
                      onPress={() => {
                        if (autoplayTTS) speak(word.thai);
                        handleWordTap(word.thai);
                      }}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={st.primaryBtn}
                  onPress={checkWordScraps}
                  activeOpacity={0.85}
                >
                  <Text style={st.primaryBtnText}>Check Answer</Text>
                </TouchableOpacity>

                {result !== "correct" && (
                  <TouchableOpacity
                    style={[st.primaryBtn, st.secondaryBtn]}
                    onPress={() => {
                      console.log("[WordScraps] Skipped");
                      fetchRound(randomMode());
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
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
              <View style={st.exerciseWrap}>
                <View style={st.promptCard}>
                  <Text style={st.promptLabel}>FIND THE THAI FOR</Text>
                  <Text style={st.promptText}>{translation}</Text>
                </View>

                <View style={st.optionsGrid}>
                  {matchOptions.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = opt.isCorrect;
                    const optRomanTokens = splitRomanization(
                      opt.romanization,
                      opt.breakdown.length,
                    );

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
                          st.optionCard,
                          { borderColor, backgroundColor: bgColor },
                        ]}
                        onPress={() => selectOption(idx)}
                        activeOpacity={matchRevealed ? 1 : 0.75}
                      >
                        <View style={st.optionTiles}>
                          {opt.breakdown.map((w, wi) => (
                            <TouchableOpacity
                              key={wi}
                              style={[
                                st.optionTile,
                                { backgroundColor: toneColor(w.tone) },
                                w.grammar && st.grammarOptionTile,
                              ]}
                              onPress={() => autoplayTTS && speak(w.thai)}
                            >
                              {w.grammar && (
                                <View style={st.grammarBadgeSmall}>
                                  <Text style={st.grammarBadgeSmallIcon}>
                                    🧩
                                  </Text>
                                </View>
                              )}
                              <Text style={st.optionTileThai}>{w.thai}</Text>
                              {showRoman && optRomanTokens[wi] ? (
                                <Text style={st.optionTileRoman}>
                                  {optRomanTokens[wi]}
                                </Text>
                              ) : null}
                              {showEnglish && (
                                <Text style={st.optionTileEng}>
                                  {w.english.toUpperCase()}
                                </Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>

                        {matchRevealed && isCorrect && (
                          <View style={st.badge}>
                            <Text style={[st.badgeText, { color: "#2E7D32" }]}>
                              ✓ Correct
                            </Text>
                          </View>
                        )}
                        {matchRevealed && isSelected && !isCorrect && (
                          <View style={[st.badge, st.badgeWrong]}>
                            <Text style={[st.badgeText, { color: "#BF360C" }]}>
                              ✗ Wrong
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {result !== "" && (
                  <View
                    style={[
                      st.resultBanner,
                      result === "correct" ? st.resultOk : st.resultBad,
                    ]}
                  >
                    <Text style={st.resultEmoji}>
                      {result === "correct" ? "🎉" : "😅"}
                    </Text>
                    <Text
                      style={[
                        st.resultLabel,
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
                    style={[st.primaryBtn, st.secondaryBtn]}
                    onPress={() => fetchRound(randomMode())}
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
                      Continue →
                    </Text>
                  </TouchableOpacity>
                )}

                {!matchRevealed && (
                  <TouchableOpacity
                    style={[st.primaryBtn, st.secondaryBtn]}
                    onPress={() => {
                      console.log("[MatchThai] Skipped");
                      fetchRound(randomMode());
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>
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

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F6F3" },
  scroll: { paddingBottom: 64 },

  loadingWrap: { alignItems: "center", paddingTop: 120, gap: 14 },
  loadingPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8E8E4",
  },
  loadingLabel: { fontSize: 14, color: "#AAA", fontWeight: "600" },

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
  studyTileRoman: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    opacity: 0.85,
    marginTop: 2,
    letterSpacing: 0.3,
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

  // ── Grammar tile styles (breakdown mode) ───────────────────
  grammarTile: {
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.85)",
    borderStyle: "dashed",
  },
  grammarBadge: {
    position: "absolute",
    top: 3,
    right: 3,
  },
  grammarBadgeIcon: {
    fontSize: 10,
  },

  // ── Grammar tile styles (matchThai mode) ───────────────────
  grammarOptionTile: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    borderStyle: "dashed",
  },
  grammarBadgeSmall: {
    position: "absolute",
    top: 1,
    right: 2,
  },
  grammarBadgeSmallIcon: {
    fontSize: 8,
  },

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
  builderChipLocked: {
    backgroundColor: "#E2E2DD",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#D0D0CA",
    borderStyle: "dashed",
  },
  builderChipLockedText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#999",
  },
  builderSlotEmpty: {
    backgroundColor: "#FAFAF8",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#D8D8D2",
    borderStyle: "dashed",
    minWidth: 44,
    alignItems: "center" as const,
  },
  builderSlotEmptyText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#CCC",
  },

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

  wordCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

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
  optionTileRoman: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
    opacity: 0.85,
    marginTop: 1,
    letterSpacing: 0.3,
  },
  optionTileEng: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    opacity: 0.8,
    marginTop: 1,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F0FAF2",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeWrong: { backgroundColor: "#FEF5F6" },
  badgeText: { fontSize: 12, fontWeight: "800" },

  toggleBar: {
    flexDirection: "row",
    gap: 5,
  },
  togglePill: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: "#F0F0ED",
    borderWidth: 1.5,
    borderColor: "#E0E0DC",
  },
  togglePillActive: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#888",
  },
  togglePillTextActive: {
    color: "#FFF",
  },
});
