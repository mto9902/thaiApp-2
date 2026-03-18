import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Sketch, SketchRadius, sketchShadow } from "@/constants/theme";
import Header from "../../src/components/Header";
import { alphabet } from "../../src/data/alphabet";
import {
  CONSONANT_INFO,
  DIFFICULTY_META,
  TrainerDifficulty,
  TrainerWord,
  VOWEL_INFO,
} from "../../src/data/trainerOptions";
import { vowels } from "../../src/data/vowels";
import { MUTED_APP_ACCENTS, withAlpha } from "../../src/utils/toneAccent";
import { generateTrainerBatch } from "../../src/utils/trainerBatch";

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
  onPlaySound,
}: {
  word: TrainerWord;
  onPlaySound: (text: string) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.wordCard}
      onPress={() => onPlaySound(word.thai)}
      activeOpacity={0.88}
    >
      <View style={styles.wordCardHeader}>
        <View style={styles.wordPrimaryCopy}>
          <Text style={styles.wordThai}>{word.thai}</Text>
          {word.romanization ? (
            <Text style={styles.wordRoman}>{word.romanization}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.soundButton}
          onPress={(event) => {
            event.stopPropagation?.();
            onPlaySound(word.thai);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="volume-medium-outline"
            size={16}
            color={Sketch.inkLight}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.wordCardCopy}>
        <Text style={styles.wordEnglish}>{word.english}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TrainerWordsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    difficulty?: string;
    consonantGroups?: string;
    vowelGroups?: string;
  }>();

  const difficultyParam = Array.isArray(params.difficulty)
    ? params.difficulty[0]
    : params.difficulty;
  const consonantGroupsParam = Array.isArray(params.consonantGroups)
    ? params.consonantGroups[0]
    : params.consonantGroups;
  const vowelGroupsParam = Array.isArray(params.vowelGroups)
    ? params.vowelGroups[0]
    : params.vowelGroups;

  const difficulty = parseDifficulty(difficultyParam);
  const consonantGroups = parseIdList(consonantGroupsParam);
  const vowelGroups = parseIdList(vowelGroupsParam);

  const [words, setWords] = useState<TrainerWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const footerSafeSpace = Math.max(insets.bottom, 14);

  const selectedConsonantCount = alphabet.filter((item) =>
    consonantGroups.includes(item.group),
  ).length;
  const selectedVowelCount = vowels.filter((item) =>
    vowelGroups.includes(item.group),
  ).length;
  const consonantLabels = CONSONANT_INFO.filter((item) =>
    consonantGroups.includes(item.id),
  ).map((item) => item.title);
  const vowelLabels = VOWEL_INFO.filter((item) =>
    vowelGroups.includes(item.id),
  ).map((item) => item.title);

  const loadWords = useCallback(async () => {
    try {
      setLoading(true);
      setNoResults(false);

      const result = await generateTrainerBatch({
        difficulty,
        consonantGroups: parseIdList(consonantGroupsParam),
        vowelGroups: parseIdList(vowelGroupsParam),
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
  }, [consonantGroupsParam, difficulty, vowelGroupsParam]);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  function speakThai(text: string) {
    const rate = ttsSpeed === "fast" ? 1.3 : ttsSpeed === "normal" ? 1.0 : 0.7;
    Speech.stop();
    Speech.speak(text, {
      language: "th-TH",
      pitch: 1,
      rate,
    });
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Practice Words"
        onBack={() => router.back()}
        showBrandMark={false}
        onSettingsChange={(settings) => setTtsSpeed(settings.ttsSpeed)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 110 + footerSafeSpace },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageIntro}>
          <View style={styles.pageIntroTop}>
            <Text style={styles.pageTitle}>Practice These Words</Text>
            <View
              style={styles.difficultyBadge}
            >
              <Text
                style={styles.difficultyBadgeText}
              >
                {DIFFICULTY_META[difficulty].label}
              </Text>
            </View>
          </View>
          <Text style={styles.pageSubtitle}>
            Tap any speaker for audio, then use `More Words` to refresh this
            batch with the same setup.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text
              style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.clay }]}
            >
              {selectedConsonantCount}
            </Text>
            <Text style={styles.summaryLabel}>letters</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text
              style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.slate }]}
            >
              {selectedVowelCount}
            </Text>
            <Text style={styles.summaryLabel}>vowels</Text>
          </View>
        </View>

        <View style={styles.filterChips}>
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

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={Sketch.orange} />
            <Text style={styles.stateTitle}>Fetching words...</Text>
            <Text style={styles.stateSubtitle}>
              Keeping the same trainer settings and generating a fresh batch.
            </Text>
          </View>
        ) : noResults ? (
          <View style={styles.stateCard}>
            <Ionicons name="search-outline" size={28} color={Sketch.inkMuted} />
            <Text style={styles.stateTitle}>No words found</Text>
            <Text style={styles.stateSubtitle}>
              Try `More Words` once more, or go back and widen the classes or
              vowel groups.
            </Text>
          </View>
        ) : (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Practice Words</Text>
            <Text style={styles.sectionSubtitle}>
              Read through the set, tap for audio, then practice another batch
              whenever you&apos;re ready.
            </Text>
            <View style={styles.resultsGrid}>
              {words.map((word, index) => (
                <WordCard
                  key={`${word.thai}-${index}`}
                  word={word}
                  onPlaySound={speakThai}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footerBar,
          { paddingBottom: footerSafeSpace, paddingTop: 10 },
        ]}
      >
        <TouchableOpacity
          style={styles.moreWordsButton}
          onPress={() => void loadWords()}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.moreWordsText}>More Words</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: 4,
    gap: 14,
  },
  pageIntro: {
    paddingTop: 4,
    gap: 6,
  },
  pageIntroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SketchRadius.badge,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: Sketch.ink,
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkLight,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...sketchShadow(2),
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: Sketch.inkMuted,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: SketchRadius.badge,
    backgroundColor: withAlpha(MUTED_APP_ACCENTS.stone, "0D"),
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkLight,
  },
  stateCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 24,
    alignItems: "center",
    gap: 10,
    ...sketchShadow(2),
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  stateSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: Sketch.inkMuted,
  },
  resultsSection: {
    gap: 8,
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
  resultsGrid: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  wordCard: {
    width: "48%",
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    minHeight: 132,
    gap: 12,
    ...sketchShadow(2),
  },
  wordCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  wordPrimaryCopy: {
    flex: 1,
    gap: 4,
  },
  wordCardCopy: {
    gap: 4,
  },
  wordThai: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    lineHeight: 32,
  },
  wordRoman: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  wordEnglish: {
    fontSize: 13,
    color: Sketch.inkLight,
    lineHeight: 18,
  },
  soundButton: {
    width: 36,
    height: 36,
    borderRadius: SketchRadius.control,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paperDark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  moreWordsButton: {
    minHeight: 54,
    borderRadius: SketchRadius.control,
    backgroundColor: Sketch.orange,
    borderWidth: 1,
    borderColor: Sketch.orangeDark,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  moreWordsText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
