import { useState, type ReactNode } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import { alphabet } from "@/src/data/alphabet";
import {
  CONSONANT_INFO,
  DIFFICULTY_META,
  type TrainerDifficulty,
  VOWEL_INFO,
} from "@/src/data/trainerOptions";
import { vowels } from "@/src/data/vowels";
import {
  BRAND,
  SURFACE_SHADOW,
  SURFACE_PRESSED,
  SurfaceButton,
  SettledPressable,
} from "@/src/screens/mobile/readingSurface";
import {
  ReadingGlyphChip,
  ReadingHero,
  ReadingScreenShell,
  ReadingSectionHeading,
  ReadingStatCard,
  ReadingSurfaceCard,
} from "@/src/screens/mobile/readingLayout";

function SelectionCard({
  title,
  subtitle,
  meta,
  active,
  onPress,
  compact = false,
  children,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <SettledPressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.selectionCard,
        compact ? styles.selectionCardCompact : null,
        active ? styles.selectionCardActive : null,
        pressed ? SURFACE_PRESSED : null,
      ]}
    >
      <View style={styles.selectionHeaderRow}>
        <View style={styles.selectionCopy}>
          <Text style={styles.selectionTitle}>{title}</Text>
          <Text style={styles.selectionSubtitle}>{subtitle}</Text>
        </View>
        {meta ? <Text style={styles.selectionMeta}>{meta}</Text> : null}
      </View>
      {children ? <View style={styles.selectionPreview}>{children}</View> : null}
    </SettledPressable>
  );
}

export default function AlphabetTrainerMobileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [difficulty, setDifficulty] = useState<TrainerDifficulty>("easy");
  const [consonantGroupsSelected, setConsonantGroupsSelected] = useState<number[]>([1]);
  const [vowelGroupsSelected, setVowelGroupsSelected] = useState<number[]>([1]);

  const gridSingle = width < 340;
  const statsSingle = width < 360;

  function toggleSelection(
    value: number,
    list: number[],
    setList: (next: number[]) => void,
  ) {
    setList(
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  }

  const consonantCount = alphabet.filter((item) =>
    consonantGroupsSelected.includes(item.group),
  ).length;
  const vowelCount = vowels.filter((item) =>
    vowelGroupsSelected.includes(item.group),
  ).length;
  const isValid =
    consonantGroupsSelected.length > 0 && vowelGroupsSelected.length > 0;

  return (
    <ReadingScreenShell title="Alphabet Trainer" onBack={() => router.back()}>
      <ReadingHero
        eyebrow="Trainer"
        title="Alphabet trainer"
        subtitle="Pick the letters, vowel groups, and difficulty you want, then generate a focused reading batch."
      />

      <View style={[styles.statRow, statsSingle ? styles.statRowStacked : null]}>
        <ReadingStatCard value={consonantCount} label="letters" />
        <ReadingStatCard value={vowelCount} label="vowels" />
        <ReadingStatCard value={DIFFICULTY_META[difficulty].label} label="difficulty" />
      </View>

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Difficulty"
          subtitle="Choose how simple or tricky the word batch should feel."
        />
        <View style={styles.difficultyGrid}>
          {(Object.keys(DIFFICULTY_META) as TrainerDifficulty[]).map((level) => (
            <View key={level} style={styles.thirdCell}>
              <SelectionCard
                title={DIFFICULTY_META[level].label}
                subtitle={
                  level === "easy"
                    ? "Short + clear"
                    : level === "medium"
                      ? "Mixed length"
                      : "Trickier forms"
                }
                compact
                active={difficulty === level}
                onPress={() => setDifficulty(level)}
              />
            </View>
          ))}
        </View>
      </ReadingSurfaceCard>

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Consonant classes"
          subtitle="Tap the classes you want in this batch."
        />
        <View style={styles.selectionGrid}>
          {CONSONANT_INFO.map((item) => {
            const allLetters = alphabet.filter((entry) => entry.group === item.id);
            const previewLetters = allLetters.slice(0, 2);
            const overflowCount = Math.max(0, allLetters.length - previewLetters.length);

            return (
              <View key={item.id} style={gridSingle ? styles.fullCell : styles.halfCell}>
                <SelectionCard
                  title={item.title}
                  subtitle={`${allLetters.length} letters`}
                  meta={consonantGroupsSelected.includes(item.id) ? "On" : "Off"}
                  compact
                  active={consonantGroupsSelected.includes(item.id)}
                  onPress={() =>
                    toggleSelection(
                      item.id,
                      consonantGroupsSelected,
                      setConsonantGroupsSelected,
                    )
                  }
                >
                  <View style={styles.glyphRow}>
                    {previewLetters.map((entry) => (
                      <ReadingGlyphChip key={entry.letter} style={styles.smallGlyphChip}>
                        <Text style={styles.glyphText}>{entry.letter}</Text>
                      </ReadingGlyphChip>
                    ))}
                    {overflowCount > 0 ? (
                      <ReadingGlyphChip style={styles.smallGlyphChip}>
                        <Text style={styles.moreGlyphText}>{`+${overflowCount}`}</Text>
                      </ReadingGlyphChip>
                    ) : null}
                  </View>
                </SelectionCard>
              </View>
            );
          })}
        </View>
      </ReadingSurfaceCard>

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Vowel groups"
          subtitle="Tap the vowel placements you want to include."
        />
        <View style={styles.selectionGrid}>
          {VOWEL_INFO.map((item) => {
            const allPatterns = vowels.filter((entry) => entry.group === item.id);
            const previewPatterns = allPatterns.slice(0, 2);
            const overflowCount = Math.max(0, allPatterns.length - previewPatterns.length);

            return (
              <View key={item.id} style={gridSingle ? styles.fullCell : styles.halfCell}>
                <SelectionCard
                  title={item.title}
                  subtitle={`${allPatterns.length} patterns`}
                  meta={vowelGroupsSelected.includes(item.id) ? "On" : "Off"}
                  compact
                  active={vowelGroupsSelected.includes(item.id)}
                  onPress={() =>
                    toggleSelection(
                      item.id,
                      vowelGroupsSelected,
                      setVowelGroupsSelected,
                    )
                  }
                >
                  <View style={styles.patternPreviewRow}>
                    {previewPatterns.map((entry) => (
                      <ReadingGlyphChip key={`${item.id}-${entry.example}`} style={styles.smallGlyphChip}>
                        <Text style={styles.patternGlyphText}>{entry.example}</Text>
                      </ReadingGlyphChip>
                    ))}
                    {overflowCount > 0 ? (
                      <ReadingGlyphChip style={styles.smallGlyphChip}>
                        <Text style={styles.moreGlyphText}>{`+${overflowCount}`}</Text>
                      </ReadingGlyphChip>
                    ) : null}
                  </View>
                </SelectionCard>
              </View>
            );
          })}
        </View>
      </ReadingSurfaceCard>

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Ready to generate"
          subtitle="Your current trainer setup is below."
        />

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Difficulty</Text>
            <Text style={styles.summaryValue}>{DIFFICULTY_META[difficulty].label}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Classes</Text>
            <Text style={styles.summaryValue}>{consonantGroupsSelected.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Vowels</Text>
            <Text style={styles.summaryValue}>{vowelGroupsSelected.length}</Text>
          </View>
        </View>

        {!isValid ? (
          <Text style={styles.validationText}>
            Select at least one consonant class and one vowel group.
          </Text>
        ) : null}

        <SurfaceButton
          label="Create Words"
          variant="primary"
          onPress={() =>
            router.push({
              pathname: "/trainer/words",
              params: {
                difficulty,
                consonantGroups: consonantGroupsSelected.join(","),
                vowelGroups: vowelGroupsSelected.join(","),
              },
            } as any)
          }
          disabled={!isValid}
        />
      </ReadingSurfaceCard>
    </ReadingScreenShell>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: "row",
    gap: 8,
  },
  statRowStacked: {
    flexDirection: "column",
  },
  difficultyGrid: {
    flexDirection: "row",
    gap: 8,
  },
  selectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  thirdCell: {
    flex: 1,
    minWidth: 0,
  },
  fullCell: {
    width: "100%",
  },
  halfCell: {
    width: "48%",
  },
  selectionCard: {
    minHeight: 84,
    backgroundColor: BRAND.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 12,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  selectionCardCompact: {
    minHeight: 70,
    padding: 12,
    gap: 6,
  },
  selectionCardActive: {
    borderColor: BRAND.navy,
    borderWidth: 2,
    backgroundColor: BRAND.paper,
  },
  selectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  selectionCopy: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  selectionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: BRAND.ink,
  },
  selectionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: BRAND.inkSoft,
  },
  selectionMeta: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "800",
    color: BRAND.inkSoft,
  },
  selectionPreview: {
    gap: 4,
  },
  glyphRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  smallGlyphChip: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  glyphText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "800",
    color: BRAND.ink,
  },
  moreGlyphText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: BRAND.inkSoft,
  },
  patternPreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  patternGlyphText: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "800",
    color: BRAND.ink,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  summaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  validationText: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
});
