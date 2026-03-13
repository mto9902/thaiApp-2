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

import LessonHeader from "../../../src/components/LessonHeader";
import ToneGuide, { ToneGuideButton } from "../../../src/components/ToneGuide";
import { API_BASE } from "../../../src/config";
import { grammarPoints } from "../../../src/data/grammar";
import { CEFR_LEVEL_META } from "../../../src/data/grammarLevels";
import { isGuestUser } from "../../../src/utils/auth";
import { Sketch, sketchShadow } from "@/constants/theme";

const TONE_COLORS: Record<string, string> = {
  mid: "#5B9BD5",
  low: "#9B72CF",
  falling: "#E8607A",
  high: "#F0983E",
  rising: "#5EBA7D",
};

function toneColor(tone?: string): string {
  return TONE_COLORS[tone ?? ""] ?? Sketch.inkMuted;
}

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.9 });
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ grammarId: id }),
        });
        setBookmarked(false);
      } else {
        await fetch(`${API_BASE}/bookmark`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      <SafeAreaView style={styles.container}>
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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LessonHeader title={grammar.title} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              {CEFR_LEVEL_META[grammar.level].label}
            </Text>
          </View>
          <View style={styles.titleCard}>
            <Text style={styles.title}>{grammar.title.toUpperCase()}</Text>
          </View>
        </View>

        {isGuest ? (
          <View style={[styles.bookmarkButton, { opacity: 0.5 }]}>
            <Ionicons name="bookmark-outline" size={20} color={Sketch.inkMuted} />
            <Text style={[styles.bookmarkText, { color: Sketch.inkMuted }]}>
              LOG IN TO BOOKMARK
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.bookmarkButton} onPress={toggleBookmark}>
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={Sketch.ink}
            />
            <Text style={styles.bookmarkText}>
              {bookmarked ? "BOOKMARKED" : "SAVE BOOKMARK"}
            </Text>
          </TouchableOpacity>
        )}

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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="megaphone-outline" size={22} color={Sketch.ink} />
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
              style={styles.audioButton}
              onPress={() => speak(example.thai)}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high" size={26} color={Sketch.ink} />
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
                  style={[styles.breakdownCard, { backgroundColor: toneColor(item.tone) }]}
                  onPress={() => speak(item.thai)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.breakdownThai}>{item.thai}</Text>
                  <Text style={styles.breakdownEnglish}>{item.english.toUpperCase()}</Text>
                  {item.tone && (
                    <View style={styles.tonePill}>
                      <Text style={styles.tonePillText}>{item.tone}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push(`/practice/${id}/PracticeCSV`)}
        >
          <Text style={styles.ctaText}>START PRACTICE</Text>
          <Ionicons name="flash" size={22} color={Sketch.cardBg} />
        </TouchableOpacity>
      </ScrollView>

      <ToneGuide visible={toneGuideVisible} onClose={() => setToneGuideVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Sketch.paper },
  scrollContent: { padding: 20, paddingBottom: 100 },

  bookmarkButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: Sketch.yellowLight,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Sketch.ink,
    marginBottom: 25,
    ...sketchShadow(2),
  },
  bookmarkText: { fontWeight: "900", color: Sketch.ink, fontSize: 13 },

  titleSection: { marginBottom: 28, alignItems: "center" },
  levelBadge: {
    backgroundColor: Sketch.ink,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: -10,
    zIndex: 1,
  },
  levelText: { color: "white", fontSize: 11, fontWeight: "900", letterSpacing: 1 },

  titleCard: {
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: "100%",
    ...sketchShadow(4),
  },
  title: { fontSize: 24, fontWeight: "900", textAlign: "center", color: Sketch.cardBg },

  section: { marginBottom: 30 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: Sketch.inkMuted,
    marginBottom: 10,
    letterSpacing: 2,
  },

  conceptCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 12,
    padding: 20,
    ...sketchShadow(3),
  },
  explanation: { fontSize: 16, fontWeight: "600", lineHeight: 24, color: Sketch.ink },

  patternCard: {
    backgroundColor: Sketch.yellowLight,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Sketch.ink,
    ...sketchShadow(3),
  },
  patternText: { fontSize: 18, fontWeight: "900", textAlign: "center", color: Sketch.ink },

  exampleCard: {
    backgroundColor: Sketch.cardBg,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    alignItems: "center",
    ...sketchShadow(5),
  },
  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    width: "100%",
  },
  exampleHeaderText: { fontSize: 11, fontWeight: "900", color: Sketch.ink, letterSpacing: 1 },

  audioButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Sketch.ink,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
    backgroundColor: Sketch.cardBg,
    ...sketchShadow(2),
  },

  thaiText: { fontSize: 38, fontWeight: "bold", textAlign: "center" },
  divider: { height: 2, backgroundColor: Sketch.inkFaint, width: "100%", marginVertical: 15 },
  romanText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    fontWeight: "600",
    color: Sketch.inkLight,
    marginBottom: 15,
  },

  englishContainer: {
    backgroundColor: Sketch.paperDark,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Sketch.inkFaint,
    borderStyle: "dashed",
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  englishText: { fontSize: 17, fontWeight: "800", textAlign: "center", color: Sketch.inkLight },

  breakdownContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  breakdownCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Sketch.ink,
    alignItems: "center",
    minWidth: 80,
    ...sketchShadow(2),
  },
  breakdownThai: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  breakdownEnglish: { fontSize: 10, fontWeight: "900", color: "#fff", opacity: 0.85, marginTop: 2 },
  tonePill: {
    marginTop: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  tonePillText: { fontSize: 8, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },

  ctaButton: {
    backgroundColor: Sketch.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    marginTop: 20,
    gap: 10,
    ...sketchShadow(5),
  },
  ctaText: { fontSize: 20, fontWeight: "900", color: Sketch.cardBg },
});

