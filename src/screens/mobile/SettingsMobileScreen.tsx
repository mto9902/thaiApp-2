import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AccentSwitch from "@/src/components/AccentSwitch";
import { API_BASE } from "@/src/config";
import {
  BRAND,
  CARD_SHADOW,
  LIGHT_BUTTON_PRESSED,
  SettledPressable,
  SurfaceButton,
  SURFACE_PRESSED,
  SURFACE_SHADOW,
} from "@/src/screens/mobile/dashboardSurface";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { clearAuthState } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import {
  DEFAULT_GRAMMAR_EXERCISE_SETTINGS,
  getGrammarExerciseSettings,
  GRAMMAR_EXERCISE_LABELS,
  type GrammarExerciseMode,
  type GrammarExerciseSettings,
  setGrammarExerciseSettings,
} from "@/src/utils/grammarExerciseSettings";
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
  getPracticeWordTrackingEnabled,
  setPracticeWordTrackingEnabled,
} from "@/src/utils/practiceWordPreference";

type SettingsProfile = {
  id: number;
  email: string;
  display_name?: string | null;
  is_admin?: boolean;
  can_review_content?: boolean;
};

type ConfirmAction = "reset" | "delete" | null;

type MobileSettingsState = {
  showRoman: boolean;
  showEnglish: boolean;
  autoplayTTS: boolean;
  wordBreakdownTTS: boolean;
  ttsSpeed: "slow" | "normal" | "fast";
  autoAddPracticeVocab: boolean;
  grammarExerciseModes: GrammarExerciseSettings;
};

const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_WORD_BREAKDOWN_TTS = "pref_word_breakdown_tts";
const PREF_TTS_SPEED = "pref_tts_speed";

function ModalCard({
  title,
  children,
  onClose,
  busy,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  return (
    <View style={styles.modalCard}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{title}</Text>
        <SettledPressable
          disabled={busy}
          onPress={onClose}
          style={({ pressed }: { pressed: boolean }) => [
            styles.modalIconButton,
            pressed ? styles.modalIconButtonPressed : null,
            busy ? styles.buttonDisabled : null,
          ]}
        >
          <Ionicons name="close" size={18} color={BRAND.inkSoft} />
        </SettledPressable>
      </View>
      {children}
    </View>
  );
}

export default function SettingsMobileScreen() {
  const router = useRouter();
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
  const [settings, setSettings] = useState<MobileSettingsState>({
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
        ttsSpeed: (speed as MobileSettingsState["ttsSpeed"]) || "slow",
        autoAddPracticeVocab,
        grammarExerciseModes,
      });
    } catch (err) {
      console.error("Failed to load settings profile:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadProfile();
    }, [loadProfile]),
  );

  const displayName = getProfileDisplayName(profile);
  const hasDraftChanges =
    draftDisplayName.trim() !== (profile?.display_name?.trim() || "");

  const confirmCopy = useMemo(() => {
    if (confirmAction === "delete") {
      return {
        title: "Delete account?",
        body: "This permanently deletes your account, bookmarks, grammar progress, vocabulary progress, review history, and activity data. This cannot be undone.",
        cta: actionBusy ? "Deleting..." : "Delete account",
      };
    }

    return {
      title: "Reset progress?",
      body: "This removes your bookmarks, grammar progress, vocabulary progress, review history, and activity data, but keeps your account and email sign-in.",
      cta: actionBusy ? "Resetting..." : "Reset progress",
    };
  }, [actionBusy, confirmAction]);

  const accessCopy = useMemo(() => {
    if (isPremium) {
      return {
        body: "Manage your subscription or keep this account ready across web and mobile.",
        cta: "Manage Keystone Access",
      };
    }

    if (billingProvider === "paddle") {
      return {
        body: "Keystone Access unlocks everything beyond the first 6 lessons, higher-level mixed practice, and unlimited bookmarks.",
        cta: "See plans",
      };
    }

    if (isSupported && canMakePurchases) {
      return {
        body: "Keystone Access unlocks everything beyond the first 6 lessons and mixed practice on mobile.",
        cta: "Unlock Keystone Access",
      };
    }

    return {
      body: "Keystone Access is not configured for mobile checkout in this build.",
      cta: "Unavailable",
    };
  }, [billingProvider, canMakePurchases, isPremium, isSupported]);

  const canOpenPlans =
    isPremium || billingProvider === "paddle" || isSupported || canMakePurchases;

  const updateSetting = useCallback(
    async <K extends keyof MobileSettingsState>(
      key: K,
      value: MobileSettingsState[K],
    ) => {
      const previous = settings;
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
          setSettings(previous);
        }
        return;
      }

      if (key === "grammarExerciseModes") return;

      const storageMap: Record<
        Exclude<keyof MobileSettingsState, "autoAddPracticeVocab" | "grammarExerciseModes">,
        string
      > = {
        showRoman: PREF_ROMANIZATION,
        showEnglish: PREF_ENGLISH,
        autoplayTTS: PREF_AUTOPLAY_TTS,
        wordBreakdownTTS: PREF_WORD_BREAKDOWN_TTS,
        ttsSpeed: PREF_TTS_SPEED,
      };

      await AsyncStorage.setItem(storageMap[key], String(value));
    },
    [settings],
  );

  const updateGrammarMode = useCallback(
    async (mode: GrammarExerciseMode) => {
      const enabledCount = Object.values(settings.grammarExerciseModes).filter(Boolean).length;
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
    },
    [settings.grammarExerciseModes],
  );

  const saveDisplayName = useCallback(async () => {
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
  }, [draftDisplayName, hasDraftChanges, savingName]);

  const performConfirmedAction = useCallback(async () => {
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
  }, [actionBusy, confirmAction, router]);

  const submitSupportRequest = useCallback(async () => {
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
  }, [supportBusy, supportEmail, supportMessage]);

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
          <ModalCard
            title="Edit name"
            onClose={() => setEditModalVisible(false)}
            busy={savingName}
          >
            <Text style={styles.modalBody}>
              Choose the name shown on your profile and account pages.
            </Text>
            <TextInput
              value={draftDisplayName}
              onChangeText={setDraftDisplayName}
              placeholder={getEmailLocalPart(profile?.email) || "Display name"}
              placeholderTextColor={BRAND.muted}
              style={styles.input}
              maxLength={40}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalActions}>
              <SurfaceButton
                label="Cancel"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalAction}
              />
              <SurfaceButton
                label={savingName ? "Saving..." : "Save"}
                onPress={() => void saveDisplayName()}
                variant="primary"
                disabled={!hasDraftChanges || savingName}
                style={styles.modalAction}
              />
            </View>
          </ModalCard>
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
          <ModalCard
            title="Contact support"
            onClose={() => {
              if (!supportBusy) setSupportModalVisible(false);
            }}
            busy={supportBusy}
          >
            <Text style={styles.modalBody}>
              Send a message to the Keystone team and we&apos;ll reply by email.
            </Text>
            <TextInput
              value={supportEmail}
              onChangeText={setSupportEmail}
              placeholder={profile?.email || SUPPORT_EMAIL}
              placeholderTextColor={BRAND.muted}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              value={supportMessage}
              onChangeText={setSupportMessage}
              placeholder="Describe the problem"
              placeholderTextColor={BRAND.muted}
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
              maxLength={4000}
            />
            {supportStatus ? (
              <Text style={styles.supportStatus}>{supportStatus}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <SurfaceButton
                label="Cancel"
                onPress={() => setSupportModalVisible(false)}
                disabled={supportBusy}
                style={styles.modalAction}
              />
              <SurfaceButton
                label={supportBusy ? "Sending..." : "Send"}
                onPress={() => void submitSupportRequest()}
                variant="primary"
                disabled={supportBusy}
                style={styles.modalAction}
              />
            </View>
          </ModalCard>
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
          <ModalCard
            title={confirmCopy.title}
            onClose={() => {
              if (!actionBusy) setConfirmAction(null);
            }}
            busy={actionBusy}
          >
            <Text style={styles.modalBody}>{confirmCopy.body}</Text>
            <View style={styles.modalActions}>
              <SurfaceButton
                label="Cancel"
                onPress={() => setConfirmAction(null)}
                disabled={actionBusy}
                style={styles.modalAction}
              />
              <SurfaceButton
                label={confirmCopy.cta}
                onPress={() => void performConfirmedAction()}
                variant={confirmAction === "delete" ? "secondary" : "primary"}
                disabled={actionBusy}
                style={styles.modalAction}
              />
            </View>
          </ModalCard>
        </View>
      </Modal>

      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView
          testID="keystone-mobile-page-scroll"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Text style={styles.topTitle}>Settings</Text>
            <SurfaceButton
              label="Back"
              icon="arrow-back"
              size="compact"
              onPress={() => router.back()}
            />
          </View>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator size="large" color={BRAND.inkSoft} />
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Account</Text>
                <Text style={styles.cardTitle}>Account</Text>

                <View style={styles.accountRow}>
                  <View style={styles.accountCopy}>
                    <Text style={styles.fieldLabel}>Display name</Text>
                    <Text style={styles.accountName}>{displayName}</Text>
                  </View>
                  <SurfaceButton
                    label="Edit name"
                    size="compact"
                    onPress={() => setEditModalVisible(true)}
                  />
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <Text style={styles.infoValue}>{profile?.email || ""}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Keystone Access</Text>
                <Text style={styles.bodyText}>{accessCopy.body}</Text>
                <SurfaceButton
                  label={premiumBusy ? "Loading..." : accessCopy.cta}
                  onPress={() => void openSubscriptionManager()}
                  variant="primary"
                  disabled={premiumBusy || !canOpenPlans}
                />
                {isSupported && canMakePurchases ? (
                  <SurfaceButton
                    label="Restore purchases"
                    onPress={() => void restorePremiumAccess()}
                    disabled={premiumBusy}
                  />
                ) : null}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Learning preferences</Text>
                <View style={styles.preferenceList}>
                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceCopy}>
                      <Text style={styles.preferenceLabel}>Romanization</Text>
                      <Text style={styles.preferenceHint}>
                        Show phonetic reading under Thai.
                      </Text>
                    </View>
                    <AccentSwitch
                      value={settings.showRoman}
                      onValueChange={(value) => void updateSetting("showRoman", value)}
                    />
                  </View>

                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceCopy}>
                      <Text style={styles.preferenceLabel}>English</Text>
                      <Text style={styles.preferenceHint}>
                        Keep the meaning visible after reveal.
                      </Text>
                    </View>
                    <AccentSwitch
                      value={settings.showEnglish}
                      onValueChange={(value) => void updateSetting("showEnglish", value)}
                    />
                  </View>

                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceCopy}>
                      <Text style={styles.preferenceLabel}>Autoplay audio</Text>
                      <Text style={styles.preferenceHint}>
                        Play Thai audio after reveal.
                      </Text>
                    </View>
                    <AccentSwitch
                      value={settings.autoplayTTS}
                      onValueChange={(value) => void updateSetting("autoplayTTS", value)}
                    />
                  </View>

                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceCopy}>
                      <Text style={styles.preferenceLabel}>Word audio (Beta)</Text>
                      <Text style={styles.preferenceHint}>
                        Experimental word-by-word audio on breakdown cards.
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
                      <Text style={styles.preferenceLabel}>Add vocabulary</Text>
                      <Text style={styles.preferenceHint}>
                        Add grammar words into your review deck.
                      </Text>
                    </View>
                    <AccentSwitch
                      value={settings.autoAddPracticeVocab}
                      onValueChange={(value) =>
                        void updateSetting("autoAddPracticeVocab", value)
                      }
                    />
                  </View>
                </View>

                <View style={styles.settingGroup}>
                  <Text style={styles.preferenceLabel}>Speech speed</Text>
                  <View style={styles.optionRow}>
                    {(["slow", "normal", "fast"] as const).map((speed) => (
                      <SurfaceButton
                        key={speed}
                        label={speed === "slow" ? "Slow" : speed === "normal" ? "Normal" : "Fast"}
                        variant={settings.ttsSpeed === speed ? "primary" : "secondary"}
                        onPress={() => void updateSetting("ttsSpeed", speed)}
                        style={styles.optionButton}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.settingGroup}>
                  <Text style={styles.preferenceLabel}>Grammar exercises</Text>
                  <View style={styles.optionWrapRow}>
                    {(Object.keys(settings.grammarExerciseModes) as GrammarExerciseMode[]).map(
                      (mode) => (
                        <SurfaceButton
                          key={mode}
                          label={GRAMMAR_EXERCISE_LABELS[mode]}
                          variant={settings.grammarExerciseModes[mode] ? "primary" : "secondary"}
                          onPress={() => void updateGrammarMode(mode)}
                        />
                      ),
                    )}
                  </View>
                </View>
              </View>

              {profile?.can_review_content || profile?.is_admin ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Workspace</Text>
                  <View style={styles.linkList}>
                    {profile?.can_review_content ? (
                      <SettledPressable
                        onPress={() => router.push("/content-review" as any)}
                        style={({ pressed }: { pressed: boolean }) => [
                          styles.linkRow,
                          profile?.is_admin ? styles.linkRowDivider : null,
                          pressed ? styles.surfacePressed : null,
                        ]}
                      >
                        <Text style={styles.linkText}>Content Review</Text>
                        <Ionicons name="chevron-forward" size={16} color={BRAND.inkSoft} />
                      </SettledPressable>
                    ) : null}

                    {profile?.is_admin ? (
                      <SettledPressable
                        onPress={() => router.push("/admin" as any)}
                        style={({ pressed }: { pressed: boolean }) => [
                          styles.linkRow,
                          pressed ? styles.surfacePressed : null,
                        ]}
                      >
                        <Text style={styles.linkText}>Admin Console</Text>
                        <Ionicons name="chevron-forward" size={16} color={BRAND.inkSoft} />
                      </SettledPressable>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Legal</Text>
                <View style={styles.actionStack}>
                  <SurfaceButton
                    label="Open Terms of Service"
                    onPress={() => void openTermsOfService()}
                  />
                  <SurfaceButton
                    label="Open Privacy Policy"
                    onPress={() => void openPrivacyPolicy()}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Support</Text>
                <View style={styles.infoCard}>
                  <Text style={styles.fieldLabel}>Support email</Text>
                  <Text style={styles.infoValue}>{SUPPORT_EMAIL}</Text>
                </View>
                {supportBanner ? (
                  <Text style={styles.bodyText}>{supportBanner}</Text>
                ) : null}
                <SurfaceButton
                  label="Contact Support"
                  onPress={() => setSupportModalVisible(true)}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Danger zone</Text>
                <View style={styles.actionStack}>
                  <SurfaceButton
                    label="Reset progress"
                    onPress={() => setConfirmAction("reset")}
                  />
                  <SurfaceButton
                    label="Delete account"
                    onPress={() => setConfirmAction("delete")}
                  />
                </View>
                <SurfaceButton
                  label="Log out"
                  onPress={() =>
                    void clearAuthState().then(() => router.replace("/login"))
                  }
                />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topTitle: {
    flex: 1,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 12,
    ...CARD_SHADOW,
  },
  cardEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  accountCopy: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: BRAND.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  accountName: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
  },
  infoCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
  },
  preferenceList: {
    gap: 10,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...SURFACE_SHADOW,
  },
  preferenceCopy: {
    flex: 1,
    gap: 2,
  },
  preferenceLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
  },
  preferenceHint: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  settingGroup: {
    gap: 10,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    flex: 1,
  },
  linkList: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    overflow: "hidden",
    backgroundColor: BRAND.paper,
    ...SURFACE_SHADOW,
  },
  linkRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: BRAND.paper,
  },
  linkRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  linkText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
  },
  actionStack: {
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: "rgba(16, 42, 67, 0.18)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 14,
    ...CARD_SHADOW,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.4,
  },
  modalIconButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    ...SURFACE_SHADOW,
  },
  modalIconButtonPressed: {
    ...LIGHT_BUTTON_PRESSED,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: BRAND.ink,
    borderRadius: 18,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalAction: {
    flex: 1,
  },
  supportStatus: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  surfacePressed: {
    ...SURFACE_PRESSED,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
