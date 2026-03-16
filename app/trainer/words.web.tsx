import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { alphabet } from "@/src/data/alphabet";
import {
  CONSONANT_INFO,
  DIFFICULTY_META,
  TrainerDifficulty,
  TrainerWord,
  VOWEL_INFO,
} from "@/src/data/trainerOptions";
import { vowels } from "@/src/data/vowels";
import { MUTED_APP_ACCENTS } from "@/src/utils/toneAccent";
import { generateTrainerBatch } from "@/src/utils/trainerBatch";

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
  if (source === "easy" || source === "medium" || source === "hard") return source;
  return "easy";
}

export default function TrainerWordsWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();
  const params = useLocalSearchParams<{
    difficulty?: string;
    consonantGroups?: string;
    vowelGroups?: string;
  }>();

  const difficulty = parseDifficulty(params.difficulty);
  const consonantGroups = parseIdList(params.consonantGroups);
  const vowelGroups = parseIdList(params.vowelGroups);

  const [words, setWords] = useState<TrainerWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);

  const columns = width >= 1480 ? 4 : width >= 1180 ? 3 : width >= 860 ? 2 : 1;
  const cardWidth =
    columns === 4 ? "23.6%" : columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Trainer"
        title="Practice words"
        subtitle="Practice a focused reading batch with your current difficulty and sound filters."
        toolbar={
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} activeOpacity={0.82}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={() => void loadWords()} activeOpacity={0.82}>
              <Ionicons name="refresh-outline" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>More words</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View style={styles.pageStack}>
          <View style={styles.summaryStrip}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.clay }]}>
                {selectedConsonantCount}
              </Text>
              <Text style={styles.summaryLabel}>letters</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.slate }]}>
                {selectedVowelCount}
              </Text>
              <Text style={styles.summaryLabel}>vowels</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{DIFFICULTY_META[difficulty].label}</Text>
              <Text style={styles.summaryLabel}>difficulty</Text>
            </View>
          </View>

          <DesktopPanel>
            <DesktopSectionTitle
              title="Current filters"
              caption="These are the consonant and vowel groups feeding the generated word batch."
            />
            <View style={styles.filterWrap}>
              {consonantLabels.map((label) => (
                <View key={label} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{label}</Text>
                </View>
              ))}
              {vowelLabels.map((label) => (
                <View key={label} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{label}</Text>
                </View>
              ))}
            </View>
          </DesktopPanel>

          <DesktopPanel>
            <DesktopSectionTitle
              title="Word batch"
              caption="Tap a card or the speaker to hear the Thai. Refresh the batch while keeping the same setup."
            />
            {loading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={Sketch.inkMuted} />
              </View>
            ) : noResults ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No words found</Text>
                <Text style={styles.stateSubtitle}>
                  Try a wider consonant or vowel selection and generate again.
                </Text>
              </View>
            ) : (
              <View style={styles.wordGrid}>
                {words.map((word, index) => (
                  <TouchableOpacity
                    key={`${word.thai}-${index}`}
                    style={[styles.wordCard, { width: cardWidth }]}
                    onPress={() => void playSentence(word.thai, { speed: "slow" })}
                    activeOpacity={0.82}
                  >
                    <View style={styles.wordCardHeader}>
                      <View style={styles.wordPrimaryCopy}>
                        <Text style={styles.wordThai}>{word.thai}</Text>
                        {word.romanization ? (
                          <Text style={styles.wordRoman}>{word.romanization}</Text>
                        ) : null}
                      </View>
                      <Ionicons name="volume-medium-outline" size={18} color={Sketch.inkMuted} />
                    </View>
                    <Text style={styles.wordEnglish}>{word.english}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </DesktopPanel>
        </View>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 28,
  },
  toolbar: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
  summaryStrip: {
    flexDirection: "row",
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 18,
    gap: 4,
  },
  summaryValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  stateCard: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  stateSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
    textAlign: "center",
    maxWidth: 420,
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  wordCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
    gap: 10,
  },
  wordCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  wordPrimaryCopy: {
    flex: 1,
    gap: 4,
  },
  wordThai: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  wordRoman: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  wordEnglish: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
});
