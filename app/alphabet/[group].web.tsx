import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { alphabet } from "@/src/data/alphabet";

type AlphabetLetter = {
  letter: string;
  name: string;
  romanization: string;
  sound: string;
  example: { thai: string; romanization: string; english: string };
  group: number;
};

const GROUP_META: Record<number, { badge: string; title: string; description: string }> = {
  1: {
    badge: "Group 1",
    title: "Mid Class",
    description: "Mid class consonants are the baseline for Thai tone rules and make a good first anchor for reading.",
  },
  2: {
    badge: "Group 2",
    title: "High Class",
    description: "High class consonants help you notice how Thai spelling shapes tone behavior in a very visible way.",
  },
  3: {
    badge: "Group 3",
    title: "Low Class I",
    description: "This first low-class set appears often in everyday Thai and is worth learning as a cluster.",
  },
  4: {
    badge: "Group 4",
    title: "Low Class II",
    description: "This second low-class set rounds out the consonant family and makes class contrasts easier to spot.",
  },
};

function playSound(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.82 });
}

export default function AlphabetGroupWeb() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 1400 ? 4 : width >= 1080 ? 3 : width >= 820 ? 2 : 1;
  const cardWidth =
    columns === 4 ? "23.7%" : columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

  const groupNum = Number(group);
  const groupInfo = GROUP_META[groupNum] ?? GROUP_META[1];
  const letters: AlphabetLetter[] = (alphabet as AlphabetLetter[]).filter(
    (item) => item.group === groupNum,
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow={groupInfo.badge}
        title={groupInfo.title}
        subtitle={groupInfo.description}
        toolbar={
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} activeOpacity={0.82}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: "/alphabet/practice/[group]",
                  params: { group },
                } as any)
              }
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Start practice</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <DesktopPanel>
          <DesktopSectionTitle
            title="Letters"
            caption="Tap any card to hear the Thai letter name before moving into practice."
          />
          <View style={styles.grid}>
            {letters.map((letter) => (
              <TouchableOpacity
                key={letter.letter}
                style={[styles.card, { width: cardWidth }]}
                onPress={() => playSound(letter.name)}
                activeOpacity={0.82}
              >
                <View style={styles.cardTop}>
                  <View style={styles.soundBadge}>
                    <Text style={styles.soundBadgeText}>{letter.sound.toUpperCase()}</Text>
                  </View>
                  <Ionicons name="volume-medium-outline" size={16} color={Sketch.inkMuted} />
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
        </DesktopPanel>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  soundBadge: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  soundBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: 0.8,
  },
  letterGlyph: {
    fontSize: 48,
    fontWeight: "700",
    color: Sketch.ink,
    lineHeight: 54,
  },
  letterName: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  letterRoman: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  exampleCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 12,
    gap: 4,
  },
  exampleThai: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  exampleEnglish: {
    fontSize: 13,
    color: Sketch.inkLight,
  },
});
