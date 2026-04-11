import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import VowelText from "@/src/components/VowelText";
import { vowels } from "@/src/data/vowels";
import {
  ReadingGlyphChip,
  ReadingHero,
  ReadingLinkCard,
  ReadingScreenShell,
  ReadingSectionHeading,
  ReadingSurfaceCard,
} from "@/src/screens/mobile/readingLayout";

const GROUPS = [
  { group: 1, title: "Before consonant", subtitle: "Placed in front of the consonant body." },
  { group: 2, title: "After consonant", subtitle: "Placed after the consonant body." },
  { group: 3, title: "Above consonant", subtitle: "Placed above the consonant body." },
  { group: 4, title: "Below consonant", subtitle: "Placed below the consonant body." },
  { group: 5, title: "Around consonant I", subtitle: "Wraps around the consonant in a simple pattern." },
  { group: 6, title: "Around consonant II", subtitle: "Uses a wider wrap-around pattern." },
];

export default function VowelsMobileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const useTwoColumns = width >= 430;

  return (
    <ReadingScreenShell title="Thai Vowels" onBack={() => router.back()}>
      <ReadingHero
        eyebrow="Vowels"
        title="Thai vowel placement"
        subtitle="Study vowels by where they sit around a consonant so the spelling patterns feel easier to read."
      />

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Browse groups"
          subtitle="Open a vowel group to study its placement, examples, and practice flow."
        />

        <View style={styles.groupGrid}>
          {GROUPS.map((item) => {
            const groupVowels = vowels.filter((entry) => entry.group === item.group);

            return (
              <View
                key={item.group}
                style={useTwoColumns ? styles.halfCell : styles.fullCell}
              >
                <ReadingLinkCard
                  eyebrow={`Group ${item.group}`}
                  title={item.title}
                  subtitle={item.subtitle}
                  footer={`${groupVowels.length} vowels`}
                  actionLabel="Open group"
                  onPress={() => router.push(`/vowels/${item.group}` as any)}
                >
                  <View style={styles.previewRow}>
                    {groupVowels.slice(0, 5).map((entry, index) => (
                      <ReadingGlyphChip key={`${entry.symbol}-${index}`}>
                        <VowelText
                          example={entry.example}
                          style={styles.previewText}
                          vowelColor="#17324D"
                          consonantColor="#102A43"
                        />
                      </ReadingGlyphChip>
                    ))}
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
  previewText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#102A43",
  },
});
