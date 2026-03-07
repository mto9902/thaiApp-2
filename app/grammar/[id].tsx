import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import LessonHeader from "../../src/components/LessonHeader";
import { grammarPoints } from "../../src/data/grammar";


export default function GrammarDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [bookmarked, setBookmarked] = useState(false);

  const grammar = grammarPoints.find((p) => p.id === id);

  useEffect(() => {
    checkBookmark();
  }, []);

  async function checkBookmark() {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch("http://192.168.1.121:3000/bookmarks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const exists = data.some((b: any) => b.grammar_id === id);

      setBookmarked(exists);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleBookmark() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (bookmarked) {
        await fetch("http://192.168.1.121:3000/bookmark", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ grammarId: id }),
        });

        setBookmarked(false);
      } else {
        await fetch("http://192.168.1.121:3000/bookmark", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ grammarId: id }),
        });

        setBookmarked(true);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Bookmark failed");
    }
  }

  if (!grammar) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <Text>Grammar point not found</Text>
      </SafeAreaView>
    );
  }

  const explanation = grammar.explanation || "No explanation provided yet.";
  const pattern = grammar.pattern || "PATTERN + HERE";

  const example = grammar.example || {
    thai: "ตัวอย่างประโยค",
    roman: "tua-yàang bprà-yòohk",
    english: "Example sentence",
    breakdown: [
      { thai: "ตัวอย่าง", english: "example" },
      { thai: "ประโยค", english: "sentence" },
    ],
  };

  const focus = grammar.focus || {
    particle: "Focus point",
    meaning: "The meaning of the key word.",
  };

  const handlePlayAudio = (text: string) => {
    Alert.alert("Audio playback", `Playing: ${text}`);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LessonHeader title={grammar.title} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LEVEL {grammar.level}</Text>
          </View>

          <View style={styles.titleCard}>
            <Text style={styles.title}>{grammar.title.toUpperCase()}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={toggleBookmark}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={22}
            color="black"
          />
          <Text style={styles.bookmarkText}>
            {bookmarked ? "BOOKMARKED" : "SAVE BOOKMARK"}
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONCEPT</Text>

          <View style={styles.conceptCard}>
            <Text style={styles.explanation}>{explanation}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SENTENCE PATTERN</Text>

          <View style={styles.patternCard}>
            <Text style={styles.patternText}>{pattern}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXAMPLE</Text>

          <View style={styles.exampleCard}>
            <View style={styles.exampleHeader}>
              <Ionicons name="megaphone-outline" size={24} color="black" />
              <Text style={styles.exampleHeaderText}>PRACTICE THIS</Text>
            </View>

            <Text style={styles.thaiText}>{example.thai}</Text>

            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => handlePlayAudio(example.thai)}
            >
              <Ionicons name="volume-high" size={28} color="black" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.romanText}>"{example.roman}"</Text>

            <View style={styles.englishContainer}>
              <Text style={styles.englishText}>{example.english}</Text>
            </View>

            <View style={styles.breakdownContainer}>
              {example.breakdown.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.breakdownCard,
                    {
                      backgroundColor: [
                        "#FFCC00",
                        "#FF66CC",
                        "#66CCFF",
                        "#99FF66",
                      ][index % 4],
                    },
                  ]}
                >
                  <Text style={styles.breakdownThai}>{item.thai}</Text>

                  <Text style={styles.breakdownEnglish}>
                    {item.english.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GRAMMAR FOCUS</Text>

          <View style={styles.focusCard}>
            <View style={styles.focusIcon}>
              <Ionicons name="star" size={20} color="black" />
            </View>

            <View style={styles.focusContent}>
              <Text style={styles.focusParticle}>{focus.particle}</Text>
              <Text style={styles.focusMeaning}>{focus.meaning}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push(`/practice/${grammar.id}`)}
        >
          <Text style={styles.ctaText}>START PRACTICE</Text>
          <Ionicons name="flash" size={24} color="black" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: { padding: 20, paddingBottom: 100 },

  bookmarkButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#FFF9C4",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "black",
    marginBottom: 25,
  },

  bookmarkText: { fontWeight: "900" },

  titleSection: { marginBottom: 30, alignItems: "center" },

  levelBadge: {
    backgroundColor: "black",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: -10,
    zIndex: 1,
  },

  levelText: { color: "white", fontSize: 12, fontWeight: "900" },

  titleCard: {
    backgroundColor: "#FFFF00",
    borderWidth: 3,
    borderColor: "black",
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },

  title: { fontSize: 28, fontWeight: "900", textAlign: "center" },

  section: { marginBottom: 35 },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#757575",
    marginBottom: 10,
    letterSpacing: 2,
  },

  conceptCard: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    padding: 20,
  },

  explanation: { fontSize: 17, fontWeight: "600", lineHeight: 24 },

  patternCard: {
    backgroundColor: "#E7F1FF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
  },

  patternText: { fontSize: 20, fontWeight: "900", textAlign: "center" },

  exampleCard: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "black",
    alignItems: "center",
  },

  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 8,
  },

  exampleHeaderText: { fontSize: 12, fontWeight: "900" },

  audioButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
  },

  thaiText: { fontSize: 42, fontWeight: "bold", textAlign: "center" },

  divider: {
    height: 2,
    backgroundColor: "#E0E0E0",
    width: "100%",
    marginVertical: 15,
  },

  romanText: {
    fontSize: 18,
    fontStyle: "italic",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 15,
  },

  englishContainer: {
    backgroundColor: "#FAFAFA",
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },

  englishText: { fontSize: 18, fontWeight: "800", textAlign: "center" },

  breakdownContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },

  breakdownCard: {
    padding: 10,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    alignItems: "center",
    minWidth: 80,
  },

  breakdownThai: { fontSize: 18, fontWeight: "bold" },

  breakdownEnglish: { fontSize: 10, fontWeight: "900", opacity: 0.8 },

  focusCard: {
    flexDirection: "row",
    backgroundColor: "#FFF4E6",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    alignItems: "center",
  },

  focusIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#FD7E14",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  focusParticle: { fontSize: 20, fontWeight: "900" },

  focusMeaning: { fontSize: 15, fontWeight: "700" },

  ctaButton: {
    backgroundColor: "#FFFF00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "black",
    marginTop: 20,
    gap: 12,
  },

  ctaText: { fontSize: 22, fontWeight: "900" },
});
