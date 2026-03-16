import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import { API_BASE } from "../../../src/config";
import { type GrammarPoint } from "../../../src/data/grammar";
import { GRAMMAR_STAGES, GRAMMAR_STAGE_META } from "../../../src/data/grammarStages";
import { useGrammarCatalog } from "../../../src/grammar/GrammarCatalogProvider";
import { getAuthToken } from "../../../src/utils/authStorage";

type EditableRow = {
  key: string;
  thai: string;
  romanization: string;
  english: string;
  difficulty: "easy" | "medium" | "hard";
  breakdownText: string;
};

type DraftState = {
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

function prettyJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

function createDraft(point: GrammarPoint): DraftState {
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

function toEditableRow(row: any, index: number): EditableRow {
  return {
    key: `${Date.now()}-${index}-${Math.random()}`,
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

function createEmptyRow(): EditableRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    thai: "",
    romanization: "",
    english: "",
    difficulty: "easy",
    breakdownText: "[]",
  };
}

export default function AdminGrammarEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { grammarById, refresh } = useGrammarCatalog();
  const grammarPoint = typeof id === "string" ? grammarById.get(id) : null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [draft, setDraft] = useState<DraftState | null>(null);

  useEffect(() => {
    if (grammarPoint) {
      setDraft(createDraft(grammarPoint));
    }
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

      if (!res.ok) {
        throw new Error(`Failed to load grammar (${res.status})`);
      }

      const data = await res.json();
      setAccessDenied(false);
      setRows(
        Array.isArray(data?.rows)
          ? data.rows.map((row: any, index: number) => toEditableRow(row, index))
          : [],
      );
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

  const levelLabel = useMemo(() => {
    if (!draft) return "";
    return GRAMMAR_STAGE_META[draft.stage].level;
  }, [draft]);

  function updateDraft<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateRow(
    key: string,
    field: keyof EditableRow,
    value: EditableRow[keyof EditableRow],
  ) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
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

      const exampleBreakdown = JSON.parse(draft.exampleBreakdownText);
      const normalizedRows = rows.map((row) => ({
        thai: row.thai,
        romanization: row.romanization,
        english: row.english,
        difficulty: row.difficulty,
        breakdown: JSON.parse(row.breakdownText),
      }));

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
            breakdown: exampleBreakdown,
          },
          focus: {
            particle: draft.focusParticle,
            meaning: draft.focusMeaning,
          },
        },
        rows: normalizedRows,
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

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save grammar");
      }

      await refresh();
      Alert.alert("Saved", "Grammar point and practice rows were updated.");
      void loadDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save grammar";
      Alert.alert("Save failed", message);
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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Grammar</Text>
          <Text style={styles.headerSubtitle}>{grammarPoint?.id ?? id}</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={() => void saveGrammar()}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving" : "Save"}</Text>
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lesson</Text>
            <View style={styles.card}>
              <Text style={styles.metaText}>ID · {grammarPoint?.id}</Text>
              <Text style={styles.metaText}>Level · {levelLabel}</Text>

              <Text style={styles.fieldLabel}>Stage</Text>
              <View style={styles.stageWrap}>
                {GRAMMAR_STAGES.map((stage) => {
                  const active = draft.stage === stage;
                  return (
                    <TouchableOpacity
                      key={stage}
                      style={[styles.stageChip, active && styles.stageChipActive]}
                      onPress={() => updateDraft("stage", stage)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.stageChipText,
                          active && styles.stageChipTextActive,
                        ]}
                      >
                        {stage}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                value={draft.title}
                onChangeText={(value) => updateDraft("title", value)}
                style={styles.input}
                placeholderTextColor={Sketch.inkFaint}
              />

              <Text style={styles.fieldLabel}>Pattern</Text>
              <TextInput
                value={draft.pattern}
                onChangeText={(value) => updateDraft("pattern", value)}
                style={styles.input}
                placeholderTextColor={Sketch.inkFaint}
              />

              <Text style={styles.fieldLabel}>Explanation</Text>
              <TextInput
                value={draft.explanation}
                onChangeText={(value) => updateDraft("explanation", value)}
                style={[styles.input, styles.textareaLg]}
                multiline
                textAlignVertical="top"
                placeholderTextColor={Sketch.inkFaint}
              />

              <Text style={styles.fieldLabel}>AI Prompt</Text>
              <TextInput
                value={draft.aiPrompt}
                onChangeText={(value) => updateDraft("aiPrompt", value)}
                style={[styles.input, styles.textarea]}
                multiline
                textAlignVertical="top"
                placeholder="Optional"
                placeholderTextColor={Sketch.inkFaint}
              />

              <Text style={styles.fieldLabel}>Focus particle</Text>
              <TextInput
                value={draft.focusParticle}
                onChangeText={(value) => updateDraft("focusParticle", value)}
                style={styles.input}
                placeholderTextColor={Sketch.inkFaint}
              />

              <Text style={styles.fieldLabel}>Focus meaning</Text>
              <TextInput
                value={draft.focusMeaning}
                onChangeText={(value) => updateDraft("focusMeaning", value)}
                style={[styles.input, styles.textarea]}
                multiline
                textAlignVertical="top"
                placeholderTextColor={Sketch.inkFaint}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Example</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Thai</Text>
              <TextInput
                value={draft.exampleThai}
                onChangeText={(value) => updateDraft("exampleThai", value)}
                style={styles.input}
                placeholderTextColor={Sketch.inkFaint}
              />

              <Text style={styles.fieldLabel}>Romanization</Text>
              <TextInput
                value={draft.exampleRoman}
                onChangeText={(value) => updateDraft("exampleRoman", value)}
                style={styles.input}
                placeholderTextColor={Sketch.inkFaint}
              />

              <Text style={styles.fieldLabel}>English</Text>
              <TextInput
                value={draft.exampleEnglish}
                onChangeText={(value) => updateDraft("exampleEnglish", value)}
                style={styles.input}
                placeholderTextColor={Sketch.inkFaint}
              />

              <Text style={styles.fieldLabel}>Example breakdown JSON</Text>
              <TextInput
                value={draft.exampleBreakdownText}
                onChangeText={(value) => updateDraft("exampleBreakdownText", value)}
                style={[styles.input, styles.jsonArea]}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={Sketch.inkFaint}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.rowsHeader}>
              <Text style={styles.sectionTitle}>Practice rows</Text>
              <TouchableOpacity
                style={styles.addRowBtn}
                onPress={() => setRows((current) => [...current, createEmptyRow()])}
                activeOpacity={0.82}
              >
                <Ionicons name="add" size={16} color={Sketch.ink} />
                <Text style={styles.addRowText}>Add row</Text>
              </TouchableOpacity>
            </View>

            {rows.map((row, index) => (
              <View key={row.key} style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>Row {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.deleteRowBtn}
                    onPress={() => removeRow(row.key)}
                    activeOpacity={0.82}
                  >
                    <Ionicons name="trash-outline" size={16} color={Sketch.inkMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Thai</Text>
                <TextInput
                  value={row.thai}
                  onChangeText={(value) => updateRow(row.key, "thai", value)}
                  style={styles.input}
                  placeholderTextColor={Sketch.inkFaint}
                />

                <Text style={styles.fieldLabel}>Romanization</Text>
                <TextInput
                  value={row.romanization}
                  onChangeText={(value) =>
                    updateRow(row.key, "romanization", value)
                  }
                  style={styles.input}
                  placeholderTextColor={Sketch.inkFaint}
                />

                <Text style={styles.fieldLabel}>English</Text>
                <TextInput
                  value={row.english}
                  onChangeText={(value) => updateRow(row.key, "english", value)}
                  style={styles.input}
                  placeholderTextColor={Sketch.inkFaint}
                />

                <Text style={styles.fieldLabel}>Difficulty</Text>
                <View style={styles.difficultyWrap}>
                  {(["easy", "medium", "hard"] as const).map((difficulty) => {
                    const active = row.difficulty === difficulty;
                    return (
                      <TouchableOpacity
                        key={difficulty}
                        style={[
                          styles.difficultyChip,
                          active && styles.difficultyChipActive,
                        ]}
                        onPress={() =>
                          updateRow(row.key, "difficulty", difficulty)
                        }
                        activeOpacity={0.82}
                      >
                        <Text
                          style={[
                            styles.difficultyChipText,
                            active && styles.difficultyChipTextActive,
                          ]}
                        >
                          {difficulty}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Breakdown JSON</Text>
                <TextInput
                  value={row.breakdownText}
                  onChangeText={(value) =>
                    updateRow(row.key, "breakdownText", value)
                  }
                  style={[styles.input, styles.jsonArea]}
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={Sketch.inkFaint}
                />
              </View>
            ))}
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
    gap: 12,
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
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Sketch.orange,
    backgroundColor: Sketch.orange,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  rowsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 16,
    gap: 10,
  },
  metaText: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
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
  textarea: {
    minHeight: 72,
  },
  textareaLg: {
    minHeight: 132,
  },
  jsonArea: {
    minHeight: 160,
    fontFamily: "monospace",
  },
  stageWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  stageChipActive: {
    borderColor: Sketch.orange,
    backgroundColor: Sketch.cardBg,
  },
  stageChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  stageChipTextActive: {
    color: Sketch.ink,
  },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  addRowText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.ink,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
  },
  deleteRowBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  difficultyWrap: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  difficultyChipActive: {
    borderColor: Sketch.ink,
  },
  difficultyChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
  },
  difficultyChipTextActive: {
    color: Sketch.ink,
  },
});
