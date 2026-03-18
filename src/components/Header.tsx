import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Sketch } from "@/constants/theme";
import {
  DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  getGrammarExerciseSettings,
  GRAMMAR_EXERCISE_LABELS,
  GrammarExerciseMode,
  GrammarExerciseSettings,
  setGrammarExerciseSettings,
} from "../utils/grammarExerciseSettings";
import {
  getPracticeWordTrackingEnabled,
  setPracticeWordTrackingEnabled,
} from "../utils/practiceWordPreference";
import BrandMark from "./BrandMark";

const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_WORD_BREAKDOWN_TTS = "pref_word_breakdown_tts";
const PREF_TTS_SPEED = "pref_tts_speed";

export type SettingsState = {
  showRoman: boolean;
  showEnglish: boolean;
  autoplayTTS: boolean;
  wordBreakdownTTS: boolean;
  ttsSpeed: "slow" | "normal" | "fast";
  autoAddPracticeVocab: boolean;
  grammarExerciseModes: GrammarExerciseSettings;
};

type HeaderProps = {
  title?: string;
  onBack?: () => void;
  showClose?: boolean;
  showSettings?: boolean;
  showWordBreakdownTtsSetting?: boolean;
  onSettingsChange?: (settings: SettingsState) => void;
};

export default function Header({
  title,
  onBack,
  showClose,
  showSettings = true,
  showWordBreakdownTtsSetting = false,
  onSettingsChange,
}: HeaderProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    showRoman: true,
    showEnglish: true,
    autoplayTTS: false,
    wordBreakdownTTS: false,
    ttsSpeed: "slow",
    autoAddPracticeVocab: true,
    grammarExerciseModes: DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  });

  const loadSettings = useCallback(async () => {
    try {
      const [roman, english, tts, breakdownTts, speed, autoAddPracticeVocab, grammarExerciseModes] =
        await Promise.all([
        AsyncStorage.getItem(PREF_ROMANIZATION),
        AsyncStorage.getItem(PREF_ENGLISH),
        AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
        AsyncStorage.getItem(PREF_WORD_BREAKDOWN_TTS),
        AsyncStorage.getItem(PREF_TTS_SPEED),
        getPracticeWordTrackingEnabled(),
        getGrammarExerciseSettings(),
      ]);
      const s: SettingsState = {
        showRoman: roman !== null ? roman === "true" : true,
        showEnglish: english !== null ? english === "true" : true,
        autoplayTTS: tts !== null ? tts === "true" : false,
        wordBreakdownTTS:
          breakdownTts !== null ? breakdownTts === "true" : false,
        ttsSpeed: (speed as SettingsState["ttsSpeed"]) || "slow",
        autoAddPracticeVocab,
        grammarExerciseModes,
      };
      setSettings(s);
      onSettingsChange?.(s);
    } catch (err) {
      console.error("Failed to load header settings:", err);
    }
  }, [onSettingsChange]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (modalVisible) {
      void loadSettings();
    }
  }, [loadSettings, modalVisible]);

  async function updateSetting<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    onSettingsChange?.(next);

    if (key === "autoAddPracticeVocab") {
      try {
        const saved = await setPracticeWordTrackingEnabled(Boolean(value));
        const synced = { ...next, autoAddPracticeVocab: saved };
        setSettings(synced);
        onSettingsChange?.(synced);
      } catch (err) {
        console.error("Failed to update practice word setting:", err);
        setSettings(settings);
        onSettingsChange?.(settings);
      }
      return;
    }

    const storageMap: Record<
      Exclude<keyof SettingsState, "autoAddPracticeVocab" | "grammarExerciseModes">,
      string
    > = {
      showRoman: PREF_ROMANIZATION,
      showEnglish: PREF_ENGLISH,
      autoplayTTS: PREF_AUTOPLAY_TTS,
      wordBreakdownTTS: PREF_WORD_BREAKDOWN_TTS,
      ttsSpeed: PREF_TTS_SPEED,
    };
    await AsyncStorage.setItem(storageMap[key], String(value));
  }

  async function updateGrammarExerciseMode(targetMode: GrammarExerciseMode) {
    const enabledCount = Object.values(settings.grammarExerciseModes).filter(
      Boolean,
    ).length;
    if (settings.grammarExerciseModes[targetMode] && enabledCount === 1) {
      return;
    }

    const nextModes = {
      ...settings.grammarExerciseModes,
      [targetMode]: !settings.grammarExerciseModes[targetMode],
    };

    try {
      const savedModes = await setGrammarExerciseSettings(nextModes);
      const next = { ...settings, grammarExerciseModes: savedModes };
      setSettings(next);
      onSettingsChange?.(next);
    } catch (err) {
      console.error("Failed to update grammar exercise settings:", err);
    }
  }

  const speedOptions: { label: string; value: SettingsState["ttsSpeed"] }[] = [
    { label: "Slow", value: "slow" },
    { label: "Normal", value: "normal" },
    { label: "Fast", value: "fast" },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={onBack}>
        <Ionicons name={showClose ? "close" : "arrow-back"} size={22} color={Sketch.ink} />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <BrandMark size={24} />
        <Text numberOfLines={1} style={styles.titleText}>
          {title || "Lesson"}
        </Text>
      </View>

      {showSettings ? (
        <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="settings-outline" size={22} color={Sketch.inkLight} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 38 }} />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Sketch.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Romanization</Text>
                  <Text style={styles.settingDesc}>Show phonetic transcription</Text>
                </View>
                <Switch
                  value={settings.showRoman}
                  onValueChange={(v) => updateSetting("showRoman", v)}
                  trackColor={{ false: Sketch.inkFaint, true: Sketch.orange }}
                  thumbColor="white"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>English Translation</Text>
                  <Text style={styles.settingDesc}>Show English meaning</Text>
                </View>
                <Switch
                  value={settings.showEnglish}
                  onValueChange={(v) => updateSetting("showEnglish", v)}
                  trackColor={{ false: Sketch.inkFaint, true: Sketch.orange }}
                  thumbColor="white"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Autoplay Audio</Text>
                  <Text style={styles.settingDesc}>Auto-speak Thai sentences</Text>
                </View>
                <Switch
                  value={settings.autoplayTTS}
                  onValueChange={(v) => updateSetting("autoplayTTS", v)}
                  trackColor={{ false: Sketch.inkFaint, true: Sketch.orange }}
                  thumbColor="white"
                />
              </View>

              {showWordBreakdownTtsSetting ? (
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Word Breakdown TTS (Beta)</Text>
                    <Text style={styles.settingDesc}>
                      Experimental word-by-word audio for grammar breakdown cards. Some voices may sound off.
                    </Text>
                  </View>
                  <Switch
                    value={settings.wordBreakdownTTS}
                    onValueChange={(v) => updateSetting("wordBreakdownTTS", v)}
                    trackColor={{ false: Sketch.inkFaint, true: Sketch.orange }}
                    thumbColor="white"
                  />
                </View>
              ) : null}

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Add Vocabulary</Text>
                  <Text style={styles.settingDesc}>
                    Add words from grammar practice to your review deck
                  </Text>
                </View>
                <Switch
                  value={settings.autoAddPracticeVocab}
                  onValueChange={(v) => void updateSetting("autoAddPracticeVocab", v)}
                  trackColor={{ false: Sketch.inkFaint, true: Sketch.orange }}
                  thumbColor="white"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Speech Speed</Text>
                  <Text style={styles.settingDesc}>Text-to-speech pace</Text>
                </View>
                <View style={styles.speedRow}>
                  {speedOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.speedPill,
                        settings.ttsSpeed === opt.value && styles.speedPillActive,
                      ]}
                      onPress={() => void updateSetting("ttsSpeed", opt.value)}
                    >
                      <Text
                        style={[
                          styles.speedPillText,
                          settings.ttsSpeed === opt.value && styles.speedPillTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.extraSettingsSection}>
                <Text style={styles.extraSettingsTitle}>Grammar Exercises</Text>
                <Text style={styles.extraSettingsDesc}>
                  Choose which grammar practice modes stay in rotation.
                </Text>
                <View style={styles.extraSettingsBody}>
                  <View style={styles.exerciseChipRow}>
                    {(
                      Object.keys(settings.grammarExerciseModes) as GrammarExerciseMode[]
                    ).map((mode) => {
                      const active = settings.grammarExerciseModes[mode];
                      return (
                        <TouchableOpacity
                          key={mode}
                          style={[
                            styles.exerciseChip,
                            active && styles.exerciseChipActive,
                          ]}
                          onPress={() => void updateGrammarExerciseMode(mode)}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.exerciseChipText,
                              active && styles.exerciseChipTextActive,
                            ]}
                          >
                            {GRAMMAR_EXERCISE_LABELS[mode]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.exerciseHint}>
                    Keep at least one exercise on
                  </Text>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },

  iconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  titleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  titleText: {
    fontWeight: "600",
    fontSize: 17,
    color: Sketch.ink,
    flexShrink: 1,
    textAlign: "center",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 0,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Sketch.ink,
  },
  modalBody: {
    paddingBottom: 4,
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 15, fontWeight: "500", color: Sketch.ink },
  settingDesc: { fontSize: 12, fontWeight: "400", color: Sketch.inkMuted, marginTop: 2 },

  speedRow: { flexDirection: "row", gap: 4 },
  speedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: Sketch.paperDark,
  },
  speedPillActive: {
    backgroundColor: Sketch.ink,
  },
  speedPillText: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  speedPillTextActive: {
    color: "white",
  },
  extraSettingsSection: {
    marginTop: 16,
    gap: 10,
  },
  extraSettingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  extraSettingsDesc: {
    fontSize: 12,
    color: Sketch.inkMuted,
    lineHeight: 18,
  },
  extraSettingsBody: {
    gap: 10,
  },
  exerciseChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exerciseChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  exerciseChipActive: {
    backgroundColor: Sketch.orange + "12",
    borderColor: Sketch.orange,
  },
  exerciseChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
  exerciseChipTextActive: {
    color: Sketch.orange,
    fontWeight: "600",
  },
  exerciseHint: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
});
