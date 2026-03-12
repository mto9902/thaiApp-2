import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import { generateTrainer } from "../../src/api/generateTrainer";
import { alphabet } from "../../src/data/alphabet";
import { vowels } from "../../src/data/vowels";
import { useState } from "react";

const DIFFICULTY_COLORS = {
  easy: "#66BB6A",
  medium: "#FFD54F",
  hard: "#FF6B6B",
};

const CONSONANT_INFO = [
  { id: 1, title: "Mid Class", color: "#FFD54F" },
  { id: 2, title: "High Class", color: "#42A5F5" },
  { id: 3, title: "Low Class I", color: "#FF4081" },
  { id: 4, title: "Low Class II", color: "#66BB6A" },
];

const VOWEL_INFO = [
  { id: 1, title: "Before", description: "เ แ โ ใ ไ" },
  { id: 2, title: "After", description: "ะ า" },
  { id: 3, title: "Above", description: "ิ ี ึ ื" },
  { id: 4, title: "Below", description: "ุ ู" },
  { id: 5, title: "Around 1", description: "เ◌ะ เ◌ แ◌" },
  { id: 6, title: "Around 2", description: "เ◌าะ ◌อ เ◌อ" },
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const bgColor = isSelected ? DIFFICULTY_COLORS[level] : "white";
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.diffButton, { backgroundColor: bgColor }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text style={[styles.diffButtonText, isSelected && styles.diffButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
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
  const letters = alphabet.filter((l) => l.group === info.id).slice(0, 3);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.consonantCard,
          { backgroundColor: isSelected ? info.color : "white" },
          { borderColor: info.color },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text style={[styles.consonantTitle, isSelected && styles.consonantTitleActive]}>
          {info.title}
        </Text>
        <View style={styles.letterPreview}>
          {letters.map((l) => (
            <Text key={l.letter} style={styles.previewLetter}>
              {l.letter}
            </Text>
          ))}
        </View>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark" size={14} color={info.color} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.vowelCard,
          { backgroundColor: isSelected ? "#FFD54F" : "white" },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text style={[styles.vowelTitle, isSelected && styles.vowelTitleActive]}>
          {info.title}
        </Text>
        <Text style={styles.vowelPreview}>{info.description}</Text>
        {isSelected && (
          <View style={styles.vowelSelectedBadge}>
            <Ionicons name="checkmark" size={12} color="black" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function WordCard({ word, onPlaySound }: any) {
  return (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <Text style={styles.wordThai}>{word.thai}</Text>
        <TouchableOpacity
          style={styles.soundButton}
          onPress={() => onPlaySound(word.thai)}
        >
          <Ionicons name="volume-high" size={20} color="black" />
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
  >([1]); // Pre-select Mid Class
  const [vowelGroupsSelected, setVowelGroupsSelected] = useState<number[]>([1]); // Pre-select Before
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  function speakThai(text: string) {
    Speech.speak(text, {
      language: "th-TH",
      pitch: 1,
      rate: 0.9,
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
    const consonants = [
      ...new Set(
        alphabet
          .filter((c) => consonantGroupsSelected.includes(c.group))
          .map((c) => c.letter),
      ),
    ];

    const selectedVowels = [
      ...new Set(
        vowels
          .filter((v) => vowelGroupsSelected.includes(v.group))
          .map((v) => v.symbol.replace("◌", "")),
      ),
    ];

    try {
      setLoading(true);

      const result = await generateTrainer(
        consonants,
        selectedVowels,
        difficulty,
      );

      setWords(result.words || []);
    } catch (err) {
      console.error("Trainer error:", err);
    } finally {
      setLoading(false);
    }
  }

  const isValid = consonantGroupsSelected.length > 0 && vowelGroupsSelected.length > 0;
  const consonantCount = alphabet.filter((c) =>
    consonantGroupsSelected.includes(c.group),
  ).length;
  const vowelCount = vowels.filter((v) =>
    vowelGroupsSelected.includes(v.group),
  ).length;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Alphabet Trainer" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Text */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Build Your Practice Set</Text>
          <Text style={styles.headerSubtitle}>
            Choose difficulty, consonant classes, and vowel groups to create words
          </Text>
        </View>

        {/* DIFFICULTY SECTION */}
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

        {/* CONSONANT GROUPS SECTION */}
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

        {/* VOWEL GROUPS SECTION */}
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

        {/* SELECTION SUMMARY */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Difficulty</Text>
              <Text style={styles.summaryValue}>{difficulty.toUpperCase()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Combinations</Text>
              <Text style={styles.summaryValue}>~{consonantCount * vowelCount}</Text>
            </View>
          </View>
          {!isValid && (
            <View style={styles.validationWarning}>
              <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
              <Text style={styles.validationText}>
                Select at least one consonant class and vowel group
              </Text>
            </View>
          )}
        </View>

        {/* GENERATE BUTTON */}
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
              <ActivityIndicator size="small" color="black" />
              <Text style={styles.generateText}>Generating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="black" />
              <Text style={styles.generateText}>Generate Words</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results Section */}
        {words.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>Generated Words</Text>
                <Text style={styles.resultsSummary}>
                  {difficulty} • {consonantGroupsSelected.length} class(es) • {vowelGroupsSelected.length} group(s)
                </Text>
              </View>
              <Text style={styles.resultsCount}>{words.length}</Text>
            </View>

            {words.map((w, i) => (
              <WordCard
                key={i}
                word={w}
                onPlaySound={speakThai}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  scroll: {
    padding: 20,
    paddingTop: 16,
  },

  headerSection: {
    marginBottom: 28,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "black",
    marginBottom: 8,
  },

  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(0,0,0,0.6)",
    lineHeight: 20,
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(0,0,0,0.6)",
    letterSpacing: 1,
  },

  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFD54F",
  },

  difficultyRow: {
    flexDirection: "row",
    gap: 10,
  },

  diffButton: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },

  diffButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(0,0,0,0.5)",
    textAlign: "center",
  },

  diffButtonTextActive: {
    color: "black",
  },

  consonantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  consonantCard: {
    width: "48%",
    minHeight: 140,
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },

  consonantTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(0,0,0,0.6)",
    marginBottom: 10,
    textAlign: "center",
  },

  consonantTitleActive: {
    color: "black",
  },

  letterPreview: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  previewLetter: {
    fontSize: 28,
    fontWeight: "900",
    color: "black",
  },

  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },

  vowelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  vowelCard: {
    width: "48%",
    minHeight: 100,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },

  vowelTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(0,0,0,0.6)",
    marginBottom: 8,
    textAlign: "center",
  },

  vowelTitleActive: {
    color: "black",
  },

  vowelPreview: {
    fontSize: 16,
    fontWeight: "700",
    color: "black",
    textAlign: "center",
  },

  vowelSelectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },

  summarySection: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(0,0,0,0.5)",
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "black",
  },

  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  validationWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderWidth: 1,
    borderColor: "#FF6B6B",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },

  validationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B6B",
  },

  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD54F",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  generateButtonDisabled: {
    backgroundColor: "#E0E0E0",
    opacity: 0.6,
    shadowOpacity: 0.3,
  },

  generateText: {
    color: "black",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  resultsSection: {
    marginTop: 16,
    marginBottom: 32,
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  resultsTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "black",
  },

  resultsSummary: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(0,0,0,0.5)",
    marginTop: 4,
  },

  resultsCount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFD54F",
  },

  wordCard: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 3,
  },

  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  wordThai: {
    flex: 1,
    fontSize: 36,
    fontWeight: "900",
    color: "black",
  },

  soundButton: {
    width: 44,
    height: 44,
    backgroundColor: "#FFD54F",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
  },

  wordRoman: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(0,0,0,0.7)",
    marginBottom: 6,
  },

  wordEnglish: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(0,0,0,0.6)",
  },
});
