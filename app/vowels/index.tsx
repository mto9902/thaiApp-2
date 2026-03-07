import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { vowels } from "../../src/data/vowels";

export default function VowelHome() {
  const router = useRouter();

  const lessons = [
    { group: 1, title: "Before Consonant" },
    { group: 2, title: "After Consonant" },
    { group: 3, title: "Above Consonant" },
    { group: 4, title: "Below Consonant" },
    { group: 5, title: "Around Consonant 1" },
    { group: 6, title: "Around Consonant 2" },
  ];

  function openLesson(group: number) {
    router.push(`/vowels/${group}` as any);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thai Vowels</Text>

      {lessons.map((lesson) => {
        const groupVowels = vowels.filter((v) => v.group === lesson.group);

        return (
          <TouchableOpacity
            key={lesson.group}
            style={styles.lessonCard}
            onPress={() => openLesson(lesson.group)}
          >
            <Text style={styles.lessonTitle}>{lesson.title}</Text>

            <View style={styles.grid}>
              {groupVowels.map((v, i) => (
                <View key={i} style={styles.tile}>
                  <Text style={styles.vowel}>{v.example}</Text>
                </View>
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
    marginBottom: 22,
  },

  lessonTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  tile: {
    width: "20%", // 5 vowels per row
    alignItems: "center",
    marginBottom: 10,
  },

  vowel: {
    fontSize: 26,
    fontWeight: "bold",
  },
});
