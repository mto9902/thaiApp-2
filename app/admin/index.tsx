import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  const deferredSearch = useDeferredValue(search);

  const availableStages = useMemo(
    () =>
      GRAMMAR_STAGES.filter((stage) =>
        grammarPoints.some((point) => point.stage === stage),
      ),
    [grammarPoints],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const [dashboardRes, listRes] = await Promise.all([
        fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/grammar`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dashboardRes.status === 403 || listRes.status === 403) {
        setAccessDenied(true);
        setStats(null);
        setSummaries([]);
        return;
      }

      if (!dashboardRes.ok || !listRes.ok) {
        throw new Error("Failed to load admin dashboard");
      }

      const [dashboardData, listData] = await Promise.all([
        dashboardRes.json(),
        listRes.json(),
      ]);

      setAccessDenied(false);
      setStats(dashboardData);
      setSummaries(Array.isArray(listData) ? listData : []);
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
