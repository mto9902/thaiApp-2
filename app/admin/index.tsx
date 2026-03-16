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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import { API_BASE } from "../../src/config";
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
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [summaries, setSummaries] = useState<AdminGrammarSummary[]>([]);

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
    const query = search.trim().toLowerCase();

    if (!query) return grammarPoints;

    return grammarPoints.filter((point) => {
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
  }, [grammarPoints, search]);

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
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
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
              { label: "Overrides", value: stats?.overriddenTopics ?? 0 },
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

          <View style={styles.list}>
            {filteredPoints.map((point) => {
              const summary = summaryById.get(point.id);
              return (
                <TouchableOpacity
                  key={point.id}
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
            })}
          </View>
        </ScrollView>
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
    gap: 16,
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
  list: {
    gap: 12,
  },
  grammarCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 16,
    gap: 8,
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
});
