import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import AccentSwitch from "@/src/components/AccentSwitch";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
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
              <TouchableOpacity
                style={styles.modalIconBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color={AppSketch.inkMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>
              Choose the name shown on your profile and account pages.
            </Text>
            <TextInput
              value={draftDisplayName}
              onChangeText={setDraftDisplayName}
              placeholder={getEmailLocalPart(profile?.email) || "Display name"}
              placeholderTextColor={AppSketch.inkFaint}
              style={styles.input}
              maxLength={40}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.modalAction]}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.82}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.modalAction,
                  (!hasDraftChanges || savingName) && styles.disabledButton,
                ]}
                onPress={() => void saveDisplayName()}
                disabled={!hasDraftChanges || savingName}
                activeOpacity={0.82}
              >
                <Text style={styles.primaryButtonText}>
                  {savingName ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.modalIconBtn}
                onPress={() => {
                  if (!supportBusy) setSupportModalVisible(false);
                }}
                activeOpacity={0.82}
                disabled={supportBusy}
              >
                <Ionicons name="close" size={18} color={AppSketch.inkMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>
              Send a message to the Keystone team and we&apos;ll reply by email.
            </Text>
            <TextInput
              value={supportEmail}
              onChangeText={setSupportEmail}
              placeholder={profile?.email || SUPPORT_EMAIL}
              placeholderTextColor={AppSketch.inkFaint}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              value={supportMessage}
              onChangeText={setSupportMessage}
              placeholder="Describe the problem"
              placeholderTextColor={AppSketch.inkFaint}
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
              maxLength={4000}
            />
            {supportStatus ? <Text style={styles.bodyText}>{supportStatus}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.modalAction]}
                onPress={() => setSupportModalVisible(false)}
                activeOpacity={0.82}
                disabled={supportBusy}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.modalAction,
                  supportBusy && styles.disabledButton,
                ]}
                onPress={() => void submitSupportRequest()}
                activeOpacity={0.82}
                disabled={supportBusy}
              >
                <Text style={styles.primaryButtonText}>
                  {supportBusy ? "Sending..." : "Send"}
                </Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.modalIconBtn}
                onPress={() => {
                  if (!actionBusy) setConfirmAction(null);
                }}
                disabled={actionBusy}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color={AppSketch.inkMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>{confirmCopy.body}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.modalAction]}
                onPress={() => setConfirmAction(null)}
                disabled={actionBusy}
                activeOpacity={0.82}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dangerButton,
                  styles.modalAction,
                  actionBusy && styles.disabledButton,
                ]}
                onPress={() => void performConfirmedAction()}
                disabled={actionBusy}
                activeOpacity={0.82}
              >
                <Text style={styles.dangerButtonText}>{confirmCopy.cta}</Text>
              </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={AppSketch.ink} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={AppSketch.inkMuted} />
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
                  <TouchableOpacity
                    style={styles.inlineButton}
                    onPress={() => setEditModalVisible(true)}
                    activeOpacity={0.82}
                  >
                    <Text style={styles.inlineButtonText}>Edit name</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[styles.infoGrid, stackInfoCards && styles.infoGridStacked]}
                >
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{profile?.email || ""}</Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>User ID</Text>
                    <Text style={styles.infoValue}>#{profile?.id || ""}</Text>
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
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    premiumBusy && styles.disabledButton,
                  ]}
                  onPress={() => void openSubscriptionManager()}
                  disabled={premiumBusy}
                  activeOpacity={0.82}
                >
                  <Text style={styles.primaryButtonText}>
                    {premiumBusy
                      ? "Loading..."
                      : isPremium
                        ? "Manage Keystone Access"
                        : billingProvider === "paddle" ||
                            (isSupported && canMakePurchases)
                          ? "Unlock Keystone Access"
                          : "Keystone Access unavailable"}
                  </Text>
                </TouchableOpacity>
                {isSupported && canMakePurchases ? (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => void restorePremiumAccess()}
                    activeOpacity={0.82}
                  >
                    <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
                  </TouchableOpacity>
                ) : null}
              </DesktopPanel>
            </View>

            <DesktopPanel>
                <DesktopSectionTitle
                  title="Learning preferences"
                  caption="Choose how Thai, English, audio, and practice settings appear while you study."
                />
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
                    onValueChange={(value) => void updateSetting("showRoman", value)}
                  />
                </View>

                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceCopy}>
                    <Text style={styles.preferenceTitle}>English translation</Text>
                    <Text style={styles.preferenceBody}>
                      Keep English visible on lessons and review cards.
                    </Text>
                  </View>
                  <AccentSwitch
                    value={settings.showEnglish}
                    onValueChange={(value) => void updateSetting("showEnglish", value)}
                  />
                </View>

                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceCopy}>
                    <Text style={styles.preferenceTitle}>Autoplay audio</Text>
                    <Text style={styles.preferenceBody}>
                      Automatically play Thai sentence audio after reveal.
                    </Text>
                  </View>
                  <AccentSwitch
                    value={settings.autoplayTTS}
                    onValueChange={(value) => void updateSetting("autoplayTTS", value)}
                  />
                </View>

                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceCopy}>
                    <Text style={styles.preferenceTitle}>Word breakdown TTS (Beta)</Text>
                    <Text style={styles.preferenceBody}>
                      Experimental word-by-word audio for grammar breakdown cards.
                    </Text>
                  </View>
                  <AccentSwitch
                    value={settings.wordBreakdownTTS}
                    onValueChange={(value) =>
                      void updateSetting("wordBreakdownTTS", value)
                    }
                  />
                </View>

                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceCopy}>
                    <Text style={styles.preferenceTitle}>Add vocabulary</Text>
                    <Text style={styles.preferenceBody}>
                      Add words from grammar practice into your review deck.
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
                  <Text style={styles.preferenceTitle}>Speech speed</Text>
                  <View style={styles.speedRow}>
                    {(["slow", "normal", "fast"] as const).map((speed) => {
                      const active = settings.ttsSpeed === speed;
                      return (
                        <TouchableOpacity
                          key={speed}
                          style={[styles.speedPill, active && styles.speedPillActive]}
                          onPress={() => void updateSetting("ttsSpeed", speed)}
                          activeOpacity={0.82}
                        >
                          <Text
                            style={[
                              styles.speedPillText,
                              active && styles.speedPillTextActive,
                            ]}
                          >
                            {speed === "slow"
                              ? "Slow"
                              : speed === "normal"
                                ? "Normal"
                                : "Fast"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.preferenceBlock}>
                  <Text style={styles.preferenceTitle}>Grammar exercises</Text>
                  <Text style={styles.preferenceBody}>
                    Choose which grammar practice modes stay in rotation.
                  </Text>
                  <View style={styles.exerciseChipRow}>
                    {(Object.keys(settings.grammarExerciseModes) as GrammarExerciseMode[]).map(
                      (mode) => {
                        const active = settings.grammarExerciseModes[mode];
                        return (
                          <TouchableOpacity
                            key={mode}
                            style={[
                              styles.exerciseChip,
                              active && styles.exerciseChipActive,
                            ]}
                            onPress={() => void updateGrammarMode(mode)}
                            activeOpacity={0.82}
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
                      },
                    )}
                  </View>
                </View>
              </View>
            </DesktopPanel>

            {profile?.can_review_content ? (
              <DesktopPanel>
                <DesktopSectionTitle
                  title="Content Review"
                  caption="Review lesson content, sentence rows, tone confidence, comments, and assignees before publishing."
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push("/content-review" as any)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.secondaryButtonText}>Open Review Queue</Text>
                </TouchableOpacity>
              </DesktopPanel>
            ) : null}

            {profile?.is_admin ? (
              <DesktopPanel>
                <DesktopSectionTitle
                  title="Admin"
                  caption="Edit lesson content and sentence rows from the admin console."
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push("/admin" as any)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.secondaryButtonText}>Open Admin Console</Text>
                </TouchableOpacity>
              </DesktopPanel>
            ) : null}

            <DesktopPanel>
              <DesktopSectionTitle
                title="Legal"
                caption="Keep the website terms and privacy policy reachable from inside the app."
              />
              <Text style={styles.bodyText}>
                Review the Keystone Languages terms and privacy policy. The
                privacy policy also explains account deletion and how learning
                data is handled.
              </Text>
              <View style={styles.legalButtonStack}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => void openTermsOfService()}
                  activeOpacity={0.82}
                >
                  <Text style={styles.secondaryButtonText}>Open Terms of Service</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => void openPrivacyPolicy()}
                  activeOpacity={0.82}
                >
                  <Text style={styles.secondaryButtonText}>Open Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </DesktopPanel>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Support"
                caption="Reach out by email when billing, access, or lesson content needs a hand."
              />
              <Text style={styles.bodyText}>
                Contact the Keystone team directly and we&apos;ll reply by email.
              </Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Support email</Text>
                <Text style={styles.infoValue}>{SUPPORT_EMAIL}</Text>
              </View>
              {supportBanner ? <Text style={styles.bodyText}>{supportBanner}</Text> : null}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={openSupportModal}
                activeOpacity={0.82}
              >
                <Text style={styles.secondaryButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </DesktopPanel>

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
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setConfirmAction("reset")}
                  activeOpacity={0.82}
                >
                  <Text style={styles.secondaryButtonText}>Reset Progress</Text>
                </TouchableOpacity>
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
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={() => setConfirmAction("delete")}
                  activeOpacity={0.82}
                >
                  <Text style={styles.dangerButtonText}>Delete Account</Text>
                </TouchableOpacity>
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
    gap: 22,
  },
  topGrid: {
    flexDirection: "row",
    gap: 20,
    alignItems: "stretch",
  },
  accountPanel: {
    flex: 1.08,
    minHeight: 276,
  },
  accessPanel: {
    flex: 0.92,
    gap: 16,
    minHeight: 276,
  },
  dangerGrid: {
    flexDirection: "row",
    gap: 20,
    alignItems: "stretch",
  },
  stackGrid: {
    flexDirection: "column",
  },
  dangerPanel: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
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
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  identityValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.7,
  },
  inlineButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
  },
  inlineButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
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
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 16,
    gap: 6,
    minHeight: 92,
    justifyContent: "center",
    borderRadius: AppRadius.md,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 17,
    lineHeight: 25,
    color: AppSketch.ink,
    fontWeight: "600",
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: AppSketch.inkMuted,
  },
  preferenceStack: {
    gap: 18,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppSketch.border,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  preferenceBody: {
    fontSize: 13,
    lineHeight: 21,
    color: AppSketch.inkMuted,
  },
  preferenceBlock: {
    gap: 10,
  },
  speedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  speedPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  speedPillActive: {
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.background,
  },
  speedPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  speedPillTextActive: {
    color: AppSketch.primary,
  },
  exerciseChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exerciseChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  exerciseChipActive: {
    borderColor: AppSketch.primary,
  },
  exerciseChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  exerciseChipTextActive: {
    color: AppSketch.primary,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.primary,
    ...appShadow("sm"),
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  legalButtonStack: {
    gap: 12,
  },
  dangerButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.danger,
    backgroundColor: AppSketch.surface,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppSketch.danger,
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
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
    padding: 22,
    gap: 16,
    borderRadius: AppRadius.lg,
    ...appShadow("sm"),
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
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.5,
  },
  modalIconBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.sm,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: AppSketch.inkMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: AppSketch.ink,
    borderRadius: AppRadius.md,
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
