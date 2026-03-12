import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ── Preference keys (shared with PracticeCSV) ────────────────────────────────
const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_TTS_SPEED = "pref_tts_speed";

export type SettingsState = {
  showRoman: boolean;
  showEnglish: boolean;
  autoplayTTS: boolean;
  ttsSpeed: "slow" | "normal" | "fast";
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
    autoplayTTS: true,
    ttsSpeed: "slow",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const [roman, english, tts, speed] = await Promise.all([
      AsyncStorage.getItem(PREF_ROMANIZATION),
      AsyncStorage.getItem(PREF_ENGLISH),
      AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
      AsyncStorage.getItem(PREF_TTS_SPEED),
    ]);
    const s: SettingsState = {
      showRoman: roman !== null ? roman === "true" : true,
      showEnglish: english !== null ? english === "true" : true,
      autoplayTTS: tts !== null ? tts === "true" : true,
      ttsSpeed: (speed as SettingsState["ttsSpeed"]) || "slow",
    };
    setSettings(s);
  }

  function updateSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    onSettingsChange?.(next);

    // Persist
    const storageMap: Record<string, string> = {
      showRoman: PREF_ROMANIZATION,
      showEnglish: PREF_ENGLISH,
      autoplayTTS: PREF_AUTOPLAY_TTS,
      ttsSpeed: PREF_TTS_SPEED,
    };
    AsyncStorage.setItem(storageMap[key], String(value));
  }

  const speedOptions: { label: string; value: SettingsState["ttsSpeed"] }[] = [
    { label: "SLOW", value: "slow" },
    { label: "NORMAL", value: "normal" },
    { label: "FAST", value: "fast" },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={onBack}>
        <Ionicons name={showClose ? "close-outline" : "arrow-back"} size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{title || "LESSON"}</Text>
      </View>

      {showSettings ? (
        <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton}>
          <Ionicons name="settings-outline" size={24} color="transparent" />
        </View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SETTINGS</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* Romanization */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Romanization</Text>
                <Text style={styles.settingDesc}>Show phonetic transcription</Text>
              </View>
              <Switch
                value={settings.showRoman}
                onValueChange={(v) => updateSetting("showRoman", v)}
                trackColor={{ false: "#E0E0E0", true: "#66BB6A" }}
                thumbColor="white"
              />
            </View>

            {/* English translation */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>English Translation</Text>
                <Text style={styles.settingDesc}>Show English meaning</Text>
              </View>
              <Switch
                value={settings.showEnglish}
                onValueChange={(v) => updateSetting("showEnglish", v)}
                trackColor={{ false: "#E0E0E0", true: "#66BB6A" }}
                thumbColor="white"
              />
            </View>

            {/* Autoplay TTS */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Autoplay Audio</Text>
                <Text style={styles.settingDesc}>Auto-speak Thai sentences</Text>
              </View>
              <Switch
                value={settings.autoplayTTS}
                onValueChange={(v) => updateSetting("autoplayTTS", v)}
                trackColor={{ false: "#E0E0E0", true: "#66BB6A" }}
                thumbColor="white"
              />
            </View>

            {/* TTS Speed */}
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
                    onPress={() => updateSetting("ttsSpeed", opt.value)}
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
          </View>
        </TouchableOpacity>
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
    paddingVertical: 10,
    marginTop: 10,
  },

  iconButton: {
    padding: 8,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },

  titleContainer: {
    backgroundColor: "#FFFF00",
    borderWidth: 2,
    borderColor: "black",
    paddingHorizontal: 16,
    paddingVertical: 6,

    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  titleText: {
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Setting rows
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  settingDesc: { fontSize: 12, fontWeight: "500", color: "#999", marginTop: 2 },

  // Speed selector
  speedRow: { flexDirection: "row", gap: 4 },
  speedPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "white",
  },
  speedPillActive: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  speedPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#999",
  },
  speedPillTextActive: {
    color: "white",
  },
});
