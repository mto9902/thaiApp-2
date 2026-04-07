import type { LessonBlocks } from "@/src/data/lessonBlocks";
import { ToneName } from "@/src/utils/toneAccent";

export type ReviewStatus =
  | "flagged"
  | "in_review"
  | "approved"
  | "needs_changes"
  | "hidden";

export type ReviewPublishState = "published" | "staged" | "retired";
export type ReviewNextWaveDecision =
  | "carry"
  | "revise"
  | "replace"
  | "retire";
export type ReviewRowQualityFlag = "thai_weak" | "legacy" | "new_gen";

export type LessonProductionSummary = {
  grammarId: string | null;
  stage: string | null;
  finalTargetCount: number;
  firstPassCandidateTarget: number;
  supplementalCandidateBatchSize: number;
  currentRewriteWaveId: string | null;
  lastGeneratedAt: string | null;
  lastPublishedAt: string | null;
  notes: string | null;
  livePublishedCount: number;
  publishedRowCount: number;
  stagedRowCount: number;
  stagedApprovedCount: number;
  stagedReadyCount: number;
  currentWaveRowCount: number;
  currentWaveApprovedCount: number;
  currentWaveReadyCount: number;
  retiredRowCount: number;
  remainingForPublish: number;
  workflowStatus:
    | "not_started"
    | "generated"
    | "reviewing"
    | "tone_review"
    | "ready_to_publish"
    | "published";
  isReadyToPublish: boolean;
};

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
  displayThaiSegments?: string[];
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
  publishState: ReviewPublishState;
  rewriteWaveId: string | null;
  sourceExampleId: number | null;
  qualityFlags: ReviewRowQualityFlag[];
  nextWaveDecision: ReviewNextWaveDecision | null;
  nextWaveAuditNote: string | null;
  nextWaveAuditedByUserId: number | null;
  nextWaveAuditedAt: string | null;
  reviewAssigneeUserId: number | null;
  reviewNote: string | null;
  lastEditedByUserId: number | null;
  lastEditedAt: string | null;
  approvedByUserId: number | null;
  approvedAt: string | null;
  sortOrder: number;
};

export type ReviewExampleRevisionSnapshot = {
  thai: string;
  romanization: string;
  english: string;
  breakdown: ReviewBreakdownItem[];
  difficulty: "easy" | "medium" | "hard";
  reviewStatus: ReviewStatus;
  reviewAssigneeUserId: number | null;
  reviewNote: string | null;
  publishState?: ReviewPublishState;
  rewriteWaveId?: string | null;
  sourceExampleId?: number | null;
  qualityFlags?: ReviewRowQualityFlag[];
  nextWaveDecision?: ReviewNextWaveDecision | null;
  nextWaveAuditNote?: string | null;
  nextWaveAuditedByUserId?: number | null;
  nextWaveAuditedAt?: string | null;
  sortOrder: number;
  toneConfidence: number;
  toneStatus: "approved" | "review";
};

export type ReviewExampleRevision = {
  id: number;
  exampleId: number;
  grammarId: string;
  action: string;
  editedByUserId: number | null;
  changedFields: string[];
  beforeSnapshot: ReviewExampleRevisionSnapshot | null;
  afterSnapshot: ReviewExampleRevisionSnapshot | null;
  createdAt: string;
  editor?: {
    id: number;
    email: string;
    display_name?: string | null;
  } | null;
};

export type ReviewLessonOverride = {
  grammarId: string;
  override: {
    title: string;
    level: string;
    stage: string;
    lessonOrder?: number;
    hiddenFromLearners?: boolean;
    explanation: string;
    pattern: string;
    lessonBlocks?: LessonBlocks;
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
  production?: LessonProductionSummary | null;
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
