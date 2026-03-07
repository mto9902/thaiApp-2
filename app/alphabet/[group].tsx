import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { alphabet } from "../../src/data/alphabet";

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

export default function AlphabetLesson() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const letters: AlphabetLetter[] = alphabet.filter(
    (l) => l.group === Number(group),
  );

  function playSound(text: string) {
    Speech.speak(text, {
      language: "th-TH",
      rate: 0.8,
    });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Lesson {group}</Text>

      <View style={styles.grid}>
        {letters.map((letter) => (
          <TouchableOpacity
            key={letter.letter}
            style={styles.tile}
            onPress={() => playSound(letter.name)}
          >
            <Text style={styles.letter}>{letter.letter}</Text>

            <Text style={styles.name}>{letter.name}</Text>

            <Text style={styles.sound}>{letter.sound}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.practiceButton}
        onPress={() =>
          router.push({
            pathname: "/alphabet/practice/[group]",
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

  letter: {
    fontSize: 42,
    fontWeight: "bold",
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
