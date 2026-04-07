import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { API_BASE } from "../config";
import { GrammarPoint, grammarPoints as bundledGrammarPoints } from "../data/grammar";
import { GRAMMAR_STAGE_META } from "../data/grammarStages";

type GrammarPointOverride = Partial<
  Pick<
    GrammarPoint,
    | "title"
    | "level"
    | "stage"
    | "stageOrder"
    | "lessonOrder"
    | "hiddenFromLearners"
    | "explanation"
    | "pattern"
    | "lessonBlocks"
    | "aiPrompt"
  >
> & {
  example?: GrammarPoint["example"];
  focus?: GrammarPoint["focus"];
};

type GrammarOverrideMap = Record<string, GrammarPointOverride>;
type GrammarCatalogEntry = GrammarPointOverride & {
  id: string;
  stageOrder?: number;
  lessonOrder?: number;
};
type GrammarCatalogMap = Record<string, GrammarCatalogEntry>;

type GrammarCatalogContextValue = {
  grammarPoints: GrammarPoint[];
  grammarById: Map<string, GrammarPoint>;
  allGrammarPoints: GrammarPoint[];
  allGrammarById: Map<string, GrammarPoint>;
  overrides: GrammarOverrideMap;
  refresh: () => Promise<void>;
};

const GrammarCatalogContext = createContext<GrammarCatalogContextValue | null>(
  null,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function applyOverride(
  point: GrammarPoint,
  override?: GrammarPointOverride,
): GrammarPoint {
  if (!override) return point;

  const stage = override.stage ?? point.stage;
  const stageMeta = GRAMMAR_STAGE_META[stage] ?? GRAMMAR_STAGE_META[point.stage];
  const level = override.level ?? stageMeta.level ?? point.level;

  return {
    ...point,
    ...override,
    stage,
    level,
    stageOrder: override.stageOrder ?? stageMeta.order,
    lessonOrder: override.lessonOrder ?? point.lessonOrder,
    example: override.example ?? point.example,
    focus: override.focus
      ? {
          ...point.focus,
          ...override.focus,
          details: override.focus.details ?? point.focus.details,
        }
      : point.focus,
  };
}

function toOverrideMap(entries: GrammarCatalogMap): GrammarOverrideMap {
  return Object.fromEntries(
    Object.entries(entries).map(([id, entry]) => {
      const { id: _id, ...override } = entry;
      return [id, override];
    }),
  );
}

function parseCatalogEntriesFromCatalogPayload(
  payload: unknown,
): GrammarCatalogMap | null {
  if (!isRecord(payload) || !Array.isArray(payload.lessons)) {
    return null;
  }

  const entries: GrammarCatalogMap = {};

  for (const lesson of payload.lessons) {
    if (!isRecord(lesson) || typeof lesson.id !== "string" || !lesson.id.trim()) {
      continue;
    }

    entries[lesson.id] = lesson as unknown as GrammarCatalogEntry;
  }

  return entries;
}

function parseCatalogEntriesFromOverridePayload(
  payload: unknown,
): GrammarCatalogMap | null {
  if (!isRecord(payload)) {
    return null;
  }

  const entries: GrammarCatalogMap = {};

  for (const [id, override] of Object.entries(payload)) {
    if (!isRecord(override)) {
      continue;
    }

    entries[id] = {
      id,
      ...(override as unknown as GrammarPointOverride),
    };
  }

  return entries;
}

function createCatalogOnlyPoint(
  entry: GrammarCatalogEntry,
  fallbackLessonOrder: number,
): GrammarPoint | null {
  if (
    typeof entry.title !== "string" ||
    typeof entry.level !== "string" ||
    typeof entry.stage !== "string" ||
    typeof entry.explanation !== "string" ||
    typeof entry.pattern !== "string" ||
    !entry.example ||
    !entry.focus
  ) {
    return null;
  }

  const stageMeta = GRAMMAR_STAGE_META[entry.stage];
  if (!stageMeta) {
    return null;
  }

  return {
    id: entry.id,
    title: entry.title,
    level: entry.level,
    stage: entry.stage,
    hiddenFromLearners: entry.hiddenFromLearners === true,
    stageOrder: entry.stageOrder ?? stageMeta.order,
    lessonOrder: entry.lessonOrder ?? fallbackLessonOrder,
    explanation: entry.explanation,
    pattern: entry.pattern,
    lessonBlocks: entry.lessonBlocks,
    aiPrompt: entry.aiPrompt,
    example: entry.example,
    focus: entry.focus,
  };
}

export function GrammarCatalogProvider({ children }: PropsWithChildren) {
  const [catalogEntries, setCatalogEntries] = useState<GrammarCatalogMap>({});

  const refresh = useCallback(async () => {
    try {
      const catalogRes = await fetch(`${API_BASE}/grammar/catalog`);
      if (catalogRes.ok) {
        const parsedCatalog = parseCatalogEntriesFromCatalogPayload(
          await catalogRes.json(),
        );

        if (parsedCatalog) {
          setCatalogEntries(parsedCatalog);
          return;
        }

        console.warn(
          "[GrammarCatalog] received an invalid backend catalog payload, falling back to legacy override merge",
        );
      } else if (catalogRes.status !== 404) {
        console.warn(
          `[GrammarCatalog] backend catalog request failed (${catalogRes.status}), falling back to legacy override merge`,
        );
      }

      const overridesRes = await fetch(`${API_BASE}/grammar/overrides`);
      if (overridesRes.status === 404) {
        setCatalogEntries({});
        return;
      }
      if (!overridesRes.ok) {
        throw new Error(
          `Failed to fetch grammar lesson data (${overridesRes.status})`,
        );
      }

      const parsedOverrides = parseCatalogEntriesFromOverridePayload(
        await overridesRes.json(),
      );
      if (parsedOverrides) {
        setCatalogEntries(parsedOverrides);
        return;
      }

      console.warn(
        "[GrammarCatalog] received an invalid legacy override payload, falling back to bundled grammar",
      );
      setCatalogEntries({});
    } catch (err) {
      console.warn(
        "[GrammarCatalog] using bundled grammar because backend lesson content could not be loaded:",
        err,
      );
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const overrides = useMemo(() => toOverrideMap(catalogEntries), [catalogEntries]);

  const allGrammarPoints = useMemo(() => {
    const baseIndex = new Map(
      bundledGrammarPoints.map((point, index) => [point.id, index]),
    );
    const nextLessonOrderByStage = new Map<GrammarPoint["stage"], number>();
    const mergedPoints = bundledGrammarPoints.map((point) => {
      const merged = applyOverride(point, overrides[point.id]);
      const nextLessonOrder = nextLessonOrderByStage.get(merged.stage) ?? 0;
      nextLessonOrderByStage.set(
        merged.stage,
        Math.max(nextLessonOrder, merged.lessonOrder + 1),
      );
      return merged;
    });
    const grammarById = new Map(
      mergedPoints.map((point) => [point.id, point]),
    );

    for (const entry of Object.values(catalogEntries)) {
      if (grammarById.has(entry.id)) {
        continue;
      }

      const stage = entry.stage;
      if (!stage) {
        continue;
      }

      const fallbackLessonOrder = nextLessonOrderByStage.get(stage) ?? 0;
      const backendPoint = createCatalogOnlyPoint(entry, fallbackLessonOrder);

      if (!backendPoint) {
        continue;
      }

      grammarById.set(backendPoint.id, backendPoint);
      nextLessonOrderByStage.set(stage, backendPoint.lessonOrder + 1);
    }

    return Array.from(grammarById.values())
      .sort((a, b) => {
        if (a.stageOrder !== b.stageOrder) {
          return a.stageOrder - b.stageOrder;
        }

        if (a.lessonOrder !== b.lessonOrder) {
          return a.lessonOrder - b.lessonOrder;
        }

        const aIndex = baseIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bIndex = baseIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }

        return a.title.localeCompare(b.title);
      });
  }, [catalogEntries, overrides]);

  const visibleGrammarPoints = useMemo(
    () => allGrammarPoints.filter((point) => point.hiddenFromLearners !== true),
    [allGrammarPoints],
  );

  const grammarById = useMemo(
    () => new Map(visibleGrammarPoints.map((point) => [point.id, point])),
    [visibleGrammarPoints],
  );

  const allGrammarById = useMemo(
    () => new Map(allGrammarPoints.map((point) => [point.id, point])),
    [allGrammarPoints],
  );

  const value = useMemo(
    () => ({
      grammarPoints: visibleGrammarPoints,
      grammarById,
      allGrammarPoints,
      allGrammarById,
      overrides,
      refresh,
    }),
    [
      allGrammarById,
      allGrammarPoints,
      grammarById,
      overrides,
      refresh,
      visibleGrammarPoints,
    ],
  );

  return (
    <GrammarCatalogContext.Provider value={value}>
      {children}
    </GrammarCatalogContext.Provider>
  );
}

export function useGrammarCatalog() {
  const context = useContext(GrammarCatalogContext);

  if (!context) {
    throw new Error("useGrammarCatalog must be used within GrammarCatalogProvider");
  }

  return context;
}
