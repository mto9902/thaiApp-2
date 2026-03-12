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
import { Sketch, sketchShadow } from "@/constants/theme";

const COLORS = [Sketch.yellow, Sketch.blue, Sketch.red, Sketch.green];

const GROUPS = [
  { group: 1, title: "Mid Class", subtitle: "กลาง" },
  { group: 2, title: "High Class", subtitle: "สูง" },
  { group: 3, title: "Low Class I", subtitle: "ต่ำ ๑" },
  { group: 4, title: "Low Class II", subtitle: "ต่ำ ๒" },
];

function ConsonantCard({ lesson, color, onPress }: any) {
  const letters = alphabet.filter((l) => l.group === lesson.group);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.textContainer}>
          <Text style={styles.levelLabel}>{lesson.subtitle}</Text>
          <Text style={styles.cardTitle}>{lesson.title.toUpperCase()}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="book-outline" size={22} color={Sketch.ink} />
        </View>
      </View>

      <View style={styles.letterPreviewSection}>
        <View style={styles.letterGrid}>
          {letters.slice(0, 6).map((l) => (
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

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>VIEW LESSON</Text>
        <Ionicons name="arrow-forward" size={14} color={Sketch.ink} />
      </View>
    </TouchableOpacity>
  );
}

export default function ConsonantsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Consonants" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.trainerCard}
          onPress={() => router.push("/trainer")}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <View style={styles.textContainer}>
              <Text style={styles.levelLabel}>ADVANCED</Text>
              <Text style={styles.cardTitle}>ALPHABET TRAINER</Text>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name="construct-outline" size={22} color={Sketch.ink} />
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Combine consonants & vowels to generate real words
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>OPEN TRAINER</Text>
            <Ionicons name="arrow-forward" size={14} color={Sketch.ink} />
          </View>
        </TouchableOpacity>

        {GROUPS.map((lesson, i) => (
          <ConsonantCard
            key={lesson.group}
            lesson={lesson}
            color={COLORS[i]}
            onPress={() => router.push(`/alphabet/${lesson.group}` as any)}
          />
        ))}
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

  trainerCard: {
    backgroundColor: Sketch.purple,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    marginBottom: 18,
    padding: 20,
    ...sketchShadow(5),
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
    marginBottom: 14,
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

  cardDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(0,0,0,0.6)",
    marginBottom: 14,
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

  letterPreviewSection: {
    marginBottom: 14,
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
    backgroundColor: Sketch.cardBg,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    ...sketchShadow(2),
  },

  letterPreview: {
    fontSize: 20,
    fontWeight: "900",
    color: Sketch.ink,
  },

  moreLettersContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  letterMore: {
    fontSize: 16,
    fontWeight: "900",
    color: Sketch.ink,
  },

  moreText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(0,0,0,0.5)",
    marginTop: 2,
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
