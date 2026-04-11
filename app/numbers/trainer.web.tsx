import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import AccentSwitch from "@/src/components/AccentSwitch";
import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import NumbersTrainerMobileScreen from "@/src/screens/mobile/NumbersTrainerMobileScreen";
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
import {
  createNumbersTrainerQuestion,
  NumbersTrainerOption,
  NumbersTrainerQuestion,
} from "@/src/data/numbers";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";

const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_TTS_SPEED = "pref_tts_speed";

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

function OptionCard({
  option,
  showRoman,
  state,
  onPress,
}: {
  option: NumbersTrainerOption;
  showRoman: boolean;
  state: "idle" | "correct" | "incorrect" | "revealed";
  onPress: () => void;
}) {
  const isMutedIncorrect = state === "incorrect";
  const stateStyle =
    state === "correct" || state === "revealed"
      ? styles.optionCardCorrect
      : state === "incorrect"
        ? styles.optionCardIncorrect
        : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={state !== "idle"}
      style={({ hovered, pressed }) => [
        styles.optionCard,
        stateStyle,
        state === "idle" && (hovered || pressed) && styles.optionCardHover,
      ]}
    >
      <Text style={[styles.optionPrimary, isMutedIncorrect && styles.optionPrimaryMuted]}>
        {option.primary}
      </Text>
      {showRoman && option.secondary ? (
        <Text
          style={[styles.optionSecondary, isMutedIncorrect && styles.optionSecondaryMuted]}
        >
          {option.secondary}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function NumbersTrainerWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();
  const [question, setQuestion] = useState<NumbersTrainerQuestion>(() =>
    createNumbersTrainerQuestion("read"),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [showRoman, setShowRoman] = useState(true);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");

  const loadQuestion = useCallback(() => {
    setQuestion(createNumbersTrainerQuestion("read"));
    setSelectedId(null);
    setResult(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const [romanRaw, autoplayRaw, speedRaw] = await Promise.all([
          AsyncStorage.getItem(PREF_ROMANIZATION),
          AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
          AsyncStorage.getItem(PREF_TTS_SPEED),
        ]);
        if (cancelled) return;
        setShowRoman(romanRaw !== null ? romanRaw === "true" : true);
        setAutoplayTTS(autoplayRaw === "true");
        if (speedRaw === "slow" || speedRaw === "normal" || speedRaw === "fast") {
          setTtsSpeed(speedRaw);
        }
      } catch {
        // Keep defaults if settings fail to load.
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAutoplayChange(value: boolean) {
    setAutoplayTTS(value);
    await AsyncStorage.setItem(PREF_AUTOPLAY_TTS, String(value));
  }

  async function handleRomanizationChange(value: boolean) {
    setShowRoman(value);
    await AsyncStorage.setItem(PREF_ROMANIZATION, String(value));
  }

  function handleOptionPress(optionId: string) {
    if (selectedId) return;
    const selectedOption = question.options.find((option) => option.id === optionId);
    const isCorrect = optionId === question.correctOptionId;
    if (autoplayTTS && selectedOption) {
      void playSentence(selectedOption.primary, { speed: ttsSpeed });
    }
    setSelectedId(optionId);
    setResult(isCorrect ? "correct" : "incorrect");
  }

  function optionState(optionId: string) {
    if (!selectedId) return "idle" as const;
    if (optionId === question.correctOptionId) {
      return selectedId === question.correctOptionId ? ("correct" as const) : ("revealed" as const);
    }
    if (optionId === selectedId) return "incorrect" as const;
    return "idle" as const;
  }

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <NumbersTrainerMobileScreen />;
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
                <Text style={styles.eyebrow}>Numbers trainer</Text>
                <Text style={styles.title}>Practice Thai Numbers</Text>
                <Text style={styles.subtitle}>
                  Practice reading digits, Thai numerals, and bigger number patterns.
                </Text>
              </View>
              <View style={styles.toolbar}>
                <Pressable
                  onPress={() => setShowSettings(true)}
                  style={({ hovered, pressed }) => [
                    styles.iconButton,
                    (hovered || pressed) && styles.lightButtonActive,
                  ]}
                >
                  <Ionicons name="settings-outline" size={18} color={BRAND.ink} />
                </Pressable>
                <Pressable
                  onPress={() => router.back()}
                  style={({ hovered, pressed }) => [
                    styles.secondaryButton,
                    (hovered || pressed) && styles.lightButtonActive,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.pageGrid}>
              <View style={styles.sideColumn}>
                <View style={styles.surfaceCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeading}>Audio</Text>
                    <Text style={styles.sectionSubheading}>
                      Listen first if you want to hear the full number before answering.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => void playSentence(question.audioText, { speed: ttsSpeed })}
                    style={({ hovered, pressed }) => [
                      styles.lightButtonWide,
                      (hovered || pressed) && styles.lightButtonActive,
                    ]}
                  >
                    <Ionicons name="volume-medium-outline" size={18} color={BRAND.ink} />
                    <Text style={styles.lightButtonWideText}>Play audio</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.mainColumn}>
                <View style={styles.surfaceCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeading}>{question.promptTitle}</Text>
                    <Text style={styles.sectionSubheading}>{question.promptHint}</Text>
                  </View>

                  <View style={styles.promptCard}>
                    <Text style={styles.promptEyebrow}>{question.eyebrow}</Text>
                    <Text style={styles.promptPrimary}>{question.promptPrimary}</Text>
                    {question.promptSecondary ? (
                      <Text style={styles.promptSecondary}>{question.promptSecondary}</Text>
                    ) : null}
                    {question.promptTertiary ? (
                      <Text style={styles.promptTertiary}>{question.promptTertiary}</Text>
                    ) : null}
                  </View>

                  <View style={styles.optionsGrid}>
                    {question.options.map((option) => (
                      <OptionCard
                        key={option.id}
                        option={option}
                        showRoman={showRoman}
                        state={optionState(option.id)}
                        onPress={() => handleOptionPress(option.id)}
                      />
                    ))}
                  </View>

                  {!selectedId ? (
                    <Pressable
                      onPress={loadQuestion}
                      style={({ hovered, pressed }) => [
                        styles.lightButtonWide,
                        styles.utilityButton,
                        (hovered || pressed) && styles.lightButtonActive,
                      ]}
                    >
                      <Text style={styles.lightButtonWideText}>Skip</Text>
                    </Pressable>
                  ) : null}

                  {result ? (
                    <View
                      style={[
                        styles.feedbackCard,
                        result === "correct"
                          ? styles.feedbackCardCorrect
                          : styles.feedbackCardIncorrect,
                      ]}
                    >
                      <Text style={styles.feedbackTitle}>
                        {result === "correct" ? "Correct" : "Not quite"}
                      </Text>
                      <Text style={styles.feedbackBody}>{question.feedback}</Text>
                    </View>
                  ) : null}

                  <Pressable
                    onPress={loadQuestion}
                    disabled={!result}
                    style={({ hovered, pressed }) => [
                      styles.primaryButton,
                      !result && styles.primaryButtonDisabled,
                      result && (hovered || pressed) && styles.primaryButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        !result && styles.primaryButtonTextDisabled,
                      ]}
                    >
                      Next
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </DesktopAppShell>

      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSettings(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <Pressable
                onPress={() => setShowSettings(false)}
                style={({ hovered, pressed }) => [
                  styles.iconButton,
                  (hovered || pressed) && styles.lightButtonActive,
                ]}
              >
                <Ionicons name="close" size={18} color={BRAND.ink} />
              </Pressable>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingLabel}>Romanization</Text>
                <Text style={styles.settingDescription}>
                  Show phonetic reading on the answer cards.
                </Text>
              </View>
              <AccentSwitch value={showRoman} onValueChange={handleRomanizationChange} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingLabel}>Autoplay audio</Text>
                <Text style={styles.settingDescription}>
                  Play the number you tapped automatically.
                </Text>
              </View>
              <AccentSwitch value={autoplayTTS} onValueChange={handleAutoplayChange} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: BRAND.bg },
  pageContent: { paddingHorizontal: 28, paddingVertical: 28 },
  shell: { width: "100%", maxWidth: DESKTOP_PAGE_WIDTH, alignSelf: "center", gap: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  headerCopy: { flex: 1, gap: 8 },
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
    alignItems: "center",
    gap: 10,
  },
  pageGrid: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  sideColumn: {
    width: 260,
  },
  mainColumn: {
    flex: 1,
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
    gap: 4,
  },
  sectionHeading: {
    color: BRAND.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sectionSubheading: {
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: BODY_FONT,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  secondaryButton: {
    minHeight: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  secondaryButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  lightButtonWide: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  lightButtonWideText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D2237",
    backgroundColor: BRAND.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: BODY_FONT,
  },
  primaryButtonDisabled: {
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  primaryButtonTextDisabled: {
    color: BRAND.inkSoft,
  },
  lightButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  promptCard: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: WEB_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    boxShadow: WEB_SENTENCE_SHADOW as any,
  },
  promptEyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: BRAND.inkSoft,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  promptPrimary: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -1.1,
    fontFamily: DISPLAY_FONT,
  },
  promptSecondary: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: BRAND.navy,
    textAlign: "center",
    fontFamily: BODY_FONT,
  },
  promptTertiary: {
    maxWidth: 760,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: BRAND.ink,
    textAlign: "center",
    fontFamily: BODY_FONT,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  optionCard: {
    width: "48.8%",
    minHeight: 96,
    borderRadius: WEB_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    justifyContent: "center",
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  optionCardHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  optionCardCorrect: {
    borderColor: BRAND.navy,
    borderWidth: 2,
    backgroundColor: BRAND.paper,
  },
  optionCardIncorrect: {
    borderColor: BRAND.edge,
    backgroundColor: BRAND.panel,
  },
  optionPrimary: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  optionPrimaryMuted: {
    color: BRAND.muted,
  },
  optionSecondary: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  optionSecondaryMuted: {
    color: BRAND.muted,
  },
  utilityButton: {
    marginTop: 2,
  },
  feedbackCard: {
    borderRadius: WEB_RADIUS.lg,
    padding: 14,
    gap: 4,
  },
  feedbackCardCorrect: {
    borderWidth: 2,
    borderColor: BRAND.navy,
    backgroundColor: BRAND.paper,
  },
  feedbackCardIncorrect: {
    borderWidth: 1,
    borderColor: BRAND.edge,
    backgroundColor: BRAND.panel,
  },
  feedbackTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  feedbackBody: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 18, 23, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 22,
    gap: 18,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    paddingTop: 18,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
});
