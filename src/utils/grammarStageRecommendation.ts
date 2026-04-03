import type { GrammarPoint } from "../data/grammar";
import type { PublicCefrLevel } from "../data/grammarLevels";
import {
  GRAMMAR_STAGES,
  PUBLIC_GRAMMAR_STAGES,
  type GrammarStage,
} from "../data/grammarStages";
import type { GrammarProgressData } from "./grammarProgress";
import { isGrammarPracticed } from "./grammarProgress";

export type StageProgressStatus = "unstarted" | "inProgress" | "completed";

export interface StageProgressSummary {
  stage: GrammarStage;
  level: PublicCefrLevel;
  total: number;
  practiced: number;
  percentage: number;
  status: StageProgressStatus;
  lastPracticed: string | null;
}

export interface RecommendedGrammarStage {
  stage: GrammarStage;
  level: PublicCefrLevel;
}

function getLatestPracticeDate(
  points: GrammarPoint[],
  progress: Record<string, GrammarProgressData>,
): string | null {
  let bestDate: string | null = null;
  let bestTimestamp = -1;

  for (const point of points) {
    const rawDate = progress[point.id]?.lastPracticed;
    if (!rawDate) continue;

    const timestamp = Date.parse(rawDate);
    if (Number.isNaN(timestamp) || timestamp <= bestTimestamp) continue;

    bestTimestamp = timestamp;
    bestDate = rawDate;
  }

  return bestDate;
}

function getStageOrder(stage: GrammarStage): number {
  return GRAMMAR_STAGES.indexOf(stage);
}

export function buildStageProgressSummaries(
  points: GrammarPoint[],
  progress: Record<string, GrammarProgressData>,
): StageProgressSummary[] {
  return PUBLIC_GRAMMAR_STAGES.flatMap((stage) => {
    const stagePoints = points.filter((point) => point.stage === stage);
    if (stagePoints.length === 0) return [];

    const practiced = stagePoints.filter((point) =>
      isGrammarPracticed(progress[point.id]),
    ).length;
    const total = stagePoints.length;
    const percentage = total > 0 ? Math.round((practiced / total) * 100) : 0;
    const status: StageProgressStatus =
      practiced === 0
        ? "unstarted"
        : practiced >= total
          ? "completed"
          : "inProgress";

    return [
      {
        stage,
        level: stagePoints[0].level as PublicCefrLevel,
        total,
        practiced,
        percentage,
        status,
        lastPracticed: getLatestPracticeDate(stagePoints, progress),
      },
    ];
  });
}

export function getRecommendedGrammarStage(
  summaries: StageProgressSummary[],
): RecommendedGrammarStage | null {
  const inProgress = summaries.filter((summary) => summary.status === "inProgress");

  if (inProgress.length > 0) {
    const mostRecent = inProgress.reduce<StageProgressSummary | null>(
      (best, current) => {
        if (!best) return current;

        const bestTimestamp = best.lastPracticed
          ? Date.parse(best.lastPracticed)
          : -1;
        const currentTimestamp = current.lastPracticed
          ? Date.parse(current.lastPracticed)
          : -1;

        if (currentTimestamp > bestTimestamp) return current;
        if (currentTimestamp < bestTimestamp) return best;

        return getStageOrder(current.stage) < getStageOrder(best.stage)
          ? current
          : best;
      },
      null,
    );

    return mostRecent
      ? { stage: mostRecent.stage, level: mostRecent.level }
      : null;
  }

  const nextUnstarted = summaries.find((summary) => summary.status === "unstarted");
  return nextUnstarted
    ? { stage: nextUnstarted.stage, level: nextUnstarted.level }
    : null;
}
