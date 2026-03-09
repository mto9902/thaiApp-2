import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import ToneGuide, { ToneGuideButton } from "../../../src/components/ToneGuide";

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
import WordCard from "../../../src/components/WordCard";

import { getPractice } from "../../../src/api/getPractice";
import { grammarPoints } from "../../../src/data/grammar";

// Tone-based colors — one color per Thai tone
const TONE_COLORS: Record<string, string> = {
  mid: "#42A5F5", // blue
  low: "#AB47BC", // purple
  falling: "#FF4081", // pink
  high: "#FF9800", // orange
  rising: "#66BB6A", // green
};

function toneColor(tone?: string): string {
  return TONE_COLORS[tone ?? ""] ?? "#42A5F5";
}

// mode = "breakdown" → BreakdownExercise (study sentence + word-by-word breakdown)
// mode = "wordScraps" → WordScraps (build the sentence from shuffled tiles)

export default function PracticeCSV() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [sentence, setSentence] = useState("");
  const [romanization, setRomanization] = useState("");
  const [translation, setTranslation] = useState("");
  const [grammarPoint, setGrammarPoint] = useState<any>(null);

  const [words, setWords] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [mode, setMode] = useState<"breakdown" | "wordScraps">("breakdown");

  const [loading, setLoading] = useState(false);

  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState("");

  const [toneGuideVisible, setToneGuideVisible] = useState(false);

  useEffect(() => {
    fetchAndShow("breakdown");
  }, [id]);

  function getRandomGrammar() {
    return grammarPoints[Math.floor(Math.random() * grammarPoints.length)];
  }

  function findGrammarById(grammarId: string) {
    return grammarPoints.find((g) => g.id === grammarId);
  }

  function shuffleWordsNotCorrectOrder(formattedWords: any[], correct: any[]) {
    let shuffled;
    do {
      shuffled = [...formattedWords].sort(() => Math.random() - 0.5);
    } while (
      JSON.stringify(shuffled.map((w) => w.thai)) ===
      JSON.stringify(correct.map((w) => w.thai))
    );
    return shuffled;
  }

  // Single shared fetch. Only switches mode after a successful fetch.
  const fetchAndShow = async (nextMode: "breakdown" | "wordScraps") => {
    try {
      setLoading(true);
      setResultMessage("");

      const grammarObject =
        typeof id === "string"
          ? findGrammarById(id) || getRandomGrammar()
          : getRandomGrammar();

      const result = await getPractice(grammarObject.id);

      setSentence(result?.thai || "");
      setRomanization(result?.romanization || "");
      setTranslation(result?.english || "");
      setGrammarPoint(grammarObject);

      const safeBreakdown = result?.breakdown || [];
      setBreakdown(safeBreakdown);

      // Only add words to SRS after user has studied them in BreakdownExercise
      if (nextMode === "breakdown") {
        await fetch("http://192.168.1.121:3000/track-words", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
          },
          body: JSON.stringify({ words: safeBreakdown }),
        });
      }

      const formattedWords = safeBreakdown.map((w: any) => ({
        thai: w?.thai || "",
        english: (w?.english || "").toUpperCase(),
        color: toneColor(w?.tone),
        rotation: Math.random() * 6 - 3,
      }));

      setWords(shuffleWordsNotCorrectOrder(formattedWords, safeBreakdown));
      setBuiltSentence([]);
      setMode(nextMode);
    } catch (error) {
      console.error("Practice generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  function handleWordTap(word: string) {
    setBuiltSentence([...builtSentence, word]);
  }

  function undoLastWord() {
    setBuiltSentence((prev) => prev.slice(0, -1));
  }

  function resetSentence() {
    setBuiltSentence([]);
  }

  function checkAnswer() {
    const correct = breakdown.map((w: any) => w?.thai || "");
    const isCorrect = JSON.stringify(correct) === JSON.stringify(builtSentence);

    if (isCorrect) {
      setResultMessage("Correct!");
      setTimeout(() => {
        fetchAndShow("breakdown");
      }, 1000);
    } else {
      setResultMessage("Try again");
    }
  }

  const speakSentence = () => {
    if (!sentence) return;
    Speech.stop();
    Speech.speak(sentence, { language: "th-TH", rate: 0.9 });
  };

  const speakWord = (word: string) => {
    if (!word) return;
    Speech.stop();
    Speech.speak(word, { language: "th-TH", rate: 0.9 });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header
          title={grammarPoint?.title || "Practice"}
          onBack={() => router.back()}
        />

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
            <ToneGuide
              visible={toneGuideVisible}
              onClose={() => setToneGuideVisible(false)}
            />
            {/* BreakdownExercise — sentence + word-by-word breakdown tiles */}

            {mode === "breakdown" && (
              <View style={styles.breakdownSection}>
                <Text style={styles.exampleLabel}>EXAMPLE</Text>

                <View style={styles.card}>
                  <Text style={styles.practiceThisLabel}>📢 PRACTICE THIS</Text>

                  <Text style={styles.sentence}>{sentence}</Text>

                  <TouchableOpacity
                    style={styles.soundButton}
                    onPress={speakSentence}
                  >
                    <Text style={styles.soundText}>🔊</Text>
                  </TouchableOpacity>

                  <Text style={styles.romanization}>{romanization}</Text>

                  <View style={styles.translationBox}>
                    <Text style={styles.translationText}>{translation}</Text>
                  </View>

                  <View style={styles.wordTiles}>
                    {breakdown.map((w: any, i: number) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.wordTile,
                          { backgroundColor: toneColor(w?.tone) },
                        ]}
                        onPress={() => speakWord(w.thai)}
                      >
                        <Text style={styles.wordTileThai}>{w.thai}</Text>
                        <Text style={styles.wordTileEnglish}>
                          {w.english.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <GenerateButton
                  title="New Sentence"
                  onPress={() => fetchAndShow("wordScraps")}
                />
              </View>
            )}

            {/* WordScraps — build the sentence from shuffled tiles */}
            {mode === "wordScraps" && (
              <View style={styles.wordScrapsSection}>
                <Text style={styles.wordScrapsTitle}>BUILD THE SENTENCE</Text>

                <View style={styles.builder}>
                  {builtSentence.map((word, i) => (
                    <Text key={i} style={styles.builderWord}>
                      {word}
                    </Text>
                  ))}
                </View>

                <View style={styles.controls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={undoLastWord}
                  >
                    <Text style={styles.controlText}>Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={resetSentence}
                  >
                    <Text style={styles.controlText}>Reset</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.wordCardsGrid}>
                  {words.map((word, idx) => (
                    <WordCard
                      key={idx}
                      thai={word.thai}
                      english={word.english}
                      backgroundColor={word.color}
                      rotation={word.rotation}
                      onPress={() => {
                        speakWord(word.thai);
                        handleWordTap(word.thai);
                      }}
                    />
                  ))}
                </View>

                <GenerateButton title="Check" onPress={checkAnswer} />

                {resultMessage !== "" && (
                  <Text style={styles.resultText}>{resultMessage}</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F5F5" },
  container: { paddingBottom: 40 },
  loadingText: { textAlign: "center", marginTop: 40 },

  // ── BreakdownExercise ──────────────────────────────────────
  breakdownSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },

  exampleLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },

  practiceThisLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 1,
    marginBottom: 12,
  },

  sentence: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 16,
  },

  soundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  soundText: {
    fontSize: 22,
  },

  romanization: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },

  translationBox: {
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },

  translationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
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

  wordTileThai: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },

  wordTileEnglish: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    opacity: 0.85,
    marginTop: 2,
  },

  // ── WordScraps ─────────────────────────────────────────────
  wordScrapsSection: {
    marginTop: 40,
    paddingHorizontal: 20,
  },

  wordScrapsTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20,
  },

  builder: {
    minHeight: 60,
    borderWidth: 3,
    borderColor: "black",
    marginBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },

  builderWord: {
    fontSize: 24,
    fontWeight: "900",
    marginHorizontal: 6,
  },

  controls: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },

  controlButton: {
    backgroundColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 8,
  },

  controlText: {
    color: "white",
    fontWeight: "700",
  },

  wordCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  resultText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
});
