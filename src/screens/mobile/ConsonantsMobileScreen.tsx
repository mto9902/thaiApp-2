import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import { alphabet } from "@/src/data/alphabet";
import {
  ReadingGlyphChip,
  ReadingHero,
  ReadingLinkCard,
  ReadingScreenShell,
  ReadingSectionHeading,
  ReadingSurfaceCard,
} from "@/src/screens/mobile/readingLayout";

const GROUPS = [
  {
    group: 1,
    title: "Mid class",
    subtitle: "Stable tone class used in many core spelling patterns.",
  },
  {
    group: 2,
    title: "High class",
    subtitle: "Important for tone rules and many contrast pairs.",
  },
  {
    group: 3,
    title: "Low class I",
    subtitle: "One of the two low-class groups you will see throughout reading practice.",
  },
  {
    group: 4,
    title: "Low class II",
    subtitle: "The second low-class group with its own common letters and patterns.",
  },
];

export default function ConsonantsMobileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const useTwoColumns = width >= 430;

  return (
    <ReadingScreenShell title="Consonants" onBack={() => router.back()}>
      <ReadingHero
        eyebrow="Alphabet"
        title="Consonant classes"
        subtitle="Learn the four Thai consonant classes and open a group for examples and practice."
      />

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Browse groups"
          subtitle="Each class affects tone behavior, so it helps to learn them as separate families."
        />

        <View style={styles.groupGrid}>
          {GROUPS.map((item) => {
            const letters = alphabet.filter((entry) => entry.group === item.group);

            return (
              <View
                key={item.group}
                style={useTwoColumns ? styles.halfCell : styles.fullCell}
              >
                <ReadingLinkCard
                  eyebrow={`Group ${item.group}`}
                  title={item.title}
                  subtitle={item.subtitle}
                  footer={`${letters.length} letters`}
                  actionLabel="Open group"
                  onPress={() => router.push(`/alphabet/${item.group}` as any)}
                >
                  <View style={styles.previewRow}>
                    {letters.slice(0, 6).map((entry) => (
                      <ReadingGlyphChip key={entry.letter}>
                        <Text style={styles.glyphText}>{entry.letter}</Text>
                      </ReadingGlyphChip>
                    ))}
                    {letters.length > 6 ? (
                      <ReadingGlyphChip>
                        <Text style={styles.moreText}>+{letters.length - 6}</Text>
                      </ReadingGlyphChip>
                    ) : null}
                  </View>
                </ReadingLinkCard>
              </View>
            );
          })}
        </View>
      </ReadingSurfaceCard>
    </ReadingScreenShell>
  );
}

const styles = StyleSheet.create({
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  fullCell: {
    width: "100%",
  },
  halfCell: {
    width: "48.5%",
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  glyphText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    color: "#102A43",
  },
  moreText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#486581",
  },
});
