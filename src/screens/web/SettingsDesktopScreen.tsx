import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  StyleProp,
  Text,
  TextStyle,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

import { Sketch } from "@/constants/theme";
import AccentSwitch from "@/src/components/AccentSwitch";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import {
  WEB_BODY_FONT,
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
import { API_BASE } from "@/src/config";
import {
  openPrivacyPolicy,
  openTermsOfService,
  SUPPORT_EMAIL,
} from "@/src/utils/legalLinks";
import {
  getEmailLocalPart,
  getProfileDisplayName,
} from "@/src/utils/profileName";
import {
  DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  getGrammarExerciseSettings,
  GRAMMAR_EXERCISE_LABELS,
  GrammarExerciseMode,
  GrammarExerciseSettings,
  setGrammarExerciseSettings,
} from "@/src/utils/grammarExerciseSettings";
import {
  getPracticeWordTrackingEnabled,
  setPracticeWordTrackingEnabled,
} from "@/src/utils/practiceWordPreference";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { clearAuthState } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";

type SettingsProfile = {
  id: number;
  email: string;
  display_name?: string | null;
  is_admin?: boolean;
  can_review_content?: boolean;
};

type ConfirmAction = "reset" | "delete" | null;

const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_WORD_BREAKDOWN_TTS = "pref_word_breakdown_tts";
const PREF_TTS_SPEED = "pref_tts_speed";

type DesktopSettingsState = {
  showRoman: boolean;
  showEnglish: boolean;
  autoplayTTS: boolean;
  wordBreakdownTTS: boolean;
  ttsSpeed: "slow" | "normal" | "fast";
  autoAddPracticeVocab: boolean;
  grammarExerciseModes: GrammarExerciseSettings;
};

type SettingsButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
};

type SettingsChipButtonProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

const SOFT_LINE = "#E5E5E5";
const SOFT_PANEL = "#FAFAFA";

function SettingsButton({
  label,
  onPress,
  variant = "secondary",
  disabled,
  style,
  textStyle,
  icon,
}: SettingsButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.buttonBase,
        variant === "primary"
          ? styles.primaryButton
          : variant === "danger"
            ? styles.dangerButton
            : styles.secondaryButton,
        (hovered || pressed) &&
          !disabled &&
          (variant === "primary"
            ? styles.primaryButtonActive
            : variant === "danger"
              ? styles.dangerButtonActive
              : styles.secondaryButtonActive),
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={variant === "primary" ? "#FFFFFF" : variant === "danger" ? Sketch.accent : Sketch.ink}
        />
      ) : null}
      <Text
        selectable={false}
        style={[
          styles.buttonText,
          variant === "primary"
            ? styles.primaryButtonText
            : variant === "danger"
              ? styles.dangerButtonText
              : styles.secondaryButtonText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SettingsChipButton({
  label,
  active,
  onPress,
}: SettingsChipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.optionChip,
        active && styles.optionChipActive,
        (hovered || pressed) && styles.optionChipPressed,
      ]}
    >
      <Text
        selectable={false}
        style={[styles.optionChipText, active && styles.optionChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function SettingsWebScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportStatus, setSupportStatus] = useState<string | null>(null);
  const [supportBanner, setSupportBanner] = useState<string | null>(null);
  const [settings, setSettings] = useState<DesktopSettingsState>({
    showRoman: true,
    showEnglish: true,
    autoplayTTS: false,
    wordBreakdownTTS: false,
    ttsSpeed: "slow",
    autoAddPracticeVocab: true,
    grammarExerciseModes: DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  });
  const {
    busy: premiumBusy,
    billingProvider,
    isPremium,
    isSupported,
    canMakePurchases,
    openSubscriptionManager,
    restorePremiumAccess,
  } = usePremiumAccess();

  const loadProfile = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load profile (${res.status})`);
      }

      const [
        data,
        roman,
        english,
        autoplay,
        breakdownTts,
        speed,
        autoAddPracticeVocab,
        grammarExerciseModes,
      ] = await Promise.all([
        res.json(),
        AsyncStorage.getItem(PREF_ROMANIZATION),
        AsyncStorage.getItem(PREF_ENGLISH),
        AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
        AsyncStorage.getItem(PREF_WORD_BREAKDOWN_TTS),
        AsyncStorage.getItem(PREF_TTS_SPEED),
        getPracticeWordTrackingEnabled(),
        getGrammarExerciseSettings(),
      ]);

      setProfile(data);
      setDraftDisplayName(data.display_name ?? "");
      setSupportEmail(data.email ?? "");
      setSettings({
        showRoman: roman !== null ? roman === "true" : true,
        showEnglish: english !== null ? english === "true" : true,
        autoplayTTS: autoplay !== null ? autoplay === "true" : false,
        wordBreakdownTTS:
          breakdownTts !== null ? breakdownTts === "true" : false,
        ttsSpeed: (speed as DesktopSettingsState["ttsSpeed"]) || "slow",
        autoAddPracticeVocab,
        grammarExerciseModes,
      });
    } catch (err) {
      console.error("Failed to load settings profile:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const displayName = getProfileDisplayName(profile);
  const hasDraftChanges =
    draftDisplayName.trim() !== (profile?.display_name?.trim() || "");
  const isStacked = width < 1180;
  const stackInfoCards = width < 1360;

  function openSupportModal() {
    setSupportEmail(profile?.email || supportEmail);
    setSupportStatus(null);
    setSupportModalVisible(true);
  }

  async function updateSetting<K extends keyof DesktopSettingsState>(
    key: K,
    value: DesktopSettingsState[K],
  ) {
    const next = { ...settings, [key]: value };
    setSettings(next);

    if (key === "autoAddPracticeVocab") {
      try {
        const saved = await setPracticeWordTrackingEnabled(Boolean(value));
        setSettings((current) => ({
          ...current,
          autoAddPracticeVocab: saved,
        }));
      } catch (err) {
        console.error("Failed to save practice-word preference:", err);
        setSettings(settings);
      }
      return;
    }

    const storageMap: Record<
      Exclude<keyof DesktopSettingsState, "autoAddPracticeVocab" | "grammarExerciseModes">,
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

  async function updateGrammarMode(mode: GrammarExerciseMode) {
    const enabledCount = Object.values(settings.grammarExerciseModes).filter(
      Boolean,
    ).length;
    if (settings.grammarExerciseModes[mode] && enabledCount === 1) return;

    try {
      const savedModes = await setGrammarExerciseSettings({
        ...settings.grammarExerciseModes,
        [mode]: !settings.grammarExerciseModes[mode],
      });
      setSettings((current) => ({
        ...current,
        grammarExerciseModes: savedModes,
      }));
    } catch (err) {
      console.error("Failed to save grammar exercise settings:", err);
    }
  }

  const confirmCopy = useMemo(() => {
    if (confirmAction === "delete") {
      return {
        title: "Delete account?",
        body: "This permanently deletes your account, bookmarks, grammar progress, vocabulary progress, review history, and activity data. This cannot be undone.",
        cta: actionBusy ? "Deleting..." : "Delete Account",
      };
    }

    return {
      title: "Reset progress?",
      body: "This removes your bookmarks, grammar progress, vocabulary progress, review history, and activity data, but keeps your account and email sign-in.",
      cta: actionBusy ? "Resetting..." : "Reset Progress",
    };
  }, [actionBusy, confirmAction]);

  async function saveDisplayName() {
    if (savingName || !hasDraftChanges) return;
    try {
      setSavingName(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: draftDisplayName.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save display name (${res.status})`);
      }

      const data = await res.json();
      setProfile(data);
      setDraftDisplayName(data.display_name ?? "");
      setEditModalVisible(false);
    } catch (err) {
      console.error("Failed to save display name:", err);
    } finally {
      setSavingName(false);
    }
  }

  async function performConfirmedAction() {
    if (!confirmAction || actionBusy) return;

    try {
      setActionBusy(true);
      const token = await getAuthToken();
      if (!token) return;

      if (confirmAction === "reset") {
        const res = await fetch(`${API_BASE}/me/reset-progress`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Failed to reset progress (${res.status})`);
        }

        setConfirmAction(null);
        router.back();
        return;
      }

      const res = await fetch(`${API_BASE}/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete account (${res.status})`);
      }

      await clearAuthState();
      setConfirmAction(null);
      router.replace("/login");
    } catch (err) {
      console.error("Settings action failed:", err);
    } finally {
      setActionBusy(false);
    }
  }

  async function submitSupportRequest() {
    if (supportBusy) return;

    const email = supportEmail.trim();
    const message = supportMessage.trim();

    if (!email) {
      setSupportStatus("Enter your email so we can reply.");
      return;
    }

    if (!message) {
      setSupportStatus("Describe the problem before sending.");
      return;
    }

    try {
      setSupportBusy(true);
      setSupportStatus(null);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/support/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, message }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Failed to send support request (${res.status})`);
      }

      setSupportModalVisible(false);
      setSupportMessage("");
      setSupportStatus(null);
      setSupportBanner(
        data?.deliveredByEmail === false
          ? "Your message was saved for support review."
          : "Your message was sent to support.",
      );
    } catch (err) {
      setSupportStatus(
        err instanceof Error ? err.message : "Failed to send support request.",
      );
    } finally {
      setSupportBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setEditModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit name</Text>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.modalIconBtn,
                  (hovered || pressed) && styles.secondaryButtonActive,
                ]}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={18} color={Sketch.inkMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              Choose the name shown on your profile and account pages.
            </Text>
            <TextInput
              value={draftDisplayName}
              onChangeText={setDraftDisplayName}
              placeholder={getEmailLocalPart(profile?.email) || "Display name"}
              placeholderTextColor={Sketch.inkFaint}
              style={styles.input}
              maxLength={40}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalActions}>
              <SettingsButton
                label="Cancel"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalAction}
              />
              <SettingsButton
                label={savingName ? "Saving..." : "Save"}
                onPress={() => void saveDisplayName()}
                variant="primary"
                disabled={!hasDraftChanges || savingName}
                style={styles.modalAction}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={supportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!supportBusy) setSupportModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!supportBusy) setSupportModalVisible(false);
            }}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact support</Text>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.modalIconBtn,
                  (hovered || pressed) && !supportBusy && styles.secondaryButtonActive,
                  supportBusy && styles.disabledButton,
                ]}
                onPress={() => {
                  if (!supportBusy) setSupportModalVisible(false);
                }}
                disabled={supportBusy}
              >
                <Ionicons name="close" size={18} color={Sketch.inkMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              Send a message to the Keystone team and we&apos;ll reply by email.
            </Text>
            <TextInput
              value={supportEmail}
              onChangeText={setSupportEmail}
              placeholder={profile?.email || SUPPORT_EMAIL}
              placeholderTextColor={Sketch.inkFaint}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              value={supportMessage}
              onChangeText={setSupportMessage}
              placeholder="Describe the problem"
              placeholderTextColor={Sketch.inkFaint}
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
              maxLength={4000}
            />
            {supportStatus ? <Text style={styles.bodyText}>{supportStatus}</Text> : null}
            <View style={styles.modalActions}>
              <SettingsButton
                label="Cancel"
                onPress={() => setSupportModalVisible(false)}
                disabled={supportBusy}
                style={styles.modalAction}
              />
              <SettingsButton
                label={supportBusy ? "Sending..." : "Send"}
                onPress={() => void submitSupportRequest()}
                variant="primary"
                disabled={supportBusy}
                style={styles.modalAction}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmAction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!actionBusy) setConfirmAction(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!actionBusy) setConfirmAction(null);
            }}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{confirmCopy.title}</Text>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.modalIconBtn,
                  (hovered || pressed) && !actionBusy && styles.secondaryButtonActive,
                  actionBusy && styles.disabledButton,
                ]}
                onPress={() => {
                  if (!actionBusy) setConfirmAction(null);
                }}
                disabled={actionBusy}
              >
                <Ionicons name="close" size={18} color={Sketch.inkMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalBody}>{confirmCopy.body}</Text>
            <View style={styles.modalActions}>
              <SettingsButton
                label="Cancel"
                onPress={() => setConfirmAction(null)}
                disabled={actionBusy}
                style={styles.modalAction}
              />
              <SettingsButton
                label={confirmCopy.cta}
                onPress={() => void performConfirmedAction()}
                variant="danger"
                disabled={actionBusy}
                style={styles.modalAction}
              />
            </View>
          </View>
        </View>
      </Modal>

      <DesktopPage
        density="compact"
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your account, reading preferences, audio, and practice options."
        toolbar={
          <SettingsButton
            label="Back"
            onPress={() => router.back()}
            icon="arrow-back"
            style={styles.backButton}
          />
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={Sketch.inkMuted} />
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={[styles.topGrid, isStacked && styles.stackGrid]}>
              <DesktopPanel style={styles.accountPanel}>
                <DesktopSectionTitle
                  title="Account"
                  caption="Update the profile name shown in the app."
                />
                <View style={styles.infoRow}>
                  <View style={styles.accountIdentity}>
                    <Text style={styles.identityLabel}>Display name</Text>
                    <Text style={styles.identityValue}>{displayName}</Text>
                  </View>
                  <SettingsButton
                    label="Edit name"
                    onPress={() => setEditModalVisible(true)}
                    style={styles.inlineButton}
                  />
                </View>
                <View
                  style={[styles.infoGrid, stackInfoCards && styles.infoGridStacked]}
                >
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{profile?.email || ""}</Text>
                  </View>
                </View>
              </DesktopPanel>

              <DesktopPanel style={styles.accessPanel}>
                <DesktopSectionTitle
                  title="Keystone Access"
                  caption={
                    isPremium
                      ? "Subscription active."
                      : billingProvider === "paddle"
                        ? "Checkout is available on web."
                        : "Manage access from one place."
                  }
                />
                <Text style={styles.bodyText}>
                  {isPremium
                    ? "Your account has the full Keystone Access path. Use the button below to manage the subscription."
                    : billingProvider === "paddle"
                      ? "Keystone Access unlocks everything beyond the first 6 lessons, higher-level mixed practice, and unlimited bookmarks. Choose monthly or yearly on web, then keep the same account unlocked on mobile."
                      : isSupported
                        ? canMakePurchases
                          ? "Keystone Access unlocks everything beyond the first 6 lessons, higher-level mixed practice, and unlimited bookmarks."
                          : "Use the mobile app to purchase or restore Keystone Access, then keep learning here with the same account."
                        : "Paddle web checkout is not configured for this build yet."}
                </Text>
                <SettingsButton
                  label={
                    premiumBusy
                      ? "Loading..."
                      : isPremium
                        ? "Manage Keystone Access"
                        : billingProvider === "paddle" ||
                            (isSupported && canMakePurchases)
                          ? "Unlock Keystone Access"
                          : "Keystone Access unavailable"
                  }
                  onPress={() => void openSubscriptionManager()}
                  variant="primary"
                  disabled={premiumBusy}
                />
                {isSupported && canMakePurchases ? (
                  <SettingsButton
                    label="Restore Purchases"
                    onPress={() => void restorePremiumAccess()}
                  />
                ) : null}
              </DesktopPanel>
            </View>

            <DesktopPanel style={styles.learningPanel}>
              <DesktopSectionTitle
                title="Learning preferences"
                caption="Choose how Thai, English, audio, and practice settings appear while you study."
              />
              <View style={[styles.preferenceGrid, isStacked && styles.stackGrid]}>
                <View style={styles.preferenceGroupCard}>
                  <Text style={styles.preferenceGroupTitle}>Reading</Text>
                  <View style={styles.preferenceStack}>
                    <View style={styles.preferenceRow}>
                      <View style={styles.preferenceCopy}>
                        <Text style={styles.preferenceTitle}>Romanization</Text>
                        <Text style={styles.preferenceBody}>
                          Show phonetic transcription under Thai text.
                        </Text>
                      </View>
                      <AccentSwitch
                        value={settings.showRoman}
                        onValueChange={(value) =>
                          void updateSetting("showRoman", value)
                        }
                      />
                    </View>

                    <View style={styles.preferenceRow}>
                      <View style={styles.preferenceCopy}>
                        <Text style={styles.preferenceTitle}>
                          English translation
                        </Text>
                        <Text style={styles.preferenceBody}>
                          Keep English visible on lessons and review cards.
                        </Text>
                      </View>
                      <AccentSwitch
                        value={settings.showEnglish}
                        onValueChange={(value) =>
                          void updateSetting("showEnglish", value)
                        }
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.preferenceGroupCard}>
                  <Text style={styles.preferenceGroupTitle}>Audio</Text>
                  <View style={styles.preferenceStack}>
                    <View style={styles.preferenceRow}>
                      <View style={styles.preferenceCopy}>
                        <Text style={styles.preferenceTitle}>Autoplay audio</Text>
                        <Text style={styles.preferenceBody}>
                          Automatically play Thai sentence audio after reveal.
                        </Text>
                      </View>
                      <AccentSwitch
                        value={settings.autoplayTTS}
                        onValueChange={(value) =>
                          void updateSetting("autoplayTTS", value)
                        }
                      />
                    </View>

                    <View style={styles.preferenceRow}>
                      <View style={styles.preferenceCopy}>
                        <Text style={styles.preferenceTitle}>
                          Word breakdown TTS (Beta)
                        </Text>
                        <Text style={styles.preferenceBody}>
                          Experimental word-by-word audio for grammar cards.
                        </Text>
                      </View>
                      <AccentSwitch
                        value={settings.wordBreakdownTTS}
                        onValueChange={(value) =>
                          void updateSetting("wordBreakdownTTS", value)
                        }
                      />
                    </View>

                    <View style={styles.preferenceBlock}>
                      <Text style={styles.preferenceTitle}>Speech speed</Text>
                      <View style={styles.speedRow}>
                        {(["slow", "normal", "fast"] as const).map((speed) => {
                          const active = settings.ttsSpeed === speed;
                          return (
                            <SettingsChipButton
                              key={speed}
                              active={active}
                              onPress={() => void updateSetting("ttsSpeed", speed)}
                              label={
                                speed === "slow"
                                  ? "Slow"
                                  : speed === "normal"
                                    ? "Normal"
                                    : "Fast"
                              }
                            />
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.preferenceGroupCard}>
                  <Text style={styles.preferenceGroupTitle}>Practice</Text>
                  <View style={styles.preferenceStack}>
                    <View style={styles.preferenceRow}>
                      <View style={styles.preferenceCopy}>
                        <Text style={styles.preferenceTitle}>Add vocabulary</Text>
                        <Text style={styles.preferenceBody}>
                          Add grammar practice words into your review deck.
                        </Text>
                      </View>
                      <AccentSwitch
                        value={settings.autoAddPracticeVocab}
                        onValueChange={(value) =>
                          void updateSetting("autoAddPracticeVocab", value)
                        }
                      />
                    </View>

                    <View style={styles.preferenceBlock}>
                      <Text style={styles.preferenceTitle}>Grammar exercises</Text>
                      <Text style={styles.preferenceBody}>
                        Choose which modes stay in rotation.
                      </Text>
                      <View style={styles.exerciseChipRow}>
                        {(
                          Object.keys(
                            settings.grammarExerciseModes,
                          ) as GrammarExerciseMode[]
                        ).map((mode) => {
                          const active = settings.grammarExerciseModes[mode];
                          return (
                            <SettingsChipButton
                              key={mode}
                              active={active}
                              onPress={() => void updateGrammarMode(mode)}
                              label={GRAMMAR_EXERCISE_LABELS[mode]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </DesktopPanel>

            <View style={[styles.utilityGrid, isStacked && styles.stackGrid]}>
              {profile?.can_review_content ? (
                <DesktopPanel style={styles.utilityPanel}>
                  <DesktopSectionTitle
                    title="Content Review"
                    caption="Review lesson rows, comments, tone confidence, and assignees before publishing."
                  />
                  <SettingsButton
                    label="Open Review Queue"
                    onPress={() => router.push("/content-review" as any)}
                  />
                </DesktopPanel>
              ) : null}

              {profile?.is_admin ? (
                <DesktopPanel style={styles.utilityPanel}>
                  <DesktopSectionTitle
                    title="Admin"
                    caption="Edit lesson content and sentence rows from the admin console."
                  />
                  <SettingsButton
                    label="Open Admin Console"
                    onPress={() => router.push("/admin" as any)}
                  />
                </DesktopPanel>
              ) : null}

              <DesktopPanel style={styles.utilityPanel}>
                <DesktopSectionTitle
                  title="Legal"
                  caption="Terms and privacy links for the app."
                />
                <Text style={styles.bodyText}>
                  Review account deletion, learning data, privacy, and terms.
                </Text>
                <View style={styles.legalButtonStack}>
                  <SettingsButton
                    label="Terms of Service"
                    onPress={() => void openTermsOfService()}
                  />
                  <SettingsButton
                    label="Privacy Policy"
                    onPress={() => void openPrivacyPolicy()}
                  />
                </View>
              </DesktopPanel>

              <DesktopPanel style={styles.utilityPanel}>
                <DesktopSectionTitle
                  title="Support"
                  caption="Get help with billing, access, or lesson content."
                />
                <View style={styles.supportEmailCard}>
                  <Text style={styles.infoLabel}>Support email</Text>
                  <Text style={styles.infoValue}>{SUPPORT_EMAIL}</Text>
                </View>
                {supportBanner ? (
                  <Text style={styles.bodyText}>{supportBanner}</Text>
                ) : null}
                <SettingsButton label="Contact Support" onPress={openSupportModal} />
              </DesktopPanel>
            </View>

            <View style={[styles.dangerGrid, isStacked && styles.stackGrid]}>
              <DesktopPanel style={styles.dangerPanel}>
                <DesktopSectionTitle
                  title="Reset progress"
                  caption="Clear learning data while keeping the account."
                />
                <Text style={styles.bodyText}>
                  Remove bookmarks, grammar progress, vocabulary progress, review
                  history, and activity data while keeping your sign-in.
                </Text>
                <SettingsButton
                  label="Reset Progress"
                  onPress={() => setConfirmAction("reset")}
                />
              </DesktopPanel>

              <DesktopPanel style={styles.dangerPanel}>
                <DesktopSectionTitle
                  title="Delete account"
                  caption="This action permanently removes the account."
                />
                <Text style={styles.bodyText}>
                  Permanently delete your account and all saved learning data.
                  This cannot be undone.
                </Text>
                <SettingsButton
                  label="Delete Account"
                  onPress={() => setConfirmAction("delete")}
                  variant="danger"
                />
              </DesktopPanel>
            </View>
          </View>
        )}
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 18,
  },
  topGrid: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  accountPanel: {
    flex: 1.08,
    minHeight: 230,
  },
  accessPanel: {
    flex: 0.92,
    gap: 16,
    minHeight: 230,
  },
  dangerGrid: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  stackGrid: {
    flexDirection: "column",
  },
  dangerPanel: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 16,
  },
  loadingPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  accountIdentity: {
    flex: 1,
    gap: 6,
  },
  identityLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontFamily: WEB_BODY_FONT,
  },
  identityValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: Sketch.ink,
    letterSpacing: -0.7,
    fontFamily: WEB_DISPLAY_FONT,
  },
  inlineButton: {
    paddingHorizontal: 14,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 14,
  },
  infoGridStacked: {
    flexDirection: "column",
  },
  infoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: SOFT_PANEL,
    padding: 18,
    gap: 6,
    minHeight: 84,
    justifyContent: "center",
    borderRadius: 18,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: WEB_BODY_FONT,
  },
  infoValue: {
    fontSize: 17,
    lineHeight: 25,
    color: Sketch.ink,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  learningPanel: {
    gap: 16,
  },
  preferenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "stretch",
  },
  preferenceGroupCard: {
    flex: 1,
    minWidth: 290,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  preferenceGroupTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: Sketch.ink,
    letterSpacing: -0.2,
    fontFamily: WEB_DISPLAY_FONT,
  },
  preferenceStack: {
    gap: 14,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    minHeight: 58,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  preferenceBody: {
    fontSize: 13,
    lineHeight: 21,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  preferenceBlock: {
    gap: 10,
  },
  speedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: WEB_RADIUS.sm,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    userSelect: "none",
    ...WEB_INTERACTIVE_TRANSITION,
  },
  optionChipActive: {
    borderColor: Sketch.accentDark,
    backgroundColor: "#FFFFFF",
  },
  optionChipPressed: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  optionChipTextActive: {
    color: Sketch.ink,
  },
  exerciseChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  buttonBase: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: WEB_RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    userSelect: "none",
    ...WEB_INTERACTIVE_TRANSITION,
  },
  buttonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  primaryButton: {
    borderColor: "#0D2237",
    backgroundColor: Sketch.accent,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  primaryButtonText: {
    color: "#fff",
  },
  secondaryButton: {
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  secondaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  secondaryButtonText: {
    color: Sketch.ink,
  },
  legalButtonStack: {
    gap: 12,
  },
  utilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    alignItems: "stretch",
  },
  utilityPanel: {
    flex: 1,
    minWidth: 290,
    gap: 14,
  },
  supportEmailCard: {
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: SOFT_PANEL,
    padding: 16,
    gap: 6,
    justifyContent: "center",
    borderRadius: 18,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  dangerButton: {
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  dangerButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  dangerButtonText: {
    color: Sketch.accent,
  },
  disabledButton: {
    opacity: 0.55,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(33, 28, 24, 0.18)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: SOFT_LINE,
    padding: 22,
    gap: 16,
    borderRadius: 24,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: Sketch.ink,
    letterSpacing: -0.5,
    fontFamily: WEB_DISPLAY_FONT,
  },
  modalIconBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    borderRadius: WEB_RADIUS.sm,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  input: {
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: SOFT_PANEL,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: Sketch.ink,
    borderRadius: WEB_RADIUS.md,
    fontFamily: WEB_BODY_FONT,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalAction: {
    flex: 1,
  },
});
