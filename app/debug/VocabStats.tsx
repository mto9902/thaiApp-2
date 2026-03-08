import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function VocabStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch("http://192.168.1.121:3000/vocab/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("STATS RESPONSE:", data);

      setStats(data);
    } catch (err) {
      console.error("Stats error:", err);
    }
  }

  if (!stats) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VOCAB DEBUG</Text>

      <Text>Total words: {stats.total_words}</Text>
      <Text>New words: {stats.new_words}</Text>
      <Text>Learning words: {stats.learning_words}</Text>
      <Text>Mastered words: {stats.mastered_words}</Text>
      <Text>Reviews due: {stats.reviews_due}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 20,
  },
});
