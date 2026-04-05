import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
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
import { countBreakdownThaiSyllables } from "@/src/contentReview/helpers";
import {
  type LessonProductionSummary,
  type ReviewExampleRow,
  type ReviewNextWaveDecision,
  type ReviewerUser,
} from "@/src/contentReview/types";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  type GrammarStage,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { getAuthToken } from "@/src/utils/authStorage";
import { getProfileDisplayName } from "@/src/utils/profileName";

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
  approvedRowCount: number;
  hasOverride: boolean;
  overrideReviewStatus: string | null;
  production?: LessonProductionSummary | null;
};

type SentenceIssueFilter = "all" | "thai" | "missing" | "multi" | "both";
type SentenceWorkflowFilter =
  | "all"
  | "published"
  | "staged"
  | ReviewNextWaveDecision;

const NEXT_WAVE_DECISIONS: ReviewNextWaveDecision[] = [
  "carry",
  "revise",
  "replace",
  "retire",
];

function formatBreakdownPreview(row: ReviewExampleRow) {
  return row.breakdown
    .map((item) => `${item.thai} (${item.english})`)
    .join(" · ");
}

function formatBreakdownTones(row: ReviewExampleRow) {
  const toneParts = row.breakdown
    .map((item) => {
      const toneLabel =
        Array.isArray(item.tones) && item.tones.length > 0
          ? item.tones.join("/")
          : "—";

      return `${item.thai}: ${toneLabel}`;
    });

  return toneParts.length > 0 ? toneParts.join(" · ") : "—";
}

function getRowToneDiagnostics(row: ReviewExampleRow) {
  const hasMissingTone = row.breakdown.some(
    (item) => !Array.isArray(item.tones) || item.tones.length === 0,
  );
  const hasMultiSyllableWord = row.breakdown.some(
    (item) => countBreakdownThaiSyllables(item.thai) > 1,
  );
  const hasWeakThai = row.qualityFlags.includes("thai_weak");

  return {
    hasWeakThai,
    hasMissingTone,
    hasMultiSyllableWord,
  };
}

function getRowToneFlags(row: ReviewExampleRow) {
  const diagnostics = getRowToneDiagnostics(row);
  return [
    ...(diagnostics.hasWeakThai ? ["Thai weak"] : []),
    ...(diagnostics.hasMultiSyllableWord ? ["2+"] : []),
    ...(diagnostics.hasMissingTone ? ["Tone?"] : []),
  ];
}

function formatCompactTimestamp(value?: string | null) {
  if (!value) {
    return "Not yet edited";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not yet edited";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTimestamp(value?: string | null) {
  if (!value) {
    return "No edits yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No edits yet";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `${diffWeeks}w ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

function formatReviewerName(reviewer?: ReviewerUser | null) {
  if (!reviewer) {
    return "—";
  }

  return getProfileDisplayName(reviewer as any) || reviewer.email || "—";
}

function formatWorkflowStatus(value?: LessonProductionSummary["workflowStatus"] | null) {
  switch (value) {
    case "generated":
      return "Generated";
    case "reviewing":
      return "Reviewing";
    case "tone_review":
      return "Tone review";
    case "ready_to_publish":
      return "Ready";
    case "published":
      return "Published";
    default:
      return "Not started";
  }
}

function formatNextWaveDecision(value?: ReviewNextWaveDecision | null) {
  switch (value) {
    case "carry":
      return "Carry";
    case "revise":
      return "Revise";
    case "replace":
      return "Replace";
    case "retire":
      return "Retire";
    default:
      return "—";
  }
}

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
  const [selectedSentenceGrammarId, setSelectedSentenceGrammarId] =
    useState<string>("");
  const [sentenceRows, setSentenceRows] = useState<ReviewExampleRow[]>([]);
  const [sentenceReviewers, setSentenceReviewers] = useState<ReviewerUser[]>([]);
  const [sentenceProduction, setSentenceProduction] =
    useState<LessonProductionSummary | null>(null);
  const [sentenceRowsLoading, setSentenceRowsLoading] = useState(false);
  const [sentenceRowsError, setSentenceRowsError] = useState<string | null>(null);
  const [sentenceIssueFilter, setSentenceIssueFilter] =
    useState<SentenceIssueFilter>("all");
  const [sentenceWorkflowFilter, setSentenceWorkflowFilter] =
    useState<SentenceWorkflowFilter>("all");
  const [sentenceAuditSavingId, setSentenceAuditSavingId] = useState<number | null>(
    null,
  );
  const [sentenceSeedLoading, setSentenceSeedLoading] = useState(false);
  const [sentencePublishLoading, setSentencePublishLoading] = useState(false);
  const [sentencePublishMessage, setSentencePublishMessage] = useState<string | null>(
    null,
  );

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

  const stageSentencePoints = useMemo(() => {
    if (selectedStage === "All") {
      return [];
    }
    return grammarPoints.filter((point) => point.stage === selectedStage);
  }, [grammarPoints, selectedStage]);

  useEffect(() => {
    if (stageSentencePoints.length === 0) {
      setSelectedSentenceGrammarId("");
      return;
    }

    const stillVisible = stageSentencePoints.some(
      (point) => point.id === selectedSentenceGrammarId,
    );
    if (!stillVisible) {
      setSelectedSentenceGrammarId(stageSentencePoints[0].id);
    }
  }, [selectedSentenceGrammarId, stageSentencePoints]);

  useEffect(() => {
    setSentencePublishMessage(null);
  }, [selectedSentenceGrammarId]);

  const loadSentenceRows = useCallback(async () => {
    if (!selectedSentenceGrammarId) {
      setSentenceRows([]);
      setSentenceReviewers([]);
      setSentenceProduction(null);
      setSentenceRowsError(null);
      return;
    }

    try {
      setSentenceRowsLoading(true);
      setSentenceRowsError(null);
      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(
        `${API_BASE}/review/grammar/${selectedSentenceGrammarId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to load sentence rows");
      }

      const data = await res.json();
      setSentenceReviewers(Array.isArray(data?.reviewers) ? data.reviewers : []);
      setSentenceProduction(data?.production ?? null);
      setSentenceRows(
        Array.isArray(data?.rows)
          ? [...data.rows].sort(
              (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
            )
          : [],
      );
    } catch (err) {
      console.error("Failed to load admin sentence rows:", err);
      setSentenceRows([]);
      setSentenceReviewers([]);
      setSentenceProduction(null);
      setSentenceRowsError(
        err instanceof Error ? err.message : "Failed to load sentence rows",
      );
    } finally {
      setSentenceRowsLoading(false);
    }
  }, [router, selectedSentenceGrammarId]);

  useEffect(() => {
    void loadSentenceRows();
  }, [loadSentenceRows]);

  useEffect(() => {
    setSentenceIssueFilter("all");
    setSentenceWorkflowFilter("all");
    setSentencePublishMessage(null);
  }, [selectedSentenceGrammarId]);

  useFocusEffect(
    useCallback(() => {
      void loadSentenceRows();
    }, [loadSentenceRows]),
  );

  const selectedSentencePoint =
    grammarPoints.find((point) => point.id === selectedSentenceGrammarId) ?? null;
  const isSentenceSalvageStage =
    selectedSentencePoint?.stage === "B1.1" ||
    selectedSentencePoint?.stage === "B1.2";
  const sentenceReviewerById = useMemo(
    () => new Map(sentenceReviewers.map((reviewer) => [reviewer.id, reviewer])),
    [sentenceReviewers],
  );
  const sentenceRowById = useMemo(
    () => new Map(sentenceRows.map((row) => [row.id, row])),
    [sentenceRows],
  );
  const liveApprovedSentenceCount = useMemo(
    () =>
      sentenceRows.filter(
        (row) => row.publishState === "published" && row.reviewStatus === "approved",
      ).length,
    [sentenceRows],
  );
  const sentenceRowsWithDiagnostics = useMemo(
    () =>
      sentenceRows.map((row) => ({
        row,
        diagnostics: getRowToneDiagnostics(row),
      })),
    [sentenceRows],
  );
  const sentenceIssueCounts = useMemo(() => {
    let thai = 0;
    let missing = 0;
    let multi = 0;
    let both = 0;

    for (const entry of sentenceRowsWithDiagnostics) {
      if (entry.diagnostics.hasWeakThai) {
        thai += 1;
      }
      if (entry.diagnostics.hasMissingTone) {
        missing += 1;
      }
      if (entry.diagnostics.hasMultiSyllableWord) {
        multi += 1;
      }
      if (
        entry.diagnostics.hasMissingTone &&
        entry.diagnostics.hasMultiSyllableWord
      ) {
        both += 1;
      }
    }

    return {
      all: sentenceRows.length,
      thai,
      missing,
      multi,
      both,
    };
  }, [sentenceRows.length, sentenceRowsWithDiagnostics]);
  const sentenceWorkflowCounts = useMemo(() => {
    const counts: Record<SentenceWorkflowFilter, number> = {
      all: sentenceRows.length,
      published: 0,
      staged: 0,
      carry: 0,
      revise: 0,
      replace: 0,
      retire: 0,
    };

    for (const row of sentenceRows) {
      if (row.publishState === "published") {
        counts.published += 1;
        if (row.nextWaveDecision) {
          counts[row.nextWaveDecision] += 1;
        }
      }
      if (row.publishState === "staged") {
        counts.staged += 1;
      }
    }

    return counts;
  }, [sentenceRows]);
  const filteredSentenceRows = useMemo(
    () =>
      sentenceRowsWithDiagnostics.filter(({ row, diagnostics }) => {
        const workflowMatches = (() => {
          switch (sentenceWorkflowFilter) {
            case "published":
              return row.publishState === "published";
            case "staged":
              return row.publishState === "staged";
            case "carry":
            case "revise":
            case "replace":
            case "retire":
              return (
                row.publishState === "published" &&
                row.nextWaveDecision === sentenceWorkflowFilter
              );
            default:
              return true;
          }
        })();

        if (!workflowMatches) {
          return false;
        }

        switch (sentenceIssueFilter) {
          case "thai":
            return diagnostics.hasWeakThai;
          case "missing":
            return diagnostics.hasMissingTone;
          case "multi":
            return diagnostics.hasMultiSyllableWord;
          case "both":
            return (
              diagnostics.hasMissingTone && diagnostics.hasMultiSyllableWord
            );
          default:
            return true;
        }
      }),
    [sentenceIssueFilter, sentenceRowsWithDiagnostics, sentenceWorkflowFilter],
  );
  const reusableSentenceCount =
    sentenceWorkflowCounts.carry + sentenceWorkflowCounts.revise;
  const hasActiveStagedWave =
    (sentenceProduction?.stagedRowCount ?? 0) > 0 ||
    (sentenceProduction?.currentWaveRowCount ?? 0) > 0;

  const updateNextWaveDecision = useCallback(
    async (rowId: number, nextWaveDecision: ReviewNextWaveDecision) => {
      try {
        setSentenceAuditSavingId(rowId);
        setSentencePublishMessage(null);
        const token = await getAuthToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const res = await fetch(`${API_BASE}/review/examples/${rowId}/audit`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nextWaveDecision,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to save next-wave decision");
        }

        setSentencePublishMessage(
          `Saved ${formatNextWaveDecision(nextWaveDecision).toLowerCase()} for live row audit.`,
        );
        await loadSentenceRows();
      } catch (err) {
        console.error("Failed to update next-wave decision:", err);
        setSentencePublishMessage(
          err instanceof Error ? err.message : "Failed to update next-wave decision",
        );
      } finally {
        setSentenceAuditSavingId(null);
      }
    },
    [loadSentenceRows, router],
  );

  const seedSentenceLessonWave = useCallback(async () => {
    if (!selectedSentenceGrammarId || !selectedSentencePoint || !isSentenceSalvageStage) {
      return;
    }

    try {
      setSentenceSeedLoading(true);
      setSentencePublishMessage(null);
      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(
        `${API_BASE}/review/grammar/${selectedSentenceGrammarId}/seed-wave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stage: selectedSentencePoint.stage,
          }),
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to seed staged rewrite wave");
      }

      setSentencePublishMessage(
        `Seeded ${data?.seededCount ?? 0} rows into staged wave ${
          data?.waveId ?? ""
        }.`.trim(),
      );
      await Promise.all([loadSentenceRows(), loadData()]);
    } catch (err) {
      console.error("Failed to seed staged lesson wave:", err);
      setSentencePublishMessage(
        err instanceof Error ? err.message : "Failed to seed staged lesson wave",
      );
    } finally {
      setSentenceSeedLoading(false);
    }
  }, [
    isSentenceSalvageStage,
    loadData,
    loadSentenceRows,
    router,
    selectedSentenceGrammarId,
    selectedSentencePoint,
  ]);

  const publishSentenceLesson = useCallback(async () => {
    if (!selectedSentenceGrammarId || !sentenceProduction?.isReadyToPublish) {
      return;
    }

    try {
      setSentencePublishLoading(true);
      setSentencePublishMessage(null);
      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch(
        `${API_BASE}/review/grammar/${selectedSentenceGrammarId}/publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to publish lesson");
      }

      setSentencePublishMessage("Published staged lesson rows to live.");
      await Promise.all([loadSentenceRows(), loadData()]);
    } catch (err) {
      console.error("Failed to publish lesson rows:", err);
      setSentencePublishMessage(
        err instanceof Error ? err.message : "Failed to publish lesson",
      );
    } finally {
      setSentencePublishLoading(false);
    }
  }, [
    loadData,
    loadSentenceRows,
    router,
    selectedSentenceGrammarId,
    sentenceProduction?.isReadyToPublish,
  ]);

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
                  const production = summary?.production ?? null;
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
                      {production ? (
                        <Text style={styles.grammarWorkflowMeta}>
                          {formatWorkflowStatus(production.workflowStatus)} · live{" "}
                          {production.livePublishedCount}/{production.finalTargetCount}
                          {production.stagedRowCount > 0
                            ? ` · staged ${production.stagedRowCount}`
                            : ""}
                        </Text>
                      ) : null}
                      <Text style={styles.grammarPattern} numberOfLines={3}>
                        {point.pattern}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </DesktopPanel>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Sentence review"
                caption="Choose a lesson in the current stage and scan its rows in a compact table. Click a row to jump into the existing editor."
              />

              {selectedStage === "All" ? (
                <Text style={styles.helperText}>
                  Pick a stage above to load the lesson sentence table.
                </Text>
              ) : stageSentencePoints.length === 0 ? (
                <Text style={styles.helperText}>
                  No grammar topics found for this stage.
                </Text>
              ) : (
                <View style={styles.sentencePanelStack}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.lessonFilterWrap}
                  >
                    {stageSentencePoints.map((point) => {
                      const active = selectedSentenceGrammarId === point.id;
                      const summary = summaryById.get(point.id);
                      const production = summary?.production ?? null;
                      return (
                        <TouchableOpacity
                          key={point.id}
                          style={[
                            styles.lessonChip,
                            active && styles.lessonChipActive,
                          ]}
                          onPress={() => setSelectedSentenceGrammarId(point.id)}
                          activeOpacity={0.82}
                        >
                          <Text
                            style={[
                              styles.lessonChipTitle,
                              active && styles.lessonChipTitleActive,
                            ]}
                            numberOfLines={1}
                          >
                            {point.title}
                          </Text>
                          <Text
                            style={[
                              styles.lessonChipMeta,
                              active && styles.lessonChipMetaActive,
                            ]}
                          >
                            {production
                              ? `${formatWorkflowStatus(production.workflowStatus)} · live ${production.livePublishedCount}/${production.finalTargetCount}`
                              : `${active ? sentenceRows.length : (summary?.rowCount ?? 0)} rows`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {selectedSentencePoint ? (
                    <View style={styles.sentenceSummaryStack}>
                      <View style={styles.sentenceSummaryRow}>
                        <View style={styles.sentenceSummaryCard}>
                          <Text style={styles.sentenceSummaryLabel}>Lesson</Text>
                          <Text style={styles.sentenceSummaryValue}>
                            {selectedSentencePoint.title}
                          </Text>
                          <Text style={styles.sentenceSummaryHint}>
                            {selectedSentencePoint.id}
                          </Text>
                        </View>
                        <View style={styles.sentenceSummaryCard}>
                          <Text style={styles.sentenceSummaryLabel}>Rows</Text>
                          <Text style={styles.sentenceSummaryValue}>
                            {filteredSentenceRows.length}
                          </Text>
                          <Text style={styles.sentenceSummaryHint}>
                            {liveApprovedSentenceCount} published · {sentenceRows.length} total
                          </Text>
                        </View>
                        <View style={styles.sentenceSummaryCard}>
                          <Text style={styles.sentenceSummaryLabel}>Pattern</Text>
                          <Text
                            style={styles.sentenceSummaryValue}
                            numberOfLines={2}
                          >
                            {selectedSentencePoint.pattern}
                          </Text>
                        </View>
                        {sentenceProduction ? (
                          <>
                            <View style={styles.sentenceSummaryCard}>
                              <Text style={styles.sentenceSummaryLabel}>Workflow</Text>
                              <Text style={styles.sentenceSummaryValue}>
                                {formatWorkflowStatus(
                                  sentenceProduction.workflowStatus,
                                )}
                              </Text>
                              <Text style={styles.sentenceSummaryHint}>
                                wave{" "}
                                {sentenceProduction.currentRewriteWaveId
                                  ? sentenceProduction.currentRewriteWaveId
                                      .split("-")
                                      .slice(-1)[0]
                                  : "—"}
                              </Text>
                            </View>
                            <View style={styles.sentenceSummaryCard}>
                              <Text style={styles.sentenceSummaryLabel}>Live</Text>
                              <Text style={styles.sentenceSummaryValue}>
                                {sentenceProduction.livePublishedCount}/
                                {sentenceProduction.finalTargetCount}
                              </Text>
                              <Text style={styles.sentenceSummaryHint}>
                                published rows
                              </Text>
                            </View>
                            <View style={styles.sentenceSummaryCard}>
                              <Text style={styles.sentenceSummaryLabel}>
                                Staged
                              </Text>
                              <Text style={styles.sentenceSummaryValue}>
                                {sentenceProduction.currentWaveReadyCount}/
                                {sentenceProduction.finalTargetCount}
                              </Text>
                              <Text style={styles.sentenceSummaryHint}>
                                ready · {sentenceProduction.currentWaveRowCount} in
                                wave
                              </Text>
                            </View>
                            {isSentenceSalvageStage ? (
                              <View style={styles.sentenceSummaryCard}>
                                <Text style={styles.sentenceSummaryLabel}>
                                  Reusable
                                </Text>
                                <Text style={styles.sentenceSummaryValue}>
                                  {reusableSentenceCount}
                                </Text>
                                <Text style={styles.sentenceSummaryHint}>
                                  carry + revise live rows
                                </Text>
                              </View>
                            ) : null}
                          </>
                        ) : null}
                      </View>

                      {sentenceProduction ? (
                        <View style={styles.productionActionRow}>
                          <View style={styles.productionActionCopy}>
                            <Text style={styles.productionActionTitle}>
                              {isSentenceSalvageStage
                                ? "Salvage workflow"
                                : "Publish workflow"}
                            </Text>
                            <Text style={styles.productionActionText}>
                              {isSentenceSalvageStage
                                ? hasActiveStagedWave
                                  ? sentenceProduction.isReadyToPublish
                                    ? `This staged wave has ${sentenceProduction.currentWaveReadyCount} rows ready to replace the live lesson.`
                                    : `This staged wave has ${sentenceProduction.currentWaveReadyCount} ready rows. Need ${sentenceProduction.remainingForPublish} more before publishing.`
                                  : `Audit live rows first, then seed the next wave. ${reusableSentenceCount} live rows are currently marked carry or revise.`
                                : sentenceProduction.isReadyToPublish
                                  ? `This lesson has ${sentenceProduction.currentWaveReadyCount} staged rows that are approved and tone-reviewed.`
                                  : `Need ${sentenceProduction.remainingForPublish} more ready staged rows before replacing the live set.`}
                            </Text>
                            {sentencePublishMessage ? (
                              <Text style={styles.productionActionMessage}>
                                {sentencePublishMessage}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.productionActionButtons}>
                            {isSentenceSalvageStage ? (
                              <TouchableOpacity
                                style={[
                                  styles.seedWaveButton,
                                  (hasActiveStagedWave || sentenceSeedLoading) &&
                                    styles.publishButtonDisabled,
                                ]}
                                onPress={() => void seedSentenceLessonWave()}
                                activeOpacity={0.82}
                                disabled={hasActiveStagedWave || sentenceSeedLoading}
                              >
                                <Text style={styles.seedWaveButtonText}>
                                  {sentenceSeedLoading
                                    ? "Seeding…"
                                    : "Seed next wave"}
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                              style={[
                                styles.publishButton,
                                (!sentenceProduction.isReadyToPublish ||
                                  sentencePublishLoading) &&
                                  styles.publishButtonDisabled,
                              ]}
                              onPress={() => void publishSentenceLesson()}
                              activeOpacity={0.82}
                              disabled={
                                !sentenceProduction.isReadyToPublish ||
                                sentencePublishLoading
                              }
                            >
                              <Text style={styles.publishButtonText}>
                                {sentencePublishLoading
                                  ? "Publishing…"
                                  : "Publish lesson"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {sentenceRows.length > 0 ? (
                    <View style={styles.issueFilterStack}>
                      <View style={styles.issueFilterRow}>
                        {[
                          {
                            key: "all" as SentenceWorkflowFilter,
                            label: "All",
                            count: sentenceWorkflowCounts.all,
                          },
                          {
                            key: "published" as SentenceWorkflowFilter,
                            label: "Live",
                            count: sentenceWorkflowCounts.published,
                          },
                          {
                            key: "staged" as SentenceWorkflowFilter,
                            label: "Staged",
                            count: sentenceWorkflowCounts.staged,
                          },
                          ...(isSentenceSalvageStage
                            ? NEXT_WAVE_DECISIONS.map((decision) => ({
                                key: decision as SentenceWorkflowFilter,
                                label: formatNextWaveDecision(decision),
                                count: sentenceWorkflowCounts[decision],
                              }))
                            : []),
                        ].map((option) => {
                          const active = sentenceWorkflowFilter === option.key;
                          return (
                            <TouchableOpacity
                              key={option.key}
                              style={[
                                styles.issueFilterChip,
                                active && styles.issueFilterChipActive,
                              ]}
                              onPress={() => setSentenceWorkflowFilter(option.key)}
                              activeOpacity={0.82}
                            >
                              <Text
                                style={[
                                  styles.issueFilterChipLabel,
                                  active && styles.issueFilterChipLabelActive,
                                ]}
                              >
                                {option.label}
                              </Text>
                              <Text
                                style={[
                                  styles.issueFilterChipCount,
                                  active && styles.issueFilterChipCountActive,
                                ]}
                              >
                                {option.count}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

                  {sentenceRows.length > 0 ? (
                    <View style={styles.issueFilterRow}>
                      {[
                        {
                          key: "all" as const,
                          label: "All",
                          count: sentenceIssueCounts.all,
                        },
                        {
                          key: "thai" as const,
                          label: "Thai weak",
                          count: sentenceIssueCounts.thai,
                        },
                        {
                          key: "missing" as const,
                          label: "Tone?",
                          count: sentenceIssueCounts.missing,
                        },
                        {
                          key: "multi" as const,
                          label: "2+",
                          count: sentenceIssueCounts.multi,
                        },
                        {
                          key: "both" as const,
                          label: "Both",
                          count: sentenceIssueCounts.both,
                        },
                      ].map((filterOption) => {
                        const active = sentenceIssueFilter === filterOption.key;
                        return (
                          <TouchableOpacity
                            key={filterOption.key}
                            style={[
                              styles.issueFilterChip,
                              active && styles.issueFilterChipActive,
                            ]}
                            onPress={() => setSentenceIssueFilter(filterOption.key)}
                            activeOpacity={0.82}
                          >
                            <Text
                              style={[
                                styles.issueFilterChipLabel,
                                active && styles.issueFilterChipLabelActive,
                              ]}
                            >
                              {filterOption.label}
                            </Text>
                            <Text
                              style={[
                                styles.issueFilterChipCount,
                                active && styles.issueFilterChipCountActive,
                              ]}
                            >
                              {filterOption.count}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}

                  {sentenceRowsLoading ? (
                    <View style={styles.sentenceLoadingWrap}>
                      <ActivityIndicator size="small" color={Sketch.inkMuted} />
                    </View>
                  ) : sentenceRowsError ? (
                    <Text style={styles.helperText}>{sentenceRowsError}</Text>
                  ) : sentenceRows.length === 0 ? (
                    <Text style={styles.helperText}>
                      No sentence rows found for this lesson yet.
                    </Text>
                  ) : filteredSentenceRows.length === 0 ? (
                    <Text style={styles.helperText}>
                      No rows match this filter yet.
                    </Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator
                      style={styles.tableViewport}
                      contentContainerStyle={styles.tableScrollContent}
                    >
                      <View style={styles.tableWrap}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]}>
                          <Text style={[styles.tableHeaderText, styles.colRow]}>
                            Row
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colEnglish]}
                          >
                            English
                          </Text>
                          <Text style={[styles.tableHeaderText, styles.colThai]}>
                            Thai
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colRoman]}
                          >
                            Romanization
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colBreakdown]}
                          >
                            Breakdown
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colTones]}
                          >
                            Tones
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colSource]}
                          >
                            Source
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colNextWave]}
                          >
                            Next wave
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colPublish]}
                          >
                            Publish
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colDifficulty]}
                          >
                            Difficulty
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colStatus]}
                          >
                            Status
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colEdited]}
                          >
                            Edited
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colEditedBy]}
                          >
                            By
                          </Text>
                          <Text
                            style={[styles.tableHeaderText, styles.colAction]}
                          >
                            Action
                          </Text>
                        </View>

                        {filteredSentenceRows.map(({ row }, index) => (
                          <TouchableOpacity
                            key={row.id}
                            style={styles.tableRow}
                            onPress={() =>
                              router.push(
                                `/admin/grammar/${selectedSentenceGrammarId}/rows/${row.id}` as any,
                              )
                            }
                            activeOpacity={0.82}
                          >
                            <View style={[styles.colRow, styles.rowIndexCell]}>
                              <Text style={styles.rowIndexValue}>{index + 1}</Text>
                              {getRowToneFlags(row).length > 0 ? (
                                <View style={styles.rowFlagList}>
                                  {getRowToneFlags(row).map((flag) => (
                                    <View key={`${row.id}-${flag}`} style={styles.rowFlagPill}>
                                      <Text style={styles.rowFlagPillText}>{flag}</Text>
                                    </View>
                                  ))}
                                </View>
                              ) : null}
                            </View>
                            <Text
                              style={[styles.tableCellText, styles.colEnglish]}
                              numberOfLines={2}
                            >
                              {row.english}
                            </Text>
                            <Text
                              style={[styles.tableCellThai, styles.colThai]}
                              numberOfLines={2}
                            >
                              {row.thai}
                            </Text>
                            <Text
                              style={[styles.tableCellText, styles.colRoman]}
                              numberOfLines={2}
                            >
                              {row.romanization || "—"}
                            </Text>
                            <Text
                              style={[styles.tableCellText, styles.colBreakdown]}
                              numberOfLines={3}
                            >
                              {formatBreakdownPreview(row)}
                            </Text>
                            <Text
                              style={[styles.tableCellText, styles.colTones]}
                              numberOfLines={3}
                            >
                              {formatBreakdownTones(row)}
                            </Text>
                            <Text
                              style={[styles.tableCellText, styles.colSource]}
                              numberOfLines={2}
                            >
                              {row.sourceExampleId
                                ? (() => {
                                    const sourceRow = sentenceRowById.get(
                                      row.sourceExampleId,
                                    );
                                    const sourceDecision = sourceRow?.nextWaveDecision
                                      ? ` · ${formatNextWaveDecision(
                                          sourceRow.nextWaveDecision,
                                        )}`
                                      : "";
                                    return `Live #${row.sourceExampleId}${sourceDecision}`;
                                  })()
                                : "—"}
                            </Text>
                            <View style={styles.colNextWave}>
                              {isSentenceSalvageStage &&
                              row.publishState === "published" ? (
                                <View style={styles.auditDecisionRow}>
                                  {NEXT_WAVE_DECISIONS.map((decision) => {
                                    const active = row.nextWaveDecision === decision;
                                    const disabled = sentenceAuditSavingId === row.id;
                                    return (
                                      <Pressable
                                        key={`${row.id}-${decision}`}
                                        style={[
                                          styles.auditDecisionChip,
                                          active && styles.auditDecisionChipActive,
                                          disabled && styles.auditDecisionChipDisabled,
                                        ]}
                                        onPress={(event) => {
                                          event.stopPropagation?.();
                                          if (disabled) {
                                            return;
                                          }
                                          void updateNextWaveDecision(row.id, decision);
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.auditDecisionChipText,
                                            active && styles.auditDecisionChipTextActive,
                                          ]}
                                        >
                                          {formatNextWaveDecision(decision)}
                                        </Text>
                                      </Pressable>
                                    );
                                  })}
                                </View>
                              ) : (
                                <Text
                                  style={styles.tableCellText}
                                  numberOfLines={2}
                                >
                                  {row.publishState === "staged"
                                    ? row.sourceExampleId
                                      ? `Seeded from #${row.sourceExampleId}`
                                      : "Seeded"
                                    : "—"}
                                </Text>
                              )}
                            </View>
                            <Text
                              style={[styles.tableCellText, styles.colPublish]}
                              numberOfLines={1}
                            >
                              {row.publishState === "published"
                                ? "Live"
                                : row.publishState === "staged"
                                  ? "Staged"
                                  : "Retired"}
                            </Text>
                            <Text
                              style={[
                                styles.tableCellText,
                                styles.colDifficulty,
                                styles.tableCellCaps,
                              ]}
                            >
                              {row.difficulty}
                            </Text>
                            <View style={styles.colStatus}>
                              <View style={styles.rowStatusPill}>
                                <Text style={styles.rowStatusPillText}>
                                  {row.reviewStatus.replace("_", " ")}
                                </Text>
                              </View>
                            </View>
                            <View style={[styles.tableMetaCell, styles.colEdited]}>
                              <Text
                                style={styles.tableCellText}
                                numberOfLines={1}
                              >
                                {formatCompactTimestamp(row.lastEditedAt)}
                              </Text>
                              <Text
                                style={styles.tableMetaSubtext}
                                numberOfLines={1}
                              >
                                {formatRelativeTimestamp(row.lastEditedAt)}
                              </Text>
                            </View>
                            <Text
                              style={[styles.tableCellText, styles.colEditedBy]}
                              numberOfLines={2}
                            >
                              {formatReviewerName(
                                row.lastEditedByUserId
                                  ? sentenceReviewerById.get(row.lastEditedByUserId) ?? null
                                  : null,
                              )}
                            </Text>
                            <Text
                              style={[
                                styles.tableCellText,
                                styles.colAction,
                                styles.openCellText,
                              ]}
                            >
                              Edit row
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}
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
  grammarWorkflowMeta: {
    fontSize: 11,
    lineHeight: 16,
    color: Sketch.inkMuted,
  },
  grammarPattern: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
  sentencePanelStack: {
    gap: 16,
  },
  lessonFilterWrap: {
    gap: 8,
    paddingBottom: 2,
  },
  lessonChip: {
    minWidth: 116,
    maxWidth: 170,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    gap: 2,
  },
  lessonChipActive: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
  },
  lessonChipTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
  },
  lessonChipTitleActive: {
    color: Sketch.ink,
  },
  lessonChipMeta: {
    fontSize: 11,
    color: Sketch.inkMuted,
  },
  lessonChipMetaActive: {
    color: Sketch.inkLight,
  },
  sentenceSummaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sentenceSummaryStack: {
    gap: 12,
  },
  issueFilterStack: {
    gap: 8,
  },
  issueFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  issueFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  issueFilterChipActive: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
  },
  issueFilterChipLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
  },
  issueFilterChipLabelActive: {
    color: Sketch.accent,
  },
  issueFilterChipCount: {
    fontSize: 11,
    color: Sketch.inkMuted,
  },
  issueFilterChipCountActive: {
    color: Sketch.accent,
  },
  sentenceSummaryCard: {
    minWidth: 180,
    flex: 1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 12,
    gap: 4,
  },
  sentenceSummaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  sentenceSummaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sentenceSummaryHint: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  productionActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 14,
  },
  productionActionCopy: {
    flex: 1,
    gap: 4,
  },
  productionActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productionActionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  productionActionText: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
  productionActionMessage: {
    fontSize: 12,
    color: Sketch.accent,
  },
  publishButton: {
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  publishButtonDisabled: {
    opacity: 0.45,
  },
  publishButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.paper,
  },
  seedWaveButton: {
    minWidth: 132,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.paper,
  },
  seedWaveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accent,
  },
  sentenceLoadingWrap: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  tableScrollContent: {
    paddingBottom: 6,
    minWidth: "100%",
  },
  tableViewport: {
    width: "100%",
  },
  tableWrap: {
    minWidth: 1608,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  tableHeaderRow: {
    backgroundColor: Sketch.cardBg,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tableCellText: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.ink,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tableCellThai: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tableCellCaps: {
    textTransform: "uppercase",
    color: Sketch.inkMuted,
  },
  tableMetaCell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },
  tableMetaSubtext: {
    fontSize: 11,
    lineHeight: 16,
    color: Sketch.inkMuted,
  },
  rowIndexCell: {
    width: 78,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 6,
  },
  rowIndexValue: {
    fontSize: 12,
    lineHeight: 16,
    color: Sketch.ink,
  },
  rowFlagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  rowFlagPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  rowFlagPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  rowStatusPill: {
    alignSelf: "center",
    marginHorizontal: 10,
    marginVertical: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  rowStatusPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.ink,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  openCellText: {
    fontWeight: "700",
    color: Sketch.accent,
  },
  auditDecisionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingVertical: 8,
  },
  auditDecisionChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  auditDecisionChipActive: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
  },
  auditDecisionChipDisabled: {
    opacity: 0.55,
  },
  auditDecisionChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  auditDecisionChipTextActive: {
    color: Sketch.accent,
  },
  colRow: {
    width: 78,
  },
  colEnglish: {
    width: 170,
  },
  colThai: {
    width: 160,
  },
  colRoman: {
    width: 170,
  },
  colBreakdown: {
    width: 220,
  },
  colTones: {
    width: 210,
  },
  colSource: {
    width: 122,
  },
  colNextWave: {
    width: 222,
  },
  colPublish: {
    width: 78,
  },
  colDifficulty: {
    width: 84,
  },
  colStatus: {
    width: 108,
  },
  colEdited: {
    width: 136,
  },
  colEditedBy: {
    width: 118,
  },
  colAction: {
    width: 72,
  },
});
