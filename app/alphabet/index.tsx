import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { alphabet } from "../../src/data/alphabet";

export default function AlphabetScreen() {
  const router = useRouter();

  const lessons = [
    { group: 1, title: "Mid Class" },
    { group: 2, title: "High Class" },
    { group: 3, title: "Low Class – 1" },
    { group: 4, title: "Low Class – 2" },
  ];

  function openLesson(group: number) {
    router.push(`/alphabet/${group}` as any);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thai Alphabet</Text>

      {/* Alphabet Trainer */}
      <TouchableOpacity
        style={styles.trainerCard}
        onPress={() => router.push("/trainer")}
      >
        <Text style={styles.trainerTitle}>Alphabet Trainer</Text>
        <Text style={styles.trainerSubtitle}>
          Combine consonants and vowels to generate words
        </Text>
      </TouchableOpacity>

      {lessons.map((lesson) => {
        const letters = alphabet.filter((l) => l.group === lesson.group);

        return (
          <TouchableOpacity
            key={lesson.group}
            style={styles.lessonCard}
            onPress={() => openLesson(lesson.group)}
          >
            <Text style={styles.lessonTitle}>{lesson.title}</Text>

            <View style={styles.letterRow}>
              {letters.map((l) => (
                <Text key={l.letter} style={styles.letter}>
                  {l.letter}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
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

  lessonCard: {
    backgroundColor: "#f2f2f2",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },

  lessonTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  letterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  letter: {
    fontSize: 26,
    fontWeight: "bold",
  },

  trainerCard: {
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  trainerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },

  trainerSubtitle: {
    fontSize: 14,
    color: "white",
    marginTop: 4,
  },
});
