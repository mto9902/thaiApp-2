import { API_BASE } from "@/src/config";
import { getPracticeWordTrackingEnabled } from "@/src/utils/practiceWordPreference";
import { getAuthToken } from "@/src/utils/authStorage";
import { isGuestUser } from "@/src/utils/auth";

import { PracticeBreakdownItem } from "./miniExerciseHelpers";

export async function trackPracticeWords(
  wordsToTrack: PracticeBreakdownItem[],
  trigger: string,
  romanTokensForWords?: string[],
) {
  const enabled = await getPracticeWordTrackingEnabled();
  if (!enabled) return;

  const guest = await isGuestUser();
  if (guest) return;

  const token = await getAuthToken();
  if (!token) return;

  const enrichedWords = wordsToTrack.map((word, index) => ({
    ...word,
    romanization:
      romanTokensForWords?.[index] || word.romanization || word.roman || "",
  }));

  try {
    await fetch(`${API_BASE}/track-words`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        words: enrichedWords,
        trigger,
      }),
    });
  } catch (error) {
    console.error("Failed to track practice words:", error);
  }
}
