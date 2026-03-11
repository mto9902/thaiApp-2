import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import VowelText from "../../src/components/VowelText";
import { vowels } from "../../src/data/vowels";

const COLORS = [
  "#81C784",
  "#4DB6AC",
  "#64B5F6",
  "#BA68C8",
  "#F06292",
  "#FFB74D",
];

export default function VowelHome() {
  const router = useRouter();

  const lessons = [
    { group: 1, title: "Before Consonant", subtitle: "หน้าพยัญชนะ" },
    { group: 2, title: "After Consonant", subtitle: "หลังพยัญชนะ" },
    { group: 3, title: "Above Consonant", subtitle: "บนพยัญชนะ" },
    { group: 4, title: "Below Consonant", subtitle: "ล่างพยัญชนะ" },
    { group: 5, title: "Around Consonant I", subtitle: "รอบพยัญชนะ ๑" },
    { group: 6, title: "Around Consonant II", subtitle: "รอบพยัญชนะ ๒" },
  ];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Thai Vowels" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {lessons.map((lesson, i) => {
          const groupVowels = vowels.filter((v) => v.group === lesson.group);

          return (
            <TouchableOpacity
              key={lesson.group}
              style={[styles.card, { backgroundColor: COLORS[i % COLORS.length] }]}
              onPress={() => router.push(`/vowels/${lesson.group}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.textContainer}>
                  <Text style={styles.levelLabel}>{lesson.subtitle}</Text>
                  <Text style={styles.cardTitle}>{lesson.title.toUpperCase()}</Text>
                </View>
                <View style={styles.iconContainer}>
                  <Ionicons name="chatbubble-outline" size={24} color="black" />
                </View>
              </View>

              <View style={styles.vowelRow}>
                {groupVowels.map((v, j) => (
                  <VowelText key={j} example={v.example} style={styles.vowelPreview} />
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  {groupVowels.length} VOWELS
                </Text>
                <Ionicons name="arrow-forward" size={16} color="black" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  scroll: {
    padding: 20,
    paddingTop: 10,
  },

  card: {
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  textContainer: {
    flex: 1,
  },

  levelLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(0,0,0,0.55)",
    marginBottom: 3,
    letterSpacing: 1,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "black",
    lineHeight: 24,
  },

  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  vowelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  vowelPreview: {
    fontSize: 22,
    fontWeight: "800",
    color: "black",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },

  footerText: {
    fontSize: 12,
    fontWeight: "900",
    color: "black",
  },
});
