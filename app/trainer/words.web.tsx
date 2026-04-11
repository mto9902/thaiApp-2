import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import TrainerWordsMobileScreen from "@/src/screens/mobile/TrainerWordsMobileScreen";
import {
  DESKTOP_PAGE_WIDTH,
  MOBILE_WEB_BREAKPOINT,
} from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT,
  WEB_BRAND,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
  WEB_SENTENCE_SHADOW,
} from "@/src/components/web/designSystem";
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
import { generateTrainerBatch } from "@/src/utils/trainerBatch";

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

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

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <TrainerWordsMobileScreen />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopAppShell>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Trainer</Text>
                <Text style={styles.title}>Practice words</Text>
                <Text style={styles.subtitle}>
                  Practice a focused reading batch with your current difficulty and sound
                  filters.
                </Text>
              </View>

              <View style={styles.toolbar}>
                <Pressable
                  onPress={() => router.back()}
                  style={({ hovered, pressed }) => [
                    styles.secondaryButton,
                    (hovered || pressed) && styles.lightButtonActive,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={() => void loadWords()}
                  style={({ hovered, pressed }) => [
                    styles.primaryButton,
                    (hovered || pressed) && styles.primaryButtonActive,
                  ]}
                >
                  <Ionicons name="refresh-outline" size={16} color="#fff" />
                  <Text style={styles.primaryButtonText}>More words</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.summaryStrip}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{selectedConsonantCount}</Text>
                <Text style={styles.summaryLabel}>letters</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{selectedVowelCount}</Text>
                <Text style={styles.summaryLabel}>vowels</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{DIFFICULTY_META[difficulty].label}</Text>
                <Text style={styles.summaryLabel}>difficulty</Text>
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionHeading}>Current filters</Text>
                  <Text style={styles.sectionSubheading}>
                    These are the consonant and vowel groups feeding the generated word
                    batch.
                  </Text>
                </View>
              </View>
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
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionHeading}>Word batch</Text>
                </View>
              </View>

              {loading ? (
                <View style={styles.stateCard}>
                  <ActivityIndicator size="large" color={BRAND.inkSoft} />
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
                    <Pressable
                      key={`${word.thai}-${index}`}
                      onPress={() => void playSentence(word.thai, { speed: "slow" })}
                      style={({ hovered, pressed }) => [
                        styles.wordCard,
                        { width: cardWidth },
                        (hovered || pressed) && styles.wordCardActive,
                      ]}
                    >
                      <View style={styles.wordCardHeader}>
                        <View style={styles.wordPrimaryCopy}>
                          <Text style={styles.wordThai}>{word.thai}</Text>
                          {word.romanization ? (
                            <Text style={styles.wordRoman}>{word.romanization}</Text>
                          ) : null}
                        </View>
                        <Pressable
                          onPress={() => void playSentence(word.thai, { speed: "slow" })}
                          style={({ hovered, pressed }) => [
                            styles.audioButton,
                            (hovered || pressed) && styles.lightButtonActive,
                          ]}
                        >
                          <Ionicons
                            name="volume-medium-outline"
                            size={18}
                            color={BRAND.ink}
                          />
                        </Pressable>
                      </View>
                      <Text style={styles.wordEnglish}>{word.english}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </DesktopAppShell>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  pageContent: {
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  shell: {
    width: "100%",
    maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  title: {
    color: BRAND.ink,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1,
    fontFamily: DISPLAY_FONT,
  },
  subtitle: {
    maxWidth: 760,
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 26,
    fontFamily: BODY_FONT,
  },
  toolbar: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    minHeight: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  secondaryButtonText: {
    color: BRAND.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  primaryButton: {
    minHeight: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D2237",
    backgroundColor: BRAND.navy,
    paddingHorizontal: 16,
    paddingVertical: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  primaryButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: BODY_FONT,
  },
  lightButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: WEB_RADIUS.md,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    padding: 18,
    gap: 4,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  summaryValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.6,
    fontFamily: DISPLAY_FONT,
  },
  summaryLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  surfaceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 24,
    gap: 18,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
  sectionHeading: {
    color: BRAND.ink,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sectionSubheading: {
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: BODY_FONT,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  filterChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  stateCard: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    boxShadow: WEB_CARD_SHADOW as any,
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  stateSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
    textAlign: "center",
    maxWidth: 420,
    fontFamily: BODY_FONT,
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  wordCard: {
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    boxShadow: WEB_SENTENCE_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  wordCardActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: "0 1px 0 0 #d4d4d4, 0 1px 0 0 #d4d4d4, 0 2px 3px rgba(16, 42, 67, 0.04)" as any,
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
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  },
  wordRoman: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  wordEnglish: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  audioButton: {
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
});
