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

import { Sketch } from "@/constants/theme";
import { generateTrainer } from "../../src/api/generateTrainer";
import Header from "../../src/components/Header";
import { alphabet } from "../../src/data/alphabet";
import { vowels } from "../../src/data/vowels";

const DIFFICULTY_META = {
  easy: { label: "Easy", color: Sketch.green },
  medium: { label: "Medium", color: Sketch.yellow },
  hard: { label: "Hard", color: Sketch.red },
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

// ── Difficulty picker ──────────────────────────────────────────────────────────
function DifficultyPicker({
  value,
  onChange,
}: {
  value: "easy" | "medium" | "hard";
  onChange: (v: "easy" | "medium" | "hard") => void;
}) {
  return (
    <View style={styles.diffRow}>
      {(["easy", "medium", "hard"] as const).map((level) => {
        const meta = DIFFICULTY_META[level];
        const active = value === level;
        return (
          <TouchableOpacity
            key={level}
            style={[
              styles.diffBtn,
              active && {
                backgroundColor: meta.color + "22",
                borderColor: meta.color,
              },
            ]}
            onPress={() => onChange(level)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.diffBtnText,
                active && { color: meta.color, fontWeight: "700" },
              ]}
            >
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Consonant card ─────────────────────────────────────────────────────────────
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
        styles.selCard,
        isSelected && {
          borderColor: info.color,
          backgroundColor: info.color + "12",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.selText}>
        <Text style={[styles.selTitle, isSelected && { color: info.color }]}>
          {info.title}
        </Text>
      </View>
      <View style={styles.letterPreview}>
        {letters.map((l) => (
          <Text
            key={l.letter}
            style={[styles.previewLetter, isSelected && { color: Sketch.ink }]}
          >
            {l.letter}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ── Vowel card ─────────────────────────────────────────────────────────────────
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
        styles.selCard,
        isSelected && {
          borderColor: info.color,
          backgroundColor: info.color + "12",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.selText}>
        <Text style={[styles.selTitle, isSelected && { color: info.color }]}>
          {info.title}
        </Text>
      </View>
      <Text style={[styles.vowelPreview, isSelected && { color: Sketch.ink }]}>
        {info.description}
      </Text>
    </TouchableOpacity>
  );
}

// ── Word result card ───────────────────────────────────────────────────────────
function WordResultCard({ word, onPlaySound }: any) {
  return (
    <View style={styles.wordCard}>
      <View style={styles.wordCardLeft}>
        <Text style={styles.wordThai}>{word.thai}</Text>
        {word.romanization && (
          <Text style={styles.wordRoman}>{word.romanization}</Text>
        )}
        <Text style={styles.wordEnglish}>{word.english}</Text>
      </View>
      <TouchableOpacity
        style={styles.soundBtn}
        onPress={() => onPlaySound(word.thai)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="volume-medium-outline"
          size={18}
          color={Sketch.inkLight}
        />
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
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
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
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
        if (consonantSet.has(char) && !allowedConsonants.has(char))
          return false;
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
      if (collected.length === 0) setNoResults(true);
      else setWords(collected.slice(0, TARGET_WORDS));
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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Build your practice set</Text>
          <Text style={styles.pageSubtitle}>
            Pick a difficulty, consonant classes, and vowel groups
          </Text>
        </View>

        {/* 1. Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DIFFICULTY</Text>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </View>

        {/* 2. Consonants */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>CONSONANT CLASSES</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{consonantCount} letters</Text>
            </View>
          </View>
          <View style={styles.cardList}>
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

        {/* 3. Vowels */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>VOWEL GROUPS</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{vowelCount} vowels</Text>
            </View>
          </View>
          <View style={styles.cardList}>
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

        {/* Validation */}
        {!isValid && (
          <View style={styles.validationBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={15}
              color={Sketch.red}
            />
            <Text style={styles.validationText}>
              Select at least one consonant class and vowel group
            </Text>
          </View>
        )}

        {/* Generate */}
        <TouchableOpacity
          style={[styles.generateBtn, !isValid && styles.generateBtnDisabled]}
          onPress={generateWords}
          disabled={!isValid}
          activeOpacity={isValid ? 0.85 : 1}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateBtnText}>Creating words...</Text>
            </>
          ) : (
            <Text style={styles.generateBtnText}>Create Words</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        {!loading && words.length > 0 && (
          <View style={styles.results}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Practice Words</Text>
              <Text style={styles.resultsMeta}>
                {DIFFICULTY_META[difficulty].label} ·{" "}
                {consonantGroupsSelected.length} class
                {consonantGroupsSelected.length !== 1 ? "es" : ""} ·{" "}
                {vowelGroupsSelected.length} group
                {vowelGroupsSelected.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {words.map((w, i) => (
              <WordResultCard
                key={`${w.thai}-${i}`}
                word={w}
                onPlaySound={speakThai}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {!loading && noResults && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={26} color={Sketch.inkMuted} />
            <Text style={styles.emptyTitle}>No words found</Text>
            <Text style={styles.emptyText}>
              Try selecting more consonant classes, vowel groups, or an easier
              difficulty level.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  pageHeader: { paddingVertical: 16, gap: 4 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    lineHeight: 18,
  },

  section: { marginBottom: 24, gap: 10 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
  },
  countPill: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countPillText: { fontSize: 11, fontWeight: "500", color: Sketch.inkLight },

  // Difficulty
  diffRow: { flexDirection: "row", gap: 12 },
  diffBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paperDark,
    minHeight: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  diffBtnText: { fontSize: 14, fontWeight: "600", color: Sketch.inkMuted },

  // Selection cards (shared by consonant + vowel)
  cardList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selCard: {
    width: "31%",
    flexGrow: 1,
    flexBasis: "30%",
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 12,
    gap: 6,
    minHeight: 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  selCardInner: { gap: 6 },
  selDot: { width: 8, height: 8, borderRadius: 4 },
  selText: { gap: 3 },
  selTitle: { fontSize: 14, fontWeight: "700", color: Sketch.ink },
  selSub: { fontSize: 11, fontWeight: "500", color: Sketch.inkMuted },
  letterPreview: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
    marginTop: 4,
  },
  previewLetter: { fontSize: 22, fontWeight: "700", color: Sketch.inkMuted },
  vowelPreview: {
    fontSize: 17,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 4,
    marginTop: 4,
  },

  // Validation
  validationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Sketch.red + "12",
    borderWidth: 1,
    borderColor: Sketch.red + "40",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  validationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.red,
    lineHeight: 18,
  },

  // Generate button
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Sketch.orange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: Sketch.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  generateBtnDisabled: {
    backgroundColor: Sketch.inkFaint,
    shadowOpacity: 0,
    borderColor: "transparent",
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.1,
  },

  // Results
  results: { marginTop: 16, gap: 10 },
  resultsHeader: { gap: 2, marginBottom: 4 },
  resultsTitle: { fontSize: 17, fontWeight: "700", color: Sketch.ink },
  resultsMeta: { fontSize: 12, fontWeight: "400", color: Sketch.inkMuted },

  wordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  wordCardLeft: { flex: 1, gap: 2 },
  wordThai: { fontSize: 28, fontWeight: "700", color: Sketch.ink },
  wordRoman: { fontSize: 13, fontWeight: "500", color: Sketch.inkMuted },
  wordEnglish: { fontSize: 13, fontWeight: "400", color: Sketch.inkLight },
  soundBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },

  // Empty state
  emptyState: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: Sketch.ink },
  emptyText: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 19,
  },
});
