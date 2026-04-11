import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type { SettingsState } from "@/src/components/Header";
import { alphabet } from "@/src/data/alphabet";
import {
  CONSONANT_INFO,
  DIFFICULTY_META,
  type TrainerDifficulty,
  type TrainerWord,
  VOWEL_INFO,
} from "@/src/data/trainerOptions";
import { vowels } from "@/src/data/vowels";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { generateTrainerBatch } from "@/src/utils/trainerBatch";
import {
  BRAND,
  SURFACE_SHADOW,
  SurfaceButton,
  SettledPressable,
  SURFACE_PRESSED,
} from "@/src/screens/mobile/readingSurface";
import {
  ReadingChip,
  ReadingHero,
  ReadingScreenShell,
  ReadingSectionHeading,
  ReadingStatCard,
  ReadingSurfaceCard,
} from "@/src/screens/mobile/readingLayout";

function parseIdList(value?: string | string[]) {
  const source = Array.isArray(value) ? value[0] : value;
  if (!source) return [];

  return source
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function parseDifficulty(value?: string | string[]): TrainerDifficulty {
  const source = Array.isArray(value) ? value[0] : value;
  if (source === "easy" || source === "medium" || source === "hard") {
    return source;
  }
  return "easy";
}

function WordCard({
  word,
  onPlay,
}: {
  word: TrainerWord;
  onPlay: () => void;
}) {
  return (
    <SettledPressable
      onPress={onPlay}
      style={({ pressed }: { pressed: boolean }) => [
        styles.wordCard,
        pressed ? SURFACE_PRESSED : null,
      ]}
    >
      <View style={styles.wordCardHeader}>
        <View style={styles.wordPrimaryCopy}>
          <Text style={styles.wordThai}>{word.thai}</Text>
          {word.romanization ? (
            <Text style={styles.wordRoman}>{word.romanization}</Text>
          ) : null}
        </View>
        <View style={styles.audioBadge}>
          <Ionicons name="volume-medium-outline" size={18} color={BRAND.ink} />
        </View>
      </View>
      <Text style={styles.wordEnglish} numberOfLines={2}>
        {word.english}
      </Text>
    </SettledPressable>
  );
}

export default function TrainerWordsMobileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    difficulty?: string;
    consonantGroups?: string;
    vowelGroups?: string;
  }>();
  const { playSentence } = useSentenceAudio();

  const difficultyParam = Array.isArray(params.difficulty)
    ? params.difficulty[0]
    : params.difficulty;
  const consonantGroupsParam = Array.isArray(params.consonantGroups)
    ? params.consonantGroups[0]
    : params.consonantGroups;
  const vowelGroupsParam = Array.isArray(params.vowelGroups)
    ? params.vowelGroups[0]
    : params.vowelGroups;

  const difficulty = useMemo(
    () => parseDifficulty(difficultyParam),
    [difficultyParam],
  );
  const consonantGroups = useMemo(
    () => parseIdList(consonantGroupsParam),
    [consonantGroupsParam],
  );
  const vowelGroups = useMemo(
    () => parseIdList(vowelGroupsParam),
    [vowelGroupsParam],
  );

  const [words, setWords] = useState<TrainerWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const singleColumn = width < 355;

  const selectedConsonantCount = alphabet.filter((item) =>
    consonantGroups.includes(item.group),
  ).length;
  const selectedVowelCount = vowels.filter((item) =>
    vowelGroups.includes(item.group),
  ).length;
  const consonantLabels = useMemo(
    () =>
      CONSONANT_INFO.filter((item) => consonantGroups.includes(item.id)).map(
        (item) => item.title,
      ),
    [consonantGroups],
  );
  const vowelLabels = useMemo(
    () =>
      VOWEL_INFO.filter((item) => vowelGroups.includes(item.id)).map(
        (item) => item.title,
      ),
    [vowelGroups],
  );

  const loadWords = useCallback(async () => {
    if (consonantGroups.length === 0 || vowelGroups.length === 0) {
      setWords([]);
      setNoResults(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNoResults(false);

      const result = await generateTrainerBatch({
        difficulty,
        consonantGroups,
        vowelGroups,
      });

      setWords(result.words);
      setNoResults(result.noResults);
    } catch (err) {
      console.error("Trainer words error:", err);
      setWords([]);
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  }, [consonantGroups, difficulty, vowelGroups]);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  function handleSettingsChange(settings: SettingsState) {
    setTtsSpeed(settings.ttsSpeed);
  }

  return (
    <ReadingScreenShell
      title="Practice Words"
      onBack={() => router.back()}
      showSettings
      onSettingsChange={handleSettingsChange}
    >
      <ReadingHero
        eyebrow="Trainer"
        title="Practice words"
        subtitle="Tap any word for audio, then refresh the batch with the same filters whenever you want."
      />

      <View style={styles.statRow}>
        <ReadingStatCard value={selectedConsonantCount} label="letters" />
        <ReadingStatCard value={selectedVowelCount} label="vowels" />
        <ReadingStatCard value={DIFFICULTY_META[difficulty].label} label="difficulty" />
      </View>

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Current filters"
          subtitle="These groups are feeding the current trainer batch."
        />
        <View style={styles.filterWrap}>
          {consonantLabels.map((label) => (
            <ReadingChip key={label} label={label} />
          ))}
          {vowelLabels.map((label) => (
            <ReadingChip key={label} label={label} />
          ))}
        </View>
      </ReadingSurfaceCard>

      <ReadingSurfaceCard>
        <ReadingSectionHeading title="Word batch" />

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={BRAND.inkSoft} />
            <Text style={styles.stateTitle}>Fetching words...</Text>
            <Text style={styles.stateSubtitle}>
              Keeping the same trainer settings and generating a fresh batch.
            </Text>
          </View>
        ) : noResults ? (
          <View style={styles.stateCard}>
            <Ionicons name="search-outline" size={26} color={BRAND.inkSoft} />
            <Text style={styles.stateTitle}>No words found</Text>
            <Text style={styles.stateSubtitle}>
              Try a wider consonant or vowel selection and generate again.
            </Text>
          </View>
        ) : (
          <View style={styles.wordGrid}>
            {words.map((word, index) => (
              <View
                key={`${word.thai}-${index}`}
                style={singleColumn ? styles.fullCell : styles.halfCell}
              >
                <WordCard
                  word={word}
                  onPlay={() => void playSentence(word.thai, { speed: ttsSpeed })}
                />
              </View>
            ))}
          </View>
        )}
      </ReadingSurfaceCard>

      <SurfaceButton
        label={loading ? "Refreshing..." : "More Words"}
        variant="primary"
        onPress={() => void loadWords()}
        disabled={loading}
      />
    </ReadingScreenShell>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stateCard: {
    minHeight: 156,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    ...SURFACE_SHADOW,
  },
  stateTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    color: BRAND.ink,
    textAlign: "center",
  },
  stateSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.inkSoft,
    textAlign: "center",
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fullCell: {
    width: "100%",
  },
  halfCell: {
    width: "48%",
  },
  wordCard: {
    minHeight: 98,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 12,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  wordCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  wordPrimaryCopy: {
    flex: 1,
    gap: 2,
  },
  wordThai: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
  },
  wordRoman: {
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.inkSoft,
  },
  wordEnglish: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.body,
  },
  audioBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    ...SURFACE_SHADOW,
  },
});
