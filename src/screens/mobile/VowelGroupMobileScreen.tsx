import { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import VowelText from "@/src/components/VowelText";
import { vowels } from "@/src/data/vowels";
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
  }
> = {
  1: {
    badge: "Group 1",
    title: "Before Consonant",
    description: "Patterns written before the consonant.",
  },
  2: {
    badge: "Group 2",
    title: "After Consonant",
    description: "Patterns that sit after the consonant.",
  },
  3: {
    badge: "Group 3",
    title: "Above Consonant",
    description: "Marks you need to spot above the consonant.",
  },
  4: {
    badge: "Group 4",
    title: "Below Consonant",
    description: "Patterns written below the consonant shape.",
  },
  5: {
    badge: "Group 5",
    title: "Around Consonant I",
    description: "Surrounding vowel shapes read as one full pattern.",
  },
  6: {
    badge: "Group 6",
    title: "Around Consonant II",
    description: "More surrounding patterns for longer spellings.",
  },
};

function VowelCard({
  item,
  onPress,
}: {
  item: VowelEntry;
  onPress: () => void;
}) {
  return (
    <SettledPressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.vowelCard,
        pressed ? SURFACE_PRESSED : null,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.soundBadge}>
          <Text style={styles.soundBadgeText}>{item.sound.toUpperCase()}</Text>
        </View>
      </View>

      <VowelText
        example={item.example}
        style={styles.vowelExample}
        vowelColor={BRAND.navy}
        consonantColor={BRAND.ink}
      />

      <Text style={styles.vowelName}>{item.name !== "..." ? item.name : item.symbol}</Text>
      <Text style={styles.vowelSymbol}>{item.symbol}</Text>
    </SettledPressable>
  );
}

export default function VowelGroupMobileScreen() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();

  const groupNum = Number(group);
  const groupInfo = GROUP_META[groupNum] ?? GROUP_META[1];
  const lessonVowels: VowelEntry[] = useMemo(
    () => (vowels as VowelEntry[]).filter((item) => item.group === groupNum),
    [groupNum],
  );
  const practiceReady = lessonVowels.some(
    (item) => item.sound !== "..." && item.name !== "...",
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
            title="Patterns"
            subtitle="Tap a card to hear the example."
          />
          <ReadingGlyphChip style={styles.countChip}>
            <Text style={styles.countValue}>{lessonVowels.length}</Text>
            <Text style={styles.countLabel}>vowels</Text>
          </ReadingGlyphChip>
        </View>

        <View style={styles.grid}>
          {lessonVowels.map((item, index) => (
            <View
              key={`${item.symbol}-${index}`}
              style={useTwoColumns ? styles.halfCell : styles.fullCell}
            >
              <VowelCard
                item={item}
                onPress={() => void playSentence(item.example, { speed: "slow" })}
              />
            </View>
          ))}
        </View>

        {practiceReady ? (
          <SurfaceButton
            label="Start practice"
            variant="primary"
            onPress={() =>
              router.push({
                pathname: "/vowels/practice/[group]",
                params: { group },
              } as any)
            }
          />
        ) : null}
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
  vowelCard: {
    minHeight: 156,
    backgroundColor: BRAND.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 8,
    justifyContent: "space-between",
    ...SURFACE_SHADOW,
  },
  cardTop: {
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
  vowelExample: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
  },
  vowelName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: BRAND.ink,
  },
  vowelSymbol: {
    fontSize: 13,
    lineHeight: 17,
    color: BRAND.inkSoft,
  },
});
