import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { API_BASE } from "../../src/config";

export default function DebugVocab() {
  const [words, setWords] = useState<any[]>([]);

  useEffect(() => {
    loadWords();
  }, []);

  async function loadWords() {
    const token = await AsyncStorage.getItem("token");

    const res = await fetch(`${API_BASE}/vocab/today`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setWords(data);
  }

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Today's Words
      </Text>

      {words.map((w, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 22 }}>{w.thai}</Text>
          <Text style={{ fontSize: 16, color: "gray" }}>{w.english}</Text>
        </View>
      ))}
    </SafeAreaView>
  );
}
