import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import AlphabetTrainerMobileScreen from "@/src/screens/mobile/AlphabetTrainerMobileScreen";
import DesktopAppShell from "@/src/components/web/DesktopAppShell";
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
} from "@/src/components/web/designSystem";
import {
  CONSONANT_INFO,
  DIFFICULTY_META,
  TrainerDifficulty,
  VOWEL_INFO,
} from "@/src/data/trainerOptions";
import { alphabet } from "@/src/data/alphabet";
import { vowels } from "@/src/data/vowels";

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

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
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.selectionCard,
        active && styles.selectionCardActive,
        (hovered || pressed) && styles.selectionCardHover,
      ]}
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
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.selectionCard,
        styles.groupCard,
        active && styles.selectionCardActive,
        (hovered || pressed) && styles.selectionCardHover,
      ]}
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

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <AlphabetTrainerMobileScreen />;
  }

  const columns = width >= 1320 ? 3 : width >= 980 ? 2 : 1;
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
                <Text style={styles.title}>Alphabet Trainer</Text>
                <Text style={styles.subtitle}>
                  Choose the letters, vowels, and difficulty you want, then launch a
                  focused reading batch.
                </Text>
              </View>

              <Pressable
                onPress={() => router.back()}
                style={({ hovered, pressed }) => [
                  styles.backButton,
                  (hovered || pressed) && styles.lightButtonActive,
                ]}
              >
                <Ionicons name="arrow-back" size={18} color={BRAND.ink} />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            </View>

            <View style={styles.summaryStrip}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{consonantCount}</Text>
                <Text style={styles.summaryLabel}>letters</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{vowelCount}</Text>
                <Text style={styles.summaryLabel}>vowels</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{DIFFICULTY_META[difficulty].label}</Text>
                <Text style={styles.summaryLabel}>difficulty</Text>
              </View>
            </View>

            <View style={styles.mainGrid}>
              <View style={styles.formColumn}>
                <View style={styles.surfaceCard}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderText}>
                      <Text style={styles.sectionHeading}>Difficulty</Text>
                      <Text style={styles.sectionSubheading}>
                        Choose how simple or tricky the word batch should be.
                      </Text>
                    </View>
                  </View>
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
                </View>

                <View style={styles.surfaceCard}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderText}>
                      <Text style={styles.sectionHeading}>Consonant classes</Text>
                      <Text style={styles.sectionSubheading}>
                        {consonantCount} letters selected
                      </Text>
                    </View>
                  </View>
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
                </View>

                <View style={styles.surfaceCard}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderText}>
                      <Text style={styles.sectionHeading}>Vowel groups</Text>
                      <Text style={styles.sectionSubheading}>
                        {vowelCount} vowels selected
                      </Text>
                    </View>
                  </View>
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
                </View>
              </View>

              <View style={styles.sideColumn}>
                <View style={styles.surfaceCard}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderText}>
                      <Text style={styles.sectionHeading}>Current batch</Text>
                      <Text style={styles.sectionSubheading}>
                        Use the side rail to confirm the setup before opening the next screen.
                      </Text>
                    </View>
                  </View>

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

                  <Pressable
                    onPress={openWordsScreen}
                    disabled={!isValid}
                    style={({ hovered, pressed }) => [
                      styles.primaryButton,
                      (hovered || pressed) && isValid && styles.primaryButtonActive,
                      !isValid && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Create Words</Text>
                  </Pressable>
                </View>
              </View>
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
  backButton: {
    minHeight: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  lightButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  backButtonText: {
    color: BRAND.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: BODY_FONT,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  selectionCard: {
    minHeight: 120,
    borderRadius: WEB_RADIUS.md,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    padding: 16,
    gap: 10,
    justifyContent: "space-between",
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  selectionCardActive: {
    borderColor: BRAND.navy,
    borderWidth: 1.5,
    backgroundColor: BRAND.paper,
  },
  selectionCardHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: "0 1px 0 0 #d4d4d4, 0 1px 0 0 #d4d4d4, 0 2px 3px rgba(16, 42, 67, 0.04)" as any,
  },
  groupCard: {
    minHeight: 132,
  },
  selectionTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  selectionDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  groupPreview: {
    fontSize: 24,
    lineHeight: 34,
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  batchStat: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  batchStatLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: BODY_FONT,
  },
  batchStatValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  validationText: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0D2237",
    backgroundColor: BRAND.navy,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: BODY_FONT,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
