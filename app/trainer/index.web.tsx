import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
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
import {
  CONSONANT_INFO,
  DIFFICULTY_META,
  TrainerDifficulty,
  VOWEL_INFO,
} from "@/src/data/trainerOptions";
import { alphabet } from "@/src/data/alphabet";
import { vowels } from "@/src/data/vowels";
import { MUTED_APP_ACCENTS } from "@/src/utils/toneAccent";

function DifficultyCard({
  level,
  active,
  onPress,
}: {
  level: TrainerDifficulty;
  active: boolean;
  onPress: () => void;
}) {
  const meta = DIFFICULTY_META[level];

  return (
    <Pressable
      style={[styles.selectionCard, active && styles.selectionCardActive]}
      onPress={onPress}
    >
      <Text style={styles.selectionTitle}>{meta.label}</Text>
      <Text style={styles.selectionDescription}>
        {level === "easy"
          ? "Short, simple words"
          : level === "medium"
            ? "A little more variety"
            : "Longer or trickier words"}
      </Text>
    </Pressable>
  );
}

function GroupCard({
  title,
  preview,
  active,
  onPress,
}: {
  title: string;
  preview: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.selectionCard, active && styles.selectionCardActive]}
      onPress={onPress}
    >
      <Text style={styles.selectionTitle}>{title}</Text>
      <Text style={styles.groupPreview}>{preview}</Text>
    </Pressable>
  );
}

export default function TrainerWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [difficulty, setDifficulty] = useState<TrainerDifficulty>("easy");
  const [consonantGroupsSelected, setConsonantGroupsSelected] = useState<number[]>([1]);
  const [vowelGroupsSelected, setVowelGroupsSelected] = useState<number[]>([1]);

  const columns = width >= 1280 ? 3 : width >= 960 ? 2 : 1;
  const cardWidth = columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

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
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Trainer"
        title="Alphabet Trainer"
        subtitle="Build a focused reading batch with a desktop layout that separates setup, filters, and launch actions."
        toolbar={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.summaryStrip}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.clay }]}>
              {consonantCount}
            </Text>
            <Text style={styles.summaryLabel}>letters</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: MUTED_APP_ACCENTS.slate }]}>
              {vowelCount}
            </Text>
            <Text style={styles.summaryLabel}>vowels</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{DIFFICULTY_META[difficulty].label}</Text>
            <Text style={styles.summaryLabel}>difficulty</Text>
          </View>
        </View>

        <View style={styles.mainGrid}>
          <View style={styles.formColumn}>
            <DesktopPanel>
              <DesktopSectionTitle
                title="Difficulty"
                caption="Choose how simple or tricky the word batch should be."
              />
              <View style={styles.grid}>
                {(Object.keys(DIFFICULTY_META) as TrainerDifficulty[]).map((level) => (
                  <View key={level} style={{ width: cardWidth }}>
                    <DifficultyCard
                      level={level}
                      active={difficulty === level}
                      onPress={() => setDifficulty(level)}
                    />
                  </View>
                ))}
              </View>
            </DesktopPanel>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Consonant classes"
                caption={`${consonantCount} letters selected`}
              />
              <View style={styles.grid}>
                {CONSONANT_INFO.map((item) => {
                  const letters = alphabet
                    .filter((entry) => entry.group === item.id)
                    .slice(0, 4)
                    .map((entry) => entry.letter)
                    .join(" ");
                  return (
                    <View key={item.id} style={{ width: cardWidth }}>
                      <GroupCard
                        title={item.title}
                        preview={letters}
                        active={consonantGroupsSelected.includes(item.id)}
                        onPress={() =>
                          toggleSelection(
                            item.id,
                            consonantGroupsSelected,
                            setConsonantGroupsSelected,
                          )
                        }
                      />
                    </View>
                  );
                })}
              </View>
            </DesktopPanel>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Vowel groups"
                caption={`${vowelCount} vowels selected`}
              />
              <View style={styles.grid}>
                {VOWEL_INFO.map((item) => (
                  <View key={item.id} style={{ width: cardWidth }}>
                    <GroupCard
                      title={item.title}
                      preview={item.description}
                      active={vowelGroupsSelected.includes(item.id)}
                      onPress={() =>
                        toggleSelection(
                          item.id,
                          vowelGroupsSelected,
                          setVowelGroupsSelected,
                        )
                      }
                    />
                  </View>
                ))}
              </View>
            </DesktopPanel>
          </View>

          <View style={styles.sideColumn}>
            <DesktopPanel>
              <DesktopSectionTitle
                title="Current batch"
                caption="Use the side rail to confirm the setup before opening the next screen."
              />
              <View style={styles.batchStat}>
                <Text style={styles.batchStatLabel}>Difficulty</Text>
                <Text style={styles.batchStatValue}>{DIFFICULTY_META[difficulty].label}</Text>
              </View>
              <View style={styles.batchStat}>
                <Text style={styles.batchStatLabel}>Consonant classes</Text>
                <Text style={styles.batchStatValue}>{consonantGroupsSelected.length}</Text>
              </View>
              <View style={styles.batchStat}>
                <Text style={styles.batchStatLabel}>Vowel groups</Text>
                <Text style={styles.batchStatValue}>{vowelGroupsSelected.length}</Text>
              </View>
              {!isValid ? (
                <Text style={styles.validationText}>
                  Select at least one consonant class and one vowel group.
                </Text>
              ) : null}
              <TouchableOpacity
                style={[styles.primaryButton, !isValid && styles.disabledButton]}
                onPress={openWordsScreen}
                disabled={!isValid}
                activeOpacity={0.82}
              >
                <Text style={styles.primaryButtonText}>Create Words</Text>
              </TouchableOpacity>
            </DesktopPanel>
          </View>
        </View>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  backButtonText: {
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
  mainGrid: {
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },
  formColumn: {
    flex: 1.2,
    gap: 20,
  },
  sideColumn: {
    width: 320,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  selectionCard: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
    gap: 10,
    justifyContent: "space-between",
  },
  selectionCardActive: {
    borderColor: Sketch.ink,
  },
  selectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Sketch.ink,
  },
  selectionDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: Sketch.inkMuted,
  },
  groupPreview: {
    fontSize: 24,
    lineHeight: 32,
    color: Sketch.inkLight,
  },
  batchStat: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  batchStatLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  batchStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  validationText: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
