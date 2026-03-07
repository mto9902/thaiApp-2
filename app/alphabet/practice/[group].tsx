import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { alphabet } from "../../../src/data/alphabet";

type AlphabetLetter = {
  letter: string;
  name: string;
  romanization: string;
  sound: string;
  example: {
    thai: string;
    romanization: string;
    english: string;
  };
  group: number;
};

export default function AlphabetPractice() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const letters: AlphabetLetter[] = alphabet.filter(
    (l) => l.group === Number(group),
  );

  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState<AlphabetLetter[]>([]);
  const [message, setMessage] = useState("");

  const question = letters[questionIndex];

  function playSound(text: string) {
    Speech.speak(text, {
      language: "th-TH",
      rate: 0.8,
    });
  }

  function shuffle(array: AlphabetLetter[]) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generateOptions() {
    const otherLetters = letters.filter((l) => l.letter !== question.letter);

    const distractors = shuffle(otherLetters).slice(0, 2);
    const allOptions = shuffle([question, ...distractors]);

    setOptions(allOptions);
  }

  useEffect(() => {
    generateOptions();
  }, [questionIndex]);

  function checkAnswer(letter: AlphabetLetter) {
    // play sound for ANY pressed letter
    playSound(letter.name);

    if (letter.letter === question.letter) {
      setMessage("Correct");

      setTimeout(() => {
        setMessage("");
        setQuestionIndex((prev) => (prev + 1) % letters.length);
      }, 800);
    } else {
      setMessage("Try again");
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        Which letter makes the "{question.sound}" sound?
      </Text>

      {options.map((opt) => (
        <TouchableOpacity
          key={opt.letter}
          style={styles.option}
          onPress={() => checkAnswer(opt)}
        >
          <Text style={styles.optionText}>{opt.letter}</Text>
        </TouchableOpacity>
      ))}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
  },

  backText: {
    fontSize: 18,
    fontWeight: "600",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
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

  message: {
    marginTop: 20,
    fontSize: 18,
    textAlign: "center",
  },
});
