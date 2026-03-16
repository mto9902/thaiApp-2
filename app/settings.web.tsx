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
  View,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { clearAuthState } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";

type SettingsProfile = {
  id: number;
  email: string;
  display_name?: string | null;
  is_admin?: boolean;
};

type ConfirmAction = "reset" | "delete" | null;

export default function SettingsWebScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const {
    busy: premiumBusy,
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

      const data = await res.json();
      setProfile(data);
      setDraftDisplayName(data.display_name ?? "");
    } catch (err) {
      console.error("Failed to load settings profile:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const displayName =
    profile?.display_name?.trim() || `User #${profile?.id || "..."}`;
  const hasDraftChanges =
    draftDisplayName.trim() !== (profile?.display_name?.trim() || "");

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
                <Ionicons name="close" size={18} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>
              Choose the name shown on your profile and account pages.
            </Text>
            <TextInput
              value={draftDisplayName}
              onChangeText={setDraftDisplayName}
              placeholder={`User #${profile?.id || ""}`}
              placeholderTextColor={Sketch.inkFaint}
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
                <Ionicons name="close" size={18} color={Sketch.inkMuted} />
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
        eyebrow="Account"
        title="Settings"
        subtitle="Desktop account controls for profile details, Keystone Access, and reset or deletion flows."
        toolbar={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={Sketch.ink} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={Sketch.inkMuted} />
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={styles.topGrid}>
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
                <View style={styles.infoGrid}>
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
                    isPremium ? "Subscription active." : "Manage access from one place."
                  }
                />
                <Text style={styles.bodyText}>
                  {isPremium
                    ? "Your account has the full A1.2 to C2 Keystone Access path. Use the button below to manage the subscription."
                    : isSupported
                      ? canMakePurchases
                        ? "Keystone Access unlocks A1.2 and above, higher-level mixed practice, and unlimited bookmarks in the mobile app."
                        : "Purchases are not configured in this build yet, but the subscription layout is ready."
                      : "Keystone Access checkout is completed in the mobile app for now."}
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
                        : isSupported && canMakePurchases
                          ? "Unlock Keystone Access"
                          : "Open subscription screen"}
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

            {profile?.is_admin ? (
              <DesktopPanel>
                <DesktopSectionTitle
                  title="Admin"
                  caption="Open the curriculum dashboard to edit lesson content and sentence rows."
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

            <View style={styles.dangerGrid}>
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
    gap: 28,
  },
  topGrid: {
    flexDirection: "row",
    gap: 20,
  },
  accountPanel: {
    flex: 1.08,
  },
  accessPanel: {
    flex: 0.92,
  },
  dangerGrid: {
    flexDirection: "row",
    gap: 20,
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
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  loadingPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  },
  identityValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.7,
  },
  inlineButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  inlineButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 14,
  },
  infoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
    gap: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 17,
    lineHeight: 25,
    color: Sketch.ink,
    fontWeight: "600",
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
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
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
  dangerButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.red,
    backgroundColor: Sketch.red,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
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
    backgroundColor: Sketch.paper,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 22,
    gap: 16,
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
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  modalIconBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: Sketch.ink,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalAction: {
    flex: 1,
  },
});
