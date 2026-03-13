import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config";

const PREFIX = "grammar_progress_";

export interface GrammarProgressData {
  rounds: number; // total rounds completed
  correct: number; // total correct answers
  total: number; // total answers attempted
  lastPracticed: string; // ISO date string
}

/** Read progress for one grammar point (null if never practiced). */
export async function getProgress(
  grammarId: string,
): Promise<GrammarProgressData | null> {
  const raw = await AsyncStorage.getItem(PREFIX + grammarId);
  return raw ? JSON.parse(raw) : null;
}

/** Record one practice round (fire-and-forget safe). */
export async function saveRound(
  grammarId: string,
  wasCorrect: boolean,
): Promise<void> {
  const existing = await getProgress(grammarId);
  const updated: GrammarProgressData = {
    rounds: (existing?.rounds ?? 0) + 1,
    correct: (existing?.correct ?? 0) + (wasCorrect ? 1 : 0),
    total: (existing?.total ?? 0) + 1,
    lastPracticed: new Date().toISOString(),
  };
  await AsyncStorage.setItem(PREFIX + grammarId, JSON.stringify(updated));

  // Log grammar activity to server for heatmap (fire-and-forget)
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE}/activity/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source: "grammar", count: 1 }),
      }).catch(() => {}); // silent fail
    }
  } catch {}
}

/** Load progress for every grammar point that has been practiced. */
export async function getAllProgress(): Promise<
  Record<string, GrammarProgressData>
> {
  const allKeys = await AsyncStorage.getAllKeys();
  const keys = allKeys.filter((k) => k.startsWith(PREFIX));
  if (keys.length === 0) return {};

  const pairs = await AsyncStorage.multiGet(keys);
  const result: Record<string, GrammarProgressData> = {};
  for (const [key, value] of pairs) {
    if (value) {
      result[key.replace(PREFIX, "")] = JSON.parse(value);
    }
  }
  return result;
}

/** Clear progress for one grammar point. */
export async function resetProgress(grammarId: string): Promise<void> {
  await AsyncStorage.removeItem(PREFIX + grammarId);
}
