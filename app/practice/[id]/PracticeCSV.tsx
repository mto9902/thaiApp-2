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

import Header, { SettingsState } from "../../../src/components/Header";
import ToneGuide, { ToneGuideButton } from "../../../src/components/ToneGuide";
import WordCard from "../../../src/components/WordCard";

import { getPractice } from "../../../src/api/getPractice";
import { API_BASE } from "../../../src/config";
import { grammarPoints } from "../../../src/data/grammar";
import { saveRound } from "../../../src/utils/grammarProgress";
import { Sketch, sketchShadow } from "@/constants/theme";

// ── Constants ──────────────────────────────────────────────────────────────────
const TONE_COLORS: Record<string, string> = {
  mid: "#5B9BD5",
  low: "#9B72CF",
  falling: "#E8607A",
  high: "#F0983E",
  rising: "#5EBA7D",
};

function toneColor(tone?: string): string {
  return TONE_COLORS[tone ?? ""] ?? Sketch.inkMuted;
}

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

const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";

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

function buildMatchOptions(
  correct: SentenceData,
  distractors: SentenceData[],
): MatchOption[] {
  const unique = distractors.filter((d) => d.thai !== correct.thai);
  const picked = unique.slice(0, 3);
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
  if (total <= MAX_FREE_TILES) return breakdown.map(() => null);
  const numToPrefill = total - MAX_FREE_TILES;
  const eligible = breakdown
    .map((w, i) => ({ i, grammar: !!w.grammar }))
    .filter((x) => !x.grammar)
    .map((x) => x.i);
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const prefillIndices = new Set(shuffled.slice(0, numToPrefill));
  return breakdown.map((w, i) => (prefillIndices.has(i) ? w.thai : null));
}

function splitRomanization(
  romanization: string,
  breakdownLength: number,
): string[] {
  const tokens = romanization.split(/\s+/);
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
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");

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

  function handleSettingsChange(s: SettingsState) {
    setShowRoman(s.showRoman);
    setShowEnglish(s.showEnglish);
    setAutoplayTTS(s.autoplayTTS);
    setTtsSpeed(s.ttsSpeed);
  }

  useEffect(() => {
    if (mix) {
      mixIdsRef.current = mix.split(",");
      mixIndexRef.current = 0;
    } else {
      mixIdsRef.current = [];
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
    const res = await getPractice(gid);
    return {
      thai: res?.thai || "",
      romanization: res?.romanization || "",
      english: res?.english || "",
      breakdown: res?.breakdown || [],
    };
  }

  async function trackWords(
    wordsToTrack: SentenceData["breakdown"],
    trigger: string,
    romanTokensForWords?: string[],
  ) {
    const guest = await isGuestUser();
    if (guest) return;
    try {
      const enriched = wordsToTrack.map((w, i) => ({
        ...w,
        romanization: romanTokensForWords?.[i] || "",
      }));
      await fetch(`${API_BASE}/track-words`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
        },
        body: JSON.stringify({ words: enriched }),
      });
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

      const perWordRoman = splitRomanization(main.romanization, main.breakdown.length);
      setRomanTokens(perWordRoman);

      const slots = computePrefill(main.breakdown);
      setPrefilled(slots);

      const freeIndices: number[] = [];
      slots.forEach((s, i) => { if (s === null) freeIndices.push(i); });

      const formatted = freeIndices.map((i) => {
        const w = main.breakdown[i];
        return {
          thai: w.thai,
          english: w.english.toUpperCase(),
          roman: perWordRoman[i] ?? "",
          color: toneColor(w.tone),
          rotation: Math.random() * 6 - 3,
          isGrammar: !!w.grammar,
        };
      });

      setWords(shuffleNotSame(formatted, formatted));
      setBuiltSentence([]);

      if (nextMode === "matchThai") {
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
    setResult(ok ? "correct" : "wrong");
    saveRound(grammarObject().id, ok);
    if (ok) {
      trackWords(breakdown, "wordScraps-correct", romanTokens);
      setTimeout(() => fetchRound(randomMode()), 1200);
    }
  }

  function selectOption(idx: number) {
    if (matchRevealed) return;
    setSelectedOption(idx);
    setMatchRevealed(true);
    const opt = matchOptions[idx];
    const ok = opt.isCorrect;
    setResult(ok ? "correct" : "wrong");
    saveRound(grammarObject().id, ok);
    if (ok) {
      trackWords(breakdown, "matchThai-correct", romanTokens);
      setTimeout(() => fetchRound(randomMode()), 1400);
    }
  }

  const TTS_RATE: Record<string, number> = { slow: 0.7, normal: 1.0, fast: 1.3 };
  const speak = (t: string) => {
    Speech.stop();
    Speech.speak(t, { language: "th-TH", rate: TTS_RATE[ttsSpeed] || 0.7 });
  };

  const freeTileCount = prefilled.filter((s) => s === null).length;
  const wordProgress = freeTileCount > 0 ? builtSentence.length / freeTileCount : 0;
  const meta = MODE_META[mode];

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Header
          title={
            mixIdsRef.current.length > 0
              ? "Quick Mix"
              : grammarPoint?.title || "Practice"
          }
          onBack={() => router.back()}
          showClose
          onSettingsChange={handleSettingsChange}
        />

        {loading ? (
          <View style={st.loadingWrap}>
            <View style={st.loadingPulse} />
            <Text style={st.loadingLabel}>Generating...</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Mode header */}
            <View style={st.modeHeader}>
              <View style={st.modeTagRow}>
                <View style={st.modeTag}>
                  <Text style={st.modeTagText}>{meta.tag}</Text>
                </View>
                <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
              </View>
              <Text style={st.modeTitle}>{meta.title}</Text>
            </View>

            {/* ── BREAKDOWN (Study) ── */}
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
                      <Text key={i} style={{ color: toneColor(w.tone) }}>{w.thai}</Text>
                    ))}
                  </Text>
                  {showRoman && <Text style={st.studyRoman}>{romanization}</Text>}
                  <View style={st.divider} />
                  {showEnglish && <Text style={st.studyEnglish}>{translation}</Text>}
                </View>

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
                            <Text style={st.grammarBadgeIcon}>*</Text>
                          </View>
                        )}
                        <Text style={st.studyTileThai}>{w.thai}</Text>
                        {showRoman && romanTokens[i] ? (
                          <Text style={st.studyTileRoman}>{romanTokens[i]}</Text>
                        ) : null}
                        {showEnglish && (
                          <Text style={st.studyTileEng}>{w.english.toUpperCase()}</Text>
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
                    trackWords(breakdown, "breakdown-next", romanTokens);
                    saveRound(grammarObject().id, true);
                    fetchRound(randomMode());
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={st.primaryBtnText}>Got it — Next →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── WORDSCRAPS (Build) ── */}
            {mode === "wordScraps" && (
              <View style={st.exerciseWrap}>
                <View style={st.promptCard}>
                  <Text style={st.promptLabel}>TRANSLATE INTO THAI</Text>
                  <Text style={st.promptText}>{translation}</Text>
                </View>

                <View style={st.progressTrack}>
                  <View style={[st.progressFill, { width: `${Math.round(wordProgress * 100)}%` as any }]} />
                </View>

                <View
                  style={[
                    st.builderZone,
                    result === "correct" && st.builderCorrect,
                    result === "wrong" && st.builderWrong,
                  ]}
                >
                  {builtSentence.length === 0 && prefilled.every((s) => s === null) ? (
                    <Text style={st.builderPlaceholder}>Tap words below to build...</Text>
                  ) : (
                    <View style={st.builderWords}>
                      {(() => {
                        const chips: React.ReactNode[] = [];
                        let userIdx = 0;
                        for (let i = 0; i < prefilled.length; i++) {
                          if (prefilled[i] !== null) {
                            chips.push(
                              <View key={`pre-${i}`} style={st.builderChipLocked}>
                                <Text style={st.builderChipLockedText}>{prefilled[i]}</Text>
                              </View>,
                            );
                          } else if (userIdx < builtSentence.length) {
                            chips.push(
                              <View key={`usr-${i}`} style={st.builderChip}>
                                <Text style={st.builderChipText}>{builtSentence[userIdx]}</Text>
                              </View>,
                            );
                            userIdx++;
                          } else {
                            chips.push(
                              <View key={`gap-${i}`} style={st.builderSlotEmpty}>
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

                {result !== "" && (
                  <View style={[st.resultBanner, result === "correct" ? st.resultOk : st.resultBad]}>
                    <Text style={st.resultEmoji}>{result === "correct" ? "🎉" : "😅"}</Text>
                    <Text style={[st.resultLabel, { color: result === "correct" ? Sketch.green : Sketch.red }]}>
                      {result === "correct" ? "Correct!" : "Not quite — try again"}
                    </Text>
                  </View>
                )}

                <View style={st.actionRow}>
                  <TouchableOpacity style={st.actionBtn} onPress={undoLastWord} activeOpacity={0.7}>
                    <Text style={st.actionBtnText}>← Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={st.actionBtn} onPress={resetSentence} activeOpacity={0.7}>
                    <Text style={st.actionBtnText}>↺ Reset</Text>
                  </TouchableOpacity>
                </View>

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

                <TouchableOpacity style={st.primaryBtn} onPress={checkWordScraps} activeOpacity={0.85}>
                  <Text style={st.primaryBtnText}>Check Answer</Text>
                </TouchableOpacity>

                {result !== "correct" && (
                  <TouchableOpacity
                    style={[st.primaryBtn, st.secondaryBtn]}
                    onPress={() => fetchRound(randomMode())}
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>Skip →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── MATCHTHAI ── */}
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
                    const optRomanTokens = splitRomanization(opt.romanization, opt.breakdown.length);

                    let borderColor = Sketch.inkFaint;
                    let bgColor = Sketch.cardBg;

                    if (matchRevealed) {
                      if (isCorrect) {
                        borderColor = Sketch.green;
                        bgColor = "#F0F9F2";
                      } else if (isSelected && !isCorrect) {
                        borderColor = Sketch.red;
                        bgColor = "#FDF2F2";
                      } else {
                        bgColor = Sketch.paperDark;
                      }
                    } else if (isSelected) {
                      borderColor = Sketch.blue;
                      bgColor = "#F0F6FC";
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[st.optionCard, { borderColor, backgroundColor: bgColor }]}
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
                                  <Text style={st.grammarBadgeSmallIcon}>*</Text>
                                </View>
                              )}
                              <Text style={st.optionTileThai}>{w.thai}</Text>
                              {showRoman && optRomanTokens[wi] ? (
                                <Text style={st.optionTileRoman}>{optRomanTokens[wi]}</Text>
                              ) : null}
                              {showEnglish && (
                                <Text style={st.optionTileEng}>{w.english.toUpperCase()}</Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>

                        {matchRevealed && isCorrect && (
                          <View style={st.badge}>
                            <Text style={[st.badgeText, { color: Sketch.green }]}>✓ Correct</Text>
                          </View>
                        )}
                        {matchRevealed && isSelected && !isCorrect && (
                          <View style={[st.badge, st.badgeWrong]}>
                            <Text style={[st.badgeText, { color: Sketch.red }]}>✗ Wrong</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {result !== "" && (
                  <View style={[st.resultBanner, result === "correct" ? st.resultOk : st.resultBad]}>
                    <Text style={st.resultEmoji}>{result === "correct" ? "🎉" : "😅"}</Text>
                    <Text style={[st.resultLabel, { color: result === "correct" ? Sketch.green : Sketch.red }]}>
                      {result === "correct" ? "Correct! Moving on..." : "Look carefully at each word"}
                    </Text>
                  </View>
                )}

                {matchRevealed && result === "wrong" && (
                  <TouchableOpacity
                    style={[st.primaryBtn, st.secondaryBtn]}
                    onPress={() => fetchRound(randomMode())}
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>Continue →</Text>
                  </TouchableOpacity>
                )}

                {!matchRevealed && (
                  <TouchableOpacity
                    style={[st.primaryBtn, st.secondaryBtn]}
                    onPress={() => fetchRound(randomMode())}
                    activeOpacity={0.85}
                  >
                    <Text style={[st.primaryBtnText, st.secondaryBtnText]}>Skip →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <ToneGuide visible={toneGuideVisible} onClose={() => setToneGuideVisible(false)} />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { paddingBottom: 64 },

  loadingWrap: { alignItems: "center", paddingTop: 120, gap: 14 },
  loadingPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Sketch.inkFaint,
  },
  loadingLabel: { fontSize: 14, color: Sketch.inkMuted, fontWeight: "600" },

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
    backgroundColor: Sketch.ink,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: Sketch.cardBg,
    letterSpacing: 2,
  },
  modeTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },

  exerciseWrap: {
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 16,
  },

  studyCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    padding: 28,
    alignItems: "center",
    ...sketchShadow(5),
  },
  speakerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Sketch.paperDark,
    borderWidth: 2,
    borderColor: Sketch.ink,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...sketchShadow(2),
  },
  speakerIcon: { fontSize: 18 },
  studySentence: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    color: Sketch.ink,
    lineHeight: 40,
    marginBottom: 6,
  },
  studyRoman: {
    fontSize: 14,
    color: Sketch.inkMuted,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  divider: {
    width: 36,
    height: 2,
    backgroundColor: Sketch.inkFaint,
    borderRadius: 1,
    marginBottom: 18,
  },
  studyEnglish: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.inkLight,
    textAlign: "center",
    lineHeight: 24,
  },

  tileSection: { gap: 10 },
  tileSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Sketch.inkMuted,
    letterSpacing: 2,
  },
  tileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  studyTile: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Sketch.ink,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: 64,
    ...sketchShadow(2),
  },
  studyTileThai: { fontSize: 20, fontWeight: "800", color: "#fff" },
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

  grammarTile: {
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.85)",
    borderStyle: "dashed",
  },
  grammarBadge: { position: "absolute", top: 3, right: 3 },
  grammarBadgeIcon: { fontSize: 12, fontWeight: "900", color: "white" },

  grammarOptionTile: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    borderStyle: "dashed",
  },
  grammarBadgeSmall: { position: "absolute", top: 1, right: 2 },
  grammarBadgeSmallIcon: { fontSize: 10, fontWeight: "900", color: "white" },

  primaryBtn: {
    backgroundColor: Sketch.orange,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    ...sketchShadow(3),
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: Sketch.cardBg,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: Sketch.cardBg,
  },
  secondaryBtnText: {
    color: Sketch.inkLight,
  },

  promptCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...sketchShadow(4),
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Sketch.inkMuted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  promptText: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
    lineHeight: 26,
  },

  progressTrack: {
    height: 6,
    backgroundColor: Sketch.inkFaint,
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.ink,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Sketch.orange,
    borderRadius: 3,
  },

  builderZone: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: Sketch.inkFaint,
    borderStyle: "dashed",
  },
  builderCorrect: {
    borderColor: Sketch.green,
    borderStyle: "solid",
    backgroundColor: "#F0F9F2",
  },
  builderWrong: {
    borderColor: Sketch.red,
    borderStyle: "solid",
    backgroundColor: "#FDF2F2",
  },
  builderPlaceholder: {
    fontSize: 14,
    color: Sketch.inkMuted,
    fontWeight: "500",
  },
  builderWords: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  builderChip: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Sketch.ink,
  },
  builderChipText: {
    fontSize: 22,
    fontWeight: "800",
    color: Sketch.ink,
  },
  builderChipLocked: {
    backgroundColor: Sketch.inkFaint,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Sketch.inkFaint,
    borderStyle: "dashed",
  },
  builderChipLockedText: {
    fontSize: 22,
    fontWeight: "800",
    color: Sketch.inkMuted,
  },
  builderSlotEmpty: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Sketch.inkFaint,
    borderStyle: "dashed",
    minWidth: 44,
    alignItems: "center" as const,
  },
  builderSlotEmptyText: {
    fontSize: 22,
    fontWeight: "800",
    color: Sketch.inkFaint,
  },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: Sketch.cardBg,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Sketch.ink,
    ...sketchShadow(2),
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: Sketch.inkLight,
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
    borderWidth: 2,
    borderColor: Sketch.ink,
  },
  resultOk: { backgroundColor: "#F0F9F2" },
  resultBad: { backgroundColor: "#FDF2F2" },
  resultEmoji: { fontSize: 20 },
  resultLabel: { fontSize: 14, fontWeight: "700" },

  optionsGrid: { gap: 10 },
  optionCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 10,
    ...sketchShadow(3),
  },
  optionTiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  optionTile: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Sketch.ink,
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
    backgroundColor: "#F0F9F2",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: Sketch.green,
  },
  badgeWrong: { backgroundColor: "#FDF2F2", borderColor: Sketch.red },
  badgeText: { fontSize: 12, fontWeight: "800" },
});
