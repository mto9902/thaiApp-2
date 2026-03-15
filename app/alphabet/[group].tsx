import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
import Header from "../../src/components/Header";
import { alphabet } from "../../src/data/alphabet";

type AlphabetLetter = {
  letter: string;
  name: string;
  romanization: string;
  sound: string;
  example: { thai: string; romanization: string; english: string };
  group: number;
};

const ACCENT = Sketch.orange;

const GROUP_META: Record<
  number,
  {
    badge: string;
    title: string;
    description: string;
  }
> = {
  1: {
    badge: "Group 1",
    title: "Mid Class",
    description:
      "Mid class consonants are the baseline for Thai tone rules and provide a strong foundation for reading.",
  },
  2: {
    badge: "Group 2",
    title: "High Class",
    description:
      "High class consonants play an important role in tone reading and help you notice how Thai spelling affects pronunciation.",
  },
  3: {
    badge: "Group 3",
    title: "Low Class I",
    description:
      "This first low class set appears often in everyday Thai and is worth learning early for stronger recognition.",
  },
  4: {
    badge: "Group 4",
    title: "Low Class II",
    description:
      "This second low class set completes the low-class family and makes tone contrasts across consonant classes easier to understand.",
  },
};

export default function AlphabetLesson() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const groupNum = Number(group);
  const groupInfo = GROUP_META[groupNum] ?? GROUP_META[1];
  const letters: AlphabetLetter[] = (alphabet as AlphabetLetter[]).filter(
    (item) => item.group === groupNum,
  );

  function playSound(text: string) {
    Speech.stop();
    Speech.speak(text, { language: "th-TH", rate: 0.82 });
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title={groupInfo.title} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.eyebrow}>{groupInfo.badge}</Text>
            <View style={styles.countPill}>
              <Text style={styles.countValue}>{letters.length}</Text>
              <Text style={styles.countLabel}>letters</Text>
            </View>
          </View>

          <Text style={styles.summaryTitle}>{groupInfo.title}</Text>
          <Text style={styles.summarySubtitle}>{groupInfo.description}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/alphabet/practice/[group]",
                params: { group },
              } as any)
            }
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Start practice</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tap any card to hear the letter name.</Text>
          <Text style={styles.sectionSubtitle}>
            Use this set to connect the letter, its Thai name, and a simple
            example before you move into practice.
          </Text>
        </View>

        <View style={styles.grid}>
          {letters.map((letter) => (
            <TouchableOpacity
              key={letter.letter}
              style={styles.letterCard}
              onPress={() => playSound(letter.name)}
              activeOpacity={0.85}
            >
              <View style={styles.letterCardTop}>
                <View style={styles.soundBadge}>
                  <Text style={styles.soundBadgeText}>
                    {letter.sound.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.speakerButton}>
                  <Ionicons
                    name="volume-medium-outline"
                    size={16}
                    color={Sketch.ink}
                  />
                </View>
              </View>

              <Text style={styles.letterGlyph}>{letter.letter}</Text>
              <Text style={styles.letterName}>{letter.name}</Text>
              <Text style={styles.letterRoman}>{letter.romanization}</Text>

              <View style={styles.exampleCard}>
                <Text style={styles.exampleThai}>{letter.example.thai}</Text>
                <Text style={styles.exampleEnglish}>{letter.example.english}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  summaryCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    marginBottom: 16,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: ACCENT,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  countValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  countLabel: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  summaryTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  summarySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Sketch.inkLight,
    marginTop: 8,
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: ACCENT,
    ...sketchShadow(4),
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  sectionHeader: {
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  letterCard: {
    width: "48%",
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 10,
    marginBottom: 12,
    ...sketchShadow(4),
  },
  letterCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  soundBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: ACCENT + "12",
  },
  soundBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: ACCENT,
  },
  speakerButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  letterGlyph: {
    fontSize: 42,
    fontWeight: "700",
    color: Sketch.ink,
  },
  letterName: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
    minHeight: 38,
  },
  letterRoman: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  exampleCard: {
    marginTop: 2,
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  exampleThai: {
    fontSize: 17,
    fontWeight: "600",
    color: Sketch.ink,
  },
  exampleEnglish: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
});
