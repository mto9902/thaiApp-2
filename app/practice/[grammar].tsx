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

import GenerateButton from "../../src/components/GenerateButton";
import Header from "../../src/components/Header";
import TranslateCard from "../../src/components/TranslateCard";
import WordCard from "../../src/components/WordCard";

import { generateSentence } from "../../src/api/generateSentence";
import { generateTransform } from "../../src/api/generateTransform";

import { grammarPoints } from "../../src/data/grammar";

const COLORS = ["#42A5F5", "#FF4081", "#66BB6A", "#FF9800", "#AB47BC"];

type TransformOption = {
  thai: string;
  romanization: string;
  english: string;
};

export default function Practice() {
  const [sentence, setSentence] = useState("");
  const [romanization, setRomanization] = useState("");
  const [translation, setTranslation] = useState("");
  const [grammarPoint, setGrammarPoint] = useState<any>(null);

  const [words, setWords] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [exerciseType, setExerciseType] = useState<
    "rapid" | "wordOrder" | "transform"
  >("rapid");

  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState("");

  const [transformOptions, setTransformOptions] = useState<TransformOption[]>(
    [],
  );
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  const { grammar } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    handleGenerate();
  }, [grammar]);

  function nextExerciseType(current: string) {
    if (current === "rapid") return "wordOrder";
    if (current === "wordOrder") return "transform";
    return "rapid";
  }

  function getRandomGrammar() {
    return grammarPoints[Math.floor(Math.random() * grammarPoints.length)];
  }

  function findGrammarById(id: string) {
    return grammarPoints.find((g) => g.id === id);
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

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setResultMessage("");

      const grammarObject =
        typeof grammar === "string"
          ? findGrammarById(grammar) || getRandomGrammar()
          : getRandomGrammar();

      setGrammarPoint(grammarObject);

      const nextType = nextExerciseType(exerciseType);
      setExerciseType(nextType);

      if (nextType === "transform") {
        const transform = await generateTransform(grammarObject.aiPrompt);

        setSentence(transform?.base_sentence?.thai || "");
        setRomanization(transform?.base_sentence?.romanization || "");
        setTranslation(transform?.base_sentence?.english || "");

        setTransformOptions(transform?.options || []);
        setCorrectIndex(transform?.correct_index ?? null);

        setWords([]);
        setBreakdown([]);
      } else {
        const result = await generateSentence(grammarObject.aiPrompt);

        setSentence(result?.sentence || "");
        setRomanization(result?.romanization || "");

        setTranslation(
          result?.translation ||
            (result?.breakdown || [])
              .map((w: any) => w?.english || "")
              .join(" "),
        );

        const safeBreakdown = result?.breakdown || [];
        setBreakdown(safeBreakdown);

        const formattedWords = safeBreakdown.map((w: any, i: number) => ({
          thai: w?.thai || "",
          english: (w?.english || "").toUpperCase(),
          color: COLORS[i % COLORS.length],
          rotation: Math.random() * 6 - 3,
        }));

        const shuffled = shuffleWordsNotCorrectOrder(
          formattedWords,
          safeBreakdown,
        );

        setWords(shuffled);
      }

      setBuiltSentence([]);
    } catch (error) {
      console.error("Generation failed:", error);
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

    setResultMessage(isCorrect ? "Correct!" : "Try again");
  }

  function checkTransform(index: number) {
    if (correctIndex === null) return;

    setResultMessage(index === correctIndex ? "Correct!" : "Try again");
  }

  const speakWord = (word: string) => {
    if (!word) return;

    Speech.stop();

    Speech.speak(word, {
      language: "th-TH",
      rate: 0.9,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header
          title="Practice"
          onBack={() => router.push(`/grammar/${grammar}`)}
        />

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 40 }}>Loading...</Text>
        ) : (
          <>
            {exerciseType === "rapid" && (
              <>
                <TranslateCard
                  sentence={sentence}
                  breakdown={breakdown}
                  romanization={romanization}
                  english={translation}
                  grammarPoint={grammarPoint?.title}
                />

                <View style={styles.wordScrapsSection}>
                  <Text style={styles.wordScrapsTitle}>WORDSCRAPS</Text>

                  <View style={styles.wordCardsGrid}>
                    {words.map((word, idx) => (
                      <WordCard
                        key={idx}
                        thai={word.thai}
                        english={word.english}
                        backgroundColor={word.color}
                        rotation={word.rotation}
                        onPress={() => speakWord(word.thai)}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}

            {exerciseType === "wordOrder" && (
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
                      onPress={() => handleWordTap(word.thai)}
                    />
                  ))}
                </View>

                <GenerateButton title="Check" onPress={checkAnswer} />

                {resultMessage !== "" && (
                  <Text style={styles.resultText}>{resultMessage}</Text>
                )}
              </View>
            )}

            {exerciseType === "transform" && (
              <View style={styles.transformBox}>
                <Text style={styles.transformInstruction}>
                  Apply the grammar rule
                </Text>

                <Text style={styles.transformSentence}>{sentence}</Text>
                <Text style={styles.transformRomanization}>{romanization}</Text>
                <Text style={styles.transformTranslation}>{translation}</Text>

                {transformOptions.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.transformOption}
                    onPress={() => checkTransform(i)}
                  >
                    <Text style={styles.optionThai}>{opt?.thai || ""}</Text>
                    <Text style={styles.optionRomanization}>
                      {opt?.romanization || ""}
                    </Text>
                    <Text style={styles.optionEnglish}>
                      {opt?.english || ""}
                    </Text>
                  </TouchableOpacity>
                ))}

                {resultMessage !== "" && (
                  <Text style={styles.resultText}>{resultMessage}</Text>
                )}
              </View>
            )}

            <GenerateButton onPress={handleGenerate} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F5F5" },
  container: { paddingBottom: 40 },

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

  transformBox: {
    marginTop: 40,
    paddingHorizontal: 20,
  },

  transformInstruction: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },

  transformSentence: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },

  transformRomanization: {
    textAlign: "center",
    marginTop: 6,
  },

  transformTranslation: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
    color: "#555",
  },

  transformOption: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    padding: 14,
    marginBottom: 12,
  },

  optionThai: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  optionRomanization: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 4,
  },

  optionEnglish: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },

  resultText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
});
