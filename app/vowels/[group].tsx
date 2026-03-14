import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const GROUP_META: Record<
  number,
  {
    badge: string;
    title: string;
    description: string;
    accent: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  1: {
    badge: "Group 1",
    title: "Before Consonant",
    description:
      "These vowels appear in front of the consonant shape, even when the sound unfolds after it.",
    accent: Sketch.green,
    icon: "arrow-back-outline",
  },
  2: {
    badge: "Group 2",
    title: "After Consonant",
    description:
      "Start with the cleanest patterns first. This group is ideal for quick sound mapping practice.",
    accent: Sketch.blue,
    icon: "arrow-forward-outline",
  },
  3: {
    badge: "Group 3",
    title: "Above Consonant",
    description:
      "Compact vowel marks that sit above the consonant. The cards keep the layout roomy so the marks stay legible.",
    accent: Sketch.orange,
    icon: "arrow-up-outline",
  },
  4: {
    badge: "Group 4",
    title: "Below Consonant",
    description:
      "Below-consonant vowels are small but important. Use the large previews here before jumping into drills.",
    accent: Sketch.purple,
    icon: "arrow-down-outline",
  },
  5: {
    badge: "Group 5",
    title: "Around Consonant I",
    description:
      "These patterns wrap the consonant from more than one side, so this screen focuses on visual pattern recognition.",
    accent: Sketch.pink,
    icon: "scan-outline",
  },
  6: {
    badge: "Group 6",
    title: "Around Consonant II",
    description:
      "Longer surrounding patterns with more moving parts. The larger cards help each component stay readable.",
    accent: Sketch.red,
    icon: "shapes-outline",
  },
};

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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
      <Header title={groupInfo.title} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroBadge,
                { backgroundColor: `${groupInfo.accent}14` },
              ]}
            >
              <Text style={[styles.heroBadgeText, { color: groupInfo.accent }]}>
                {groupInfo.badge}
              </Text>
            </View>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: `${groupInfo.accent}14` },
              ]}
            >
              <Ionicons
                name={groupInfo.icon}
                size={22}
                color={groupInfo.accent}
              />
            </View>
          </View>

          <Text style={styles.heroTitle}>{groupInfo.title}</Text>
          <Text style={styles.heroSubtitle}>{groupInfo.description}</Text>

          <View style={styles.statsRow}>
            <StatPill
              label="Vowels"
              value={String(lessonVowels.length)}
              accent={groupInfo.accent}
            />
            <StatPill
              label="Practice"
              value={practiceReady ? "Ready" : "Browse"}
              accent={practiceReady ? Sketch.orange : Sketch.inkLight}
            />
          </View>

          {practiceReady ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: groupInfo.accent,
                  borderColor: groupInfo.accent,
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/vowels/practice/[group]",
                  params: { group },
                } as any)
              }
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={16} color="#fff" />
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
                <View
                  style={[
                    styles.soundBadge,
                    { backgroundColor: `${groupInfo.accent}12` },
                  ]}
                >
                  <Text
                    style={[styles.soundBadgeText, { color: groupInfo.accent }]}
                  >
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
                vowelColor={groupInfo.accent}
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
    gap: 16,
  },
  heroCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 14,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Sketch.inkLight,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  sectionHeader: {
    gap: 6,
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
    gap: 12,
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
  },
  soundBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
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
