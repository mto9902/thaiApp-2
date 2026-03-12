import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { API_BASE } from "../../src/config";

export default function MasteryStats() {
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const token = await AsyncStorage.getItem("token");

    const res = await fetch(`${API_BASE}/vocab/mastery-stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    setStats(data);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MASTERY DEBUG</Text>

      {stats.map((row) => (
        <Text key={row.mastery} style={styles.row}>
          Mastery {row.mastery}: {row.count} words
        </Text>
      ))}
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
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 20,
  },

  row: {
    fontSize: 18,
    marginVertical: 4,
  },
});
