import { ToneName } from "@/src/utils/toneAccent";

export type ReviewStatus =
  | "flagged"
  | "in_review"
  | "approved"
  | "needs_changes"
  | "hidden";

export type ReviewerUser = {
  id: number;
  email: string;
  display_name?: string | null;
  is_admin: boolean;
  can_review_content: boolean;
};

export type ReviewComment = {
  id: number;
  grammarId?: string;
  exampleId?: number;
  authorUserId: number;
  body: string;
  createdAt: string;
  author?: {
    id: number;
    email: string;
    display_name?: string | null;
  } | null;
};

export type ReviewBreakdownItem = {
  thai: string;
  english: string;
  romanization?: string;
  grammar?: boolean;
  tones?: ToneName[];
};

export type ReviewToneAnalysis = {
  confidence?: number;
  status?: string;
  flaggedItemCount?: number;
  reasons?: string[];
  breakdown?: {
    source?: string;
    confidence?: number;
    needsReview?: boolean;
    reasons?: string[];
    syllableCount?: number;
  }[];
};

export type ReviewExampleRow = {
  id: number;
  grammarId: string;
  thai: string;
  romanization: string;
  english: string;
  breakdown: ReviewBreakdownItem[];
  difficulty: "easy" | "medium" | "hard";
  toneConfidence: number;
  toneStatus: "approved" | "review";
  toneAnalysis?: ReviewToneAnalysis | null;
  reviewStatus: ReviewStatus;
  reviewAssigneeUserId: number | null;
  reviewNote: string | null;
  lastEditedByUserId: number | null;
  lastEditedAt: string | null;
  approvedByUserId: number | null;
  approvedAt: string | null;
  sortOrder: number;
};

export type ReviewLessonOverride = {
  grammarId: string;
  override: {
    title: string;
    level: string;
    stage: string;
    explanation: string;
    pattern: string;
    aiPrompt?: string;
    example: {
      thai: string;
      roman: string;
      english: string;
      breakdown: ReviewBreakdownItem[];
    };
    focus: {
      particle: string;
      meaning: string;
    };
  } | null;
  reviewStatus: ReviewStatus;
  reviewAssigneeUserId: number | null;
  reviewNote: string | null;
  lastEditedByUserId: number | null;
  lastEditedAt: string | null;
  approvedByUserId: number | null;
  approvedAt: string | null;
};

export type ReviewQueueItem = {
  id: string | number;
  type: "lesson" | "row";
  grammarId: string;
  stage?: string | null;
  reviewStatus: ReviewStatus;
  reviewAssigneeUserId: number | null;
  reviewNote: string | null;
  lastEditedByUserId: number | null;
  lastEditedAt: string | null;
  approvedByUserId: number | null;
  approvedAt: string | null;
  confidence: number | null;
  flaggedItemCount: number;
  previewThai: string | null;
  previewEnglish: string | null;
  title: string | null;
};

export type ReviewQueueResponse = {
  items: ReviewQueueItem[];
  reviewers: ReviewerUser[];
};

export type ReviewGrammarDetailResponse = {
  lesson: ReviewLessonOverride | null;
  rows: ReviewExampleRow[];
  reviewers: ReviewerUser[];
  lessonComments: ReviewComment[];
  exampleCommentsByExampleId: Record<string, ReviewComment[]>;
};

export type ReviewerProfile = {
  id: number;
  email: string;
  display_name?: string | null;
  is_admin?: boolean;
  can_review_content?: boolean;
};
