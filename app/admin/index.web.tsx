import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  type GrammarStage,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { getAuthToken } from "@/src/utils/authStorage";

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

export default function AdminDashboardWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<GrammarStage | "All">(
    "A1.1",
  );
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [summaries, setSummaries] = useState<AdminGrammarSummary[]>([]);

  const columns = width >= 1500 ? 4 : width >= 1220 ? 3 : width >= 880 ? 2 : 1;
  const cardWidth =
    columns === 4 ? "23.6%" : columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

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

      const [meRes, dashboardRes, listRes] = await Promise.all([
        fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/grammar`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const meData = meRes.ok ? await meRes.json() : null;
      if (meData?.is_admin !== true && meData?.can_review_content === true) {
        router.replace("/content-review" as any);
        return;
      }

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
    const query = search.trim().toLowerCase();
    const basePoints =
      selectedStage === "All"
        ? grammarPoints
        : grammarPoints.filter((point) => point.stage === selectedStage);

    if (!query) return basePoints;

    return basePoints.filter((point) =>
      [point.id, point.title, point.stage, point.level, point.focus.particle]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [grammarPoints, search, selectedStage]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Admin"
        title="Admin console"
        subtitle="Desktop editing and curriculum oversight for lesson content, practice rows, and the most important app-wide counts."
        toolbar={
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/content-review" as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.secondaryButtonText}>Review Queue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
              activeOpacity={0.82}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => void loadData()}
              activeOpacity={0.82}
            >
              <Ionicons name="refresh" size={16} color={Sketch.inkMuted} />
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={Sketch.inkMuted} />
          </DesktopPanel>
        ) : accessDenied ? (
          <DesktopPanel>
            <Text style={styles.deniedTitle}>Admin access required</Text>
            <Text style={styles.helperText}>
              This account is not marked as an admin yet.
            </Text>
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <DesktopPanel>
              <DesktopSectionTitle
                title="Overview"
                caption="High-level usage and content counts that are useful while editing lessons."
              />
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
                  <View
                    key={item.label}
                    style={[styles.statCard, { width: cardWidth }]}
                  >
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </DesktopPanel>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Grammar editor"
                caption={`${filteredPoints.length} of ${grammarPoints.length} topics`}
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by title, id, stage, or focus"
                placeholderTextColor={Sketch.inkFaint}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stageFilterWrap}
              >
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
              </ScrollView>

              <View style={styles.grammarGrid}>
                {filteredPoints.map((point) => {
                  const summary = summaryById.get(point.id);
                  return (
                    <TouchableOpacity
                      key={point.id}
                      style={[styles.grammarCard, { width: cardWidth }]}
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
                      <Text style={styles.grammarPattern} numberOfLines={3}>
                        {point.pattern}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </DesktopPanel>
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
  toolbar: {
    flexDirection: "row",
    gap: 10,
  },
  loadingPanel: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  helperText: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Sketch.ink,
  },
  stageFilterWrap: {
    gap: 10,
    paddingBottom: 2,
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    gap: 2,
  },
  stageChipActive: {
    borderColor: Sketch.accent,
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
  grammarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  grammarCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  stageTag: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  overrideTag: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  grammarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.4,
  },
  grammarMeta: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  grammarPattern: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
});
