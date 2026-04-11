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
import { DESKTOP_PAGE_WIDTH } from "@/src/components/web/desktopLayout";
import ToneDots from "@/src/components/ToneDots";
import { API_BASE } from "@/src/config";
import {
  buildLessonFormState,
  buildRowEditorState,
  countBreakdownThaiSyllables,
  createEmptyBreakdownItem,
  formatReviewTimestamp,
  lessonPayloadFromState,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_OPTIONS,
  rowPayloadFromState,
  sanitizeReviewAssigneeUserId,
  splitBreakdownRomanizationSyllables,
  sortComments,
  suggestBreakdownTonesFromRomanization,
  TONE_OPTIONS,
  validateBreakdownItems,
  type LessonFormState,
  type RowEditorState,
} from "@/src/contentReview/helpers";
import {
  ReviewBreakdownItem,
  ReviewComment,
  ReviewExampleRevision,
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
  surface?: "full" | "rowOnly";
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

const REVISION_FIELD_LABELS: Record<string, string> = {
  thai: "Thai",
  romanization: "Romanization",
  english: "English",
  breakdown: "Breakdown",
  tones: "Tones",
  difficulty: "Difficulty",
  reviewStatus: "Status",
  reviewAssigneeUserId: "Assignee",
  reviewNote: "Review note",
  sourceExampleId: "Source row",
  qualityFlags: "Quality flags",
  nextWaveDecision: "Next-wave decision",
  nextWaveAuditNote: "Audit note",
  nextWaveAuditedByUserId: "Audited by",
  nextWaveAuditedAt: "Audited at",
  sortOrder: "Sort order",
  toneConfidence: "Tone confidence",
  toneStatus: "Tone status",
};

function formatRevisionRelativeTime(value: string | null | undefined) {
  if (!value) {
    return "just now";
  }

  const when = new Date(value).getTime();
  if (Number.isNaN(when)) {
    return "just now";
  }

  const diffMs = Date.now() - when;
  if (diffMs < 60_000) {
    return "just now";
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function compactBreakdownPreview(items: ReviewBreakdownItem[] | null | undefined) {
  if (!Array.isArray(items) || items.length === 0) {
    return "—";
  }

  const preview = items
    .map((item) => {
      const thai = (item.thai ?? "").trim();
      const english = (item.english ?? "").trim();
      if (!thai && !english) {
        return null;
      }
      if (!english) {
        return thai;
      }
      return `${thai} (${english})`;
    })
    .filter(Boolean)
    .join(" · ");

  if (!preview) {
    return "—";
  }

  return preview.length > 160 ? `${preview.slice(0, 157)}...` : preview;
}

function compactTonePreview(items: ReviewBreakdownItem[] | null | undefined) {
  if (!Array.isArray(items) || items.length === 0) {
    return "—";
  }

  const preview = items
    .map((item) => {
      const thai = (item.thai ?? "").trim();
      if (!thai) {
        return null;
      }
      const tones = Array.isArray(item.tones) && item.tones.length > 0
        ? item.tones.join("/")
        : "—";
      return `${thai}: ${tones}`;
    })
    .filter(Boolean)
    .join(" · ");

  if (!preview) {
    return "—";
  }

  return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
}

function parseLessonOrderInput(value: string, fallback: number) {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function normalizeBreakdownForRevisionDiff(
  items: ReviewBreakdownItem[] | null | undefined,
  options: { includeTones?: boolean } = {},
) {
  const { includeTones = true } = options;
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    index,
    thai: item?.thai ?? "",
    english: item?.english ?? "",
    romanization: item?.romanization ?? "",
    grammar: item?.grammar === true,
    ...(includeTones
      ? {
          tones: Array.isArray(item?.tones) ? item.tones : [],
        }
      : {}),
  }));
}

function resolveRevisionDisplayFields(revision: ReviewExampleRevision) {
  const rawFields = Array.isArray(revision.changedFields)
    ? revision.changedFields
    : [];
  const displayFields = rawFields.filter(
    (field) => field !== "breakdown" && field !== "tones" && field !== "no_changes",
  );

  const hasSnapshots = Boolean(revision.beforeSnapshot || revision.afterSnapshot);

  if (hasSnapshots) {
    const beforeBreakdownContent = normalizeBreakdownForRevisionDiff(
      revision.beforeSnapshot?.breakdown,
      { includeTones: false },
    );
    const afterBreakdownContent = normalizeBreakdownForRevisionDiff(
      revision.afterSnapshot?.breakdown,
      { includeTones: false },
    );

    if (
      JSON.stringify(beforeBreakdownContent) !==
      JSON.stringify(afterBreakdownContent)
    ) {
      displayFields.push("breakdown");
    }

    const beforeBreakdownTones = normalizeBreakdownForRevisionDiff(
      revision.beforeSnapshot?.breakdown,
      { includeTones: true },
    ).map((item) => ({
      index: item.index,
      thai: item.thai,
      romanization: item.romanization,
      tones: item.tones,
    }));
    const afterBreakdownTones = normalizeBreakdownForRevisionDiff(
      revision.afterSnapshot?.breakdown,
      { includeTones: true },
    ).map((item) => ({
      index: item.index,
      thai: item.thai,
      romanization: item.romanization,
      tones: item.tones,
    }));

    if (
      JSON.stringify(beforeBreakdownTones) !==
      JSON.stringify(afterBreakdownTones)
    ) {
      displayFields.push("tones");
    }
  } else {
    if (rawFields.includes("breakdown")) {
      displayFields.push("breakdown");
    }
    if (rawFields.includes("tones")) {
      displayFields.push("tones");
    }
  }

  const deduped = Array.from(new Set(displayFields));
  return deduped.length > 0 ? deduped : ["no_changes"];
}

function formatRevisionSnapshotValue(
  snapshot: ReviewExampleRevision["beforeSnapshot"] | ReviewExampleRevision["afterSnapshot"],
  field: string,
  reviewersMap: Map<number, ReviewerUser>,
) {
  if (!snapshot) {
    return "—";
  }

  switch (field) {
    case "breakdown":
      return compactBreakdownPreview(snapshot.breakdown);
    case "tones":
      return compactTonePreview(snapshot.breakdown);
    case "reviewAssigneeUserId":
      return snapshot.reviewAssigneeUserId
        ? reviewerLabel(reviewersMap.get(snapshot.reviewAssigneeUserId))
        : "Unassigned";
    case "reviewStatus":
      return REVIEW_STATUS_LABELS[snapshot.reviewStatus] ?? snapshot.reviewStatus;
    case "reviewNote": {
      const note = snapshot.reviewNote?.trim();
      if (!note) {
        return "—";
      }
      return note.length > 160 ? `${note.slice(0, 157)}...` : note;
    }
    case "qualityFlags": {
      const flags = Array.isArray(snapshot.qualityFlags)
        ? snapshot.qualityFlags
        : [];
      if (flags.length === 0) {
        return "â€”";
      }
      return flags
        .map((flag) =>
          flag === "thai_weak"
            ? "Thai weak"
            : flag === "legacy"
              ? "Legacy"
              : flag === "new_gen"
                ? "New Gen"
                : flag,
        )
        .join(", ");
    }
    case "sortOrder":
      return String(snapshot.sortOrder);
    case "toneConfidence":
      return String(snapshot.toneConfidence);
    case "toneStatus":
      return snapshot.toneStatus;
    case "difficulty":
      return snapshot.difficulty;
    case "thai":
      return snapshot.thai || "—";
    case "romanization":
      return snapshot.romanization || "—";
    case "english":
      return snapshot.english || "—";
    default: {
      const value = (snapshot as Record<string, unknown>)[field];
      if (value === null || value === undefined || value === "") {
        return "—";
      }
      return String(value);
    }
  }
}

function showReviewAlert(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

async function readJsonResponseSafe(
  res: Response,
  fallbackMessage: string,
): Promise<any> {
  const raw = await res.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    if (raw.trim().startsWith("<")) {
      throw new Error(fallbackMessage);
    }
    throw new Error("Received an unreadable server response.");
  }
}

function BreakdownEditor({
  items,
  onChange,
  compact = false,
}: {
  items: ReviewBreakdownItem[];
  onChange: (items: ReviewBreakdownItem[]) => void;
  compact?: boolean;
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
    const suggested = suggestBreakdownTonesFromRomanization(
      items[index]?.romanization,
      items[index]?.thai,
    );
    const nextTones =
      count <= 0
        ? []
        : Array.from(
            { length: count },
            (_unused, toneIndex) =>
              current[toneIndex] ?? suggested[toneIndex] ?? "mid",
          );
    updateItem(index, { tones: nextTones });
  }

  function setTone(
    index: number,
    toneIndex: number,
    tone: NonNullable<ReviewBreakdownItem["tones"]>[number],
  ) {
    const tones = [...(items[index]?.tones ?? [])];
    tones[toneIndex] = tone;
    updateItem(index, { tones });
  }

  function updateRomanization(index: number, romanization: string) {
    const currentTones = items[index]?.tones ?? [];
    const suggestedTones = suggestBreakdownTonesFromRomanization(
      romanization,
      items[index]?.thai,
    );

    updateItem(index, {
      romanization,
      ...(currentTones.length === 0 && suggestedTones.length > 0
        ? { tones: suggestedTones }
        : {}),
    });
  }

  return (
    <View style={[styles.breakdownList, compact && styles.breakdownListCompact]}>
      {items.map((item, index) => (
        <View
          key={`breakdown-${index}`}
          style={[styles.breakdownCard, compact && styles.breakdownCardCompact]}
        >
          {(() => {
            const syllables = splitBreakdownRomanizationSyllables(
              item.romanization,
            );
            const thaiSyllableCount = countBreakdownThaiSyllables(item.thai);
            const suggestedTones = suggestBreakdownTonesFromRomanization(
              item.romanization,
              item.thai,
            );
            const toneSignature = (item.tones ?? []).join("|");
            const suggestedSignature = suggestedTones.join("|");
            const canApplySuggestion =
              suggestedTones.length > 0 && toneSignature !== suggestedSignature;
            const detectedSyllableCount = Math.max(
              syllables.length,
              suggestedTones.length,
              thaiSyllableCount,
            );
            const detectionSource =
              syllables.length <= 1 && thaiSyllableCount > syllables.length
                ? "Thai spelling"
                : "Romanization";

            return (
              <>
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
          <TextInput
            value={item.romanization ?? ""}
            onChangeText={(romanization) =>
              updateRomanization(index, romanization)
            }
            style={styles.input}
          />

          {detectedSyllableCount > 0 ? (
            <View style={styles.suggestionRow}>
              <Text style={styles.suggestionText}>
                Detected {detectedSyllableCount} syllable
                {detectedSyllableCount === 1 ? "" : "s"} from {detectionSource}
                : {suggestedTones.join(" / ")}
              </Text>
              {canApplySuggestion ? (
                <TouchableOpacity
                  style={styles.miniSecondaryButton}
                  onPress={() => updateItem(index, { tones: suggestedTones })}
                  activeOpacity={0.82}
                >
                  <Text style={styles.miniSecondaryButtonText}>
                    Use suggestion
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

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
                <View
                  key={`tone-slot-${toneIndex}`}
                  style={[styles.toneSlotBlock, compact && styles.toneSlotBlockCompact]}
                >
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
              </>
            );
          })()}
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
  surface = "full",
}: GrammarReviewEditorProps) {
  const router = useRouter();
  const { allGrammarById, refresh } = useGrammarCatalog();
  const grammarPoint = allGrammarById.get(grammarId);
  const isRowOnly = surface === "rowOnly";

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
  const [rowHistory, setRowHistory] = useState<ReviewExampleRevision[]>([]);
  const [rowHistoryLoading, setRowHistoryLoading] = useState(false);
  const [rowHistoryError, setRowHistoryError] = useState<string | null>(null);
  const [expandedRevisionIds, setExpandedRevisionIds] = useState<number[]>([]);
  const [savingLesson, setSavingLesson] = useState(false);
  const [savingRow, setSavingRow] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const [initialRowHandled, setInitialRowHandled] = useState(false);

  const reviewersMap = useMemo(() => reviewerById(reviewers), [reviewers]);

  const loadRowHistory = useCallback(
    async (exampleId: number | null) => {
      if (!exampleId) {
        setRowHistory([]);
        setRowHistoryError(null);
        setExpandedRevisionIds([]);
        return;
      }

      try {
        setRowHistoryLoading(true);
        setRowHistoryError(null);
        const token = await getAuthToken();
        if (!token) {
          router.replace("/login");
          return;
        }

        const res = await fetch(`${API_BASE}/review/examples/${exampleId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await readJsonResponseSafe(
          res,
          "History is unavailable on the backend this web app is currently using.",
        );
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load row history");
        }

        setRowHistory(Array.isArray(data?.revisions) ? data.revisions : []);
        setExpandedRevisionIds([]);
      } catch (err) {
        console.error("Failed to load row history:", err);
        setRowHistory([]);
        setRowHistoryError(
          err instanceof Error ? err.message : "Failed to load row history",
        );
      } finally {
        setRowHistoryLoading(false);
      }
    },
    [router],
  );

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

  useEffect(() => {
    void loadRowHistory(rowDraft?.id ?? null);
  }, [loadRowHistory, rowDraft?.id]);

  const toggleRevisionExpanded = useCallback((revisionId: number) => {
    setExpandedRevisionIds((current) =>
      current.includes(revisionId)
        ? current.filter((id) => id !== revisionId)
        : [...current, revisionId],
    );
  }, []);

  const rowEditorBody = rowDraft ? (
    <>
      <View style={isRowOnly ? styles.rowOnlyFieldGrid : undefined}>
        <View
          style={[
            styles.fieldBlock,
            isRowOnly ? styles.rowOnlyHalfField : undefined,
          ]}
        >
          <Text style={styles.fieldLabel}>Thai</Text>
          <TextInput
            value={rowDraft.thai}
            onChangeText={(thai) =>
              setRowDraft((current) => (current ? { ...current, thai } : current))
            }
            style={styles.input}
          />
        </View>

        <View
          style={[
            styles.fieldBlock,
            isRowOnly ? styles.rowOnlyHalfField : undefined,
          ]}
        >
          <Text style={styles.fieldLabel}>Romanization</Text>
          <TextInput
            value={rowDraft.romanization}
            onChangeText={(romanization) =>
              setRowDraft((current) =>
                current ? { ...current, romanization } : current,
              )
            }
            style={styles.input}
          />
        </View>

        <View
          style={[
            styles.fieldBlock,
            isRowOnly ? styles.rowOnlyWideField : undefined,
          ]}
        >
          <Text style={styles.fieldLabel}>English</Text>
          <TextInput
            value={rowDraft.english}
            onChangeText={(english) =>
              setRowDraft((current) =>
                current ? { ...current, english } : current,
              )
            }
            style={styles.input}
          />
        </View>

        <View
          style={[
            styles.fieldBlock,
            isRowOnly ? styles.rowOnlyNarrowField : undefined,
          ]}
        >
          <Text style={styles.fieldLabel}>Sort order</Text>
          <TextInput
            value={String(rowDraft.sortOrder)}
            onChangeText={(value) =>
              setRowDraft((current) =>
                current
                  ? {
                      ...current,
                      sortOrder: Number.parseInt(value || "0", 10) || 0,
                    }
                  : current,
              )
            }
            style={styles.input}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Difficulty</Text>
        <View style={styles.inlineChipRow}>
          {(["easy", "medium", "hard"] as const).map((difficulty) => {
            const active = rowDraft.difficulty === difficulty;
            return (
              <TouchableOpacity
                key={difficulty}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() =>
                  setRowDraft((current) =>
                    current ? { ...current, difficulty } : current,
                  )
                }
                activeOpacity={0.82}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {difficulty}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Review settings</Text>
      <View style={isRowOnly ? styles.rowOnlyFieldGrid : undefined}>
        <View
          style={[
            styles.fieldBlock,
            isRowOnly ? styles.rowOnlyHalfField : undefined,
          ]}
        >
          <Text style={styles.fieldLabel}>Status</Text>
          <StatusPicker
            value={rowDraft.reviewStatus}
            onChange={(reviewStatus) =>
              setRowDraft((current) =>
                current ? { ...current, reviewStatus } : current,
              )
            }
          />
        </View>

        <View
          style={[
            styles.fieldBlock,
            isRowOnly ? styles.rowOnlyHalfField : undefined,
          ]}
        >
          <Text style={styles.fieldLabel}>Assignee</Text>
          <ReviewerPicker
            reviewers={reviewers}
            value={rowDraft.reviewAssigneeUserId}
            onChange={(reviewAssigneeUserId) =>
              setRowDraft((current) =>
                current ? { ...current, reviewAssigneeUserId } : current,
              )
            }
          />
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Review note</Text>
        <TextInput
          value={rowDraft.reviewNote}
          onChangeText={(reviewNote) =>
            setRowDraft((current) =>
              current ? { ...current, reviewNote } : current,
            )
          }
          style={[
            styles.input,
            styles.textarea,
            isRowOnly ? styles.rowOnlyNoteInput : undefined,
          ]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Quality flags</Text>
        <View style={styles.inlineChipRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              rowDraft.qualityFlags.includes("new_gen") && styles.chipActive,
            ]}
            onPress={() =>
              setRowDraft((current) => {
                if (!current) {
                  return current;
                }
                const hasFlag = current.qualityFlags.includes("new_gen");
                return {
                  ...current,
                  qualityFlags: hasFlag
                    ? current.qualityFlags.filter((flag) => flag !== "new_gen")
                    : [
                        ...current.qualityFlags.filter((flag) => flag !== "legacy"),
                        "new_gen",
                      ],
                };
              })
            }
            activeOpacity={0.82}
          >
            <Text
              style={[
                styles.chipText,
                rowDraft.qualityFlags.includes("new_gen") &&
                  styles.chipTextActive,
              ]}
            >
              New Gen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chip,
              rowDraft.qualityFlags.includes("legacy") && styles.chipActive,
            ]}
            onPress={() =>
              setRowDraft((current) => {
                if (!current) {
                  return current;
                }
                const hasFlag = current.qualityFlags.includes("legacy");
                return {
                  ...current,
                  qualityFlags: hasFlag
                    ? current.qualityFlags.filter((flag) => flag !== "legacy")
                    : [
                        ...current.qualityFlags.filter((flag) => flag !== "new_gen"),
                        "legacy",
                      ],
                };
              })
            }
            activeOpacity={0.82}
          >
            <Text
              style={[
                styles.chipText,
                rowDraft.qualityFlags.includes("legacy") &&
                  styles.chipTextActive,
              ]}
            >
              Legacy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chip,
              rowDraft.qualityFlags.includes("thai_weak") && styles.chipActive,
            ]}
            onPress={() =>
              setRowDraft((current) => {
                if (!current) {
                  return current;
                }
                const hasFlag = current.qualityFlags.includes("thai_weak");
                return {
                  ...current,
                  qualityFlags: hasFlag
                    ? current.qualityFlags.filter((flag) => flag !== "thai_weak")
                    : [...current.qualityFlags, "thai_weak"],
                };
              })
            }
            activeOpacity={0.82}
          >
            <Text
              style={[
                styles.chipText,
                rowDraft.qualityFlags.includes("thai_weak") &&
                  styles.chipTextActive,
              ]}
            >
              Thai weak
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Breakdown editor</Text>
      <BreakdownEditor
        items={rowDraft.breakdown}
        onChange={(breakdown) =>
          setRowDraft((current) => (current ? { ...current, breakdown } : current))
        }
        compact={isRowOnly}
      />

      <CommentsBlock
        title="Row comments"
        comments={rowComments}
        draft={rowCommentDraft}
        onDraftChange={setRowCommentDraft}
        onSubmit={() => void submitRowComment()}
        submitLabel="Add row comment"
        disabled={!rowDraft.id || savingComment}
        emptyCopy={rowDraft.id ? "No comments yet." : "Save this row first to enable comments."}
      />

      <View style={styles.historyWrap}>
        <Text style={styles.sectionTitle}>History</Text>
        {!rowDraft.id ? (
          <Text style={styles.helperText}>
            Save this row first to start tracking sentence revisions.
          </Text>
        ) : rowHistoryLoading ? (
          <View style={styles.historyLoadingRow}>
            <ActivityIndicator size="small" color={Sketch.inkMuted} />
            <Text style={styles.helperText}>Loading history...</Text>
          </View>
        ) : rowHistoryError ? (
          <Text style={styles.helperText}>
            {rowHistoryError}
            {Platform.OS === "web"
              ? " Refresh after the backend route is deployed, or point this web app at your local backend."
              : ""}
          </Text>
        ) : rowHistory.length === 0 ? (
          <Text style={styles.helperText}>No row history yet.</Text>
        ) : (
          <View style={styles.historyList}>
            {rowHistory.map((revision) => {
              const expanded = expandedRevisionIds.includes(revision.id);
              const revisionDisplayFields = resolveRevisionDisplayFields(revision);
              return (
                <View key={revision.id} style={styles.historyCard}>
                  <TouchableOpacity
                    style={styles.historyToggle}
                    onPress={() => toggleRevisionExpanded(revision.id)}
                    activeOpacity={0.82}
                  >
                    <View style={styles.historyTopRow}>
                      <View style={styles.historyMeta}>
                        <Text style={styles.historyTitle}>
                          {revision.action === "created"
                            ? "Row created"
                            : "Row updated"}
                        </Text>
                        <Text style={styles.historyMetaText}>
                          {revision.editor
                            ? reviewerLabel(revision.editor)
                            : "Unknown"}
                          {" · "}
                          {formatReviewTimestamp(revision.createdAt)}
                          {" · "}
                          {formatRevisionRelativeTime(revision.createdAt)}
                        </Text>
                      </View>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={Sketch.inkMuted}
                      />
                    </View>

                    <View style={styles.historyFieldPillRow}>
                      {revisionDisplayFields.map((field) => (
                        <View key={`${revision.id}-${field}`} style={styles.historyFieldPill}>
                          <Text style={styles.historyFieldPillText}>
                            {REVISION_FIELD_LABELS[field] ??
                              (field === "no_changes" ? "No field diff" : field)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>

                  {expanded ? (
                    <View style={styles.historyDetails}>
                      {revisionDisplayFields.map((field) => (
                        <View key={`${revision.id}-${field}-detail`} style={styles.historyFieldRow}>
                          <Text style={styles.historyFieldLabel}>
                            {REVISION_FIELD_LABELS[field] ??
                              (field === "no_changes" ? "Change summary" : field)}
                          </Text>
                          <View style={styles.historyBeforeAfter}>
                            <Text style={styles.historyBeforeText}>
                              Before:{" "}
                              {field === "no_changes"
                                ? "No field diff was recorded."
                                : formatRevisionSnapshotValue(
                                    revision.beforeSnapshot,
                                    field,
                                    reviewersMap,
                                  )}
                            </Text>
                            <Text style={styles.historyAfterText}>
                              After:{" "}
                              {field === "no_changes"
                                ? "No field diff was recorded."
                                : formatRevisionSnapshotValue(
                                    revision.afterSnapshot,
                                    field,
                                    reviewersMap,
                                  )}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.modalActions}>
        {rowDraft.id ? (
          <TouchableOpacity
            style={[styles.dangerButton, savingRow && styles.disabledButton]}
            onPress={() => void deleteRow()}
            activeOpacity={0.82}
            disabled={savingRow}
          >
            <Text style={styles.dangerButtonText}>Delete row</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              isRowOnly ? router.back() : setRowEditorVisible(false)
            }
            activeOpacity={0.82}
          >
            <Text style={styles.secondaryButtonText}>
              {isRowOnly ? "Back" : "Cancel"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, savingRow && styles.disabledButton]}
            onPress={() => void saveRow()}
            activeOpacity={0.82}
            disabled={savingRow}
          >
            <Text style={styles.primaryButtonText}>
              {savingRow ? "Saving..." : rowDraft.id ? "Save row" : "Create row"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  ) : null;

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
    if (!isRowOnly) {
      setRowEditorVisible(true);
    }
  }, [isRowOnly, reviewers, rows.length]);

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
        if (isRowOnly) {
          const nextDraft = buildRowEditorState(savedRow);
          nextDraft.reviewAssigneeUserId = sanitizeReviewAssigneeUserId(
            nextDraft.reviewAssigneeUserId,
            reviewers,
          );
          setRowDraft(nextDraft);
        }
        void loadRowHistory(savedRow.id);
      }

      if (isRowOnly) {
        showReviewAlert("Row saved", "Sentence row was updated.");
      } else {
        setRowEditorVisible(false);
        setRowDraft(null);
      }
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
      if (isRowOnly) {
        router.back();
      } else {
        setRowEditorVisible(false);
        setRowDraft(null);
      }
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

      {!isRowOnly ? (
        <Modal
          visible={rowEditorVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRowEditorVisible(false)}
        >
          <View style={styles.overlay}>
            <Pressable
              style={styles.backdrop}
              onPress={() => setRowEditorVisible(false)}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {rowDraft?.id ? "Edit sentence row" : "Add sentence row"}
                </Text>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setRowEditorVisible(false)}
                  activeOpacity={0.82}
                >
                  <Ionicons name="close" size={20} color={Sketch.inkMuted} />
                </TouchableOpacity>
              </View>

              {rowDraft ? (
                <ScrollView
                  contentContainerStyle={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  {rowEditorBody}
                </ScrollView>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.82}>
          <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isRowOnly
              ? "Sentence Row Editor"
              : mode === "admin"
                ? "Admin Lesson Editor"
                : "Lesson Review"}
          </Text>
          <Text style={styles.headerSubtitle}>{grammarId}</Text>
        </View>
        {mode === "admin" && !isRowOnly ? (
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
      ) : isRowOnly ? (
        rowDraft ? (
          <ScrollView
            contentContainerStyle={[styles.scroll, styles.rowOnlyScroll]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.card, styles.rowOnlyCard]}>
              <View style={styles.sectionHeader}>
                <View style={styles.headerCenter}>
                  <Text style={styles.sectionTitle}>Sentence row editor</Text>
                  <Text style={styles.helperText}>
                    Focused editor for sentence rows in{" "}
                    {grammarPoint?.title ?? grammarId}.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push(`/admin/grammar/${grammarId}` as any)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.secondaryButtonText}>
                    Open full lesson editor
                  </Text>
                </TouchableOpacity>
              </View>
              {rowEditorBody}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.centerWrap}>
            <Text style={styles.emptyTitle}>Sentence row not found</Text>
            <Text style={styles.helperText}>
              This row may have been deleted, or the link is out of date.
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push(`/admin/grammar/${grammarId}` as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.secondaryButtonText}>
                Open full lesson editor
              </Text>
            </TouchableOpacity>
          </View>
        )
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
              <View style={styles.headerPillRow}>
                {lessonForm.hiddenFromLearners ? (
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: "#F3F3F1",
                        borderColor: "#D4D4CF",
                      },
                    ]}
                  >
                    <Text
                      style={[styles.statusPillText, { color: Sketch.inkMuted }]}
                    >
                      Hidden from learners
                    </Text>
                  </View>
                ) : null}
                {lessonReviewMeta ? (
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: lessonReviewMeta.bg,
                        borderColor: lessonReviewMeta.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: lessonReviewMeta.text },
                      ]}
                    >
                      {REVIEW_STATUS_LABELS[lessonForm.reviewStatus]}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={styles.metaText}>Stage {lessonForm.stage}</Text>
            <Text style={styles.metaText}>Current reviewer {profile ? reviewerLabel({ email: profile.email, display_name: profile.display_name }) : "Unknown"}</Text>

            <Text style={styles.fieldLabel}>Review status</Text>
            <Text style={styles.helperText}>
              This controls the review workflow only. It does not hide the
              lesson from learners.
            </Text>
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

            <Text style={styles.fieldLabel}>Lesson order</Text>
            <Text style={styles.helperText}>
              Backend-owned order within this stage. 0 is the first lesson
              learners see.
            </Text>
            <TextInput
              value={String(lessonForm.lessonOrder)}
              onChangeText={(value) =>
                setLessonForm((current) =>
                  current
                    ? {
                        ...current,
                        lessonOrder: parseLessonOrderInput(
                          value,
                          current.lessonOrder,
                        ),
                      }
                    : current,
                )
              }
              style={styles.input}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Learner visibility</Text>
            <Text style={styles.helperText}>
              Hide this lesson when the content is wrong or incomplete. Hidden
              lessons stay available in admin.
            </Text>
            <View style={styles.inlineChipRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  !lessonForm.hiddenFromLearners && styles.chipActive,
                ]}
                onPress={() =>
                  setLessonForm((current) =>
                    current
                      ? { ...current, hiddenFromLearners: false }
                      : current,
                  )
                }
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    styles.chipText,
                    !lessonForm.hiddenFromLearners && styles.chipTextActive,
                  ]}
                >
                  Visible to learners
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  lessonForm.hiddenFromLearners && styles.chipActive,
                ]}
                onPress={() =>
                  setLessonForm((current) =>
                    current
                      ? { ...current, hiddenFromLearners: true }
                      : current,
                  )
                }
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    styles.chipText,
                    lessonForm.hiddenFromLearners && styles.chipTextActive,
                  ]}
                >
                  Hidden from learners
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput value={lessonForm.title} onChangeText={(title) => setLessonForm((current) => (current ? { ...current, title } : current))} style={styles.input} />

            <Text style={styles.fieldLabel}>Pattern</Text>
            <TextInput value={lessonForm.pattern} onChangeText={(pattern) => setLessonForm((current) => (current ? { ...current, pattern } : current))} style={styles.input} />

            <Text style={styles.fieldLabel}>Short explanation</Text>
            <TextInput value={lessonForm.explanation} onChangeText={(explanation) => setLessonForm((current) => (current ? { ...current, explanation } : current))} style={[styles.input, styles.textareaLarge]} multiline textAlignVertical="top" />

            <Text style={styles.sectionTitle}>Lesson guide</Text>

            <Text style={styles.fieldLabel}>Summary</Text>
            <TextInput
              value={lessonForm.lessonSummary}
              onChangeText={(lessonSummary) =>
                setLessonForm((current) =>
                  current ? { ...current, lessonSummary } : current,
                )
              }
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Build</Text>
            <TextInput
              value={lessonForm.lessonBuild}
              onChangeText={(lessonBuild) =>
                setLessonForm((current) =>
                  current ? { ...current, lessonBuild } : current,
                )
              }
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Use</Text>
            <TextInput
              value={lessonForm.lessonUse}
              onChangeText={(lessonUse) =>
                setLessonForm((current) =>
                  current ? { ...current, lessonUse } : current,
                )
              }
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
      maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Sketch.ink },
  headerSubtitle: { fontSize: 12, color: Sketch.inkMuted },
  iconButton: { minWidth: 40, height: 40, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.cardBg },
  centerWrap: {
    flex: 1,
    width: "100%",
      maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  scroll: {
    width: "100%",
      maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 14,
  },
  rowOnlyScroll: {
      maxWidth: 1080,
    paddingHorizontal: 18,
    gap: 10,
  },
  card: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.cardBg, padding: 16, gap: 12 },
  rowOnlyCard: { padding: 14, gap: 10 },
  metaText: { fontSize: 12, color: Sketch.inkMuted },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  headerPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
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
  fieldBlock: { gap: 8 },
  rowOnlyFieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 10,
  },
  rowOnlyHalfField: { width: "48.8%" },
  rowOnlyWideField: { width: "72%" },
  rowOnlyNarrowField: { width: "26%" },
  rowOnlyNoteInput: { minHeight: 64 },
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
  breakdownListCompact: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
  breakdownCard: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.paperDark, padding: 12, gap: 10 },
  breakdownCardCompact: { width: "48.8%", padding: 10, gap: 8 },
  breakdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  breakdownTitle: { fontSize: 14, fontWeight: "700", color: Sketch.ink },
  breakdownHeaderActions: { flexDirection: "row", gap: 6 },
  miniButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.cardBg },
  miniButtonDanger: { borderColor: "#E4C4BF", backgroundColor: "#FCF2F1" },
  suggestionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  suggestionText: { flex: 1, minWidth: 180, fontSize: 12, lineHeight: 18, color: Sketch.inkMuted },
  miniSecondaryButton: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.cardBg, alignItems: "center", justifyContent: "center" },
  miniSecondaryButtonText: { fontSize: 12, fontWeight: "700", color: Sketch.ink },
  toneEditorWrap: { gap: 10 },
  breakdownToneDots: { marginTop: 2 },
  toneSlotBlock: { gap: 8 },
  toneSlotBlockCompact: { gap: 6 },
  commentsWrap: { gap: 10 },
  historyWrap: { gap: 10 },
  historyLoadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyList: { gap: 8 },
  historyCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paperDark,
  },
  historyToggle: { padding: 10, gap: 8 },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  historyMeta: { flex: 1, gap: 2 },
  historyTitle: { fontSize: 13, fontWeight: "700", color: Sketch.ink },
  historyMetaText: { fontSize: 12, color: Sketch.inkMuted },
  historyFieldPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  historyFieldPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  historyFieldPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  historyDetails: {
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  historyFieldRow: { gap: 4 },
  historyFieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  historyBeforeAfter: { gap: 4 },
  historyBeforeText: { fontSize: 12, lineHeight: 18, color: Sketch.inkMuted },
  historyAfterText: { fontSize: 12, lineHeight: 18, color: Sketch.ink },
  commentCard: { borderWidth: 1, borderColor: Sketch.inkFaint, backgroundColor: Sketch.paperDark, padding: 12, gap: 6 },
  commentAuthor: { fontSize: 12, fontWeight: "700", color: Sketch.ink },
  commentBody: { fontSize: 14, lineHeight: 21, color: Sketch.ink },
  commentTime: { fontSize: 12, color: Sketch.inkMuted },
  commentInput: { minHeight: 88 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  actionsRight: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Sketch.ink },
});
