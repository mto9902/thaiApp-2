import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config";
import { getAuthToken as getStoredAuthToken } from "./authStorage";

const GUEST_PREFIX = "grammar_progress_guest_v1:";

type GrammarProgressApiRow = {
  grammarId: string;
  rounds: number;
  correct: number;
  total: number;
  lastPracticed: string;
};

export interface GrammarProgressData {
  rounds: number; // total rounds completed
  correct: number; // total correct answers
  total: number; // total answers attempted
  lastPracticed: string; // ISO date string
}

function getGuestStorageKey(grammarId: string): string {
  return `${GUEST_PREFIX}${grammarId}`;
}

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function normalizeProgressRow(row: GrammarProgressApiRow): GrammarProgressData {
  return {
    rounds: row.rounds ?? 0,
    correct: row.correct ?? 0,
    total: row.total ?? 0,
    lastPracticed: row.lastPracticed,
  };
}

async function getLocalProgress(
  grammarId: string,
): Promise<GrammarProgressData | null> {
  const raw = await AsyncStorage.getItem(getGuestStorageKey(grammarId));
  return raw ? JSON.parse(raw) : null;
}

async function saveLocalRound(
  grammarId: string,
  wasCorrect: boolean,
): Promise<void> {
  const existing = await getLocalProgress(grammarId);
  const updated: GrammarProgressData = {
    rounds: (existing?.rounds ?? 0) + 1,
    correct: (existing?.correct ?? 0) + (wasCorrect ? 1 : 0),
    total: (existing?.total ?? 0) + 1,
    lastPracticed: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    getGuestStorageKey(grammarId),
    JSON.stringify(updated),
  );
}

async function getAllLocalProgress(): Promise<Record<string, GrammarProgressData>> {
  const allKeys = await AsyncStorage.getAllKeys();
  const keys = allKeys.filter((key) => key.startsWith(GUEST_PREFIX));
  if (keys.length === 0) return {};

  const pairs = await AsyncStorage.multiGet(keys);
  const result: Record<string, GrammarProgressData> = {};
  for (const [key, value] of pairs) {
    if (value) {
      result[key.replace(GUEST_PREFIX, "")] = JSON.parse(value);
    }
  }
  return result;
}

async function getServerProgress(
  token: string,
  grammarId: string,
): Promise<GrammarProgressData | null> {
  const res = await fetch(
    `${API_BASE}/grammar/progress/${encodeURIComponent(grammarId)}`,
    {
      headers: authHeaders(token),
    },
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch grammar progress (${res.status})`);
  }

  return normalizeProgressRow(await res.json());
}

async function getAllServerProgress(
  token: string,
): Promise<Record<string, GrammarProgressData>> {
  const res = await fetch(`${API_BASE}/grammar/progress`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch grammar progress (${res.status})`);
  }

  const rows: GrammarProgressApiRow[] = await res.json();
  return rows.reduce<Record<string, GrammarProgressData>>((acc, row) => {
    acc[row.grammarId] = normalizeProgressRow(row);
    return acc;
  }, {});
}

export function isGrammarPracticed(
  progress: GrammarProgressData | null | undefined,
): boolean {
  return (progress?.rounds ?? 0) > 0;
}

/** Read progress for one grammar point (null if never practiced). */
export async function getProgress(
  grammarId: string,
): Promise<GrammarProgressData | null> {
  const token = await getStoredAuthToken();

  try {
    if (token) {
      return await getServerProgress(token, grammarId);
    }

    return await getLocalProgress(grammarId);
  } catch (err) {
    console.error("[GrammarProgress] getProgress failed:", err);
    return null;
  }
}

/** Record one practice round (fire-and-forget safe). */
export async function saveRound(
  grammarId: string,
  wasCorrect: boolean,
): Promise<void> {
  const token = await getStoredAuthToken();

  try {
    if (token) {
      const res = await fetch(`${API_BASE}/grammar/progress/round`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ grammarId, wasCorrect }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save grammar progress (${res.status})`);
      }
      return;
    }

    await saveLocalRound(grammarId, wasCorrect);
  } catch (err) {
    console.error("[GrammarProgress] saveRound failed:", err);
  }
}

/** Load progress for every grammar point that has been practiced. */
export async function getAllProgress(): Promise<
  Record<string, GrammarProgressData>
> {
  const token = await getStoredAuthToken();

  try {
    if (token) {
      return await getAllServerProgress(token);
    }

    return await getAllLocalProgress();
  } catch (err) {
    console.error("[GrammarProgress] getAllProgress failed:", err);
    return {};
  }
}

/** Clear progress for one grammar point. */
export async function resetProgress(grammarId: string): Promise<void> {
  const token = await getStoredAuthToken();

  try {
    if (token) {
      const res = await fetch(
        `${API_BASE}/grammar/progress/${encodeURIComponent(grammarId)}`,
        {
          method: "DELETE",
          headers: authHeaders(token),
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to reset grammar progress (${res.status})`);
      }
      return;
    }

    await AsyncStorage.removeItem(getGuestStorageKey(grammarId));
  } catch (err) {
    console.error("[GrammarProgress] resetProgress failed:", err);
  }
}

export async function clearAllProgress(): Promise<void> {
  const token = await getStoredAuthToken();

  try {
    if (token) {
      const res = await fetch(`${API_BASE}/grammar/progress`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      if (!res.ok) {
        throw new Error(`Failed to clear grammar progress (${res.status})`);
      }
      return;
    }

    const allKeys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(
      allKeys.filter((key) => key.startsWith(GUEST_PREFIX)),
    );
  } catch (err) {
    console.error("[GrammarProgress] clearAllProgress failed:", err);
  }
}
