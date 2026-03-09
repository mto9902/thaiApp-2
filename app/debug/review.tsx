import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { submitVocabAnswer } from "../../src/api/submitVocabAnswer";

export default function DebugReview() {
  const [question, setQuestion] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadQuestion();
  }, []);

  async function loadQuestion() {
    const token = await AsyncStorage.getItem("token");

    const res = await fetch("http://192.168.1.121:3000/vocab/review", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (data.done) {
      setQuestion(null);
      setFeedback("All reviews finished for today 🎉");
      return;
    }

    setQuestion(data);
    setFeedback(null);
  }

  async function checkAnswer(choice: string) {
    const isCorrect = choice === question.correct;

    if (isCorrect) {
      setFeedback("Correct!");
    } else {
      setFeedback("Try again");
    }

    await submitVocabAnswer(question.thai, isCorrect);

    if (isCorrect) {
      setTimeout(() => {
        loadQuestion();
      }, 800);
    }
  }
  if (!question) {
    return (
      <SafeAreaView style={{ padding: 20 }}>
        <Text style={{ fontSize: 22 }}>{feedback || "Loading..."}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <Text style={{ fontSize: 32, marginBottom: 30 }}>{question.thai}</Text>

      {question.choices.map((choice: string, i: number) => (
        <TouchableOpacity
          key={i}
          onPress={() => checkAnswer(choice)}
          style={{
            padding: 15,
            borderWidth: 2,
            borderColor: "black",
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 20 }}>{choice}</Text>
        </TouchableOpacity>
      ))}

      {feedback && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 22 }}>{feedback}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
