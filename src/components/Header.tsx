import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Sketch } from "@/constants/theme";
import {
  getPracticeWordTrackingEnabled,
  setPracticeWordTrackingEnabled,
} from "../utils/practiceWordPreference";

const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_TTS_SPEED = "pref_tts_speed";

export type SettingsState = {
  showRoman: boolean;
  showEnglish: boolean;
  autoplayTTS: boolean;
  ttsSpeed: "slow" | "normal" | "fast";
  autoAddPracticeVocab: boolean;
};

type HeaderProps = {
  title?: string;
  onBack?: () => void;
  showClose?: boolean;
  showSettings?: boolean;
  onSettingsChange?: (settings: SettingsState) => void;
};

export default function Header({
  title,
  onBack,
  showClose,
  showSettings = true,
  onSettingsChange,
}: HeaderProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    showRoman: true,
    showEnglish: true,
    autoplayTTS: false,
    ttsSpeed: "slow",
    autoAddPracticeVocab: true,
  });

  const loadSettings = useCallback(async () => {
    try {
      const [roman, english, tts, speed] = await Promise.all([
        AsyncStorage.getItem(PREF_ROMANIZATION),
        AsyncStorage.getItem(PREF_ENGLISH),
        AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
        AsyncStorage.getItem(PREF_TTS_SPEED),
      ]);
      const autoAddPracticeVocab = await getPracticeWordTrackingEnabled();
      const s: SettingsState = {
        showRoman: roman !== null ? roman === "true" : true,
        showEnglish: english !== null ? english === "true" : true,
        autoplayTTS: tts !== null ? tts === "true" : false,
        ttsSpeed: (speed as SettingsState["ttsSpeed"]) || "slow",
        autoAddPracticeVocab,
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
      Exclude<keyof SettingsState, "autoAddPracticeVocab">,
      string
    > = {
      showRoman: PREF_ROMANIZATION,
      showEnglish: PREF_ENGLISH,
      autoplayTTS: PREF_AUTOPLAY_TTS,
      ttsSpeed: PREF_TTS_SPEED,
    };
    await AsyncStorage.setItem(storageMap[key], String(value));
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

      <Text style={styles.titleText}>{title || "Lesson"}</Text>

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

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Add Practice Words</Text>
                <Text style={styles.settingDesc}>
                  Save new words from grammar practice to your review deck
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
  },

  iconButton: {
    padding: 8,
  },

  titleText: {
    fontWeight: "600",
    fontSize: 17,
    color: Sketch.ink,
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
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
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
    borderRadius: 8,
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
});
