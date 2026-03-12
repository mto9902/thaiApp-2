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
import { Sketch, sketchShadow } from "@/constants/theme";

const COLORS = [
  Sketch.green,
  Sketch.blue,
  Sketch.blue,
  Sketch.purple,
  Sketch.pink,
  Sketch.orange,
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
                  <Ionicons name="chatbubble-outline" size={22} color={Sketch.ink} />
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
                <Ionicons name="arrow-forward" size={14} color={Sketch.ink} />
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
    backgroundColor: Sketch.paper,
  },

  scroll: {
    padding: 20,
    paddingTop: 10,
  },

  card: {
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    marginBottom: 16,
    padding: 20,
    ...sketchShadow(5),
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
    fontWeight: "800",
    color: "rgba(0,0,0,0.5)",
    marginBottom: 3,
    letterSpacing: 1,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Sketch.ink,
    lineHeight: 24,
  },

  iconContainer: {
    width: 42,
    height: 42,
    backgroundColor: Sketch.cardBg,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    ...sketchShadow(2),
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
    color: Sketch.ink,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
  },

  footerText: {
    fontSize: 11,
    fontWeight: "900",
    color: Sketch.ink,
  },
});
