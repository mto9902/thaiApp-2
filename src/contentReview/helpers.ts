import { GrammarPoint } from "@/src/data/grammar";
import type { LessonBlocks } from "@/src/data/lessonBlocks";
import { ToneName } from "@/src/utils/toneAccent";

import {
  ReviewBreakdownItem,
  ReviewComment,
  ReviewExampleRow,
  ReviewLessonOverride,
  ReviewRowQualityFlag,
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

const EXPLICIT_ROMAN_TONE_MARKS = new Map<string, ToneName>([
  ["\u0300", "low"],
  ["\u0301", "high"],
  ["\u0302", "falling"],
  ["\u030C", "rising"],
]);
const LEADING_THAI_VOWELS = new Set(["เ", "แ", "โ", "ใ", "ไ"]);
const DEPENDENT_THAI_VOWELS = new Set([
  "ะ",
  "ั",
  "า",
  "ำ",
  "ิ",
  "ี",
  "ึ",
  "ื",
  "ุ",
  "ู",
  "ฤ",
  "ฦ",
  "ๅ",
]);

export type LessonFormState = {
  title: string;
  level: string;
  stage: string;
  lessonOrder: number;
  hiddenFromLearners: boolean;
  explanation: string;
  pattern: string;
  lessonSummary: string;
  lessonBuild: string;
  lessonUse: string;
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
  qualityFlags: ReviewRowQualityFlag[];
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

export function splitBreakdownRomanizationSyllables(
  romanization?: string | null,
) {
  return String(romanization ?? "")
    .trim()
    .split(/[\s/-]+/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripThaiToneMarks(word: string) {
  return word.replace(/[\u0E48\u0E49\u0E4A\u0E4B]/gu, "");
}

function stripThaiSilentMarkers(word: string) {
  return word.replace(/[\u0E01-\u0E2E]\u0E4C/gu, "").replace(/\u0E4C/gu, "");
}

function normalizeLessonOrderValue(value: unknown, fallback = 0) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export function countBreakdownThaiSyllables(thai?: string | null) {
  const chars = Array.from(
    stripThaiToneMarks(stripThaiSilentMarkers(String(thai ?? "").trim())),
  );

  let count = 0;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];

    if (LEADING_THAI_VOWELS.has(char)) {
      count += 1;
      continue;
    }

    if (DEPENDENT_THAI_VOWELS.has(char)) {
      const previous = chars[index - 1];
      if (!previous || !LEADING_THAI_VOWELS.has(previous)) {
        count += 1;
      }
    }
  }

  return count;
}

export function suggestBreakdownTonesFromRomanization(
  romanization?: string | null,
  thai?: string | null,
): ToneName[] {
  const romanSyllables = splitBreakdownRomanizationSyllables(romanization);
  const thaiSyllableCount = countBreakdownThaiSyllables(thai);
  const shouldUseThaiFallback =
    romanSyllables.length <= 1 && thaiSyllableCount > romanSyllables.length;

  const sourceSyllables = shouldUseThaiFallback
    ? Array.from({ length: Math.min(thaiSyllableCount, 4) }, () => "")
    : romanSyllables.slice(0, 4);

  return sourceSyllables
    .slice(0, 4)
    .map((syllable) => {
      const normalized = syllable.normalize("NFD");
      for (const [mark, tone] of EXPLICIT_ROMAN_TONE_MARKS.entries()) {
        if (normalized.includes(mark)) {
          return tone;
        }
      }
      return "mid";
    });
}

export function buildLessonFormState(
  point: GrammarPoint,
  lesson: ReviewLessonOverride | null,
): LessonFormState {
  const source = lesson?.override
    ? {
        ...point,
        ...lesson.override,
        example: lesson.override.example ?? point.example,
        focus: lesson.override.focus ?? point.focus,
        lessonBlocks: lesson.override.lessonBlocks ?? point.lessonBlocks,
      }
    : point;
  const lessonBlocks = source.lessonBlocks ?? point.lessonBlocks;

  return {
    title: source.title ?? point.title,
    level: source.level ?? point.level,
    stage: source.stage ?? point.stage,
    lessonOrder: normalizeLessonOrderValue(
      source.lessonOrder,
      point.lessonOrder,
    ),
    hiddenFromLearners: source.hiddenFromLearners === true,
    explanation: source.explanation ?? point.explanation,
    pattern: source.pattern ?? point.pattern,
    lessonSummary: lessonBlocks?.summary ?? source.explanation ?? point.explanation,
    lessonBuild: lessonBlocks?.build ?? "",
    lessonUse: lessonBlocks?.use ?? "",
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
      qualityFlags: [],
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
    qualityFlags: Array.isArray(row.qualityFlags) ? [...row.qualityFlags] : [],
    sortOrder: row.sortOrder,
  };
}

export function cloneBreakdownItem(item: ReviewBreakdownItem): ReviewBreakdownItem {
  return {
    thai: item.thai ?? "",
    english: item.english ?? "",
    romanization: item.romanization ?? "",
    displayThaiSegments: Array.isArray(item.displayThaiSegments)
      ? item.displayThaiSegments.filter(Boolean).map((segment) => segment.trim())
      : [],
    grammar: item.grammar === true,
    tones: Array.isArray(item.tones) ? [...item.tones] : [],
  };
}

export function lessonPayloadFromState(state: LessonFormState) {
  const exampleBreakdown = sanitizeBreakdownItems(state.exampleBreakdown);
  const lessonBlocks = sanitizeLessonBlocks({
    summary: state.lessonSummary,
    build: state.lessonBuild,
    use: state.lessonUse,
  });

  return {
    override: {
      title: state.title,
      level: state.level,
      stage: state.stage,
      lessonOrder: normalizeLessonOrderValue(state.lessonOrder),
      hiddenFromLearners: state.hiddenFromLearners,
      explanation: state.explanation,
      pattern: state.pattern,
      lessonBlocks,
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
    qualityFlags: state.qualityFlags,
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

  const displayThaiSegments = Array.isArray(item.displayThaiSegments)
    ? item.displayThaiSegments
        .map((segment) => String(segment ?? "").trim())
        .filter(Boolean)
    : [];

  if (displayThaiSegments.length > 0) {
    cleaned.displayThaiSegments = displayThaiSegments;
  }

  if (Array.isArray(item.tones) && item.tones.length > 0) {
    cleaned.tones = item.tones.filter(Boolean);
  }

  return cleaned;
}

function sanitizeLessonBlocks(blocks: LessonBlocks): LessonBlocks | undefined {
  const summary = blocks.summary.trim();
  const build = blocks.build.trim();
  const use = blocks.use.trim();

  if (!summary && !build && !use) {
    return undefined;
  }

  return {
    summary,
    build,
    use,
  };
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
    (!Array.isArray(item.displayThaiSegments) ||
      item.displayThaiSegments.length === 0) &&
    item.grammar !== true &&
    (!Array.isArray(item.tones) || item.tones.length === 0)
  );
}
