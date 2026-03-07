import { useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";

import { generateSentence } from "../api/generateSentence";
import { grammarPoints } from "../data/grammar";
import { getRandomWords } from "../logic/sentenceGenerator";

export default function PracticeScreen() {
  const [sentence, setSentence] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const words = getRandomWords(3);

      const grammar = grammarPoints[0]; // default grammar

      const result = await generateSentence(words, grammar.aiPrompt);

      setSentence(result.sentence);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <Text style={{ fontSize: 28, marginBottom: 20, textAlign: "center" }}>
          {sentence || "Generate a sentence to begin"}
        </Text>
      )}

      <Button
        title="Generate Sentence"
        onPress={handleGenerate}
        disabled={loading}
      />
    </View>
  );
}
