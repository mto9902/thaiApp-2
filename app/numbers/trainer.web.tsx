import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Sketch } from "@/constants/theme";
import AccentSwitch from "@/src/components/AccentSwitch";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import {
  createNumbersTrainerQuestion,
  NumbersTrainerOption,
  NumbersTrainerQuestion,
} from "@/src/data/numbers";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";

const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_TTS_SPEED = "pref_tts_speed";

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
  return (
    <Pressable
      style={[
        styles.optionCard,
        state === "correct" && styles.optionCardCorrect,
        state === "incorrect" && styles.optionCardIncorrect,
        state === "revealed" && styles.optionCardRevealed,
      ]}
      onPress={onPress}
      disabled={state !== "idle"}
    >
      <Text style={styles.optionPrimary}>{option.primary}</Text>
      {showRoman && option.secondary ? (
        <Text style={styles.optionSecondary}>{option.secondary}</Text>
      ) : null}
    </Pressable>
  );
}

export default function NumbersTrainerWeb() {
  const router = useRouter();
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
        // Ignore settings load failure and keep defaults.
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
    if (optionId === question.correctOptionId) return "revealed" as const;
    if (optionId === selectedId && selectedId !== question.correctOptionId) {
      return "incorrect" as const;
    }
    if (optionId === selectedId && selectedId === question.correctOptionId) {
      return "correct" as const;
    }
    return "idle" as const;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Numbers trainer"
        title="Practice Thai Numbers"
        subtitle="Practice reading digits, Thai numerals, and bigger number patterns."
        toolbar={
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
              activeOpacity={0.82}
            >
              <Ionicons name="settings-outline" size={18} color={Sketch.inkLight} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.82}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View style={styles.pageGrid}>
          <View style={styles.sideColumn}>
            <DesktopPanel>
              <DesktopSectionTitle
                title="Prompt audio"
                caption="Use the same Thai audio path as the rest of the app."
              />
              <TouchableOpacity
                style={styles.audioPanelButton}
                onPress={() => void playSentence(question.audioText, { speed: ttsSpeed })}
                activeOpacity={0.82}
              >
                <Ionicons name="volume-medium-outline" size={18} color={Sketch.accent} />
                <Text style={styles.audioPanelButtonText}>Hear the Thai</Text>
              </TouchableOpacity>
            </DesktopPanel>
          </View>

          <View style={styles.mainColumn}>
            <DesktopPanel>
              <DesktopSectionTitle
                title={question.promptTitle}
                caption={question.promptHint}
              />

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
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={loadQuestion}
                  activeOpacity={0.82}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
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

              <TouchableOpacity
                style={[styles.nextButton, !result && styles.nextButtonDisabled]}
                onPress={loadQuestion}
                activeOpacity={0.82}
                disabled={!result}
              >
                <Text
                  style={[
                    styles.nextButtonText,
                    !result && styles.nextButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </DesktopPanel>
          </View>
        </View>
      </DesktopPage>

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
              <TouchableOpacity onPress={() => setShowSettings(false)} activeOpacity={0.82}>
                <Ionicons name="close" size={22} color={Sketch.ink} />
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingLabel}>Romanization</Text>
                <Text style={styles.settingDescription}>
                  Show phonetic transcription on answer cards.
                </Text>
              </View>
              <AccentSwitch value={showRoman} onValueChange={handleRomanizationChange} />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingLabel}>Autoplay Audio</Text>
                <Text style={styles.settingDescription}>
                  Automatically play the answer card you tap.
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
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  pageGrid: {
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },
  sideColumn: {
    width: 340,
    gap: 20,
  },
  mainColumn: {
    flex: 1,
  },
  audioPanelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingVertical: 16,
  },
  audioPanelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
  promptCard: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  promptEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  promptPrimary: {
    fontSize: 56,
    lineHeight: 62,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -1.5,
  },
  promptSecondary: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: Sketch.accent,
    textAlign: "center",
  },
  promptTertiary: {
    maxWidth: 760,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  optionsGrid: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  optionCard: {
    width: "48.8%",
    minHeight: 118,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 8,
    justifyContent: "center",
  },
  optionCardCorrect: {
    borderColor: Sketch.green,
  },
  optionCardIncorrect: {
    borderColor: Sketch.red,
  },
  optionCardRevealed: {
    borderColor: Sketch.green,
    backgroundColor: "#F7FBF7",
  },
  optionPrimary: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: Sketch.ink,
  },
  optionSecondary: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkLight,
  },
  skipButton: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  feedbackCard: {
    marginTop: 20,
    borderWidth: 1,
    padding: 16,
    gap: 4,
    backgroundColor: Sketch.paper,
  },
  feedbackCardCorrect: {
    borderColor: Sketch.green,
  },
  feedbackCardIncorrect: {
    borderColor: Sketch.red,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  feedbackBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
  nextButton: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  nextButtonDisabled: {
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nextButtonTextDisabled: {
    color: Sketch.inkMuted,
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
    maxWidth: 420,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 22,
    gap: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
    paddingTop: 18,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkLight,
  },
});
