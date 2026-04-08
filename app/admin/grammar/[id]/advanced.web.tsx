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
  useWindowDimensions,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import { type GrammarPoint } from "@/src/data/grammar";
import { GRAMMAR_STAGE_META, GRAMMAR_STAGES } from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { getAuthToken } from "@/src/utils/authStorage";

type Row = {
  key: string;
  thai: string;
  romanization: string;
  english: string;
  difficulty: "easy" | "medium" | "hard";
  breakdownText: string;
};

type Draft = {
  title: string;
  stage: (typeof GRAMMAR_STAGES)[number];
  hiddenFromLearners: boolean;
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
});

const prettyJson = (value: unknown) => JSON.stringify(value ?? [], null, 2);

function makeDraft(point: GrammarPoint): Draft {
  return {
    title: point.title,
    stage: point.stage,
    hiddenFromLearners: point.hiddenFromLearners === true,
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

function applyColumn(
  rows: Row[],
  field: "thai" | "romanization" | "english",
  text: string,
) {
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

export default function AdminGrammarEditorWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allGrammarById, refresh } = useGrammarCatalog();
  const grammarPoint = typeof id === "string" ? allGrammarById.get(id) : null;

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

  const isWide = width >= 1180;
  const isMedium = width >= 940;

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

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

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
    setBulkText(nextMode === "rows" ? rowsToTsv(rows) : columnText(rows, nextMode));
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
          hiddenFromLearners: draft.hiddenFromLearners,
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
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <DesktopPage
          widthVariant="wide"
          eyebrow="Admin"
          title="Lesson not found"
          subtitle="This grammar topic is not available in the current catalog."
        >
          <DesktopPanel>
            <Text style={styles.helperText}>Grammar point not found.</Text>
          </DesktopPanel>
        </DesktopPage>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Modal
        visible={editorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditorVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setEditorVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editorKey ? "Edit row" : "New row"}</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setEditorVisible(false)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={18} color={Sketch.inkMuted} />
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
                    <TouchableOpacity
                      key={difficulty}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setRowDraft((current) => ({ ...current, difficulty }))}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{difficulty}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.fieldLabel}>Breakdown JSON</Text>
              <TextInput value={rowDraft.breakdownText} onChangeText={(breakdownText) => setRowDraft((current) => ({ ...current, breakdownText }))} style={[styles.input, styles.jsonArea]} multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} />
              <View style={styles.modalActions}>
                {editorKey ? (
                  <TouchableOpacity style={styles.deleteButton} onPress={deleteRow} activeOpacity={0.82}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                ) : <View />}
                <View style={styles.toolbar}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditorVisible(false)} activeOpacity={0.82}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveRow} activeOpacity={0.82}>
                    <Text style={styles.primaryButtonText}>Save row</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={bulkVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBulkVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setBulkVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk tools</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setBulkVisible(false)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={18} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.helperText}>
                Use this text area as a copy and paste workspace for rows or one column at a time.
              </Text>
              <View style={styles.chipRow}>
                {(Object.keys(BULK_LABELS) as BulkMode[]).map((mode) => {
                  const active = bulkMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        setBulkMode(mode);
                        loadBulkText(mode);
                      }}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {BULK_LABELS[mode]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput value={bulkText} onChangeText={setBulkText} style={[styles.input, styles.bulkArea]} multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} />
              <View style={styles.modalActionsEnd}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => loadBulkText()} activeOpacity={0.82}>
                  <Text style={styles.secondaryButtonText}>Load current</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={applyBulkChanges} activeOpacity={0.82}>
                  <Text style={styles.primaryButtonText}>{bulkMode === "rows" ? "Replace rows" : "Apply column"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DesktopPage
        widthVariant="wide"
        eyebrow="Admin"
        title={draft ? `Edit ${draft.title}` : "Edit lesson"}
        subtitle={grammarPoint?.id ?? String(id)}
        toolbar={
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} activeOpacity={0.82}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, saving && styles.disabledButton]} onPress={() => void saveGrammar()} activeOpacity={0.82} disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? "Saving" : "Save lesson"}</Text>
            </TouchableOpacity>
          </View>
        }
      >
        {loading || !draft ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={Sketch.inkMuted} />
          </DesktopPanel>
        ) : accessDenied ? (
          <DesktopPanel>
            <Text style={styles.deniedTitle}>Admin access required</Text>
            <Text style={styles.helperText}>This account is not marked as an admin yet.</Text>
          </DesktopPanel>
        ) : (
          <View style={styles.pageContent}>
            <View style={[styles.topGrid, !isWide && styles.stack]}>
              <DesktopPanel style={styles.lessonPanel}>
                <DesktopSectionTitle title="Lesson content" caption={`ID ${grammarPoint?.id} · Level ${levelLabel}`} />
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
                <Text style={styles.fieldLabel}>Learner visibility</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, !draft.hiddenFromLearners && styles.chipActive]}
                    onPress={() => updateDraft("hiddenFromLearners", false)}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.chipText, !draft.hiddenFromLearners && styles.chipTextActive]}>
                      Visible to learners
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, draft.hiddenFromLearners && styles.chipActive]}
                    onPress={() => updateDraft("hiddenFromLearners", true)}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.chipText, draft.hiddenFromLearners && styles.chipTextActive]}>
                      Hidden from learners
                    </Text>
                  </TouchableOpacity>
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
              </DesktopPanel>

              <DesktopPanel style={styles.examplePanel}>
                <DesktopSectionTitle title="Example" caption="This content appears on the lesson page." />
                <Text style={styles.fieldLabel}>Thai</Text>
                <TextInput value={draft.exampleThai} onChangeText={(value) => updateDraft("exampleThai", value)} style={styles.input} />
                <Text style={styles.fieldLabel}>Romanization</Text>
                <TextInput value={draft.exampleRoman} onChangeText={(value) => updateDraft("exampleRoman", value)} style={styles.input} />
                <Text style={styles.fieldLabel}>English</Text>
                <TextInput value={draft.exampleEnglish} onChangeText={(value) => updateDraft("exampleEnglish", value)} style={styles.input} />
                <Text style={styles.fieldLabel}>Example breakdown JSON</Text>
                <TextInput value={draft.exampleBreakdownText} onChangeText={(value) => updateDraft("exampleBreakdownText", value)} style={[styles.input, styles.jsonArea]} multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} />
              </DesktopPanel>
            </View>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Practice rows"
                caption={
                  rowsViewMode === "cards"
                    ? `${rows.length} rows loaded. Use a compact list on desktop and open one at a time to edit it.`
                    : `${rows.length} rows loaded. Spreadsheet view shows every row in one place.`
                }
                action={
                  <View style={styles.toolbar}>
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
                    <TouchableOpacity style={styles.secondaryButton} onPress={openBulkTools} activeOpacity={0.82}>
                      <Text style={styles.secondaryButtonText}>Bulk tools</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={openNewRow} activeOpacity={0.82}>
                      <Text style={styles.secondaryButtonText}>Add row</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
              {rowsViewMode === "cards" ? (
                <>
                  <View style={styles.rowGrid}>
                    {shownRows.map((row, index) => (
                      <TouchableOpacity key={row.key} style={[styles.rowCard, isMedium ? { width: "31.8%" } : { width: "100%" }]} onPress={() => openEditRow(row)} activeOpacity={0.82}>
                        <View style={styles.rowCardTop}>
                          <Text style={styles.rowIndex}>Row {index + 1}</Text>
                          <Text style={styles.rowDifficulty}>{row.difficulty}</Text>
                        </View>
                        <Text style={styles.rowThai} numberOfLines={1}>{row.thai || "Untitled row"}</Text>
                        <Text style={styles.rowEnglish} numberOfLines={1}>{row.english || "No English gloss yet"}</Text>
                        <Text style={styles.rowRoman} numberOfLines={1}>{row.romanization || "No romanization yet"}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {rows.length > visibleRows ? (
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setVisibleRows((current) => Math.min(rows.length, current + 20))} activeOpacity={0.82}>
                      <Text style={styles.secondaryButtonText}>Show 20 more rows</Text>
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
                      <Text style={[styles.tableCell, styles.tableCellBreakdown, styles.tableHeaderText]}>Breakdown</Text>
                    </View>
                    {rows.map((row, index) => (
                      <TouchableOpacity key={row.key} style={styles.tableRow} onPress={() => openEditRow(row)} activeOpacity={0.82}>
                        <Text style={[styles.tableCell, styles.tableCellIndex]}>{index + 1}</Text>
                        <Text style={[styles.tableCell, styles.tableCellThai]}>{row.thai || "-"}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRoman]}>{row.romanization || "-"}</Text>
                        <Text style={[styles.tableCell, styles.tableCellEnglish]}>{row.english || "-"}</Text>
                        <Text style={[styles.tableCell, styles.tableCellDifficulty]}>{row.difficulty}</Text>
                        <Text style={[styles.tableCell, styles.tableCellBreakdown]}>{summarizeBreakdown(row.breakdownText)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </DesktopPanel>
          </View>
        )}
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: "column",
  },
  pageContent: {
    gap: 20,
  },
  topGrid: {
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },
  lessonPanel: {
    flex: 1.1,
  },
  examplePanel: {
    flex: 0.95,
  },
  rowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  viewToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  loadingPanel: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Sketch.ink,
  },
  textarea: {
    minHeight: 90,
  },
  textareaLg: {
    minHeight: 180,
  },
  jsonArea: {
    minHeight: 220,
    fontFamily: "monospace",
  },
  bulkArea: {
    minHeight: 320,
    fontFamily: "monospace",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  chipActive: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  chipTextActive: {
    color: Sketch.ink,
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
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
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D8C5C0",
    backgroundColor: "#F7F2F0",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#826A66",
  },
  disabledButton: {
    opacity: 0.7,
  },
  rowCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 14,
    gap: 6,
  },
  rowCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  rowIndex: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  rowDifficulty: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.accent,
    textTransform: "uppercase",
  },
  rowThai: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  rowEnglish: {
    fontSize: 14,
    color: Sketch.inkLight,
  },
  rowRoman: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  tableScrollContent: {
    paddingBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    minWidth: 1120,
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
    width: 230,
    fontWeight: "700",
  },
  tableCellRoman: {
    width: 240,
    color: Sketch.inkMuted,
  },
  tableCellEnglish: {
    width: 300,
    color: Sketch.inkLight,
  },
  tableCellDifficulty: {
    width: 110,
    textTransform: "uppercase",
  },
  tableCellBreakdown: {
    width: 280,
    color: Sketch.inkMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    padding: 28,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    maxWidth: 900,
    width: "100%",
    maxHeight: "88%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  modalBody: {
    gap: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    paddingTop: 6,
  },
  modalActionsEnd: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
});
