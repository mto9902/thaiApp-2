import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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
import ToneDots from "@/src/components/ToneDots";
import { API_BASE } from "@/src/config";
import {
  buildLessonFormState,
  buildRowEditorState,
  createEmptyBreakdownItem,
  formatReviewTimestamp,
  lessonPayloadFromState,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_OPTIONS,
  rowPayloadFromState,
  sanitizeReviewAssigneeUserId,
  sortComments,
  TONE_OPTIONS,
  validateBreakdownItems,
  type LessonFormState,
  type RowEditorState,
} from "@/src/contentReview/helpers";
import {
  ReviewBreakdownItem,
  ReviewComment,
  ReviewGrammarDetailResponse,
  ReviewExampleRow,
  ReviewerProfile,
  ReviewerUser,
  ReviewStatus,
} from "@/src/contentReview/types";
import { GRAMMAR_STAGE_META, GRAMMAR_STAGES } from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { getAuthToken } from "@/src/utils/authStorage";
import { getProfileDisplayName } from "@/src/utils/profileName";

type GrammarReviewEditorProps = {
  grammarId: string;
  mode: "review" | "admin";
  initialRowId?: number | null;
};

function statusTone(status: ReviewStatus) {
  switch (status) {
    case "approved":
      return { bg: "#EFF5EC", border: "#BFD1B6", text: Sketch.green };
    case "in_review":
      return { bg: "#EEF3F7", border: "#C7D0D8", text: Sketch.blue };
    case "needs_changes":
      return { bg: "#FCF2F1", border: "#E4C4BF", text: Sketch.red };
    case "hidden":
      return { bg: "#F3F3F1", border: "#D4D4CF", text: Sketch.inkMuted };
    default:
      return { bg: "#F8F4EC", border: "#DDD0B7", text: Sketch.yellow };
  }
}

function reviewerLabel(reviewer: ReviewerUser | { email: string; display_name?: string | null } | null | undefined) {
  if (!reviewer) {
    return "Unknown";
  }

  return getProfileDisplayName(reviewer as any) || reviewer.email;
}

function reviewerById(reviewers: ReviewerUser[]) {
  return new Map(reviewers.map((reviewer) => [reviewer.id, reviewer]));
}

function showReviewAlert(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

function BreakdownEditor({
  items,
  onChange,
}: {
  items: ReviewBreakdownItem[];
  onChange: (items: ReviewBreakdownItem[]) => void;
}) {
  function updateItem(index: number, patch: Partial<ReviewBreakdownItem>) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    const next = items.filter((_item, itemIndex) => itemIndex !== index);
    onChange(next.length > 0 ? next : [createEmptyBreakdownItem()]);
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const next = [...items];
    const [current] = next.splice(index, 1);
    next.splice(nextIndex, 0, current);
    onChange(next);
  }

  function setToneCount(index: number, count: number) {
    const current = items[index]?.tones ?? [];
    const nextTones =
      count <= 0
        ? []
        : Array.from({ length: count }, (_unused, toneIndex) => current[toneIndex] ?? "mid");
    updateItem(index, { tones: nextTones });
  }

  function setTone(index: number, toneIndex: number, tone: ReviewBreakdownItem["tones"][number]) {
    const tones = [...(items[index]?.tones ?? [])];
    tones[toneIndex] = tone;
    updateItem(index, { tones });
  }

  return (
    <View style={styles.breakdownList}>
      {items.map((item, index) => (
        <View key={`breakdown-${index}`} style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>Word {index + 1}</Text>
            <View style={styles.breakdownHeaderActions}>
              <TouchableOpacity style={styles.miniButton} onPress={() => moveItem(index, -1)} activeOpacity={0.82}>
                <Ionicons name="arrow-up" size={16} color={Sketch.inkMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniButton} onPress={() => moveItem(index, 1)} activeOpacity={0.82}>
                <Ionicons name="arrow-down" size={16} color={Sketch.inkMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.miniButton, styles.miniButtonDanger]} onPress={() => removeItem(index)} activeOpacity={0.82}>
                <Ionicons name="trash-outline" size={16} color={Sketch.red} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Thai</Text>
          <TextInput value={item.thai} onChangeText={(thai) => updateItem(index, { thai })} style={styles.input} />

          <Text style={styles.fieldLabel}>Gloss / English</Text>
          <TextInput value={item.english} onChangeText={(english) => updateItem(index, { english })} style={styles.input} />

          <Text style={styles.fieldLabel}>Romanization</Text>
          <TextInput value={item.romanization ?? ""} onChangeText={(romanization) => updateItem(index, { romanization })} style={styles.input} />

          <View style={styles.inlineRow}>
            <Text style={styles.fieldLabel}>Grammar marker</Text>
            <TouchableOpacity style={[styles.chip, item.grammar && styles.chipActive]} onPress={() => updateItem(index, { grammar: item.grammar !== true })} activeOpacity={0.82}>
              <Text style={[styles.chipText, item.grammar && styles.chipTextActive]}>{item.grammar ? "Marked" : "Normal"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inlineRow}>
            <Text style={styles.fieldLabel}>Tone slots</Text>
            <View style={styles.inlineChipRow}>
              {[0, 1, 2, 3, 4].map((count) => {
                const active = (item.tones?.length ?? 0) === count;
                return (
                  <TouchableOpacity key={`count-${count}`} style={[styles.chip, active && styles.chipActive]} onPress={() => setToneCount(index, count)} activeOpacity={0.82}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {item.tones && item.tones.length > 0 ? (
            <View style={styles.toneEditorWrap}>
              <ToneDots tones={item.tones} style={styles.breakdownToneDots} />
              {item.tones.map((tone, toneIndex) => (
                <View key={`tone-slot-${toneIndex}`} style={styles.toneSlotBlock}>
                  <Text style={styles.fieldLabel}>Tone {toneIndex + 1}</Text>
                  <View style={styles.inlineChipRow}>
                    {TONE_OPTIONS.map((toneOption) => {
                      const active = tone === toneOption;
                      return (
                        <TouchableOpacity key={`${toneIndex}-${toneOption}`} style={[styles.chip, active && styles.chipActive]} onPress={() => setTone(index, toneIndex, toneOption)} activeOpacity={0.82}>
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{toneOption}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      <TouchableOpacity style={styles.secondaryButton} onPress={() => onChange([...items, createEmptyBreakdownItem()])} activeOpacity={0.82}>
        <Text style={styles.secondaryButtonText}>Add word</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReviewerPicker({
  reviewers,
  value,
  onChange,
}: {
  reviewers: ReviewerUser[];
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <View style={styles.inlineChipRow}>
      <TouchableOpacity style={[styles.chip, value === null && styles.chipActive]} onPress={() => onChange(null)} activeOpacity={0.82}>
        <Text style={[styles.chipText, value === null && styles.chipTextActive]}>Unassigned</Text>
      </TouchableOpacity>
      {reviewers.map((reviewer) => {
        const active = value === reviewer.id;
        return (
          <TouchableOpacity key={reviewer.id} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(reviewer.id)} activeOpacity={0.82}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{reviewerLabel(reviewer)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StatusPicker({ value, onChange }: { value: ReviewStatus; onChange: (value: ReviewStatus) => void }) {
  return (
    <View style={styles.inlineChipRow}>
      {REVIEW_STATUS_OPTIONS.map((status) => {
        const active = value === status;
        return (
          <TouchableOpacity key={status} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(status)} activeOpacity={0.82}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{REVIEW_STATUS_LABELS[status]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CommentsBlock({
  title,
  comments,
  draft,
  onDraftChange,
  onSubmit,
  submitLabel,
  disabled,
  emptyCopy,
}: {
  title: string;
  comments: ReviewComment[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
  emptyCopy: string;
}) {
  return (
    <View style={styles.commentsWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {comments.length === 0 ? (
        <Text style={styles.helperText}>{emptyCopy}</Text>
      ) : (
        sortComments(comments).map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            <Text style={styles.commentAuthor}>{comment.author ? reviewerLabel(comment.author as any) : "Reviewer"}</Text>
            <Text style={styles.commentBody}>{comment.body}</Text>
            <Text style={styles.commentTime}>{formatReviewTimestamp(comment.createdAt)}</Text>
          </View>
        ))
      )}

      <TextInput value={draft} onChangeText={onDraftChange} placeholder="Add a comment" placeholderTextColor={Sketch.inkFaint} style={[styles.input, styles.commentInput]} multiline textAlignVertical="top" editable={!disabled} />
      <TouchableOpacity style={[styles.primaryButton, disabled && styles.disabledButton]} onPress={onSubmit} activeOpacity={0.82} disabled={disabled}>
        <Text style={styles.primaryButtonText}>{submitLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function GrammarReviewEditorScreen({
  grammarId,
  mode,
  initialRowId = null,
}: GrammarReviewEditorProps) {
  const router = useRouter();
  const { grammarById, refresh } = useGrammarCatalog();
  const grammarPoint = grammarById.get(grammarId);

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [profile, setProfile] = useState<ReviewerProfile | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormState | null>(null);
  const [rows, setRows] = useState<ReviewExampleRow[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerUser[]>([]);
  const [lessonComments, setLessonComments] = useState<ReviewComment[]>([]);
  const [exampleCommentsByExampleId, setExampleCommentsByExampleId] = useState<Record<string, ReviewComment[]>>({});
  const [lessonCommentDraft, setLessonCommentDraft] = useState("");
  const [rowEditorVisible, setRowEditorVisible] = useState(false);
  const [rowDraft, setRowDraft] = useState<RowEditorState | null>(null);
  const [rowCommentDraft, setRowCommentDraft] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);
  const [savingRow, setSavingRow] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const [initialRowHandled, setInitialRowHandled] = useState(false);

  const reviewersMap = useMemo(() => reviewerById(reviewers), [reviewers]);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const [meRes, detailRes] = await Promise.all([
        fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/review/grammar/${grammarId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (meRes.status === 403 || detailRes.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (!meRes.ok || !detailRes.ok) {
        throw new Error("Failed to load review detail");
      }

      const [meData, detailData] = await Promise.all([
        meRes.json() as Promise<ReviewerProfile>,
        detailRes.json() as Promise<ReviewGrammarDetailResponse>,
      ]);

      if (
        mode === "admin" &&
        meData.is_admin !== true &&
        meData.can_review_content === true
      ) {
        router.replace(`/content-review/${grammarId}` as any);
        return;
      }

      setAccessDenied(false);
      setProfile(meData);
      setReviewers(detailData.reviewers ?? []);
      setRows(
        Array.isArray(detailData.rows)
          ? [...detailData.rows].sort((a, b) => a.sortOrder - b.sortOrder)
          : [],
      );
      setLessonComments(
        Array.isArray(detailData.lessonComments) ? detailData.lessonComments : [],
      );
      setExampleCommentsByExampleId(detailData.exampleCommentsByExampleId ?? {});

      if (!grammarPoint && !detailData.lesson) {
        throw new Error("Grammar point not found");
      }

      if (grammarPoint) {
        const nextLessonForm = buildLessonFormState(grammarPoint, detailData.lesson);
        nextLessonForm.reviewAssigneeUserId = sanitizeReviewAssigneeUserId(
          nextLessonForm.reviewAssigneeUserId,
          detailData.reviewers ?? [],
        );
        setLessonForm(nextLessonForm);
      }
    } catch (err) {
      console.error("Failed to load grammar review detail:", err);
    } finally {
      setLoading(false);
    }
  }, [grammarId, grammarPoint, mode, router]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const rowComments = rowDraft?.id
    ? exampleCommentsByExampleId[String(rowDraft.id)] ?? []
    : [];
  const lessonReviewMeta = lessonForm ? statusTone(lessonForm.reviewStatus) : null;

  const openRowEditor = useCallback((row?: ReviewExampleRow | null) => {
    const nextDraft = buildRowEditorState(row ?? null);
    nextDraft.reviewAssigneeUserId = sanitizeReviewAssigneeUserId(
      nextDraft.reviewAssigneeUserId,
      reviewers,
    );
    if (!row && rows.length > 0) {
      nextDraft.sortOrder = rows.length;
    }
    setRowDraft(nextDraft);
    setRowCommentDraft("");
    setRowEditorVisible(true);
  }, [reviewers, rows.length]);

  useEffect(() => {
    if (initialRowHandled || !initialRowId || loading || rowEditorVisible) {
      return;
    }

    const targetRow = rows.find((row) => row.id === initialRowId) ?? null;
    if (targetRow) {
      openRowEditor(targetRow);
    }
    setInitialRowHandled(true);
  }, [initialRowHandled, initialRowId, loading, openRowEditor, rowEditorVisible, rows]);

  async function saveLesson() {
    if (!lessonForm || !grammarPoint || savingLesson) {
      return;
    }

    try {
      const breakdownError = validateBreakdownItems(lessonForm.exampleBreakdown);
      if (breakdownError) {
        showReviewAlert("Lesson example incomplete", breakdownError);
        return;
      }

      setSavingLesson(true);
      const token = await getAuthToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const payload = lessonPayloadFromState({
        ...lessonForm,
        reviewAssigneeUserId: sanitizeReviewAssigneeUserId(
          lessonForm.reviewAssigneeUserId,
          reviewers,
        ),
      });

      const res = await fetch(`${API_BASE}/review/grammar/${grammarId}/lesson`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save lesson");
      }

      await refresh();
      await loadDetail();
      showReviewAlert("Lesson saved", "Lesson content and review metadata were updated.");
    } catch (err) {
      showReviewAlert("Save failed", err instanceof Error ? err.message : "Failed to save lesson");
    } finally {
      setSavingLesson(false);
    }
  }

  async function submitLessonComment() {
    if (!lessonCommentDraft.trim() || savingComment) {
      return;
    }

    try {
      setSavingComment(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/review/grammar/${grammarId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: lessonCommentDraft.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to add lesson comment");
      }

      setLessonComments((current) => [...current, data]);
      setLessonCommentDraft("");
    } catch (err) {
      showReviewAlert("Comment failed", err instanceof Error ? err.message : "Failed to add lesson comment");
    } finally {
      setSavingComment(false);
    }
  }

  async function saveRow() {
    if (!rowDraft || savingRow) {
      return;
    }

    try {
      const breakdownError = validateBreakdownItems(rowDraft.breakdown);
      if (breakdownError) {
        showReviewAlert("Row breakdown incomplete", breakdownError);
        return;
      }

      setSavingRow(true);
      const token = await getAuthToken();
      if (!token) return;

      const sanitizedRowDraft = {
        ...rowDraft,
        reviewAssigneeUserId: sanitizeReviewAssigneeUserId(
          rowDraft.reviewAssigneeUserId,
          reviewers,
        ),
      };

      const url = sanitizedRowDraft.id
        ? `${API_BASE}/review/examples/${sanitizedRowDraft.id}`
        : `${API_BASE}/review/grammar/${grammarId}/examples`;
      const method = sanitizedRowDraft.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rowPayloadFromState(sanitizedRowDraft)),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save row");
      }

      const savedRow = data?.row as ReviewExampleRow | null;
      if (savedRow) {
        setRows((current) => {
          const next = sanitizedRowDraft.id
            ? current.map((row) => (row.id === savedRow.id ? savedRow : row))
            : [...current, savedRow];
          return [...next].sort((a, b) => a.sortOrder - b.sortOrder);
        });
      }

      setRowEditorVisible(false);
      setRowDraft(null);
    } catch (err) {
      showReviewAlert("Row save failed", err instanceof Error ? err.message : "Failed to save row");
    } finally {
      setSavingRow(false);
    }
  }

  async function deleteRow() {
    if (!rowDraft?.id || savingRow) {
      return;
    }

    try {
      setSavingRow(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/review/examples/${rowDraft.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete row");
      }

      setRows((current) => current.filter((row) => row.id !== rowDraft.id));
      setRowEditorVisible(false);
      setRowDraft(null);
    } catch (err) {
      showReviewAlert("Delete failed", err instanceof Error ? err.message : "Failed to delete row");
    } finally {
      setSavingRow(false);
    }
  }

  async function submitRowComment() {
    if (!rowDraft?.id || !rowCommentDraft.trim() || savingComment) {
      return;
    }

    try {
      setSavingComment(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/review/examples/${rowDraft.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: rowCommentDraft.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to add row comment");
      }

      setExampleCommentsByExampleId((current) => ({
        ...current,
        [String(rowDraft.id)]: [...(current[String(rowDraft.id)] ?? []), data],
      }));
      setRowCommentDraft("");
    } catch (err) {
      showReviewAlert("Comment failed", err instanceof Error ? err.message : "Failed to add row comment");
    } finally {
      setSavingComment(false);
    }
  }

  if (!grammarPoint && !loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerWrap}>
          <Text style={styles.emptyTitle}>Grammar point not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      <Modal visible={rowEditorVisible} transparent animationType="fade" onRequestClose={() => setRowEditorVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setRowEditorVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{rowDraft?.id ? "Edit sentence row" : "Add sentence row"}</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => setRowEditorVisible(false)} activeOpacity={0.82}>
                <Ionicons name="close" size={20} color={Sketch.inkMuted} />
              </TouchableOpacity>
            </View>

            {rowDraft ? (
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Thai</Text>
                <TextInput value={rowDraft.thai} onChangeText={(thai) => setRowDraft((current) => (current ? { ...current, thai } : current))} style={styles.input} />

                <Text style={styles.fieldLabel}>Romanization</Text>
                <TextInput value={rowDraft.romanization} onChangeText={(romanization) => setRowDraft((current) => (current ? { ...current, romanization } : current))} style={styles.input} />

                <Text style={styles.fieldLabel}>English</Text>
                <TextInput value={rowDraft.english} onChangeText={(english) => setRowDraft((current) => (current ? { ...current, english } : current))} style={styles.input} />

                <Text style={styles.fieldLabel}>Difficulty</Text>
                <View style={styles.inlineChipRow}>
                  {(["easy", "medium", "hard"] as const).map((difficulty) => {
                    const active = rowDraft.difficulty === difficulty;
                    return (
                      <TouchableOpacity key={difficulty} style={[styles.chip, active && styles.chipActive]} onPress={() => setRowDraft((current) => (current ? { ...current, difficulty } : current))} activeOpacity={0.82}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{difficulty}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Sort order</Text>
                <TextInput value={String(rowDraft.sortOrder)} onChangeText={(value) => setRowDraft((current) => (current ? { ...current, sortOrder: Number.parseInt(value || "0", 10) || 0 } : current))} style={styles.input} keyboardType="numeric" />

                <Text style={styles.sectionTitle}>Review settings</Text>
                <Text style={styles.fieldLabel}>Status</Text>
                <StatusPicker value={rowDraft.reviewStatus} onChange={(reviewStatus) => setRowDraft((current) => (current ? { ...current, reviewStatus } : current))} />

                <Text style={styles.fieldLabel}>Assignee</Text>
                <ReviewerPicker reviewers={reviewers} value={rowDraft.reviewAssigneeUserId} onChange={(reviewAssigneeUserId) => setRowDraft((current) => (current ? { ...current, reviewAssigneeUserId } : current))} />

                <Text style={styles.fieldLabel}>Review note</Text>
                <TextInput value={rowDraft.reviewNote} onChangeText={(reviewNote) => setRowDraft((current) => (current ? { ...current, reviewNote } : current))} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />

                <Text style={styles.sectionTitle}>Breakdown editor</Text>
                <BreakdownEditor items={rowDraft.breakdown} onChange={(breakdown) => setRowDraft((current) => (current ? { ...current, breakdown } : current))} />

                <CommentsBlock title="Row comments" comments={rowComments} draft={rowCommentDraft} onDraftChange={setRowCommentDraft} onSubmit={() => void submitRowComment()} submitLabel="Add row comment" disabled={!rowDraft.id || savingComment} emptyCopy={rowDraft.id ? "No comments yet." : "Save this row first to enable comments."} />

                <View style={styles.modalActions}>
                  {rowDraft.id ? (
                    <TouchableOpacity style={[styles.dangerButton, savingRow && styles.disabledButton]} onPress={() => void deleteRow()} activeOpacity={0.82} disabled={savingRow}>
                      <Text style={styles.dangerButtonText}>Delete row</Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  <View style={styles.actionsRight}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setRowEditorVisible(false)} activeOpacity={0.82}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryButton, savingRow && styles.disabledButton]} onPress={() => void saveRow()} activeOpacity={0.82} disabled={savingRow}>
                      <Text style={styles.primaryButtonText}>{savingRow ? "Saving..." : rowDraft.id ? "Save row" : "Create row"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.82}>
          <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{mode === "admin" ? "Admin Lesson Editor" : "Lesson Review"}</Text>
          <Text style={styles.headerSubtitle}>{grammarId}</Text>
        </View>
        {mode === "admin" ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowAdvancedInfo((current) => !current)} activeOpacity={0.82}>
            <Text style={styles.secondaryButtonText}>{showAdvancedInfo ? "Hide advanced" : "Advanced tools"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      ) : accessDenied ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyTitle}>Review access required</Text>
          <Text style={styles.helperText}>This account is not marked as an admin or reviewer.</Text>
        </View>
      ) : lessonForm && grammarPoint ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {showAdvancedInfo && mode === "admin" ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Advanced admin tools</Text>
              <Text style={styles.helperText}>Bulk TSV import/export and raw JSON editing still live in the legacy advanced editor.</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push(`/admin/grammar/${grammarId}/advanced` as any)} activeOpacity={0.82}>
                <Text style={styles.secondaryButtonText}>Open advanced editor</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lesson review</Text>
              {lessonReviewMeta ? (
                <View style={[styles.statusPill, { backgroundColor: lessonReviewMeta.bg, borderColor: lessonReviewMeta.border }]}>
                  <Text style={[styles.statusPillText, { color: lessonReviewMeta.text }]}>{REVIEW_STATUS_LABELS[lessonForm.reviewStatus]}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.metaText}>Stage {lessonForm.stage}</Text>
            <Text style={styles.metaText}>Current reviewer {profile ? reviewerLabel({ email: profile.email, display_name: profile.display_name }) : "Unknown"}</Text>

            <Text style={styles.fieldLabel}>Status</Text>
            <StatusPicker value={lessonForm.reviewStatus} onChange={(reviewStatus) => setLessonForm((current) => (current ? { ...current, reviewStatus } : current))} />

            <Text style={styles.fieldLabel}>Assignee</Text>
            <ReviewerPicker reviewers={reviewers} value={lessonForm.reviewAssigneeUserId} onChange={(reviewAssigneeUserId) => setLessonForm((current) => (current ? { ...current, reviewAssigneeUserId } : current))} />

            <Text style={styles.fieldLabel}>Review note</Text>
            <TextInput value={lessonForm.reviewNote} onChangeText={(reviewNote) => setLessonForm((current) => (current ? { ...current, reviewNote } : current))} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lesson content</Text>

            <Text style={styles.fieldLabel}>Stage</Text>
            <View style={styles.inlineChipRow}>
              {GRAMMAR_STAGES.map((stage) => {
                const active = lessonForm.stage === stage;
                return (
                  <TouchableOpacity key={stage} style={[styles.chip, active && styles.chipActive]} onPress={() => setLessonForm((current) => (current ? { ...current, stage, level: GRAMMAR_STAGE_META[stage].level } : current))} activeOpacity={0.82}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{stage}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput value={lessonForm.title} onChangeText={(title) => setLessonForm((current) => (current ? { ...current, title } : current))} style={styles.input} />

            <Text style={styles.fieldLabel}>Pattern</Text>
            <TextInput value={lessonForm.pattern} onChangeText={(pattern) => setLessonForm((current) => (current ? { ...current, pattern } : current))} style={styles.input} />

            <Text style={styles.fieldLabel}>Explanation</Text>
            <TextInput value={lessonForm.explanation} onChangeText={(explanation) => setLessonForm((current) => (current ? { ...current, explanation } : current))} style={[styles.input, styles.textareaLarge]} multiline textAlignVertical="top" />

            <Text style={styles.fieldLabel}>AI prompt</Text>
            <TextInput value={lessonForm.aiPrompt} onChangeText={(aiPrompt) => setLessonForm((current) => (current ? { ...current, aiPrompt } : current))} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />

            <Text style={styles.fieldLabel}>Focus particle</Text>
            <TextInput value={lessonForm.focusParticle} onChangeText={(focusParticle) => setLessonForm((current) => (current ? { ...current, focusParticle } : current))} style={styles.input} />

            <Text style={styles.fieldLabel}>Focus meaning</Text>
            <TextInput value={lessonForm.focusMeaning} onChangeText={(focusMeaning) => setLessonForm((current) => (current ? { ...current, focusMeaning } : current))} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Main example</Text>

            <Text style={styles.fieldLabel}>Thai</Text>
            <TextInput value={lessonForm.exampleThai} onChangeText={(exampleThai) => setLessonForm((current) => (current ? { ...current, exampleThai } : current))} style={styles.input} />

            <Text style={styles.fieldLabel}>Romanization</Text>
            <TextInput value={lessonForm.exampleRoman} onChangeText={(exampleRoman) => setLessonForm((current) => (current ? { ...current, exampleRoman } : current))} style={styles.input} />

            <Text style={styles.fieldLabel}>English</Text>
            <TextInput value={lessonForm.exampleEnglish} onChangeText={(exampleEnglish) => setLessonForm((current) => (current ? { ...current, exampleEnglish } : current))} style={styles.input} />

            <Text style={styles.sectionTitle}>Example breakdown</Text>
            <BreakdownEditor items={lessonForm.exampleBreakdown} onChange={(exampleBreakdown) => setLessonForm((current) => (current ? { ...current, exampleBreakdown } : current))} />

            <TouchableOpacity style={[styles.primaryButton, savingLesson && styles.disabledButton]} onPress={() => void saveLesson()} activeOpacity={0.82} disabled={savingLesson}>
              <Text style={styles.primaryButtonText}>{savingLesson ? "Saving lesson..." : "Save lesson"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <CommentsBlock title="Lesson comments" comments={lessonComments} draft={lessonCommentDraft} onDraftChange={setLessonCommentDraft} onSubmit={() => void submitLessonComment()} submitLabel="Add lesson comment" disabled={savingComment || !lessonForm} emptyCopy="No lesson comments yet." />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Sentence rows</Text>
                <Text style={styles.helperText}>Only rows with Approved status and confidence 99+ are published to learners.</Text>
              </View>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => openRowEditor(null)} activeOpacity={0.82}>
                <Text style={styles.secondaryButtonText}>Add row</Text>
              </TouchableOpacity>
            </View>

            {rows.length === 0 ? (
              <Text style={styles.helperText}>No sentence rows yet.</Text>
            ) : (
              rows.map((row) => {
                const tone = statusTone(row.reviewStatus);
                return (
                  <TouchableOpacity key={row.id} style={styles.rowCard} onPress={() => openRowEditor(row)} activeOpacity={0.82}>
                    <View style={styles.rowCardTop}>
                      <View style={styles.rowCardText}>
                        <Text style={styles.rowThai}>{row.thai}</Text>
                        <Text style={styles.rowEnglish}>{row.english}</Text>
                        <Text style={styles.rowMeta}>{row.romanization || "No romanization"} · {row.difficulty}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                        <Text style={[styles.statusPillText, { color: tone.text }]}>{REVIEW_STATUS_LABELS[row.reviewStatus]}</Text>
                      </View>
                    </View>

                    <View style={styles.rowInfoGrid}>
                      <Text style={styles.rowInfoText}>Confidence {row.toneConfidence}</Text>
                      <Text style={styles.rowInfoText}>Flagged items {row.toneAnalysis?.flaggedItemCount ?? 0}</Text>
                      <Text style={styles.rowInfoText}>Assignee {row.reviewAssigneeUserId ? reviewerLabel(reviewersMap.get(row.reviewAssigneeUserId)) : "Unassigned"}</Text>
                      <Text style={styles.rowInfoText}>Last edited {formatReviewTimestamp(row.lastEditedAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyTitle}>Grammar point not found</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Sketch.ink },
  headerSubtitle: { fontSize: 12, color: Sketch.inkMuted },
  iconButton: { minWidth: 40, height: 40, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.cardBg },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 8 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  card: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.cardBg, padding: 16, gap: 12 },
  metaText: { fontSize: 12, color: Sketch.inkMuted },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Sketch.ink },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: Sketch.inkMuted, textTransform: "uppercase", letterSpacing: 0.7 },
  input: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.paperDark, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: Sketch.ink },
  textarea: { minHeight: 82 },
  textareaLarge: { minHeight: 140 },
  inlineChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  inlineRow: { gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.paperDark },
  chipActive: { borderColor: Sketch.accent, backgroundColor: Sketch.cardBg },
  chipText: { fontSize: 13, fontWeight: "700", color: Sketch.inkMuted },
  chipTextActive: { color: Sketch.ink },
  primaryButton: { borderWidth: 1, borderColor: Sketch.accent, backgroundColor: Sketch.accent, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  secondaryButton: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.paperDark, paddingHorizontal: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { fontSize: 13, fontWeight: "700", color: Sketch.ink },
  dangerButton: { borderWidth: 1, borderColor: "#D9B5AF", backgroundColor: "#FCF2F1", paddingHorizontal: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  dangerButtonText: { fontSize: 13, fontWeight: "700", color: Sketch.red },
  disabledButton: { opacity: 0.6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  statusPillText: { fontSize: 12, fontWeight: "700" },
  helperText: { fontSize: 14, lineHeight: 22, color: Sketch.inkMuted },
  rowCard: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.paperDark, padding: 14, gap: 10 },
  rowCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  rowCardText: { flex: 1, gap: 4 },
  rowThai: { fontSize: 18, fontWeight: "700", color: Sketch.ink },
  rowEnglish: { fontSize: 14, color: Sketch.ink },
  rowMeta: { fontSize: 12, color: Sketch.inkMuted },
  rowInfoGrid: { gap: 4 },
  rowInfoText: { fontSize: 12, color: Sketch.inkMuted },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.28)", padding: 20, justifyContent: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalCard: { maxHeight: "92%", borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.cardBg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Sketch.inkFaint },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Sketch.ink },
  modalBody: { padding: 16, gap: 12 },
  breakdownList: { gap: 12 },
  breakdownCard: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.paperDark, padding: 12, gap: 10 },
  breakdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  breakdownTitle: { fontSize: 14, fontWeight: "700", color: Sketch.ink },
  breakdownHeaderActions: { flexDirection: "row", gap: 6 },
  miniButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.cardBg },
  miniButtonDanger: { borderColor: "#E4C4BF", backgroundColor: "#FCF2F1" },
  toneEditorWrap: { gap: 10 },
  breakdownToneDots: { marginTop: 2 },
  toneSlotBlock: { gap: 8 },
  commentsWrap: { gap: 10 },
  commentCard: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.paperDark, padding: 12, gap: 6 },
  commentAuthor: { fontSize: 12, fontWeight: "700", color: Sketch.ink },
  commentBody: { fontSize: 14, lineHeight: 21, color: Sketch.ink },
  commentTime: { fontSize: 12, color: Sketch.inkMuted },
  commentInput: { minHeight: 88 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  actionsRight: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Sketch.ink },
});
