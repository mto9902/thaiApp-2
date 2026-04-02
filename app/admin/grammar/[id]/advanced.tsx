import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { API_BASE } from "@/src/config";
import { type GrammarPoint } from "@/src/data/grammar";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { getAuthToken } from "@/src/utils/authStorage";

type Row = {
  key: string;
  thai: string;
  romanization: string;
  english: string;
  difficulty: "easy" | "medium" | "hard";
  breakdownText: string;
  toneConfidence: number;
  toneStatus: "approved" | "review";
  toneReasonSummary: string;
  flaggedItemCount: number;
};

type Draft = {
  title: string;
  stage: (typeof GRAMMAR_STAGES)[number];
  explanation: string;
  pattern: string;
  aiPrompt: string;
  exampleThai: string;
  exampleRoman: string;
  exampleEnglish: string;
  exampleBreakdownText: string;
  focusParticle: string;
  focusMeaning: string;
};

type BulkMode = "rows" | "thai" | "romanization" | "english";
type RowsViewMode = "cards" | "table";

const BULK_LABELS: Record<BulkMode, string> = {
  rows: "Rows TSV",
  thai: "Thai column",
  romanization: "Romanization column",
  english: "English column",
};

const newKey = () => `row-${Date.now()}-${Math.random()}`;
const emptyRow = (): Row => ({
  key: newKey(),
  thai: "",
  romanization: "",
  english: "",
  difficulty: "easy",
  breakdownText: "[]",
  toneConfidence: 0,
  toneStatus: "review",
  toneReasonSummary: "",
  flaggedItemCount: 0,
});
const prettyJson = (value: unknown) => JSON.stringify(value ?? [], null, 2);

function summarizeToneReasons(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return "";
  }

  const reasons = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, 2);

  return reasons.join(" | ");
}

function makeDraft(point: GrammarPoint): Draft {
  return {
    title: point.title,
    stage: point.stage,
    explanation: point.explanation,
    pattern: point.pattern,
    aiPrompt: point.aiPrompt ?? "",
    exampleThai: point.example.thai,
    exampleRoman: point.example.roman,
    exampleEnglish: point.example.english,
    exampleBreakdownText: prettyJson(point.example.breakdown),
    focusParticle: point.focus.particle,
    focusMeaning: point.focus.meaning,
  };
}

function makeRow(row: any): Row {
  return {
    key: newKey(),
    thai: row?.thai ?? "",
    romanization: row?.romanization ?? "",
    english: row?.english ?? "",
    difficulty:
      row?.difficulty === "medium" || row?.difficulty === "hard"
        ? row.difficulty
        : "easy",
    breakdownText: prettyJson(row?.breakdown ?? []),
    toneConfidence:
      typeof row?.toneConfidence === "number"
        ? row.toneConfidence
        : typeof row?.tone_confidence === "number"
          ? row.tone_confidence
          : 0,
    toneStatus:
      row?.toneStatus === "approved" || row?.tone_status === "approved"
        ? "approved"
        : "review",
    toneReasonSummary: summarizeToneReasons(
      row?.toneAnalysis?.reasons ?? row?.tone_analysis?.reasons,
    ),
    flaggedItemCount:
      typeof row?.toneAnalysis?.flaggedItemCount === "number"
        ? row.toneAnalysis.flaggedItemCount
        : typeof row?.tone_analysis?.flaggedItemCount === "number"
          ? row.tone_analysis.flaggedItemCount
          : 0,
  };
}

function rowsToTsv(rows: Row[]) {
  return rows
    .map((row) =>
      [row.thai, row.romanization, row.english, row.difficulty, row.breakdownText]
        .map((value) => String(value).replace(/\r?\n/g, " "))
        .join("\t"),
    )
    .join("\n");
}

function tsvToRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [thai = "", romanization = "", english = "", difficulty = "easy", breakdownText = "[]"] =
        line.split("\t");
      return {
        key: newKey(),
        thai,
        romanization,
        english,
        difficulty:
          difficulty === "medium" || difficulty === "hard" ? difficulty : "easy",
        breakdownText,
      } as Row;
    });
}

function columnText(rows: Row[], field: "thai" | "romanization" | "english") {
  return rows.map((row) => row[field]).join("\n");
}

function applyColumn(rows: Row[], field: "thai" | "romanization" | "english", text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return rows;
  const next = [...rows];
  lines.forEach((line, index) => {
    if (!next[index]) next[index] = emptyRow();
    next[index] = { ...next[index], [field]: line };
  });
  return next;
}

function summarizeBreakdown(breakdownText: string) {
  try {
    const parsed = JSON.parse(breakdownText);
    if (!Array.isArray(parsed) || parsed.length === 0) return "No breakdown";
    const tokens = parsed
      .map((item) => (item && typeof item === "object" ? item.thai : ""))
      .filter((value) => typeof value === "string" && value.trim().length > 0)
      .slice(0, 4);
    if (tokens.length === 0) return `${parsed.length} item${parsed.length === 1 ? "" : "s"}`;
    return `${tokens.join(" | ")}${parsed.length > tokens.length ? " ..." : ""}`;
  } catch {
    return "Invalid JSON";
  }
}

export default function AdminGrammarEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { grammarById, refresh } = useGrammarCatalog();
  const grammarPoint = typeof id === "string" ? grammarById.get(id) : null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [visibleRows, setVisibleRows] = useState(20);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorKey, setEditorKey] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<Row>(emptyRow());
  const [bulkVisible, setBulkVisible] = useState(false);
  const [bulkMode, setBulkMode] = useState<BulkMode>("rows");
  const [bulkText, setBulkText] = useState("");
  const [rowsViewMode, setRowsViewMode] = useState<RowsViewMode>("cards");

  useEffect(() => {
    if (grammarPoint) setDraft(makeDraft(grammarPoint));
  }, [grammarPoint]);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const res = await fetch(`${API_BASE}/admin/grammar/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!res.ok) throw new Error(`Failed to load grammar (${res.status})`);
      const data = await res.json();
      setAccessDenied(false);
      setRows(Array.isArray(data?.rows) ? data.rows.map(makeRow) : []);
      setVisibleRows(20);
    } catch (err) {
      console.error("Failed to load admin grammar detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(useCallback(() => {
    void loadDetail();
  }, [loadDetail]));

  const levelLabel = useMemo(
    () => (draft ? GRAMMAR_STAGE_META[draft.stage].level : ""),
    [draft],
  );

  const shownRows = useMemo(() => rows.slice(0, visibleRows), [rows, visibleRows]);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function openEditRow(row: Row) {
    setEditorKey(row.key);
    setRowDraft({ ...row });
    setEditorVisible(true);
  }

  function openNewRow() {
    setEditorKey(null);
    setRowDraft(emptyRow());
    setEditorVisible(true);
  }

  function saveRow() {
    if (!rowDraft.thai.trim()) {
      Alert.alert("Thai required", "Each row needs Thai text.");
      return;
    }
    setRows((current) =>
      editorKey
        ? current.map((row) => (row.key === editorKey ? rowDraft : row))
        : [...current, rowDraft],
    );
    setVisibleRows((current) => Math.max(current, rows.length + 1, 20));
    setEditorVisible(false);
  }

  function deleteRow() {
    if (!editorKey) return;
    setRows((current) => current.filter((row) => row.key !== editorKey));
    setEditorVisible(false);
  }

  function loadBulkText(nextMode = bulkMode) {
    setBulkText(
      nextMode === "rows"
        ? rowsToTsv(rows)
        : columnText(rows, nextMode),
    );
  }

  function openBulkTools() {
    loadBulkText();
    setBulkVisible(true);
  }

  function applyBulkChanges() {
    if (bulkMode === "rows") {
      setRows(tsvToRows(bulkText));
      setVisibleRows(20);
      setBulkVisible(false);
      return;
    }
    setRows((current) => applyColumn(current, bulkMode, bulkText));
    setBulkVisible(false);
  }

  async function saveGrammar() {
    if (!draft || !id || saving) return;
    try {
      setSaving(true);
      const token = await getAuthToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const payload = {
        override: {
          title: draft.title,
          level: GRAMMAR_STAGE_META[draft.stage].level,
          stage: draft.stage,
          explanation: draft.explanation,
          pattern: draft.pattern,
          aiPrompt: draft.aiPrompt,
          example: {
            thai: draft.exampleThai,
            roman: draft.exampleRoman,
            english: draft.exampleEnglish,
            breakdown: JSON.parse(draft.exampleBreakdownText),
          },
          focus: {
            particle: draft.focusParticle,
            meaning: draft.focusMeaning,
          },
        },
        rows: rows.map((row) => ({
          thai: row.thai,
          romanization: row.romanization,
          english: row.english,
          difficulty: row.difficulty,
          breakdown: JSON.parse(row.breakdownText),
        })),
      };
      const res = await fetch(`${API_BASE}/admin/grammar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save grammar");
      await refresh();
      Alert.alert("Saved", "Lesson content and practice rows were updated.");
      void loadDetail();
    } catch (err) {
      Alert.alert(
        "Save failed",
        err instanceof Error ? err.message : "Failed to save grammar",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!grammarPoint && !loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyTitle}>Grammar point not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      <Modal visible={editorVisible} transparent animationType="fade" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setEditorVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editorKey ? "Edit row" : "New row"}</Text>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setEditorVisible(false)} activeOpacity={0.82}>
                <Ionicons name="close" size={20} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Thai</Text>
              <TextInput value={rowDraft.thai} onChangeText={(thai) => setRowDraft((current) => ({ ...current, thai }))} style={styles.input} />
              <Text style={styles.fieldLabel}>Romanization</Text>
              <TextInput value={rowDraft.romanization} onChangeText={(romanization) => setRowDraft((current) => ({ ...current, romanization }))} style={styles.input} />
              <Text style={styles.fieldLabel}>English</Text>
              <TextInput value={rowDraft.english} onChangeText={(english) => setRowDraft((current) => ({ ...current, english }))} style={styles.input} />
              <Text style={styles.fieldLabel}>Difficulty</Text>
              <View style={styles.chipRow}>
                {(["easy", "medium", "hard"] as const).map((difficulty) => {
                  const active = rowDraft.difficulty === difficulty;
                  return (
                    <TouchableOpacity key={difficulty} style={[styles.chip, active && styles.chipActive]} onPress={() => setRowDraft((current) => ({ ...current, difficulty }))} activeOpacity={0.82}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{difficulty}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.fieldLabel}>Breakdown JSON</Text>
              <TextInput value={rowDraft.breakdownText} onChangeText={(breakdownText) => setRowDraft((current) => ({ ...current, breakdownText }))} style={[styles.input, styles.jsonArea]} multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} />
              <View style={styles.modalActions}>
                {editorKey ? (
                  <TouchableOpacity style={styles.deleteBtn} onPress={deleteRow} activeOpacity={0.82}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                ) : <View />}
                <View style={styles.modalActionsRight}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditorVisible(false)} activeOpacity={0.82}>
                    <Text style={styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={saveRow} activeOpacity={0.82}>
                    <Text style={styles.primaryBtnText}>Save row</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={bulkVisible} transparent animationType="fade" onRequestClose={() => setBulkVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setBulkVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk tools</Text>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setBulkVisible(false)} activeOpacity={0.82}>
                <Ionicons name="close" size={20} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.helperText}>Use this box as a copy and paste workspace. Long-press inside the text area to select and copy, or paste edited content back in.</Text>
              <View style={styles.chipRow}>
                {(Object.keys(BULK_LABELS) as BulkMode[]).map((mode) => {
                  const active = bulkMode === mode;
                  return (
                    <TouchableOpacity key={mode} style={[styles.chip, active && styles.chipActive]} onPress={() => { setBulkMode(mode); loadBulkText(mode); }} activeOpacity={0.82}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{BULK_LABELS[mode]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput value={bulkText} onChangeText={setBulkText} style={[styles.input, styles.bulkArea]} multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} />
              <View style={styles.modalActionsRight}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => loadBulkText()} activeOpacity={0.82}>
                  <Text style={styles.secondaryBtnText}>Load current</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={applyBulkChanges} activeOpacity={0.82}>
                  <Text style={styles.primaryBtnText}>{bulkMode === "rows" ? "Replace rows" : "Apply column"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.82}>
          <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Lesson</Text>
          <Text style={styles.headerSubtitle}>{grammarPoint?.id ?? id}</Text>
        </View>
        <TouchableOpacity style={[styles.primaryBtn, saving && styles.saveDisabled]} onPress={() => void saveGrammar()} activeOpacity={0.82} disabled={saving}>
          <Text style={styles.primaryBtnText}>{saving ? "Saving" : "Save"}</Text>
        </TouchableOpacity>
      </View>

      {loading || !draft ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      ) : accessDenied ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyTitle}>Admin access required</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lesson content</Text>
            <View style={styles.card}>
              <Text style={styles.metaText}>ID - {grammarPoint?.id}</Text>
              <Text style={styles.metaText}>Level - {levelLabel}</Text>
              <Text style={styles.fieldLabel}>Stage</Text>
              <View style={styles.chipRow}>
                {GRAMMAR_STAGES.map((stage) => {
                  const active = draft.stage === stage;
                  return (
                    <TouchableOpacity key={stage} style={[styles.chip, active && styles.chipActive]} onPress={() => updateDraft("stage", stage)} activeOpacity={0.82}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{stage}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput value={draft.title} onChangeText={(value) => updateDraft("title", value)} style={styles.input} />
              <Text style={styles.fieldLabel}>Pattern</Text>
              <TextInput value={draft.pattern} onChangeText={(value) => updateDraft("pattern", value)} style={styles.input} />
              <Text style={styles.fieldLabel}>Explanation</Text>
              <TextInput value={draft.explanation} onChangeText={(value) => updateDraft("explanation", value)} style={[styles.input, styles.textareaLg]} multiline textAlignVertical="top" />
              <Text style={styles.fieldLabel}>AI Prompt</Text>
              <TextInput value={draft.aiPrompt} onChangeText={(value) => updateDraft("aiPrompt", value)} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
              <Text style={styles.fieldLabel}>Focus particle</Text>
              <TextInput value={draft.focusParticle} onChangeText={(value) => updateDraft("focusParticle", value)} style={styles.input} />
              <Text style={styles.fieldLabel}>Focus meaning</Text>
              <TextInput value={draft.focusMeaning} onChangeText={(value) => updateDraft("focusMeaning", value)} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Example</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Thai</Text>
              <TextInput value={draft.exampleThai} onChangeText={(value) => updateDraft("exampleThai", value)} style={styles.input} />
              <Text style={styles.fieldLabel}>Romanization</Text>
              <TextInput value={draft.exampleRoman} onChangeText={(value) => updateDraft("exampleRoman", value)} style={styles.input} />
              <Text style={styles.fieldLabel}>English</Text>
              <TextInput value={draft.exampleEnglish} onChangeText={(value) => updateDraft("exampleEnglish", value)} style={styles.input} />
              <Text style={styles.fieldLabel}>Example breakdown JSON</Text>
              <TextInput value={draft.exampleBreakdownText} onChangeText={(value) => updateDraft("exampleBreakdownText", value)} style={[styles.input, styles.jsonArea]} multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.rowsHeader}>
              <Text style={styles.sectionTitle}>Practice rows</Text>
              <View style={styles.modalActionsRight}>
                <View style={styles.viewToggle}>
                  {(["cards", "table"] as const).map((mode) => {
                    const active = rowsViewMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.viewToggleButton, active && styles.viewToggleButtonActive]}
                        onPress={() => setRowsViewMode(mode)}
                        activeOpacity={0.82}
                      >
                        <Text style={[styles.viewToggleText, active && styles.viewToggleTextActive]}>
                          {mode === "cards" ? "Cards" : "Table"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity style={styles.secondaryBtn} onPress={openBulkTools} activeOpacity={0.82}>
                  <Text style={styles.secondaryBtnText}>Bulk tools</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={openNewRow} activeOpacity={0.82}>
                  <Text style={styles.secondaryBtnText}>Add row</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.helperText}>
              {rowsViewMode === "cards"
                ? "Rows are shown as compact cards and opened one at a time for editing."
                : "Spreadsheet view shows all rows at once. Tap any row to edit it."}
            </Text>
            {rowsViewMode === "cards" ? (
              <>
                {shownRows.map((row, index) => (
                  <TouchableOpacity key={row.key} style={styles.rowCard} onPress={() => openEditRow(row)} activeOpacity={0.82}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowIndex}>Row {index + 1}</Text>
                      <View style={styles.rowTopMeta}>
                        <Text style={styles.rowMeta}>{row.difficulty}</Text>
                        <View style={[styles.statusBadge, row.toneStatus === "approved" ? styles.statusBadgeApproved : styles.statusBadgeReview]}>
                          <Text style={[styles.statusBadgeText, row.toneStatus === "approved" ? styles.statusBadgeTextApproved : styles.statusBadgeTextReview]}>
                            {row.toneStatus === "approved" ? `Approved ${row.toneConfidence}` : `Review ${row.toneConfidence}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.rowThai} numberOfLines={1}>{row.thai || "Untitled row"}</Text>
                    <Text style={styles.rowEnglish} numberOfLines={1}>{row.english || "No English gloss yet"}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>{row.romanization || "No romanization yet"}</Text>
                    {row.toneReasonSummary ? (
                      <Text style={styles.rowReviewNote} numberOfLines={2}>
                        {row.toneReasonSummary}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
                {rows.length > visibleRows ? (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVisibleRows((current) => Math.min(rows.length, current + 20))} activeOpacity={0.82}>
                    <Text style={styles.secondaryBtnText}>Show 20 more rows</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScrollContent}>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableCell, styles.tableCellIndex, styles.tableHeaderText]}>#</Text>
                    <Text style={[styles.tableCell, styles.tableCellThai, styles.tableHeaderText]}>Thai</Text>
                    <Text style={[styles.tableCell, styles.tableCellRoman, styles.tableHeaderText]}>Romanization</Text>
                    <Text style={[styles.tableCell, styles.tableCellEnglish, styles.tableHeaderText]}>English</Text>
                    <Text style={[styles.tableCell, styles.tableCellDifficulty, styles.tableHeaderText]}>Difficulty</Text>
                    <Text style={[styles.tableCell, styles.tableCellToneReview, styles.tableHeaderText]}>Tone review</Text>
                    <Text style={[styles.tableCell, styles.tableCellBreakdown, styles.tableHeaderText]}>Breakdown</Text>
                  </View>
                  {rows.map((row, index) => (
                    <TouchableOpacity key={row.key} style={styles.tableRow} onPress={() => openEditRow(row)} activeOpacity={0.82}>
                      <Text style={[styles.tableCell, styles.tableCellIndex]}>{index + 1}</Text>
                      <Text style={[styles.tableCell, styles.tableCellThai]}>{row.thai || "-"}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRoman]}>{row.romanization || "-"}</Text>
                      <Text style={[styles.tableCell, styles.tableCellEnglish]}>{row.english || "-"}</Text>
                      <Text style={[styles.tableCell, styles.tableCellDifficulty]}>{row.difficulty}</Text>
                      <Text style={[styles.tableCell, styles.tableCellToneReview]}>
                        {row.toneStatus === "approved" ? `Approved ${row.toneConfidence}` : `Review ${row.toneConfidence}`}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellBreakdown]}>{summarizeBreakdown(row.breakdownText)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Sketch.ink },
  headerSubtitle: { fontSize: 12, color: Sketch.inkMuted },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Sketch.ink },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 18 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Sketch.ink },
  card: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 16,
    gap: 10,
  },
  metaText: { fontSize: 12, color: Sketch.inkMuted },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: Sketch.ink,
  },
  textarea: { minHeight: 72 },
  textareaLg: { minHeight: 132 },
  jsonArea: { minHeight: 160, fontFamily: "monospace" },
  bulkArea: { minHeight: 220, fontFamily: "monospace" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  chipActive: { borderColor: Sketch.orange, backgroundColor: Sketch.cardBg },
  chipText: { fontSize: 13, fontWeight: "600", color: Sketch.inkMuted },
  chipTextActive: { color: Sketch.ink },
  rowsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
  viewToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  viewToggleButtonActive: {
    backgroundColor: Sketch.cardBg,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  viewToggleTextActive: {
    color: Sketch.ink,
  },
  tableScrollContent: {
    paddingBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    minWidth: 980,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  tableHeaderRow: {
    borderTopWidth: 0,
    backgroundColor: Sketch.cardBg,
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 18,
    color: Sketch.ink,
    borderLeftWidth: 1,
    borderLeftColor: Sketch.inkFaint,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableCellIndex: {
    width: 56,
    borderLeftWidth: 0,
  },
  tableCellThai: {
    width: 210,
    fontWeight: "700",
  },
  tableCellRoman: {
    width: 220,
    color: Sketch.inkMuted,
  },
  tableCellEnglish: {
    width: 260,
    color: Sketch.inkLight,
  },
  tableCellDifficulty: {
    width: 110,
    textTransform: "uppercase",
  },
  tableCellToneReview: {
    width: 150,
  },
  tableCellBreakdown: {
    width: 260,
    color: Sketch.inkMuted,
  },
  helperText: { fontSize: 13, lineHeight: 19, color: Sketch.inkMuted },
  rowCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 14,
    gap: 6,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowTopMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  rowIndex: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowThai: { fontSize: 17, fontWeight: "700", color: Sketch.ink },
  rowEnglish: { fontSize: 13, color: Sketch.inkLight },
  rowMeta: { fontSize: 12, color: Sketch.inkMuted, textTransform: "uppercase" },
  rowReviewNote: { fontSize: 12, lineHeight: 17, color: Sketch.inkMuted },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeApproved: {
    borderColor: "#BFD0B4",
    backgroundColor: "#F3F7F1",
  },
  statusBadgeReview: {
    borderColor: "#E1C2BE",
    backgroundColor: "#FCF3F2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusBadgeTextApproved: {
    color: "#40503B",
  },
  statusBadgeTextReview: {
    color: "#634543",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    padding: 20,
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Sketch.ink },
  modalBody: { gap: 12 },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 6,
  },
  modalActionsRight: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Sketch.orange,
    backgroundColor: Sketch.orange,
  },
  primaryBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: "600", color: Sketch.ink },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#D8C5C0",
    backgroundColor: "#F7F2F0",
  },
  deleteBtnText: { fontSize: 13, fontWeight: "700", color: "#826A66" },
  saveDisabled: { opacity: 0.7 },
});
