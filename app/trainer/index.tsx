import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
import Header from "../../src/components/Header";
import {
  CONSONANT_INFO,
  DIFFICULTY_META,
  TrainerDifficulty,
  VOWEL_INFO,
} from "../../src/data/trainerOptions";
import { alphabet } from "../../src/data/alphabet";
import { vowels } from "../../src/data/vowels";
import { useState } from "react";
import { MUTED_APP_ACCENTS, withAlpha } from "../../src/utils/toneAccent";

function DifficultyPicker({
  value,
  onChange,
}: {
  value: TrainerDifficulty;
  onChange: (value: TrainerDifficulty) => void;
}) {
  return (
    <View style={styles.difficultyRow}>
      {(Object.keys(DIFFICULTY_META) as TrainerDifficulty[]).map((level) => {
        const meta = DIFFICULTY_META[level];
        const active = value === level;

        return (
          <Pressable
            key={level}
            style={[
              styles.difficultyCard,
              active && styles.selectionCardActive,
            ]}
            android_ripple={{ color: "transparent" }}
            onPress={() => onChange(level)}
          >
            <Text
              style={[
                styles.difficultyTitle,
                active && styles.selectionTitleActive,
              ]}
            >
              {meta.label}
            </Text>
            <Text style={styles.difficultyCaption}>
              {level === "easy"
                ? "Short, simple words"
                : level === "medium"
                  ? "A little more variety"
                  : "Longer or trickier words"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ConsonantCard({
  id,
  title,
  isSelected,
  onPress,
}: {
  id: number;
  title: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const letters = alphabet.filter((item) => item.group === id).slice(0, 4);

  return (
    <Pressable
      style={[
        styles.selectionCard,
        isSelected && styles.selectionCardActive,
      ]}
      android_ripple={{ color: "transparent" }}
      onPress={onPress}
    >
      <Text
        style={[styles.selectionTitle, isSelected && styles.selectionTitleActive]}
      >
        {title}
      </Text>
      <View style={styles.previewRow}>
        {letters.map((item) => (
          <Text key={item.letter} style={styles.previewGlyph}>
            {item.letter}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

function VowelCard({
  id,
  title,
  description,
  isSelected,
  onPress,
}: {
  id: number;
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.selectionCard,
        isSelected && styles.selectionCardActive,
      ]}
      android_ripple={{ color: "transparent" }}
      onPress={onPress}
    >
      <Text
        style={[styles.selectionTitle, isSelected && styles.selectionTitleActive]}
      >
        {title}
      </Text>
      <Text style={styles.selectionDescription}>{description}</Text>
    </Pressable>
  );
}

export default function TrainerScreen() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<TrainerDifficulty>("easy");
  const [consonantGroupsSelected, setConsonantGroupsSelected] = useState<
    number[]
  >([1]);
  const [vowelGroupsSelected, setVowelGroupsSelected] = useState<number[]>([1]);

  function toggleSelection(
    value: number,
    list: number[],
    setList: (next: number[]) => void,
  ) {
    setList(
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  }

  const isValid =
    consonantGroupsSelected.length > 0 && vowelGroupsSelected.length > 0;
  const consonantCount = alphabet.filter((item) =>
    consonantGroupsSelected.includes(item.group),
  ).length;
  const vowelCount = vowels.filter((item) =>
    vowelGroupsSelected.includes(item.group),
  ).length;

  function openWordsScreen() {
    if (!isValid) return;

    router.push({
      pathname: "/trainer/words",
      params: {
        difficulty,
        consonantGroups: consonantGroupsSelected.join(","),
        vowelGroups: vowelGroupsSelected.join(","),
      },
    } as any);
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Alphabet Trainer"
        onBack={() => router.back()}
        showSettings={false}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageIntro}>
          <Text style={styles.pageTitle}>Build a focused reading batch.</Text>
          <Text style={styles.pageSubtitle}>
            Choose difficulty, consonants, and vowels. Your word batch opens on
            the next screen.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.clay }]}>
              {consonantCount}
            </Text>
            <Text style={styles.summaryLabel}>letters</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.slate }]}>
              {vowelCount}
            </Text>
            <Text style={styles.summaryLabel}>vowels</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.sage }]}>
              {DIFFICULTY_META[difficulty].label}
            </Text>
            <Text style={styles.summaryLabel}>difficulty</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Difficulty</Text>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Consonant Classes</Text>
            <Text style={styles.sectionMeta}>{consonantCount} letters</Text>
          </View>
          <View style={styles.grid}>
            {CONSONANT_INFO.map((item) => (
              <ConsonantCard
                key={item.id}
                id={item.id}
                title={item.title}
                isSelected={consonantGroupsSelected.includes(item.id)}
                onPress={() =>
                  toggleSelection(
                    item.id,
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
            <Text style={styles.sectionLabel}>Vowel Groups</Text>
            <Text style={styles.sectionMeta}>{vowelCount} vowels</Text>
          </View>
          <View style={styles.grid}>
            {VOWEL_INFO.map((item) => (
              <VowelCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                isSelected={vowelGroupsSelected.includes(item.id)}
                onPress={() =>
                  toggleSelection(
                    item.id,
                    vowelGroupsSelected,
                    setVowelGroupsSelected,
                  )
                }
              />
            ))}
          </View>
        </View>

        {!isValid ? (
          <View style={styles.validationBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={Sketch.orange}
            />
            <Text style={styles.validationText}>
              Select at least one consonant class and one vowel group.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !isValid && styles.primaryButtonDisabled,
          ]}
          onPress={openWordsScreen}
          disabled={!isValid}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Create Words</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 14,
  },
  pageIntro: {
    paddingTop: 4,
    gap: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
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
    borderRadius: 14,
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
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sectionMeta: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  difficultyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  difficultyCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minHeight: 80,
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 12,
    justifyContent: "space-between",
    ...sketchShadow(3),
  },
  difficultyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Sketch.ink,
  },
  difficultyCaption: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.inkMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  selectionCard: {
    flexBasis: "48%",
    maxWidth: "48%",
    minHeight: 92,
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 12,
    justifyContent: "space-between",
    ...sketchShadow(3),
  },
  selectionCardActive: {
    borderColor: Sketch.orange,
    backgroundColor: Sketch.cardBg,
  },
  selectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
  },
  selectionTitleActive: {
    color: Sketch.orange,
  },
  selectionDescription: {
    fontSize: 18,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  previewGlyph: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  validationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: withAlpha(Sketch.orange, "10"),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withAlpha(Sketch.orange, "30"),
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  validationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.orangeDark,
  },
  primaryButton: {
    backgroundColor: Sketch.orange,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    ...sketchShadow(4),
  },
  primaryButtonDisabled: {
    backgroundColor: Sketch.inkFaint,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
