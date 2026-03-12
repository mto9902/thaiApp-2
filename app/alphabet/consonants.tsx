import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import { alphabet } from "../../src/data/alphabet";

const COLORS = ["#FFD54F", "#42A5F5", "#FF4081", "#66BB6A"];

const GROUPS = [
  { group: 1, title: "Mid Class", subtitle: "กลาง" },
  { group: 2, title: "High Class", subtitle: "สูง" },
  { group: 3, title: "Low Class I", subtitle: "ต่ำ ๑" },
  { group: 4, title: "Low Class II", subtitle: "ต่ำ ๒" },
];

function ConsonantCard({ lesson, color, onPress }: any) {
  const letters = alphabet.filter((l) => l.group === lesson.group);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: color }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.textContainer}>
            <Text style={styles.levelLabel}>{lesson.subtitle}</Text>
            <Text style={styles.cardTitle}>
              {lesson.title.toUpperCase()}
            </Text>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="book-outline" size={24} color="black" />
          </View>
        </View>

        {/* ── Polished Letter Preview Grid ─────────────────────────── */}
        <View style={styles.letterPreviewSection}>
          <View style={styles.letterGrid}>
            {letters.slice(0, 6).map((l, idx) => (
              <View key={l.letter} style={styles.letterTile}>
                <Text style={styles.letterPreview}>{l.letter}</Text>
              </View>
            ))}
          </View>
          {letters.length > 6 && (
            <View style={styles.moreLettersContainer}>
              <Text style={styles.letterMore}>+{letters.length - 6}</Text>
              <Text style={styles.moreText}>more</Text>
            </View>
          )}
        </View>

        {/* ── Letter Count Indicator ──────────────────────────────── */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(letters.length / 44) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.countText}>{letters.length} / 44 LETTERS</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>VIEW LESSON</Text>
          <Ionicons name="arrow-forward" size={16} color="black" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ConsonantsScreen() {
  const router = useRouter();
  const trainerScaleAnim = useRef(new Animated.Value(1)).current;

  const handleTrainerPressIn = () => {
    Animated.spring(trainerScaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handleTrainerPressOut = () => {
    Animated.spring(trainerScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Consonants" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Alphabet Trainer ───────────────────────────────── */}
        <Animated.View style={{ transform: [{ scale: trainerScaleAnim }] }}>
          <TouchableOpacity
            style={styles.trainerCard}
            onPress={() => router.push("/trainer")}
            onPressIn={handleTrainerPressIn}
            onPressOut={handleTrainerPressOut}
            activeOpacity={0.9}
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
        </Animated.View>

        {/* ── Consonant class cards ─────────────────────────── */}
        {GROUPS.map((lesson, i) =>
          <ConsonantCard
            key={lesson.group}
            lesson={lesson}
            color={COLORS[i]}
            onPress={() => router.push(`/alphabet/${lesson.group}` as any)}
          />
        )}
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

  trainerCard: {
    backgroundColor: "#CE93D8",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    marginBottom: 20,
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
    marginBottom: 16,
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

  letterPreviewSection: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  letterGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  letterTile: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },

  letterPreview: {
    fontSize: 20,
    fontWeight: "900",
    color: "black",
  },

  moreLettersContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  letterMore: {
    fontSize: 16,
    fontWeight: "900",
    color: "black",
  },

  moreText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(0,0,0,0.6)",
    marginTop: 2,
  },

  progressContainer: {
    marginBottom: 14,
  },

  progressBar: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 3,
  },

  countText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(0,0,0,0.5)",
    letterSpacing: 0.5,
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
