import { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { alphabet } from "@/src/data/alphabet";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import {
  BRAND,
  SURFACE_SHADOW,
  SurfaceButton,
  SettledPressable,
  SURFACE_PRESSED,
} from "@/src/screens/mobile/readingSurface";
import {
  ReadingGlyphChip,
  ReadingHero,
  ReadingScreenShell,
  ReadingSectionHeading,
  ReadingSurfaceCard,
} from "@/src/screens/mobile/readingLayout";

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
  }
> = {
  1: {
    badge: "Group 1",
    title: "Mid Class",
    description: "Core baseline letters for Thai tone reading.",
  },
  2: {
    badge: "Group 2",
    title: "High Class",
    description: "Useful for noticing how spelling changes tone behavior.",
  },
  3: {
    badge: "Group 3",
    title: "Low Class I",
    description: "A common low-class set that appears often in daily Thai.",
  },
  4: {
    badge: "Group 4",
    title: "Low Class II",
    description: "Rounds out the low-class family and class contrasts.",
  },
};

function LetterCard({
  letter,
  onPress,
}: {
  letter: AlphabetLetter;
  onPress: () => void;
}) {
  return (
    <SettledPressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.letterCard,
        pressed ? SURFACE_PRESSED : null,
      ]}
    >
      <View style={styles.letterTop}>
        <View style={styles.soundBadge}>
          <Text style={styles.soundBadgeText}>{letter.sound.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.letterGlyph}>{letter.letter}</Text>
      <Text style={styles.letterName}>{letter.name}</Text>
      <Text style={styles.letterRoman}>{letter.romanization}</Text>

      <View style={styles.exampleWrap}>
        <Text style={styles.exampleThai}>{letter.example.thai}</Text>
        <Text style={styles.exampleEnglish}>{letter.example.english}</Text>
      </View>
    </SettledPressable>
  );
}

export default function AlphabetGroupMobileScreen() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();

  const groupNum = Number(group);
  const groupInfo = GROUP_META[groupNum] ?? GROUP_META[1];
  const letters: AlphabetLetter[] = useMemo(
    () => (alphabet as AlphabetLetter[]).filter((item) => item.group === groupNum),
    [groupNum],
  );
  const useTwoColumns = width >= 385;

  return (
    <ReadingScreenShell title={groupInfo.title} onBack={() => router.back()}>
      <ReadingHero
        eyebrow={groupInfo.badge}
        title={groupInfo.title}
        subtitle={groupInfo.description}
      />

      <ReadingSurfaceCard>
        <View style={styles.summaryRow}>
          <ReadingSectionHeading
            title="Letters"
            subtitle="Tap a card to hear the Thai name."
          />
          <ReadingGlyphChip style={styles.countChip}>
            <Text style={styles.countValue}>{letters.length}</Text>
            <Text style={styles.countLabel}>letters</Text>
          </ReadingGlyphChip>
        </View>

        <View style={styles.grid}>
          {letters.map((letter) => (
            <View
              key={letter.letter}
              style={useTwoColumns ? styles.halfCell : styles.fullCell}
            >
              <LetterCard
                letter={letter}
                onPress={() => void playSentence(letter.name, { speed: "slow" })}
              />
            </View>
          ))}
        </View>

        <SurfaceButton
          label="Start practice"
          variant="primary"
          onPress={() =>
            router.push({
              pathname: "/alphabet/practice/[group]",
              params: { group },
            } as any)
          }
        />
      </ReadingSurfaceCard>
    </ReadingScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  countChip: {
    minWidth: 78,
    minHeight: 62,
    gap: 2,
    ...SURFACE_SHADOW,
  },
  countValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  countLabel: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: BRAND.inkSoft,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  fullCell: {
    width: "100%",
  },
  halfCell: {
    width: "47.3%",
  },
  letterCard: {
    minHeight: 164,
    backgroundColor: BRAND.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  letterTop: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  soundBadge: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  soundBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    fontWeight: "800",
    color: BRAND.inkSoft,
  },
  letterGlyph: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    color: BRAND.ink,
  },
  letterName: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    color: BRAND.ink,
  },
  letterRoman: {
    fontSize: 13,
    lineHeight: 17,
    color: BRAND.inkSoft,
  },
  exampleWrap: {
    marginTop: "auto",
    gap: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
  },
  exampleThai: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "800",
    color: BRAND.ink,
  },
  exampleEnglish: {
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.inkSoft,
  },
});
