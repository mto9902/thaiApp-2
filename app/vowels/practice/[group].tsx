import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { vowels } from "../../../src/data/vowels";

export default function VowelPractice() {
  const { group } = useLocalSearchParams();
  const router = useRouter();

  const lessonVowels = vowels.filter((v) => v.group === Number(group));

  const [question, setQuestion] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    generateQuestion();
  }, []);

  function shuffle(array: any[]) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function generateQuestion() {
    const q = lessonVowels[Math.floor(Math.random() * lessonVowels.length)];

    const distractors = shuffle(
      lessonVowels.filter((v) => v.symbol !== q.symbol),
    ).slice(0, 2);

    const opts = shuffle([q, ...distractors]);

    setQuestion(q);
    setOptions(opts);
    setMessage("");
  }

  function speak(text: string) {
    Speech.stop();
    Speech.speak(text, {
      language: "th-TH",
      rate: 0.9,
    });
  }

  function checkAnswer(vowel: any) {
    speak(vowel.example);

    if (vowel.symbol === question.symbol) {
      setMessage("Correct");

      setTimeout(() => {
        generateQuestion();
      }, 800);
    } else {
      setMessage("Try again");
    }
  }

  if (!question) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Which vowel makes "{question.sound}"?</Text>

      {options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={styles.option}
          onPress={() => checkAnswer(opt)}
        >
          <Text style={styles.optionText}>{opt.example}</Text>
        </TouchableOpacity>
      ))}

      {message !== "" && <Text style={styles.result}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  back: {
    fontSize: 18,
    marginBottom: 40,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },

  option: {
    backgroundColor: "#eee",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },

  optionText: {
    fontSize: 32,
    textAlign: "center",
    fontWeight: "bold",
  },

  result: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
});
