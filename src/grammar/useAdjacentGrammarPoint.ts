import { useMemo } from "react";

import type { GrammarPoint } from "../data/grammar";
import { useGrammarCatalog } from "./GrammarCatalogProvider";

export type AdjacentGrammarPointResult = {
  previous: GrammarPoint | null;
  next: GrammarPoint | null;
  currentIndex: number;
  total: number;
};

export function getAdjacentGrammarPoint(
  grammarPoints: GrammarPoint[],
  grammarId?: string | null,
): AdjacentGrammarPointResult {
  const currentIndex =
    typeof grammarId === "string"
      ? grammarPoints.findIndex((point) => point.id === grammarId)
      : -1;

  if (currentIndex === -1) {
    return {
      previous: null,
      next: null,
      currentIndex: -1,
      total: grammarPoints.length,
    };
  }

  return {
    previous: grammarPoints[currentIndex - 1] ?? null,
    next: grammarPoints[currentIndex + 1] ?? null,
    currentIndex,
    total: grammarPoints.length,
  };
}

export function useAdjacentGrammarPoint(
  grammarId?: string | null,
): AdjacentGrammarPointResult {
  const { grammarPoints } = useGrammarCatalog();

  return useMemo(
    () => getAdjacentGrammarPoint(grammarPoints, grammarId),
    [grammarId, grammarPoints],
  );
}
