import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import { API_BASE } from "../src/config";
import { usePremiumAccess } from "../src/subscription/usePremiumAccess";
import { clearAuthState } from "../src/utils/auth";

type SettingsProfile = {
  id: number;
  email: string;
  display_name?: string | null;
};

type ConfirmAction = "reset" | "delete" | null;

export default function SettingsScreen() {
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
      const token = await AsyncStorage.getItem("token");
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
    loadProfile();
  }, [loadProfile]);

  const displayName = profile?.display_name?.trim() || `User #${profile?.id || "..."}`;
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

  function openEditNameModal() {
    setDraftDisplayName(profile?.display_name ?? "");
    setEditModalVisible(true);
  }

  async function saveDisplayName() {
    if (savingName || !hasDraftChanges) return;
    try {
      setSavingName(true);
      const token = await AsyncStorage.getItem("token");
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
      const token = await AsyncStorage.getItem("token");
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

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
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
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TouchableOpacity
                style={styles.modalIconBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.75}
              >
                <Ionicons name="close" size={20} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalBody}>
              Choose the name shown on your profile.
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
                style={[styles.secondaryBtn, styles.modalAction]}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  styles.modalAction,
                  (!hasDraftChanges || savingName) && styles.primaryBtnDisabled,
                ]}
                onPress={saveDisplayName}
                activeOpacity={0.82}
                disabled={!hasDraftChanges || savingName}
              >
                <Text style={styles.primaryBtnText}>
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
                activeOpacity={0.75}
                disabled={actionBusy}
              >
                <Ionicons name="close" size={20} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalBody}>{confirmCopy.body}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.secondaryBtn, styles.modalAction]}
                onPress={() => setConfirmAction(null)}
                activeOpacity={0.8}
                disabled={actionBusy}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dangerBtn,
                  styles.modalAction,
                  actionBusy && styles.dangerBtnDisabled,
                ]}
                onPress={performConfirmedAction}
                activeOpacity={0.82}
                disabled={actionBusy}
              >
                <Text style={styles.dangerBtnText}>{confirmCopy.cta}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TouchableOpacity
                style={styles.inlineEditBtn}
                onPress={openEditNameModal}
                activeOpacity={0.75}
              >
                <Text style={styles.inlineEditText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.infoValue}>{displayName}</Text>

            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || ""}</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>User ID</Text>
              <Text style={styles.infoValueMuted}>{profile?.id || ""}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keystone Access</Text>
          <View style={styles.card}>
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {isPremium ? "Keystone Access active" : "Free plan"}
              </Text>
            </View>

            <Text style={styles.helperText}>
              {isPremium
                ? "You have access to the full A1.2 to C2 Keystone Access path. Use the button below to manage your subscription."
                : isSupported
                  ? canMakePurchases
                    ? "Keystone Access unlocks A1.2 and above, along with higher-level mixed practice, in the mobile app."
                    : "Add your RevenueCat mobile API keys to turn on Keystone Access in this build."
                  : "Keystone Access checkout is available in the mobile app for now."}
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                premiumBusy && styles.primaryBtnDisabled,
              ]}
              onPress={() => void openSubscriptionManager()}
              activeOpacity={0.82}
              disabled={premiumBusy}
            >
              <Text style={styles.primaryBtnText}>
                {premiumBusy
                  ? "Loading..."
                  : isPremium
                    ? "Manage Keystone Access"
                    : isSupported && canMakePurchases
                      ? "Unlock Keystone Access"
                      : "Keystone Access on mobile"}
              </Text>
            </TouchableOpacity>

            {isSupported && canMakePurchases ? (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => void restorePremiumAccess()}
                activeOpacity={0.8}
                disabled={premiumBusy}
              >
                <Text style={styles.secondaryBtnText}>Restore Purchases</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Reset Progress</Text>
            <Text style={styles.dangerText}>
              Remove bookmarks, grammar progress, vocabulary progress, review
              history, and activity data while keeping your account.
            </Text>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.dangerActionBtn]}
              onPress={() => setConfirmAction("reset")}
              activeOpacity={0.82}
            >
              <Text style={styles.secondaryBtnText}>Reset Progress</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <Text style={styles.dangerText}>
              Permanently delete your account and all saved learning data. This
              cannot be undone.
            </Text>
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => setConfirmAction("delete")}
              activeOpacity={0.82}
            >
              <Text style={styles.dangerBtnText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  card: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoBlock: {
    gap: 6,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 17,
    fontWeight: "600",
    color: Sketch.ink,
  },
  infoValueMuted: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  inlineEditBtn: {
    paddingVertical: 2,
  },
  inlineEditText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.orange,
  },
  dangerCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(180, 73, 52, 0.18)",
    padding: 16,
    gap: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  dangerText: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  dangerActionBtn: {
    alignSelf: "flex-start",
    minWidth: 150,
  },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.orange,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 13,
    shadowColor: Sketch.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.paperDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
  },
  dangerBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.red,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  dangerBtnDisabled: {
    opacity: 0.55,
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(33, 28, 24, 0.18)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: Sketch.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },
  modalIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: 12,
    backgroundColor: Sketch.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: Sketch.ink,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalAction: {
    flex: 1,
  },
});
