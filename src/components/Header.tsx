import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppRadius, AppSketch } from "@/constants/theme-app";
import {
  WEB_CARD_SHADOW,
  WEB_BODY_FONT,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
} from "@/src/components/web/designSystem";
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
import AccentSwitch from "./AccentSwitch";
import BrandMark from "./BrandMark";

const IS_WEB = Platform.OS === "web";
const BODY_FONT = IS_WEB ? WEB_BODY_FONT : undefined;
const DISPLAY_FONT = IS_WEB ? WEB_DISPLAY_FONT : undefined;
const WEB_LIGHT_BASE = IS_WEB
  ? ({ boxShadow: WEB_LIGHT_BUTTON_SHADOW as any, ...WEB_INTERACTIVE_TRANSITION } as const)
  : {};
const WEB_NAVY_BASE = IS_WEB
  ? ({ boxShadow: WEB_NAVY_BUTTON_SHADOW as any, ...WEB_INTERACTIVE_TRANSITION } as const)
  : {};
const WEB_CARD_BASE = IS_WEB ? ({ boxShadow: WEB_CARD_SHADOW as any } as const) : {};

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
  showBrandMark?: boolean;
  showWordBreakdownTtsSetting?: boolean;
  onSettingsChange?: (settings: SettingsState) => void;
};

export default function Header({
  title,
  onBack,
  showClose,
  showSettings = true,
  showBrandMark = false,
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
    const optimisticNext = { ...settings, grammarExerciseModes: nextModes };

    setSettings(optimisticNext);
    onSettingsChange?.(optimisticNext);

    try {
      const savedModes = await setGrammarExerciseSettings(nextModes);
      const next = { ...settings, grammarExerciseModes: savedModes };
      setSettings(next);
      onSettingsChange?.(next);
    } catch (err) {
      console.error("Failed to update grammar exercise settings:", err);
      setSettings(settings);
      onSettingsChange?.(settings);
    }
  }

  const speedOptions: { label: string; value: SettingsState["ttsSpeed"] }[] = [
    { label: "Slow", value: "slow" },
    { label: "Normal", value: "normal" },
    { label: "Fast", value: "fast" },
  ];

  const getInteractiveStateStyle = (
    variant: "light" | "navy",
    hovered: boolean,
    pressed: boolean,
  ) =>
    IS_WEB && (hovered || pressed)
      ? ({
          transform: WEB_DEPRESSED_TRANSFORM as any,
          boxShadow:
            variant === "navy"
              ? (WEB_NAVY_BUTTON_PRESSED as any)
              : (WEB_LIGHT_BUTTON_PRESSED as any),
        } as const)
      : null;

  return (
    <View style={styles.container}>
      <Pressable
        style={({ hovered, pressed }) => [
          styles.iconButton,
          WEB_LIGHT_BASE,
          getInteractiveStateStyle("light", hovered, pressed),
        ]}
        onPress={onBack}
      >
        <Ionicons
          name={showClose ? "close" : "arrow-back"}
          size={18}
          color={AppSketch.ink}
        />
      </Pressable>

      <View style={styles.titleWrap}>
        {showBrandMark ? <BrandMark size={24} /> : null}
        <Text numberOfLines={1} style={styles.titleText}>
          {title || "Lesson"}
        </Text>
      </View>

      {showSettings ? (
        <Pressable
          style={({ hovered, pressed }) => [
            styles.iconButton,
            WEB_LIGHT_BASE,
            getInteractiveStateStyle("light", hovered, pressed),
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="settings-outline" size={18} color={AppSketch.ink} />
        </Pressable>
      ) : (
        <View style={styles.iconButtonPlaceholder} />
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
          <Pressable style={[styles.modalCard, WEB_CARD_BASE]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={({ hovered, pressed }) => [
                  styles.modalCloseButton,
                  WEB_LIGHT_BASE,
                  getInteractiveStateStyle("light", hovered, pressed),
                ]}
              >
                <Ionicons name="close" size={18} color={AppSketch.ink} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <View style={styles.sectionStack}>
                <View style={styles.settingCard}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Romanization</Text>
                    <Text style={styles.settingDesc}>Show phonetic transcription</Text>
                  </View>
                  <AccentSwitch
                    value={settings.showRoman}
                    onValueChange={(v) => updateSetting("showRoman", v)}
                  />
                </View>

                <View style={styles.settingCard}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>English Translation</Text>
                    <Text style={styles.settingDesc}>Show English meaning</Text>
                  </View>
                  <AccentSwitch
                    value={settings.showEnglish}
                    onValueChange={(v) => updateSetting("showEnglish", v)}
                  />
                </View>

                <View style={styles.settingCard}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Autoplay Audio</Text>
                    <Text style={styles.settingDesc}>Auto-speak Thai sentences</Text>
                  </View>
                  <AccentSwitch
                    value={settings.autoplayTTS}
                    onValueChange={(v) => updateSetting("autoplayTTS", v)}
                  />
                </View>

                {showWordBreakdownTtsSetting ? (
                  <View style={styles.settingCard}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>Word Breakdown TTS (Beta)</Text>
                      <Text style={styles.settingDesc}>
                        Experimental word-by-word audio for grammar breakdown cards. Some voices may sound off.
                      </Text>
                    </View>
                    <AccentSwitch
                      value={settings.wordBreakdownTTS}
                      onValueChange={(v) => updateSetting("wordBreakdownTTS", v)}
                    />
                  </View>
                ) : null}

                <View style={styles.settingCard}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Add Vocabulary</Text>
                    <Text style={styles.settingDesc}>
                      Add words from grammar practice to your review deck
                    </Text>
                  </View>
                  <AccentSwitch
                    value={settings.autoAddPracticeVocab}
                    onValueChange={(v) => void updateSetting("autoAddPracticeVocab", v)}
                  />
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Speech Speed</Text>
                  <Text style={styles.sectionDesc}>Text-to-speech pace</Text>
                </View>
                <View style={styles.speedRow}>
                  {speedOptions.map((opt) => {
                    const active = settings.ttsSpeed === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={({ hovered, pressed }) => [
                          styles.speedButton,
                          WEB_LIGHT_BASE,
                          active && styles.speedButtonActive,
                          active && WEB_NAVY_BASE,
                          getInteractiveStateStyle(active ? "navy" : "light", hovered, pressed),
                        ]}
                        onPress={() => void updateSetting("ttsSpeed", opt.value)}
                      >
                        <Text
                          style={[
                            styles.speedButtonText,
                            active && styles.speedButtonTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Grammar Exercises</Text>
                  <Text style={styles.sectionDesc}>
                    Choose which grammar practice modes stay in rotation.
                  </Text>
                </View>
                <View style={styles.sectionStack}>
                  {(
                    Object.keys(settings.grammarExerciseModes) as GrammarExerciseMode[]
                  ).map((mode) => (
                    <View key={mode} style={styles.settingCard}>
                      <View style={styles.settingInfo}>
                        <Text
                          style={styles.settingLabel}
                        >
                          {GRAMMAR_EXERCISE_LABELS[mode]}
                        </Text>
                        <Text style={styles.settingDesc}>
                          Include this practice mode in the lesson rotation.
                        </Text>
                      </View>
                      <AccentSwitch
                        value={settings.grammarExerciseModes[mode]}
                        onValueChange={() => void updateGrammarExerciseMode(mode)}
                      />
                    </View>
                  ))}
                </View>
                <Text style={styles.exerciseHint}>Keep at least one exercise on</Text>
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
    width: 40,
    height: 40,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
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
    fontWeight: "700",
    fontSize: 17,
    color: AppSketch.ink,
    flexShrink: 1,
    textAlign: "center",
    fontFamily: BODY_FONT,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16,42,67,0.18)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.xl,
    borderWidth: 1,
    borderColor: AppSketch.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    width: "100%",
    maxWidth: 460,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    color: AppSketch.ink,
    fontFamily: DISPLAY_FONT,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    paddingBottom: 4,
    gap: 14,
  },
  sectionStack: {
    gap: 10,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeading: {
    gap: 3,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: AppSketch.ink,
    fontFamily: DISPLAY_FONT,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: AppSketch.inkMuted,
    fontFamily: BODY_FONT,
  },
  settingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...WEB_LIGHT_BASE,
  },
  settingInfo: { flex: 1, marginRight: 12, gap: 3 },
  settingLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: AppSketch.ink,
    fontFamily: BODY_FONT,
  },
  settingDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
    color: AppSketch.inkMuted,
    fontFamily: BODY_FONT,
  },
  speedRow: { flexDirection: "row", gap: 8 },
  speedButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  speedButtonActive: {
    borderColor: AppSketch.primaryDark,
    backgroundColor: AppSketch.primary,
  },
  speedButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
    fontFamily: BODY_FONT,
  },
  speedButtonTextActive: {
    color: "white",
  },
  exerciseHint: {
    fontSize: 12,
    lineHeight: 18,
    color: AppSketch.inkMuted,
    fontFamily: BODY_FONT,
  },
});
