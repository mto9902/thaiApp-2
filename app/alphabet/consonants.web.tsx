import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { alphabet } from "@/src/data/alphabet";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";

const GROUPS = [
  { group: 1, title: "Mid Class" },
  { group: 2, title: "High Class" },
  { group: 3, title: "Low Class I" },
  { group: 4, title: "Low Class II" },
];

export default function ConsonantsWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();
  const columns = width >= 1320 ? 4 : width >= 980 ? 2 : 1;
  const cardWidth = columns === 4 ? "23.6%" : columns === 2 ? "48.8%" : "100%";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Alphabet"
        title="Consonant classes"
        subtitle="Learn the four consonant classes and open each group for examples and practice."
        toolbar={
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.82}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <DesktopPanel>
          <DesktopSectionTitle
            title="Browse groups"
            caption="Each class affects tone behavior, so it helps to learn them as separate groups."
          />
          <View style={styles.grid}>
            {GROUPS.map((item) => {
              const letters = alphabet.filter((entry) => entry.group === item.group);
              return (
                <TouchableOpacity
                  key={item.group}
                  style={[styles.card, { width: cardWidth }]}
                  onPress={() => router.push(`/alphabet/${item.group}` as any)}
                  activeOpacity={0.82}
                >
                  <TouchableOpacity
                    style={styles.speakerButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      void playSentence(
                        letters.slice(0, 4).map((entry) => entry.letter).join(" "),
                        { speed: "slow" },
                      );
                    }}
                    activeOpacity={0.82}
                  >
                    <Ionicons
                      name="volume-medium-outline"
                      size={16}
                      color={Sketch.inkMuted}
                    />
                  </TouchableOpacity>
                  <Text style={styles.eyebrow}>Group {item.group}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.letterRow}>
                    {letters.slice(0, 8).map((entry) => (
                      <View key={entry.letter} style={styles.letterChip}>
                        <Text style={styles.letterChipText}>{entry.letter}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>{letters.length} letters</Text>
                    <Text style={styles.footerAction}>Open lesson</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </DesktopPanel>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
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
    padding: 18,
    gap: 12,
  },
  speakerButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  letterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  letterChip: {
    minWidth: 44,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  letterChipText: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  footerAction: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
});
