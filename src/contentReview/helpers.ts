import { GrammarPoint } from "@/src/data/grammar";
import { ToneName } from "@/src/utils/toneAccent";

import {
  ReviewBreakdownItem,
  ReviewComment,
  ReviewExampleRow,
  ReviewLessonOverride,
  ReviewerUser,
  ReviewStatus,
} from "./types";

export const REVIEW_STATUS_OPTIONS: ReviewStatus[] = [
  "flagged",
  "in_review",
  "approved",
  "needs_changes",
  "hidden",
];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  flagged: "Flagged",
  in_review: "In review",
  approved: "Approved",
  needs_changes: "Needs changes",
  hidden: "Hidden",
};

export const TONE_OPTIONS: ToneName[] = [
  "mid",
  "low",
  "falling",
  "high",
  "rising",
];

export type LessonFormState = {
  title: string;
  level: string;
  stage: string;
  explanation: string;
  pattern: string;
  aiPrompt: string;
  focusParticle: string;
  focusMeaning: string;
  exampleThai: string;
  exampleRoman: string;
  exampleEnglish: string;
  exampleBreakdown: ReviewBreakdownItem[];
  reviewStatus: ReviewStatus;
  reviewAssigneeUserId: number | null;
  reviewNote: string;
};

export type RowEditorState = {
  id?: number;
  thai: string;
  romanization: string;
  english: string;
  difficulty: "easy" | "medium" | "hard";
  breakdown: ReviewBreakdownItem[];
  reviewStatus: ReviewStatus;
  reviewAssigneeUserId: number | null;
  reviewNote: string;
  sortOrder: number;
};

export function createEmptyBreakdownItem(): ReviewBreakdownItem {
  return {
    thai: "",
    english: "",
    romanization: "",
    grammar: false,
    tones: [],
  };
}

export function buildLessonFormState(
  point: GrammarPoint,
  lesson: ReviewLessonOverride | null,
): LessonFormState {
  const source = lesson?.override ?? point;

  return {
    title: source.title ?? point.title,
    level: source.level ?? point.level,
    stage: source.stage ?? point.stage,
    explanation: source.explanation ?? point.explanation,
    pattern: source.pattern ?? point.pattern,
    aiPrompt: source.aiPrompt ?? point.aiPrompt ?? "",
    focusParticle: source.focus?.particle ?? point.focus.particle,
    focusMeaning: source.focus?.meaning ?? point.focus.meaning,
    exampleThai: source.example?.thai ?? point.example.thai,
    exampleRoman: source.example?.roman ?? point.example.roman,
    exampleEnglish: source.example?.english ?? point.example.english,
    exampleBreakdown:
      source.example?.breakdown?.map(cloneBreakdownItem) ??
      point.example.breakdown.map(cloneBreakdownItem),
    reviewStatus: lesson?.reviewStatus ?? "flagged",
    reviewAssigneeUserId: lesson?.reviewAssigneeUserId ?? null,
    reviewNote: lesson?.reviewNote ?? "",
  };
}

export function buildRowEditorState(row?: ReviewExampleRow | null): RowEditorState {
  if (!row) {
    return {
      thai: "",
      romanization: "",
      english: "",
      difficulty: "easy",
      breakdown: [createEmptyBreakdownItem()],
      reviewStatus: "flagged",
      reviewAssigneeUserId: null,
      reviewNote: "",
      sortOrder: 0,
    };
  }

  return {
    id: row.id,
    thai: row.thai,
    romanization: row.romanization,
    english: row.english,
    difficulty: row.difficulty,
    breakdown: row.breakdown.map(cloneBreakdownItem),
    reviewStatus: row.reviewStatus,
    reviewAssigneeUserId: row.reviewAssigneeUserId,
    reviewNote: row.reviewNote ?? "",
    sortOrder: row.sortOrder,
  };
}

export function cloneBreakdownItem(item: ReviewBreakdownItem): ReviewBreakdownItem {
  return {
    thai: item.thai ?? "",
    english: item.english ?? "",
    romanization: item.romanization ?? "",
    grammar: item.grammar === true,
    tones: Array.isArray(item.tones) ? [...item.tones] : [],
  };
}

export function lessonPayloadFromState(state: LessonFormState) {
  const exampleBreakdown = sanitizeBreakdownItems(state.exampleBreakdown);

  return {
    override: {
      title: state.title,
      level: state.level,
      stage: state.stage,
      explanation: state.explanation,
      pattern: state.pattern,
      aiPrompt: state.aiPrompt || undefined,
      example: {
        thai: state.exampleThai,
        roman: state.exampleRoman,
        english: state.exampleEnglish,
        breakdown: exampleBreakdown.map(cleanBreakdownItem),
      },
      focus: {
        particle: state.focusParticle,
        meaning: state.focusMeaning,
      },
    },
    reviewStatus: state.reviewStatus,
    reviewAssigneeUserId: state.reviewAssigneeUserId,
    reviewNote: state.reviewNote.trim() || null,
  };
}

export function rowPayloadFromState(state: RowEditorState) {
  const breakdown = sanitizeBreakdownItems(state.breakdown);

  return {
    thai: state.thai,
    romanization: state.romanization,
    english: state.english,
    difficulty: state.difficulty,
    breakdown: breakdown.map(cleanBreakdownItem),
    reviewStatus: state.reviewStatus,
    reviewAssigneeUserId: state.reviewAssigneeUserId,
    reviewNote: state.reviewNote.trim() || null,
    sortOrder: state.sortOrder,
  };
}

export function sanitizeBreakdownItems(items: ReviewBreakdownItem[]) {
  return items.filter((item) => !isBreakdownItemBlank(item));
}

export function validateBreakdownItems(items: ReviewBreakdownItem[]) {
  const sanitized = sanitizeBreakdownItems(items);

  if (sanitized.length === 0) {
    return "Add at least one breakdown word before saving.";
  }

  const invalidIndex = sanitized.findIndex(
    (item) => !item.thai.trim() || !item.english.trim(),
  );

  if (invalidIndex >= 0) {
    return `Breakdown word ${invalidIndex + 1} needs both Thai and English text.`;
  }

  return null;
}

export function sanitizeReviewAssigneeUserId(
  value: number | null,
  reviewers: ReviewerUser[],
) {
  if (value === null) {
    return null;
  }

  return reviewers.some((reviewer) => reviewer.id === value) ? value : null;
}

export function cleanBreakdownItem(item: ReviewBreakdownItem): ReviewBreakdownItem {
  const cleaned: ReviewBreakdownItem = {
    thai: item.thai.trim(),
    english: item.english.trim(),
  };

  if (item.romanization?.trim()) {
    cleaned.romanization = item.romanization.trim();
  }

  if (item.grammar) {
    cleaned.grammar = true;
  }

  if (Array.isArray(item.tones) && item.tones.length > 0) {
    cleaned.tones = item.tones.filter(Boolean);
  }

  return cleaned;
}

export function formatReviewTimestamp(value?: string | null) {
  if (!value) {
    return "Not yet edited";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not yet edited";
  }

  return parsed.toLocaleString();
}

export function sortComments(comments: ReviewComment[]) {
  return [...comments].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
}

function isBreakdownItemBlank(item: ReviewBreakdownItem) {
  return (
    !item.thai.trim() &&
    !item.english.trim() &&
    !(item.romanization ?? "").trim() &&
    item.grammar !== true &&
    (!Array.isArray(item.tones) || item.tones.length === 0)
  );
}
