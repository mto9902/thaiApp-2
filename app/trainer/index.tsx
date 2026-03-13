import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
import { generateTrainer } from "../../src/api/generateTrainer";
import Header from "../../src/components/Header";
import { alphabet } from "../../src/data/alphabet";
import { vowels } from "../../src/data/vowels";

const DIFFICULTY_COLORS = {
  easy: Sketch.green,
  medium: Sketch.yellow,
  hard: Sketch.red,
};

const CONSONANT_INFO = [
  { id: 1, title: "Mid Class", color: Sketch.yellow },
  { id: 2, title: "High Class", color: Sketch.blue },
  { id: 3, title: "Low Class I", color: Sketch.red },
  { id: 4, title: "Low Class II", color: Sketch.green },
];

const VOWEL_INFO = [
  { id: 1, title: "Before", description: "เ แ โ", color: Sketch.yellow },
  { id: 2, title: "After", description: "ะ า", color: Sketch.orange },
  { id: 3, title: "Above", description: "ิ ี ึ", color: Sketch.red },
  { id: 4, title: "Below", description: "ุ ู", color: Sketch.blue },
  { id: 5, title: "Around 1", description: "เ◌ะ แ◌", color: Sketch.purple },
  { id: 6, title: "Around 2", description: "เ◌อ เ◌าะ", color: Sketch.green },
];

function DifficultyButton({
  level,
  isSelected,
  onPress,
}: {
  level: "easy" | "medium" | "hard";
  isSelected: boolean;
  onPress: () => void;
}) {
  const bgColor = isSelected ? DIFFICULTY_COLORS[level] : Sketch.cardBg;
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <TouchableOpacity
      style={[styles.diffButton, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.diffButtonText,
          isSelected && styles.diffButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ConsonantCard({
  info,
  isSelected,
  onPress,
}: {
  info: (typeof CONSONANT_INFO)[0];
  isSelected: boolean;
  onPress: () => void;
}) {
  const letters = alphabet.filter((l) => l.group === info.id).slice(0, 4);

  return (
    <TouchableOpacity
      style={[
        styles.consonantCard,
        { backgroundColor: isSelected ? info.color : Sketch.cardBg },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.consonantCardContent}>
        <View style={styles.consonantTextSection}>
          <Text
            style={[
              styles.consonantTitle,
              isSelected && styles.consonantTitleActive,
            ]}
          >
            {info.title}
          </Text>
          <Text
            style={[
              styles.consonantSubtitle,
              isSelected && styles.consonantSubtitleActive,
            ]}
          >
            {letters.length} letters
          </Text>
        </View>
        <View style={styles.letterPreview}>
          {letters.map((l) => (
            <Text key={l.letter} style={styles.previewLetter}>
              {l.letter}
            </Text>
          ))}
        </View>
      </View>
      {isSelected && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark" size={16} color={Sketch.ink} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function VowelCard({
  info,
  isSelected,
  onPress,
}: {
  info: (typeof VOWEL_INFO)[0];
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.vowelCard,
        { backgroundColor: isSelected ? info.color : Sketch.cardBg },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.vowelCardContent}>
        <View style={styles.vowelTextSection}>
          <Text
            style={[styles.vowelTitle, isSelected && styles.vowelTitleActive]}
          >
            {info.title}
          </Text>
          <Text
            style={[
              styles.vowelSubtitle,
              isSelected && styles.vowelSubtitleActive,
            ]}
          >
            Vowels
          </Text>
        </View>
        <Text style={styles.vowelPreview}>{info.description}</Text>
      </View>
      {isSelected && (
        <View style={styles.vowelSelectedBadge}>
          <Ionicons name="checkmark" size={16} color={Sketch.ink} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function TrainerWordCard({ word, onPlaySound }: any) {
  return (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <Text style={styles.wordThai}>{word.thai}</Text>
        <TouchableOpacity
          style={styles.soundButton}
          onPress={() => onPlaySound(word.thai)}
        >
          <Ionicons name="volume-high" size={20} color={Sketch.ink} />
        </TouchableOpacity>
      </View>
      {word.romanization && (
        <Text style={styles.wordRoman}>{word.romanization}</Text>
      )}
      <Text style={styles.wordEnglish}>{word.english}</Text>
    </View>
  );
}

export default function Trainer() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy",
  );
  const [consonantGroupsSelected, setConsonantGroupsSelected] = useState<
    number[]
  >([1]);
  const [vowelGroupsSelected, setVowelGroupsSelected] = useState<number[]>([1]);
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const [noResults, setNoResults] = useState(false);

  const TTS_RATE: Record<string, number> = {
    slow: 0.7,
    normal: 1.0,
    fast: 1.3,
  };
  function speakThai(text: string) {
    Speech.speak(text, {
      language: "th-TH",
      pitch: 1,
      rate: TTS_RATE[ttsSpeed] || 0.7,
    });
  }

  function toggleSelection(
    value: number,
    list: number[],
    setList: (v: number[]) => void,
  ) {
    if (list.includes(value)) {
      setList(list.filter((v) => v !== value));
    } else {
      setList([...list, value]);
    }
  }

  async function generateWords() {
    setNoResults(false);
    setWords([]);

    const TARGET_WORDS = 10;

    const consonants = [
      ...new Set(
        alphabet
          .filter((c) => consonantGroupsSelected.includes(c.group))
          .map((c) => c.letter),
      ),
    ];

    const allowedConsonants = new Set(consonants);
    const consonantSet = new Set(alphabet.map((a) => a.letter));

    function wordUsesOnlyAllowedConsonants(word: string) {
      for (const char of word) {
        if (consonantSet.has(char) && !allowedConsonants.has(char)) {
          return false;
        }
      }
      return true;
    }

    const selectedVowels = [
      ...new Set(
        vowels
          .filter((v) => vowelGroupsSelected.includes(v.group))
          .map((v) => v.symbol.replace("◌", "")),
      ),
    ];

    try {
      setLoading(true);

      let collected: any[] = [];
      let attempts = 0;

      while (collected.length < TARGET_WORDS && attempts < 5) {
        attempts++;

        const result = await generateTrainer(
          consonants,
          selectedVowels,
          difficulty,
        );

        const filtered = (result.words || []).filter((w: any) =>
          wordUsesOnlyAllowedConsonants(w.thai),
        );

        collected = [...collected, ...filtered];
      }

      // decide what to show
      if (collected.length === 0) {
        setNoResults(true);
      } else {
        setWords(collected.slice(0, TARGET_WORDS));
      }
    } catch (err) {
      console.error("Trainer error:", err);
    } finally {
      setLoading(false);
    }
  }

  const isValid =
    consonantGroupsSelected.length > 0 && vowelGroupsSelected.length > 0;
  const consonantCount = alphabet.filter((c) =>
    consonantGroupsSelected.includes(c.group),
  ).length;
  const vowelCount = vowels.filter((v) =>
    vowelGroupsSelected.includes(v.group),
  ).length;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header
        title="Alphabet Trainer"
        onBack={() => router.back()}
        onSettingsChange={(s) => setTtsSpeed(s.ttsSpeed)}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Build Your Practice Set</Text>
          <Text style={styles.headerSubtitle}>
            Choose difficulty, consonant classes, and vowel groups to create
            words
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>1. DIFFICULTY</Text>
          <View style={styles.difficultyRow}>
            {(["easy", "medium", "hard"] as const).map((d) => (
              <DifficultyButton
                key={d}
                level={d}
                isSelected={difficulty === d}
                onPress={() => setDifficulty(d)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>2. CONSONANT CLASSES</Text>
            <Text style={styles.sectionCount}>{consonantCount} selected</Text>
          </View>
          <View style={styles.consonantGrid}>
            {CONSONANT_INFO.map((info) => (
              <ConsonantCard
                key={info.id}
                info={info}
                isSelected={consonantGroupsSelected.includes(info.id)}
                onPress={() =>
                  toggleSelection(
                    info.id,
                    consonantGroupsSelected,
                    setConsonantGroupsSelected,
                  )
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>3. VOWEL GROUPS</Text>
            <Text style={styles.sectionCount}>{vowelCount} selected</Text>
          </View>
          <View style={styles.vowelGrid}>
            {VOWEL_INFO.map((info) => (
              <VowelCard
                key={info.id}
                info={info}
                isSelected={vowelGroupsSelected.includes(info.id)}
                onPress={() =>
                  toggleSelection(
                    info.id,
                    vowelGroupsSelected,
                    setVowelGroupsSelected,
                  )
                }
              />
            ))}
          </View>
        </View>

        {!isValid && (
          <View style={styles.validationWarning}>
            <Ionicons name="alert-circle" size={16} color={Sketch.red} />
            <Text style={styles.validationText}>
              Select at least one consonant class and vowel group to continue
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            !isValid && styles.generateButtonDisabled,
          ]}
          onPress={generateWords}
          disabled={!isValid}
          activeOpacity={isValid ? 0.85 : 1}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color={Sketch.cardBg} />
              <Text style={styles.generateText}>Creating...</Text>
            </>
          ) : (
            <Text style={styles.generateText}>Create Words</Text>
          )}
        </TouchableOpacity>

        {!loading && words.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>Created Words</Text>
                <Text style={styles.resultsSummary}>
                  {difficulty} · {consonantGroupsSelected.length} class(es) ·{" "}
                  {vowelGroupsSelected.length} group(s)
                </Text>
              </View>
            </View>

            {words.map((w, i) => (
              <TrainerWordCard
                key={`${w.thai}-${i}`}
                word={w}
                onPlaySound={speakThai}
              />
            ))}
          </View>
        )}

        {!loading && noResults && (
          <View style={styles.emptyState}>
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={Sketch.orange}
            />
            <Text style={styles.emptyTitle}>No Words Found</Text>
            <Text style={styles.emptyText}>
              This combination of consonant classes, vowels, and difficulty may
              not exist in the dictionary. Try selecting more consonants or
              easier difficulty.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  headerSection: { marginBottom: 24 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Sketch.ink,
    marginBottom: 8,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
    lineHeight: 18,
  },

  section: { marginBottom: 26 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: Sketch.inkMuted,
    letterSpacing: 0.8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.orange,
    backgroundColor: Sketch.orange + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  difficultyRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  diffButton: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    ...sketchShadow(3),
  },
  diffButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  diffButtonTextActive: { color: Sketch.ink },

  consonantGrid: { flexDirection: "column", gap: 12 },
  consonantCard: {
    width: "100%",
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    padding: 14,
    paddingRight: 48,
    ...sketchShadow(3),
  },
  consonantCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  consonantTextSection: { flex: 1 },
  consonantTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: Sketch.inkMuted,
    marginBottom: 4,
  },
  consonantTitleActive: { color: Sketch.ink },
  consonantSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkFaint,
  },
  consonantSubtitleActive: { color: "rgba(0,0,0,0.6)" },
  letterPreview: { flexDirection: "row", gap: 8 },
  previewLetter: { fontSize: 22, fontWeight: "900", color: Sketch.ink },
  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Sketch.cardBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Sketch.ink,
  },

  vowelGrid: { flexDirection: "column", gap: 12 },
  vowelCard: {
    width: "100%",
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    padding: 14,
    paddingRight: 48,
    ...sketchShadow(3),
  },
  vowelCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  vowelTextSection: { flex: 1 },
  vowelTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: Sketch.inkMuted,
    marginBottom: 4,
  },
  vowelTitleActive: { color: Sketch.ink },
  vowelSubtitle: { fontSize: 11, fontWeight: "600", color: Sketch.inkFaint },
  vowelSubtitleActive: { color: "rgba(0,0,0,0.6)" },
  vowelPreview: {
    fontSize: 20,
    fontWeight: "800",
    color: Sketch.ink,
    marginLeft: 12,
    letterSpacing: 6,
  },
  vowelSelectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Sketch.cardBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Sketch.ink,
  },

  validationWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Sketch.red + "18",
    borderWidth: 2,
    borderColor: Sketch.red,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  validationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.red,
    lineHeight: 18,
  },

  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
    gap: 8,
    ...sketchShadow(5),
  },
  generateButtonDisabled: {
    backgroundColor: Sketch.inkFaint,
    borderColor: Sketch.inkFaint,
  },
  generateText: {
    color: Sketch.cardBg,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  resultsSection: { marginTop: 16, marginBottom: 32 },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  resultsTitle: { fontSize: 20, fontWeight: "900", color: Sketch.ink },
  resultsSummary: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    marginTop: 4,
  },
  resultsCount: { fontSize: 28, fontWeight: "900", color: Sketch.orange },

  wordCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    ...sketchShadow(3),
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  wordThai: { flex: 1, fontSize: 34, fontWeight: "900", color: Sketch.ink },
  soundButton: {
    width: 44,
    height: 44,
    backgroundColor: Sketch.orange,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...sketchShadow(2),
  },
  wordRoman: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.inkLight,
    marginBottom: 6,
  },
  wordEnglish: { fontSize: 14, fontWeight: "500", color: Sketch.inkMuted },

  emptyState: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginTop: 16,
    ...sketchShadow(3),
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: Sketch.ink,
    marginTop: 8,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
