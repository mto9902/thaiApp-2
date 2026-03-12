import * as Speech from "expo-speech";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sketch, sketchShadow } from "@/constants/theme";
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
        <Text
          style={[
            styles.result,
            {
              color:
                resultMessage === "Correct!" ? Sketch.green : Sketch.red,
            },
          ]}
        >
          {resultMessage}
        </Text>
      )}

      <GenerateButton title="New Sentence" onPress={handleGenerate} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 40, paddingHorizontal: 20 },
  title: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 20,
    color: Sketch.ink,
    letterSpacing: 1,
  },

  builder: {
    minHeight: 60,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    borderStyle: "dashed",
    marginBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: Sketch.cardBg,
  },

  builderWord: {
    fontSize: 24,
    fontWeight: "900",
    marginHorizontal: 6,
    color: Sketch.ink,
  },

  controls: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
  },

  button: {
    backgroundColor: Sketch.ink,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Sketch.ink,
    ...sketchShadow(2),
  },

  buttonText: { color: "white", fontWeight: "800", fontSize: 13 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },

  result: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
});
