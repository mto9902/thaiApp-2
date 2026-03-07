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

import { generateTrainer } from "../../src/api/generateTrainer";
import { alphabet } from "../../src/data/alphabet";
import { vowels } from "../../src/data/vowels";

export default function Trainer() {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy",
  );

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
    { id: 1, title: "Before Consonant" },
    { id: 2, title: "After Consonant" },
    { id: 3, title: "Above Consonant" },
    { id: 4, title: "Below Consonant" },
    { id: 5, title: "Around Consonant 1" },
    { id: 6, title: "Around Consonant 2" },
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Alphabet Trainer</Text>

      <Text style={styles.sectionTitle}>Difficulty</Text>

      <View style={styles.row}>
        {["easy", "medium", "hard"].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.button, difficulty === d && styles.selected]}
            onPress={() => setDifficulty(d as "easy" | "medium" | "hard")}
          >
            <Text style={styles.buttonText}>{d.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Consonant Groups</Text>

      <View style={styles.row}>
        {consonantGroups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.button,
              consonantGroupsSelected.includes(group.id) && styles.selected,
            ]}
            onPress={() =>
              toggleSelection(
                group.id,
                consonantGroupsSelected,
                setConsonantGroupsSelected,
              )
            }
          >
            <Text style={styles.buttonText}>{group.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Vowel Groups</Text>

      <View style={styles.row}>
        {vowelGroups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.button,
              vowelGroupsSelected.includes(group.id) && styles.selected,
            ]}
            onPress={() =>
              toggleSelection(
                group.id,
                vowelGroupsSelected,
                setVowelGroupsSelected,
              )
            }
          >
            <Text style={styles.buttonText}>{group.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.generateButton} onPress={generateWords}>
        <Text style={styles.generateText}>Generate Words</Text>
      </TouchableOpacity>

      {loading && (
        <View style={{ marginTop: 30 }}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {words.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Generated Words</Text>

          {words.map((w, i) => (
            <View key={i} style={styles.wordCard}>
              <View style={styles.wordHeader}>
                <Text style={styles.wordThai}>{w.thai}</Text>

                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={() => speakThai(w.thai)}
                >
                  <Text style={styles.voiceText}>🔊</Text>
                </TouchableOpacity>
              </View>

              {w.romanization && (
                <Text style={styles.wordRoman}>{w.romanization}</Text>
              )}

              <Text style={styles.wordEnglish}>{w.english}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  button: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  selected: {
    backgroundColor: "#4CAF50",
  },

  buttonText: {
    fontWeight: "600",
  },

  generateButton: {
    marginTop: 30,
    backgroundColor: "black",
    padding: 16,
    borderRadius: 10,
  },

  generateText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },

  results: {
    marginTop: 30,
  },

  resultsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  wordCard: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },

  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  wordThai: {
    fontSize: 28,
    fontWeight: "bold",
  },

  voiceButton: {
    padding: 6,
  },

  voiceText: {
    fontSize: 20,
  },

  wordRoman: {
    fontSize: 16,
    marginTop: 4,
  },

  wordEnglish: {
    fontSize: 16,
    color: "#555",
  },
});
