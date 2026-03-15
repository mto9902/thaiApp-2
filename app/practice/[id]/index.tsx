import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import Header from "../../../src/components/Header";
import ToneGuide, { ToneGuideButton } from "../../../src/components/ToneGuide";
import { API_BASE } from "../../../src/config";
import { grammarPoints } from "../../../src/data/grammar";
import { CEFR_LEVEL_META } from "../../../src/data/grammarLevels";
import { isGuestUser } from "../../../src/utils/auth";
import { getToneAccent } from "../../../src/utils/toneAccent";

function toneColor(tone?: string): string {
  return tone ? getToneAccent(tone) : Sketch.inkMuted;
}

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.9 });
}

function splitRomanization(romanization: string, breakdownLength: number) {
  const tokens = romanization.split(/\s+/);
  return Array.from({ length: breakdownLength }, (_, index) => tokens[index] ?? "");
}

export default function GrammarDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const scrollRef = useRef<ScrollView>(null);

  const [bookmarked, setBookmarked] = useState(false);
  const [toneGuideVisible, setToneGuideVisible] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const grammar = grammarPoints.find((p) => p.id === id);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const checkBookmark = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      if (guest) return;
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const exists = data.some((b: any) => b.grammar_id === id);
      setBookmarked(exists);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      isGuestUser().then(setIsGuest);
      checkBookmark();
    }
  }, [checkBookmark, id]);

  async function toggleBookmark() {
    try {
      const token = await AsyncStorage.getItem("token");
      if (bookmarked) {
        await fetch(`${API_BASE}/bookmark`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ grammarId: id }),
        });
        setBookmarked(false);
      } else {
        await fetch(`${API_BASE}/bookmark`, {
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
    roman: "tua-yang prayok",
    english: "Example sentence",
    breakdown: [
      { thai: "ตัวอย่าง", english: "example", tone: "mid" },
      { thai: "ประโยค", english: "sentence", tone: "mid" },
    ],
  };
  const exampleRomanTokens = splitRomanization(
    example.roman || "",
    example.breakdown.length,
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={grammar.title}
        onBack={() => router.back()}
        showSettings={false}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        {/* Level + Title */}
        <View style={styles.titleSection}>
          <Text style={styles.levelLabel}>
            {CEFR_LEVEL_META[grammar.level].label}
          </Text>
          <Text style={styles.title}>{grammar.title}</Text>
        </View>

        {/* Concept */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONCEPT</Text>
          <View style={styles.card}>
            <Text style={styles.explanation}>{explanation}</Text>
          </View>
        </View>

        {/* Pattern */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SENTENCE PATTERN</Text>
          <View style={styles.patternRow}>
            <View style={styles.patternCard}>
              <Text style={styles.patternText}>{pattern}</Text>
            </View>
            {isGuest ? (
              <View style={styles.bookmarkTile}>
                <Ionicons
                  name="bookmark-outline"
                  size={16}
                  color={Sketch.inkMuted}
                />
                <Text style={styles.bookmarkText}>Login</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.bookmarkTile}
                onPress={toggleBookmark}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={bookmarked ? "bookmark" : "bookmark-outline"}
                  size={16}
                  color={bookmarked ? Sketch.orange : Sketch.inkLight}
                />
                <Text
                  style={[
                    styles.bookmarkText,
                    bookmarked && styles.bookmarkTextActive,
                  ]}
                >
                  {bookmarked ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Example */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXAMPLE</Text>

          <View style={styles.exampleCard}>
            <View style={styles.exampleHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={styles.exampleHeaderText}>PRACTICE THIS</Text>
              </View>
              <ToneGuideButton onPress={() => setToneGuideVisible(true)} />
            </View>

            <Text style={styles.thaiText}>
              {example.breakdown.map((item: any, index: number) => (
                <Text key={index} style={{ color: toneColor(item.tone) }}>
                  {item.thai}
                </Text>
              ))}
            </Text>

            <TouchableOpacity
              style={styles.speakerBtn}
              onPress={() => speak(example.thai)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="volume-medium-outline"
                size={18}
                color={Sketch.inkLight}
              />
              <Text style={styles.speakerBtnText}>Play audio</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            <Text style={styles.romanText}>{example.roman}</Text>

            <View style={styles.englishContainer}>
              <Text style={styles.englishText}>{example.english}</Text>
            </View>

            <View style={styles.breakdownContainer}>
              {example.breakdown.map((item: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.wordTile}
                  onPress={() => speak(item.thai)}
                  activeOpacity={0.8}
                >
                  <View style={styles.wordTileHeader}>
                    <Text style={styles.wordTileThai}>{item.thai}</Text>
                    {item.tone && (
                      <View
                        style={[
                          styles.toneDot,
                          { backgroundColor: toneColor(item.tone) },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={styles.wordTileRoman}>
                    {item.romanization || item.roman || exampleRomanTokens[index]}
                  </Text>
                  <Text style={styles.wordTileEng}>
                    {item.english.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push(`/practice/${id}/PracticeCSV`)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Start Practice</Text>
        </TouchableOpacity>
      </ScrollView>

      <ToneGuide
        visible={toneGuideVisible}
        onClose={() => setToneGuideVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Sketch.paper },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },

  // Title
  titleSection: {
    marginBottom: 16,
    gap: 6,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },

  // Sections
  section: { marginBottom: 24, gap: 10 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
  },

  // Concept card
  card: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  explanation: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 24,
    color: Sketch.ink,
  },

  // Pattern
  patternRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  patternCard: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    justifyContent: "center",
  },
  patternText: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
    lineHeight: 24,
  },
  bookmarkTile: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bookmarkText: {
    fontSize: 10,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
  bookmarkTextActive: {
    color: Sketch.orange,
    fontWeight: "600",
  },

  // Example card
  exampleCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    width: "100%",
  },
  exampleHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
  },
  thaiText: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 44,
  },
  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
    width: "100%",
    marginVertical: 12,
  },
  romanText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "center",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  englishContainer: {
    backgroundColor: Sketch.paperDark,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderStyle: "dashed",
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  englishText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    color: Sketch.inkLight,
  },
  speakerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    marginTop: 8,
    marginBottom: 4,
  },
  speakerBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkLight,
  },

  // Word breakdown tiles — identical to practice screen
  breakdownContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
    width: "100%",
    alignSelf: "flex-start",
  },
  wordTile: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    alignSelf: "flex-start",
    minWidth: 64,
    maxWidth: "100%",
  },
  wordTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  wordTileThai: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
    flexShrink: 1,
  },
  wordTileRoman: {
    fontSize: 10,
    fontWeight: "500",
    color: Sketch.inkMuted,
    opacity: 0.9,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  wordTileEng: {
    fontSize: 9,
    fontWeight: "600",
    color: Sketch.inkLight,
    opacity: 0.9,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  toneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },

  // CTA
  ctaButton: {
    backgroundColor: Sketch.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    marginTop: 8,
    gap: 8,
    shadowColor: Sketch.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.1,
  },
});
