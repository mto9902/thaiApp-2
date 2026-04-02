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
import { API_BASE } from "@/src/config";
import {
  REVIEW_STATUS_LABELS,
} from "@/src/contentReview/helpers";
import {
  ReviewQueueItem,
  ReviewQueueResponse,
  ReviewerProfile,
} from "@/src/contentReview/types";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  type GrammarStage,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { getAuthToken } from "@/src/utils/authStorage";

type QueueTab = "flagged" | "mine" | "in_review" | "approved" | "hidden";

const TAB_LABELS: Record<QueueTab, string> = {
  flagged: "Flagged",
  mine: "Assigned to me",
  in_review: "In review",
  approved: "Approved",
  hidden: "Hidden",
};

export default function ContentReviewDashboard() {
  const router = useRouter();
  const { grammarById, grammarPoints } = useGrammarCatalog();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState<QueueTab>("flagged");
  const [selectedStage, setSelectedStage] = useState<GrammarStage | "All">("All");
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [profile, setProfile] = useState<ReviewerProfile | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const [meRes, queueRes] = await Promise.all([
        fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/review/queue`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (meRes.status === 403 || queueRes.status === 403) {
        setAccessDenied(true);
        setItems([]);
        return;
      }

      if (!meRes.ok || !queueRes.ok) {
        throw new Error("Failed to load review queue");
      }

      const [meData, queueData] = await Promise.all([
        meRes.json(),
        queueRes.json() as Promise<ReviewQueueResponse>,
      ]);

      setProfile(meData);
      setAccessDenied(false);
      setItems(Array.isArray(queueData?.items) ? queueData.items : []);
    } catch (err) {
      console.error("Failed to load content review queue:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadQueue();
    }, [loadQueue]),
  );

  const availableStages = useMemo(
    () =>
      GRAMMAR_STAGES.filter((stage) =>
        grammarPoints.some((point) => point.stage === stage),
      ),
    [grammarPoints],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const grammarPoint = grammarById.get(item.grammarId);
      const stage = grammarPoint?.stage ?? item.stage ?? null;
      const reviewStatus = item.reviewStatus;

      const matchesTab =
        selectedTab === "mine"
          ? item.reviewAssigneeUserId === profile?.id
          : selectedTab === "flagged"
            ? reviewStatus === "flagged" || reviewStatus === "needs_changes"
            : reviewStatus === selectedTab;

      if (!matchesTab) {
        return false;
      }

      if (selectedStage !== "All" && stage !== selectedStage) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        item.grammarId,
        grammarPoint?.title ?? item.title ?? "",
        grammarPoint?.pattern ?? "",
        item.previewThai ?? "",
        item.previewEnglish ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [grammarById, items, profile?.id, search, selectedStage, selectedTab]);

  function renderCard(item: ReviewQueueItem) {
    const grammarPoint = grammarById.get(item.grammarId);
    const stage = grammarPoint?.stage ?? item.stage ?? "Unknown";
    const title =
      grammarPoint?.title ??
      item.title ??
      (item.type === "lesson" ? item.grammarId : item.previewThai ?? item.grammarId);
    const subtitle =
      item.type === "lesson"
        ? grammarPoint?.pattern ?? item.previewEnglish ?? "Lesson content review"
        : item.previewEnglish ?? grammarPoint?.pattern ?? "Sentence review";

    return (
      <TouchableOpacity
        key={`${item.type}-${item.id}`}
        style={styles.card}
        onPress={() => router.push(`/content-review/${item.grammarId}` as any)}
        activeOpacity={0.82}
      >
        <View style={styles.cardTop}>
          <Text style={styles.stageTag}>{stage}</Text>
          <Text style={styles.badge}>{item.type === "lesson" ? "Lesson" : "Row"}</Text>
        </View>

        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardMeta}>
          {item.grammarId}
          {item.confidence != null ? ` · ${item.confidence}` : ""}
          {item.flaggedItemCount > 0 ? ` · ${item.flaggedItemCount} flagged` : ""}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>

        <View style={styles.cardBottom}>
          <Text style={styles.statusText}>{REVIEW_STATUS_LABELS[item.reviewStatus]}</Text>
          <Text style={styles.timeText}>
            {item.lastEditedAt ? new Date(item.lastEditedAt).toLocaleDateString() : "New"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.82}
        >
          <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Content Review</Text>
          <Text style={styles.headerSubtitle}>
            Review lesson content, sentence rows, and tone confidence before publishing.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => void loadQueue()}
          activeOpacity={0.82}
        >
          <Ionicons name="refresh" size={20} color={Sketch.inkMuted} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      ) : accessDenied ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyTitle}>Review access required</Text>
          <Text style={styles.emptyBody}>
            This account is not marked as an admin or reviewer.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title, id, Thai, or English"
            placeholderTextColor={Sketch.inkFaint}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(Object.keys(TAB_LABELS) as QueueTab[]).map((tab) => {
              const active = selectedTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedTab(tab)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {TAB_LABELS[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[styles.chip, selectedStage === "All" && styles.chipActive]}
              onPress={() => setSelectedStage("All")}
              activeOpacity={0.82}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedStage === "All" && styles.chipTextActive,
                ]}
              >
                All stages
              </Text>
            </TouchableOpacity>
            {availableStages.map((stage) => {
              const active = selectedStage === stage;
              return (
                <TouchableOpacity
                  key={stage}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedStage(stage)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {stage}
                  </Text>
                  <Text
                    style={[
                      styles.chipSubtext,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {GRAMMAR_STAGE_META[stage].shortTitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>
            {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
          </Text>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>
                Try a different status or stage filter.
              </Text>
            </View>
          ) : (
            filteredItems.map(renderCard)
          )}
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
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  headerCenter: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
    paddingBottom: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    gap: 2,
  },
  chipActive: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.paperDark,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  chipTextActive: {
    color: Sketch.ink,
  },
  chipSubtext: {
    fontSize: 11,
    color: Sketch.inkMuted,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Sketch.inkMuted,
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stageTag: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  cardMeta: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Sketch.ink,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.accent,
  },
  timeText: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
});
