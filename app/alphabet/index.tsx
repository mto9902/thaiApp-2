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
import { alphabet } from "../../src/data/alphabet";
import { vowels } from "../../src/data/vowels";

const CONSONANT_COLORS = ["#FFD54F", "#42A5F5", "#FF4081", "#66BB6A"];
const VOWEL_COLOR = "#81C784";

export default function AlphabetScreen() {
  const router = useRouter();

  const consonantGroups = [
    { group: 1, title: "Mid Class", subtitle: "กลาง" },
    { group: 2, title: "High Class", subtitle: "สูง" },
    { group: 3, title: "Low Class I", subtitle: "ต่ำ ๑" },
    { group: 4, title: "Low Class II", subtitle: "ต่ำ ๒" },
  ];

  const vowelGroups = [
    { group: 1, title: "Before Consonant" },
    { group: 2, title: "After Consonant" },
    { group: 3, title: "Above Consonant" },
    { group: 4, title: "Below Consonant" },
    { group: 5, title: "Around Consonant I" },
    { group: 6, title: "Around Consonant II" },
  ];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Alphabet" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Alphabet Trainer ───────────────────────────────── */}
        <TouchableOpacity
          style={styles.trainerCard}
          onPress={() => router.push("/trainer")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.textContainer}>
              <Text style={styles.levelLabel}>ADVANCED</Text>
              <Text style={styles.cardTitle}>ALPHABET TRAINER</Text>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name="construct-outline" size={24} color="black" />
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Combine consonants &amp; vowels to generate real words
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>OPEN TRAINER</Text>
            <Ionicons name="arrow-forward" size={16} color="black" />
          </View>
        </TouchableOpacity>

        {/* ── Consonants section ────────────────────────────── */}
        <Text style={styles.sectionLabel}>CONSONANTS</Text>

        {consonantGroups.map((lesson, i) => {
          const letters = alphabet.filter((l) => l.group === lesson.group);
          return (
            <TouchableOpacity
              key={lesson.group}
              style={[styles.card, { backgroundColor: CONSONANT_COLORS[i % CONSONANT_COLORS.length] }]}
              onPress={() => router.push(`/alphabet/${lesson.group}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.textContainer}>
                  <Text style={styles.levelLabel}>{lesson.subtitle}</Text>
                  <Text style={styles.cardTitle}>{lesson.title.toUpperCase()}</Text>
                </View>
                <View style={styles.iconContainer}>
                  <Ionicons name="book-outline" size={24} color="black" />
                </View>
              </View>

              <View style={styles.letterRow}>
                {letters.slice(0, 12).map((l) => (
                  <Text key={l.letter} style={styles.letterPreview}>
                    {l.letter}
                  </Text>
                ))}
                {letters.length > 12 && (
                  <Text style={styles.letterMore}>+{letters.length - 12}</Text>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  {letters.length} LETTERS
                </Text>
                <Ionicons name="arrow-forward" size={16} color="black" />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── Vowels section ────────────────────────────────── */}
        <Text style={styles.sectionLabel}>VOWELS</Text>

        {vowelGroups.map((lesson) => {
          const groupVowels = vowels.filter((v) => v.group === lesson.group);
          return (
            <TouchableOpacity
              key={lesson.group}
              style={[styles.card, { backgroundColor: VOWEL_COLOR }]}
              onPress={() => router.push(`/vowels/${lesson.group}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.textContainer}>
                  <Text style={styles.levelLabel}>GROUP {lesson.group}</Text>
                  <Text style={styles.cardTitle}>{lesson.title.toUpperCase()}</Text>
                </View>
                <View style={styles.iconContainer}>
                  <Ionicons name="chatbubble-outline" size={24} color="black" />
                </View>
              </View>

              <View style={styles.letterRow}>
                {groupVowels.map((v, i) => (
                  <Text key={i} style={styles.letterPreview}>
                    {v.example}
                  </Text>
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

  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(0,0,0,0.4)",
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 8,
  },

  // ── Cards ──────────────────────────────────────────────────
  trainerCard: {
    backgroundColor: "#CE93D8",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    marginBottom: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
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

  cardDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(0,0,0,0.65)",
    marginBottom: 14,
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

  letterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  letterPreview: {
    fontSize: 22,
    fontWeight: "800",
    color: "black",
  },

  letterMore: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(0,0,0,0.5)",
    alignSelf: "center",
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
