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

const CONSONANT_COLORS = ["#FFD54F", "#42A5F5", "#FF4081", "#66BB6A"];

function SelectionButton({
  label,
  isSelected,
  onPress,
  color,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  color?: string;
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

  const bgColor = isSelected ? (color || "#FFD54F") : "white";

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.selectionButton,
          { backgroundColor: bgColor },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text
          style={[
            styles.selectionButtonText,
            isSelected && styles.selectionButtonTextActive,
          ]}
        >
          {label}
        </Text>
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
  const [showHelp, setShowHelp] = useState(false);

  const [consonantGroupsSelected, setConsonantGroupsSelected] = useState<
    number[]
  >([]);
  const [vowelGroupsSelected, setVowelGroupsSelected] = useState<number[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const consonantGroups = [
    { id: 1, title: "Mid Class" },
    { id: 2, title: "High Class" },
    { id: 3, title: "Low Class 1" },
    { id: 4, title: "Low Class 2" },
  ];

  const vowelGroups = [
    { id: 1, title: "Before" },
    { id: 2, title: "After" },
    { id: 3, title: "Above" },
    { id: 4, title: "Below" },
    { id: 5, title: "Around 1" },
    { id: 6, title: "Around 2" },
  ];

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
    if (
      consonantGroupsSelected.length === 0 ||
      vowelGroupsSelected.length === 0
    ) {
      return;
    }

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

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Alphabet Trainer" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Help Section */}
        <TouchableOpacity
          style={styles.helpHeader}
          onPress={() => setShowHelp(!showHelp)}
          activeOpacity={0.7}
        >
          <View style={styles.helpHeaderContent}>
            <Ionicons
              name={showHelp ? "chevron-up" : "chevron-down"}
              size={20}
              color="black"
            />
            <Text style={styles.helpHeaderText}>
              What are consonant classes &amp; vowel groups?
            </Text>
          </View>
        </TouchableOpacity>

        {showHelp && (
          <View style={styles.helpContent}>
            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>🎓 Consonant Classes</Text>
              <Text style={styles.helpText}>
                Thai consonants are organized into <Text style={styles.helpBold}>4 classes</Text> based on how they affect tones when combined with vowels. Understanding these classes helps you predict the tone of any Thai word.
              </Text>
              <View style={styles.helpList}>
                <Text style={styles.helpListItem}>
                  <Text style={styles.helpBold}>Mid Class:</Text> ก ข ค (most common, neutral tone)
                </Text>
                <Text style={styles.helpListItem}>
                  <Text style={styles.helpBold}>High Class:</Text> ฉ ช ผ ฟ ส (raise the tone)
                </Text>
                <Text style={styles.helpListItem}>
                  <Text style={styles.helpBold}>Low Class I &amp; II:</Text> ค ค ค ท ด (lower the tone)
                </Text>
              </View>
            </View>

            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>🔤 Vowel Groups</Text>
              <Text style={styles.helpText}>
                Vowels in Thai can appear <Text style={styles.helpBold}>before, after, above, or below</Text> the consonant. We group them by position to help you learn them systematically.
              </Text>
              <View style={styles.helpList}>
                <Text style={styles.helpListItem}>
                  <Text style={styles.helpBold}>Before:</Text> vowels that come before the consonant (ะ า)
                </Text>
                <Text style={styles.helpListItem}>
                  <Text style={styles.helpBold}>After:</Text> vowels that come after (ิ ี)
                </Text>
                <Text style={styles.helpListItem}>
                  <Text style={styles.helpBold}>Above/Below:</Text> vowels that go above or below (เ แ โ)
                </Text>
                <Text style={styles.helpListItem}>
                  <Text style={styles.helpBold}>Around:</Text> vowels that surround the consonant (เ-ะ เ-อ)
                </Text>
              </View>
            </View>

            <View style={styles.helpTip}>
              <Ionicons name="bulb" size={18} color="#FFD54F" />
              <Text style={styles.helpTipText}>
                Pro tip: Mix different consonant classes and vowel groups to practice tone changes!
              </Text>
            </View>
          </View>
        )}

        {/* Difficulty Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DIFFICULTY</Text>
          <View style={styles.difficultyRow}>
            {(["easy", "medium", "hard"] as const).map((d) => (
              <SelectionButton
                key={d}
                label={d.charAt(0).toUpperCase() + d.slice(1)}
                isSelected={difficulty === d}
                onPress={() => setDifficulty(d)}
                color={DIFFICULTY_COLORS[d]}
              />
            ))}
          </View>
        </View>

        {/* Consonant Groups Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONSONANT GROUPS</Text>
          <View style={styles.consonantGrid}>
            {consonantGroups.map((group, idx) => (
              <SelectionButton
                key={group.id}
                label={group.title}
                isSelected={consonantGroupsSelected.includes(group.id)}
                onPress={() =>
                  toggleSelection(
                    group.id,
                    consonantGroupsSelected,
                    setConsonantGroupsSelected,
                  )
                }
                color={CONSONANT_COLORS[idx]}
              />
            ))}
          </View>
        </View>

        {/* Vowel Groups Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VOWEL GROUPS</Text>
          <View style={styles.vowelGrid}>
            {vowelGroups.map((group) => (
              <SelectionButton
                key={group.id}
                label={group.title}
                isSelected={vowelGroupsSelected.includes(group.id)}
                onPress={() =>
                  toggleSelection(
                    group.id,
                    vowelGroupsSelected,
                    setVowelGroupsSelected,
                  )
                }
              />
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateWords}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={20} color="black" />
          <Text style={styles.generateText}>Generate Words</Text>
        </TouchableOpacity>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="black" />
            <Text style={styles.loadingText}>Creating words...</Text>
          </View>
        )}

        {/* Results Section */}
        {words.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Generated Words</Text>
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

        {/* Empty State */}
        {!loading && words.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="create-outline" size={48} color="rgba(0,0,0,0.2)" />
            <Text style={styles.emptyStateText}>
              Select consonant and vowel groups to generate words
            </Text>
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

  helpHeader: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },

  helpHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  helpHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: "black",
  },

  helpContent: {
    backgroundColor: "#FFFBF0",
    borderWidth: 2,
    borderColor: "#FFD54F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },

  helpSection: {
    marginBottom: 16,
  },

  helpTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "black",
    marginBottom: 8,
  },

  helpText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(0,0,0,0.7)",
    lineHeight: 18,
    marginBottom: 10,
  },

  helpBold: {
    fontWeight: "900",
    color: "black",
  },

  helpList: {
    gap: 8,
  },

  helpListItem: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(0,0,0,0.7)",
    lineHeight: 18,
    marginLeft: 8,
  },

  helpTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 213, 79, 0.15)",
    borderWidth: 1,
    borderColor: "#FFD54F",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },

  helpTipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(0,0,0,0.7)",
    lineHeight: 16,
  },

  section: {
    marginBottom: 28,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(0,0,0,0.6)",
    letterSpacing: 1,
    marginBottom: 12,
  },

  difficultyRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },

  consonantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  vowelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  selectionButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },

  selectionButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(0,0,0,0.6)",
    textAlign: "center",
  },

  selectionButtonTextActive: {
    color: "black",
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
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  generateText: {
    color: "black",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },

  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(0,0,0,0.6)",
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

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },

  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(0,0,0,0.5)",
    textAlign: "center",
    maxWidth: "80%",
  },
});
