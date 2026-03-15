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
import VowelText from "../../src/components/VowelText";
import { vowels } from "../../src/data/vowels";

type VowelEntry = {
  symbol: string;
  example: string;
  name: string;
  sound: string;
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
    title: "Before Consonant",
    description:
      "These vowels appear in front of the consonant shape, even when the sound unfolds after it.",
  },
  2: {
    badge: "Group 2",
    title: "After Consonant",
    description:
      "Start with the cleanest patterns first. This group is ideal for quick sound mapping practice.",
  },
  3: {
    badge: "Group 3",
    title: "Above Consonant",
    description:
      "Compact vowel marks that sit above the consonant. The cards stay roomy so the marks remain legible.",
  },
  4: {
    badge: "Group 4",
    title: "Below Consonant",
    description:
      "Below-consonant vowels are small but important. Use the larger previews here before jumping into drills.",
  },
  5: {
    badge: "Group 5",
    title: "Around Consonant I",
    description:
      "These patterns wrap the consonant from more than one side, so this screen focuses on visual pattern recognition.",
  },
  6: {
    badge: "Group 6",
    title: "Around Consonant II",
    description:
      "Longer surrounding patterns with more moving parts. The larger cards help each component stay readable.",
  },
};

export default function VowelLesson() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const groupNum = Number(group);
  const groupInfo = GROUP_META[groupNum] ?? GROUP_META[1];
  const lessonVowels = (vowels as VowelEntry[]).filter(
    (item) => item.group === groupNum,
  );
  const practiceReady = lessonVowels.some(
    (item) => item.sound !== "..." && item.name !== "...",
  );

  function speak(text: string) {
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
              <Text style={styles.countValue}>{lessonVowels.length}</Text>
              <Text style={styles.countLabel}>vowels</Text>
            </View>
          </View>

          <Text style={styles.summaryTitle}>{groupInfo.title}</Text>
          <Text style={styles.summarySubtitle}>{groupInfo.description}</Text>

          {practiceReady ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: "/vowels/practice/[group]",
                  params: { group },
                } as any)
              }
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Start practice</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tap a card to hear the vowel.</Text>
          <Text style={styles.sectionSubtitle}>
            The example is large and color-coded so the vowel pattern is easier
            to spot at a glance.
          </Text>
        </View>

        <View style={styles.grid}>
          {lessonVowels.map((vowel, index) => (
            <TouchableOpacity
              key={`${vowel.symbol}-${index}`}
              style={styles.vowelCard}
              onPress={() => speak(vowel.example)}
              activeOpacity={0.85}
            >
              <View style={styles.vowelCardTop}>
                <View style={styles.soundBadge}>
                  <Text style={styles.soundBadgeText}>
                    {vowel.sound.toUpperCase()}
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

              <VowelText
                example={vowel.example}
                style={styles.vowelExample}
                vowelColor={ACCENT}
                consonantColor={Sketch.inkLight}
              />

              <Text style={styles.vowelName}>
                {vowel.name !== "..." ? vowel.name : vowel.symbol}
              </Text>
              <Text style={styles.vowelSymbol}>{vowel.symbol}</Text>
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
  vowelCard: {
    width: "48%",
    minHeight: 190,
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 10,
    marginBottom: 12,
    ...sketchShadow(4),
  },
  vowelCardTop: {
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
  vowelExample: {
    fontSize: 34,
    fontWeight: "700",
    color: Sketch.ink,
    lineHeight: 40,
  },
  vowelName: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
    minHeight: 38,
  },
  vowelSymbol: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
});
