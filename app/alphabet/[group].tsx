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
import { alphabet } from "../../src/data/alphabet";

type AlphabetLetter = {
  letter: string;
  name: string;
  romanization: string;
  sound: string;
  example: { thai: string; romanization: string; english: string };
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
    title: "Mid Class",
    description:
      "Core consonants with balanced tone behavior. Learn the shape, name, and base sound together.",
    accent: Sketch.yellow,
    icon: "sparkles-outline",
  },
  2: {
    badge: "Group 2",
    title: "High Class",
    description:
      "Sharp, high-class consonants that show up often in tone patterns and spelling rules.",
    accent: Sketch.blue,
    icon: "flash-outline",
  },
  3: {
    badge: "Group 3",
    title: "Low Class I",
    description:
      "The first low-class set. Focus on recognition first, then use practice mode to lock in the sounds.",
    accent: Sketch.red,
    icon: "layers-outline",
  },
  4: {
    badge: "Group 4",
    title: "Low Class II",
    description:
      "The second low-class set. This group is bigger, so the card grid is tuned for quick scanning on mobile.",
    accent: Sketch.green,
    icon: "grid-outline",
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
              label="Letters"
              value={String(letters.length)}
              accent={groupInfo.accent}
            />
            <StatPill label="Practice" value="3 modes" accent={Sketch.orange} />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: groupInfo.accent, borderColor: groupInfo.accent },
            ]}
            onPress={() =>
              router.push({
                pathname: "/alphabet/practice/[group]",
                params: { group },
              } as any)
            }
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>Start practice</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tap any card to hear the letter name.</Text>
          <Text style={styles.sectionSubtitle}>
            Each card keeps the sound and a quick example visible so it is easier
            to scan on a phone.
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
                <View
                  style={[
                    styles.soundBadge,
                    { backgroundColor: `${groupInfo.accent}12` },
                  ]}
                >
                  <Text
                    style={[styles.soundBadgeText, { color: groupInfo.accent }]}
                  >
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
  letterCard: {
    width: "48%",
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 10,
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
