import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { submitVocabAnswer } from "../../src/api/submitVocabAnswer";
import { API_BASE } from "../../src/config";

export default function DebugReview() {
  const [question, setQuestion] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showRoman, setShowRoman] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, []);

  async function loadQuestion() {
    const token = await AsyncStorage.getItem("token");

    const res = await fetch(`${API_BASE}/vocab/review`, {
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

    await submitVocabAnswer(question.thai, isCorrect ? "good" : "again");

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
      <View
        style={{
          marginBottom: 30,
        }}
      >
        <Text style={{ fontSize: 32 }}>{question.thai}</Text>
        {showRoman && question.romanization ? (
          <Text style={{ fontSize: 18, marginTop: 6, opacity: 0.8 }}>
            {question.romanization}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => setShowRoman((v) => !v)}
        style={{
          alignSelf: "flex-start",
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderWidth: 2,
          borderColor: "black",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "700" }}>
          {showRoman ? "Hide Romanization" : "Show Romanization"}
        </Text>
      </TouchableOpacity>

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
