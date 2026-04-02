import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import { API_BASE } from "../../src/config";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  type GrammarStage,
} from "../../src/data/grammarStages";
import { useGrammarCatalog } from "../../src/grammar/GrammarCatalogProvider";
import { getAuthToken } from "../../src/utils/authStorage";
import { getProfileDisplayName } from "../../src/utils/profileName";

type AdminDashboardStats = {
  totalUsers: number;
  activeUsers7d: number;
  totalBookmarks: number;
  grammarProgressEntries: number;
  grammarRounds: number;
  vocabCards: number;
  grammarTopics: number;
  grammarPracticeRows: number;
  overriddenTopics: number;
};

type AdminGrammarSummary = {
  id: string;
  rowCount: number;
  hasOverride: boolean;
};

type AdminUserSummary = {
  id: number;
  email: string;
  display_name?: string | null;
  is_admin: boolean;
  can_review_content: boolean;
  has_keystone_access: boolean;
  consent_source?: string | null;
  last_active_at?: string | null;
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<GrammarStage | "All">(
    "A1.1",
  );
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [summaries, setSummaries] = useState<AdminGrammarSummary[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [mutatingUserId, setMutatingUserId] = useState<number | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [newUserCanReviewContent, setNewUserCanReviewContent] = useState(false);
  const [newUserHasPremium, setNewUserHasPremium] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const deferredUserSearch = useDeferredValue(userSearch);

  const availableStages = useMemo(
    () =>
      GRAMMAR_STAGES.filter((stage) =>
        grammarPoints.some((point) => point.stage === stage),
      ),
    [grammarPoints],
  );

  const resetCreateUserForm = useCallback(() => {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserDisplayName("");
    setNewUserIsAdmin(false);
    setNewUserCanReviewContent(false);
    setNewUserHasPremium(false);
  }, []);

  const formatLastActive = useCallback((value?: string | null) => {
    if (!value) return "No activity yet";

    const lastActive = new Date(value);
    if (Number.isNaN(lastActive.getTime())) return "Recent activity";

    const diffMs = Date.now() - lastActive.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Active today";
    if (diffDays === 1) return "Active yesterday";
    return `Active ${diffDays}d ago`;
  }, []);

  const filteredUsers = useMemo(() => {
    const query = deferredUserSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.email, user.display_name ?? "", String(user.id)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredUserSearch, users]);

  async function readErrorMessage(response: Response, fallback: string) {
    try {
      const data = await response.json();
      return typeof data?.error === "string" ? data.error : fallback;
    } catch {
      return fallback;
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const [meRes, dashboardRes, listRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/grammar`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const meData = meRes.ok ? await meRes.json() : null;
      if (meData?.is_admin !== true && meData?.can_review_content === true) {
        router.replace("/content-review" as any);
        return;
      }

      if (
        dashboardRes.status === 403 ||
        listRes.status === 403 ||
        usersRes.status === 403
      ) {
        setAccessDenied(true);
        setStats(null);
        setSummaries([]);
        setUsers([]);
        return;
      }

      if (!dashboardRes.ok || !listRes.ok || !usersRes.ok) {
        throw new Error("Failed to load admin dashboard");
      }

      const [dashboardData, listData, usersData] = await Promise.all([
        dashboardRes.json(),
        listRes.json(),
        usersRes.json(),
      ]);

      setAccessDenied(false);
      setStats(dashboardData);
      setSummaries(Array.isArray(listData) ? listData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const summaryById = useMemo(
    () => new Map(summaries.map((item) => [item.id, item])),
    [summaries],
  );

  const filteredPoints = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const basePoints =
      selectedStage === "All"
        ? grammarPoints
        : grammarPoints.filter((point) => point.stage === selectedStage);

    if (!query) return basePoints;

    return basePoints.filter((point) => {
      const haystack = [
        point.id,
        point.title,
        point.stage,
        point.level,
        point.focus.particle,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [deferredSearch, grammarPoints, selectedStage]);

  const createUser = useCallback(async () => {
    if (creatingUser) return;

    const email = newUserEmail.trim().toLowerCase();
    const password = newUserPassword;
    const displayName = newUserDisplayName.trim();

    if (!email || !password) {
      Alert.alert("Missing details", "Email and password are required.");
      return;
    }

    try {
      setCreatingUser(true);
      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          isAdmin: newUserIsAdmin,
          canReviewContent: newUserCanReviewContent,
          hasKeystoneAccess: newUserHasPremium,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create user"),
        );
      }

      resetCreateUserForm();
      setShowCreateUser(false);
      await loadData();
      Alert.alert("User created", `${email} is ready to sign in.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create user";
      Alert.alert("Could not create user", message);
    } finally {
      setCreatingUser(false);
    }
  }, [
    creatingUser,
    loadData,
    newUserDisplayName,
    newUserCanReviewContent,
    newUserEmail,
    newUserHasPremium,
    newUserIsAdmin,
    newUserPassword,
    resetCreateUserForm,
    router,
  ]);

  const patchUser = useCallback(
    async (userId: number, body: Record<string, unknown>, fallbackError: string) => {
      try {
        setMutatingUserId(userId);
        const token = await getAuthToken();

        if (!token) {
          router.replace("/login");
          return false;
        }

        const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response, fallbackError));
        }

        await loadData();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : fallbackError;
        Alert.alert("Could not update user", message);
        return false;
      } finally {
        setMutatingUserId(null);
      }
    },
    [loadData, router],
  );

  const deleteUser = useCallback(
    async (user: AdminUserSummary) => {
      Alert.alert(
        "Delete user?",
        `This will permanently delete ${user.email} and all of their progress.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setMutatingUserId(user.id);
                const token = await getAuthToken();

                if (!token) {
                  router.replace("/login");
                  return;
                }

                const response = await fetch(`${API_BASE}/admin/users/${user.id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                  throw new Error(
                    await readErrorMessage(response, "Failed to delete user"),
                  );
                }

                await loadData();
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : "Failed to delete user";
                Alert.alert("Could not delete user", message);
              } finally {
                setMutatingUserId(null);
              }
            },
          },
        ],
      );
    },
    [loadData, router],
  );

  const renderGrammarItem: ListRenderItem<(typeof filteredPoints)[number]> =
    useCallback(
      ({ item: point }) => {
        const summary = summaryById.get(point.id);

        return (
          <TouchableOpacity
            style={styles.grammarCard}
            onPress={() => router.push(`/admin/grammar/${point.id}` as any)}
            activeOpacity={0.82}
          >
            <View style={styles.cardTop}>
              <Text style={styles.stageTag}>{point.stage}</Text>
              {summary?.hasOverride ? (
                <Text style={styles.overrideTag}>Edited</Text>
              ) : null}
            </View>
            <Text style={styles.grammarTitle}>{point.title}</Text>
            <Text style={styles.grammarMeta}>
              {point.id} · {summary?.rowCount ?? 0} rows
            </Text>
            <Text style={styles.grammarPattern} numberOfLines={2}>
              {point.pattern}
            </Text>
          </TouchableOpacity>
        );
      },
      [router, summaryById],
    );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => void loadData()}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color={Sketch.inkMuted} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      ) : accessDenied ? (
        <View style={styles.deniedWrap}>
          <Text style={styles.deniedTitle}>Admin access required</Text>
          <Text style={styles.deniedBody}>
            This account is not marked as an admin yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPoints}
          keyExtractor={(item) => item.id}
          renderItem={renderGrammarItem}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={8}
          removeClippedSubviews
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <Text style={styles.sectionLabel}>Overview</Text>
              <View style={styles.statsGrid}>
                {[
                  { label: "Users", value: stats?.totalUsers ?? 0 },
                  { label: "Active 7d", value: stats?.activeUsers7d ?? 0 },
                  { label: "Bookmarks", value: stats?.totalBookmarks ?? 0 },
                  { label: "Grammar rounds", value: stats?.grammarRounds ?? 0 },
                  { label: "Vocab cards", value: stats?.vocabCards ?? 0 },
                  { label: "Rows", value: stats?.grammarPracticeRows ?? 0 },
                  { label: "Topics", value: stats?.grammarTopics ?? 0 },
                  { label: "Edited lessons", value: stats?.overriddenTopics ?? 0 },
                ].map((item) => (
                  <View key={item.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>User Management</Text>
                <TouchableOpacity
                  style={styles.inlineActionBtn}
                  onPress={() => setShowCreateUser((current) => !current)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.inlineActionText}>
                    {showCreateUser ? "Hide form" : "Add user"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showCreateUser ? (
                <View style={styles.userCreateCard}>
                  <TextInput
                    value={newUserEmail}
                    onChangeText={setNewUserEmail}
                    placeholder="Email"
                    placeholderTextColor={Sketch.inkFaint}
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                  <TextInput
                    value={newUserPassword}
                    onChangeText={setNewUserPassword}
                    placeholder="Temporary password"
                    placeholderTextColor={Sketch.inkFaint}
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                  <TextInput
                    value={newUserDisplayName}
                    onChangeText={setNewUserDisplayName}
                    placeholder="Display name (optional)"
                    placeholderTextColor={Sketch.inkFaint}
                    style={styles.searchInput}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  <View style={styles.userToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.userToggleChip,
                        newUserHasPremium && styles.userToggleChipActive,
                      ]}
                      onPress={() => setNewUserHasPremium((value) => !value)}
                      activeOpacity={0.82}
                    >
                      <Text
                        style={[
                          styles.userToggleChipText,
                          newUserHasPremium && styles.userToggleChipTextActive,
                        ]}
                      >
                        Premium
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.userToggleChip,
                        newUserCanReviewContent && styles.userToggleChipActive,
                      ]}
                      onPress={() => setNewUserCanReviewContent((value) => !value)}
                      activeOpacity={0.82}
                    >
                      <Text
                        style={[
                          styles.userToggleChipText,
                          newUserCanReviewContent && styles.userToggleChipTextActive,
                        ]}
                      >
                        Reviewer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.userToggleChip,
                        newUserIsAdmin && styles.userToggleChipActive,
                      ]}
                      onPress={() => setNewUserIsAdmin((value) => !value)}
                      activeOpacity={0.82}
                    >
                      <Text
                        style={[
                          styles.userToggleChipText,
                          newUserIsAdmin && styles.userToggleChipTextActive,
                        ]}
                      >
                        Admin
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.primaryActionBtn,
                      creatingUser && styles.primaryActionBtnDisabled,
                    ]}
                    onPress={() => void createUser()}
                    activeOpacity={0.82}
                    disabled={creatingUser}
                  >
                    <Text style={styles.primaryActionText}>
                      {creatingUser ? "Creating..." : "Create User"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TextInput
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search users by email, name, or id"
                placeholderTextColor={Sketch.inkFaint}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.userList}>
                {filteredUsers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No users found</Text>
                    <Text style={styles.emptyBody}>
                      Try a broader search or create a new account.
                    </Text>
                  </View>
                ) : (
                  filteredUsers.map((user) => {
                    const busy = mutatingUserId === user.id;

                    return (
                      <View key={user.id} style={styles.userCard}>
                        <View style={styles.userCardTop}>
                          <View style={styles.userIdentity}>
                            <Text style={styles.userName}>
                              {getProfileDisplayName(user)}
                            </Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                          </View>
                          <Text style={styles.userMeta}>#{user.id}</Text>
                        </View>

                        <View style={styles.userBadgeRow}>
                          {user.is_admin ? (
                            <Text style={styles.userBadge}>Admin</Text>
                          ) : null}
                          {user.can_review_content ? (
                            <Text style={styles.userBadge}>Reviewer</Text>
                          ) : null}
                          {user.has_keystone_access ? (
                            <Text style={styles.userBadge}>Premium</Text>
                          ) : null}
                          <Text style={styles.userActivity}>
                            {formatLastActive(user.last_active_at)}
                          </Text>
                        </View>

                        <View style={styles.userActionRow}>
                          <TouchableOpacity
                            style={[
                              styles.userActionChip,
                              user.has_keystone_access &&
                                styles.userActionChipActive,
                              busy && styles.userActionChipDisabled,
                            ]}
                            onPress={() =>
                              void patchUser(
                                user.id,
                                {
                                  hasKeystoneAccess: !user.has_keystone_access,
                                },
                                "Failed to update premium access",
                              )
                            }
                            activeOpacity={0.82}
                            disabled={busy}
                          >
                            <Text
                              style={[
                                styles.userActionChipText,
                                user.has_keystone_access &&
                                  styles.userActionChipTextActive,
                              ]}
                            >
                              {user.has_keystone_access
                                ? "Premium on"
                                : "Make premium"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.userActionChip,
                              user.can_review_content &&
                                styles.userActionChipActive,
                              busy && styles.userActionChipDisabled,
                            ]}
                            onPress={() =>
                              void patchUser(
                                user.id,
                                {
                                  canReviewContent: !user.can_review_content,
                                },
                                "Failed to update reviewer access",
                              )
                            }
                            activeOpacity={0.82}
                            disabled={busy}
                          >
                            <Text
                              style={[
                                styles.userActionChipText,
                                user.can_review_content &&
                                  styles.userActionChipTextActive,
                              ]}
                            >
                              {user.can_review_content
                                ? "Reviewer on"
                                : "Make reviewer"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.userActionChip,
                              user.is_admin && styles.userActionChipActive,
                              busy && styles.userActionChipDisabled,
                            ]}
                            onPress={() =>
                              void patchUser(
                                user.id,
                                {
                                  isAdmin: !user.is_admin,
                                },
                                "Failed to update admin access",
                              )
                            }
                            activeOpacity={0.82}
                            disabled={busy}
                          >
                            <Text
                              style={[
                                styles.userActionChipText,
                                user.is_admin && styles.userActionChipTextActive,
                              ]}
                            >
                              {user.is_admin ? "Admin on" : "Make admin"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.userActionChip,
                              styles.userActionChipDanger,
                              busy && styles.userActionChipDisabled,
                            ]}
                            onPress={() => void deleteUser(user)}
                            activeOpacity={0.82}
                            disabled={busy}
                          >
                            <Text
                              style={[
                                styles.userActionChipText,
                                styles.userActionChipDangerText,
                              ]}
                            >
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Grammar Editor</Text>
                <Text style={styles.sectionHint}>
                  {filteredPoints.length} of {grammarPoints.length} topics
                </Text>
              </View>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by title, id, stage, or focus"
                placeholderTextColor={Sketch.inkFaint}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.stageFilterWrap}>
                <TouchableOpacity
                  style={[
                    styles.stageChip,
                    selectedStage === "All" && styles.stageChipActive,
                  ]}
                  onPress={() => setSelectedStage("All")}
                  activeOpacity={0.82}
                >
                  <Text
                    style={[
                      styles.stageChipText,
                      selectedStage === "All" && styles.stageChipTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>

                {availableStages.map((stage) => {
                  const active = selectedStage === stage;
                  return (
                    <TouchableOpacity
                      key={stage}
                      style={[styles.stageChip, active && styles.stageChipActive]}
                      onPress={() => setSelectedStage(stage)}
                      activeOpacity={0.82}
                    >
                      <Text
                        style={[
                          styles.stageChipText,
                          active && styles.stageChipTextActive,
                        ]}
                      >
                        {stage}
                      </Text>
                      <Text
                        style={[
                          styles.stageChipSubtext,
                          active && styles.stageChipTextActive,
                        ]}
                      >
                        {GRAMMAR_STAGE_META[stage].shortTitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No grammar points found</Text>
              <Text style={styles.emptyBody}>
                Try another unit or a broader search.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deniedWrap: {
    margin: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    gap: 8,
  },
  deniedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  deniedBody: {
    fontSize: 14,
    lineHeight: 21,
    color: Sketch.inkMuted,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContent: {
    gap: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sectionHint: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  inlineActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  inlineActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  statCard: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Sketch.ink,
  },
  userCreateCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 14,
    gap: 10,
  },
  userToggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  userToggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  userToggleChipActive: {
    borderColor: Sketch.orange,
  },
  userToggleChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  userToggleChipTextActive: {
    color: Sketch.ink,
  },
  primaryActionBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.orange,
    backgroundColor: Sketch.orange,
  },
  primaryActionBtnDisabled: {
    opacity: 0.55,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  userList: {
    gap: 10,
  },
  userCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 14,
    gap: 10,
  },
  userCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  userIdentity: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  userEmail: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  userMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  userBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  userBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  userActivity: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  userActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  userActionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  userActionChipActive: {
    borderColor: Sketch.orange,
  },
  userActionChipDisabled: {
    opacity: 0.55,
  },
  userActionChipDanger: {
    borderColor: Sketch.red,
  },
  userActionChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
  },
  userActionChipTextActive: {
    color: Sketch.orange,
  },
  userActionChipDangerText: {
    color: Sketch.red,
  },
  stageFilterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stageChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    gap: 2,
  },
  stageChipActive: {
    borderColor: Sketch.orange,
  },
  stageChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  stageChipSubtext: {
    fontSize: 11,
    color: Sketch.inkMuted,
  },
  stageChipTextActive: {
    color: Sketch.ink,
  },
  grammarCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 16,
    gap: 8,
  },
  itemSeparator: {
    height: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageTag: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  overrideTag: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  grammarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  grammarMeta: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  grammarPattern: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkLight,
  },
  emptyState: {
    paddingVertical: 28,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
});
