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

type GrammarCatalogContextValue = {
  grammarPoints: GrammarPoint[];
  grammarById: Map<string, GrammarPoint>;
  overrides: GrammarOverrideMap;
  refresh: () => Promise<void>;
};

const GrammarCatalogContext = createContext<GrammarCatalogContextValue | null>(
  null,
);

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
    stageOrder: stageMeta.order,
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

export function GrammarCatalogProvider({ children }: PropsWithChildren) {
  const [overrides, setOverrides] = useState<GrammarOverrideMap>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/grammar/overrides`);
      if (res.status === 404) {
        setOverrides({});
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch grammar overrides (${res.status})`);
      }

      const data = await res.json();
      if (data && typeof data === "object") {
        setOverrides(data as GrammarOverrideMap);
      }
    } catch (err) {
      console.warn("[GrammarCatalog] using bundled grammar because overrides could not be loaded:", err);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const grammarPoints = useMemo(() => {
    const baseIndex = new Map(
      bundledGrammarPoints.map((point, index) => [point.id, index]),
    );

    return bundledGrammarPoints
      .map((point) => applyOverride(point, overrides[point.id]))
      .sort((a, b) => {
        if (a.stageOrder !== b.stageOrder) {
          return a.stageOrder - b.stageOrder;
        }

        return (baseIndex.get(a.id) ?? 0) - (baseIndex.get(b.id) ?? 0);
      });
  }, [overrides]);

  const grammarById = useMemo(
    () => new Map(grammarPoints.map((point) => [point.id, point])),
    [grammarPoints],
  );

  const value = useMemo(
    () => ({
      grammarPoints,
      grammarById,
      overrides,
      refresh,
    }),
    [grammarById, grammarPoints, overrides, refresh],
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
