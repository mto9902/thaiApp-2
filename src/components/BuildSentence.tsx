import * as Speech from "expo-speech";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GenerateButton from "./GenerateButton";
import WordCard from "./WordCard";

type Word = {
  thai: string;
  english: string;
  color: string;
  rotation: number;
};

type Props = {
  words: Word[];
  breakdown: any[];
  handleGenerate: () => void;
};

export default function BuildSentence({
  words,
  breakdown,
  handleGenerate,
}: Props) {
  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState("");

  function handleWordTap(word: string) {
    Speech.stop();
    Speech.speak(word, { language: "th-TH", rate: 0.9 });

    setBuiltSentence((prev) => [...prev, word]);
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
        setBuiltSentence([]);
        setResultMessage("");
      }, 1000);
    } else {
      setResultMessage("Try again");
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>BUILD THE SENTENCE</Text>

      <View style={styles.builder}>
        {builtSentence.map((word, i) => (
          <Text key={i} style={styles.builderWord}>
            {word}
          </Text>
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={undoLastWord}>
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={resetSentence}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
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
        <Text style={styles.result}>{resultMessage}</Text>
      )}

      <GenerateButton title="New Sentence" onPress={handleGenerate} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 40, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 20 },

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

  button: {
    backgroundColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 8,
  },

  buttonText: { color: "white", fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },

  result: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
});
