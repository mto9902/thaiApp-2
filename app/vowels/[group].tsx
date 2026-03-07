import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { vowels } from "../../src/data/vowels";

export default function VowelLesson() {
  const { group } = useLocalSearchParams();
  const router = useRouter();

  const lessonVowels = vowels.filter((v) => v.group === Number(group));

  function speak(text: string) {
    Speech.speak(text, { language: "th-TH", rate: 0.8 });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Vowel Lesson</Text>

      <View style={styles.grid}>
        {lessonVowels.map((vowel, i) => (
          <TouchableOpacity
            key={i}
            style={styles.tile}
            onPress={() => speak(vowel.example)}
          >
            <Text style={styles.example}>{vowel.example}</Text>

            <Text style={styles.name}>{vowel.name}</Text>

            <Text style={styles.sound}>{vowel.sound}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.practiceButton}
        onPress={() =>
          router.push({
            pathname: "/vowels/practice/[group]",
            params: { group },
          } as any)
        }
      >
        <Text style={styles.practiceText}>Start Practice</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  tile: {
    width: "30%",
    backgroundColor: "#f3f3f3",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    alignItems: "center",
  },

  example: {
    fontSize: 42,
    fontWeight: "bold",
  },

  symbol: {
    fontSize: 20,
    marginTop: 4,
  },

  name: {
    fontSize: 12,
    marginTop: 4,
  },

  sound: {
    fontSize: 12,
    color: "#666",
  },

  practiceButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },

  practiceText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
});
