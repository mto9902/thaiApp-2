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
import TranslateCard from "../../../src/components/TranslateCard";
import WordCard from "../../../src/components/WordCard";

import { getPractice } from "../../../src/api/getPractice";
import { grammarPoints } from "../../../src/data/grammar";

const COLORS = ["#42A5F5", "#FF4081", "#66BB6A", "#FF9800", "#AB47BC"];

export default function PracticeCSV() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [sentence, setSentence] = useState("");
  const [romanization, setRomanization] = useState("");
  const [translation, setTranslation] = useState("");
  const [grammarPoint, setGrammarPoint] = useState<any>(null);

  const [words, setWords] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    handleGenerate();
  }, [id]);

  useEffect(() => {
    console.log("BREAKDOWN STATE:", breakdown);
  }, [breakdown]);

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

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setResultMessage("");

      const grammarObject =
        typeof id === "string"
          ? findGrammarById(id) || getRandomGrammar()
          : getRandomGrammar();

      setGrammarPoint(grammarObject);

      const result = await getPractice(grammarObject.id);

      console.log("API RESULT:", result);

      setSentence(result?.sentence || "");
      setRomanization(result?.romanization || "");
      setTranslation(result?.translation || "");

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
      setBuiltSentence([]);
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
        handleGenerate();
        setResultMessage("");
      }, 1000);
    } else {
      setResultMessage("Try again");
    }
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
          title={grammarPoint?.title || "Practice"}
          onBack={() => router.back()}
        />

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 40 }}>Loading...</Text>
        ) : (
          <>
            <TranslateCard
              sentence={sentence}
              breakdown={breakdown}
              romanization={romanization}
              english={translation}
              grammarPoint={grammarPoint?.title}
            />

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

  resultText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
});
