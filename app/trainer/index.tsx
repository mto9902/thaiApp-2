import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useRef, useState } from "react";
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
  { id: 1, title: "Before", description: "เ แ โ" },
  { id: 2, title: "After", description: "ะ า" },
  { id: 3, title: "Above", description: "ิ ี ึ" },
  { id: 4, title: "Below", description: "ุ ู" },
  { id: 5, title: "Around 1", description: "เ◌ะ แ◌" },
  { id: 6, title: "Around 2", description: "เ◌อ เ◌าะ" },
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
        <Text
          style={[
            styles.diffButtonText,
            isSelected && styles.diffButtonTextActive,
          ]}
        >
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
  const letters = alphabet
    .filter((l) => l.group === info.id)
    .slice(0, 4);
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
          {
            backgroundColor: isSelected ? info.color : "white",
            borderColor: info.color,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
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
            <Ionicons name="checkmark" size={16} color="black" />
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
          { backgroundColor: isSelected ? "#FFD54F" : "#FFFBF0" },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.vowelCardContent}>
          <View style={styles.vowelTextSection}>
            <Text
              style={[
                styles.vowelTitle,
                isSelected && styles.vowelTitleActive,
              ]}
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
            <Ionicons name="checkmark" size={16} color="black" />
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
    "easy"
  );
  const [consonantGroupsSelected, setConsonantGroupsSelected] = useState<
    number[]
  >([1]); // Pre-select Mid Class
  const [vowelGroupsSelected, setVowelGroupsSelected] = useState<number[]>([
    1,
  ]); // Pre-select Before
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
    setList: (v: number[]) => void
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
          .map((c) => c.letter)
      ),
    ];

    const selectedVowels = [
      ...new Set(
        vowels
          .filter((v) => vowelGroupsSelected.includes(v.group))
          .map((v) => v.symbol.replace("◌", ""))
      ),
    ];

    try {
      setLoading(true);

      const result = await generateTrainer(
        consonants,
        selectedVowels,
        difficulty
      );

      setWords(result.words || []);
    } catch (err) {
      console.error("Trainer error:", err);
    } finally {
      setLoading(false);
    }
  }

  const isValid =
    consonantGroupsSelected.length > 0 && vowelGroupsSelected.length > 0;
  const consonantCount = alphabet.filter((c) =>
    consonantGroupsSelected.includes(c.group)
  ).length;
  const vowelCount = vowels.filter((v) =>
    vowelGroupsSelected.includes(v.group)
  ).length;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Alphabet Trainer" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Text */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Build Your Practice Set</Text>
          <Text style={styles.headerSubtitle}>
            Choose difficulty, consonant classes, and vowel groups to create
            words
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
                    setConsonantGroupsSelected
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
                    setVowelGroupsSelected
                  )
                }
              />
            ))}
          </View>
        </View>

        {/* VALIDATION WARNING */}
        {!isValid && (
          <View style={styles.validationWarning}>
            <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
            <Text style={styles.validationText}>
              Select at least one consonant class and vowel group to continue
            </Text>
          </View>
        )}

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
              <Text style={styles.generateText}>Creating...</Text>
            </>
          ) : (
            <Text style={styles.generateText}>Create Words</Text>
          )}
        </TouchableOpacity>

        {/* Results Section */}
        {words.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>Generated Words</Text>
                <Text style={styles.resultsSummary}>
                  {difficulty} • {consonantGroupsSelected.length} class(es) •{" "}
                  {vowelGroupsSelected.length} group(s)
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },

  headerSection: {
    marginBottom: 24,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "black",
    marginBottom: 8,
    lineHeight: 32,
  },

  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(0,0,0,0.6)",
    lineHeight: 18,
  },

  section: {
    marginBottom: 26,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(0,0,0,0.5)",
    letterSpacing: 0.8,
    flex: 1,
  },

  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF9800",
    backgroundColor: "rgba(255, 152, 0, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  difficultyRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  diffButton: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 3,
  },

  diffButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(0,0,0,0.5)",
    textAlign: "center",
  },

  diffButtonTextActive: {
    color: "black",
  },

  consonantGrid: {
    flexDirection: "column",
    gap: 12,
  },

  consonantCard: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    paddingRight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 3,
  },

  consonantCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  consonantTextSection: {
    flex: 1,
  },

  consonantTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(0,0,0,0.5)",
    marginBottom: 4,
  },

  consonantTitleActive: {
    color: "black",
  },

  consonantSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(0,0,0,0.4)",
  },

  consonantSubtitleActive: {
    color: "rgba(0,0,0,0.6)",
  },

  letterPreview: {
    flexDirection: "row",
    gap: 8,
  },

  previewLetter: {
    fontSize: 22,
    fontWeight: "900",
    color: "black",
  },

  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },

  vowelGrid: {
    flexDirection: "column",
    gap: 12,
  },

  vowelCard: {
    width: "100%",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 14,
    padding: 14,
    paddingRight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 3,
  },

  vowelCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  vowelTextSection: {
    flex: 1,
  },

  vowelTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(0,0,0,0.5)",
    marginBottom: 4,
  },

  vowelTitleActive: {
    color: "black",
  },

  vowelSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(0,0,0,0.4)",
  },

  vowelSubtitleActive: {
    color: "rgba(0,0,0,0.6)",
  },

  vowelPreview: {
    fontSize: 20,
    fontWeight: "800",
    color: "black",
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
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "black",
  },

  validationWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    borderWidth: 2,
    borderColor: "#FF6B6B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },

  validationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#FF6B6B",
    lineHeight: 18,
  },

  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD54F",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  generateButtonDisabled: {
    backgroundColor: "#E8E8E8",
    borderColor: "rgba(0,0,0,0.2)",
    shadowOpacity: 0.2,
  },

  generateText: {
    color: "black",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
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
    color: "#FF9800",
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
