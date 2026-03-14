import AsyncStorage from "@react-native-async-storage/async-storage";

export type GrammarExerciseMode = "breakdown" | "wordScraps" | "matchThai";

export type GrammarExerciseSettings = Record<GrammarExerciseMode, boolean>;

export const DEFAULT_GRAMMAR_EXERCISE_SETTINGS: GrammarExerciseSettings = {
  breakdown: true,
  wordScraps: true,
  matchThai: true,
};

export const GRAMMAR_EXERCISE_LABELS: Record<GrammarExerciseMode, string> = {
  breakdown: "Study",
  wordScraps: "Build",
  matchThai: "Match",
};

const STORAGE_KEY = "pref_grammar_exercise_settings";

function hasEnabledMode(settings: GrammarExerciseSettings): boolean {
  return Object.values(settings).some(Boolean);
}

export function normalizeGrammarExerciseSettings(
  value?: Partial<GrammarExerciseSettings> | null,
): GrammarExerciseSettings {
  const normalized: GrammarExerciseSettings = {
    breakdown:
      typeof value?.breakdown === "boolean"
        ? value.breakdown
        : DEFAULT_GRAMMAR_EXERCISE_SETTINGS.breakdown,
    wordScraps:
      typeof value?.wordScraps === "boolean"
        ? value.wordScraps
        : DEFAULT_GRAMMAR_EXERCISE_SETTINGS.wordScraps,
    matchThai:
      typeof value?.matchThai === "boolean"
        ? value.matchThai
        : DEFAULT_GRAMMAR_EXERCISE_SETTINGS.matchThai,
  };

  return hasEnabledMode(normalized)
    ? normalized
    : DEFAULT_GRAMMAR_EXERCISE_SETTINGS;
}

export async function getGrammarExerciseSettings(): Promise<GrammarExerciseSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GRAMMAR_EXERCISE_SETTINGS;
    return normalizeGrammarExerciseSettings(JSON.parse(raw));
  } catch (error) {
    console.error("Failed to load grammar exercise settings:", error);
    return DEFAULT_GRAMMAR_EXERCISE_SETTINGS;
  }
}

export async function setGrammarExerciseSettings(
  next: Partial<GrammarExerciseSettings>,
): Promise<GrammarExerciseSettings> {
  const normalized = normalizeGrammarExerciseSettings(next);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
