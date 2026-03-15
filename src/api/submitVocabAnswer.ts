import { API_BASE } from "../config";
import { getAuthToken } from "../utils/authStorage";

export async function submitVocabAnswer(
  thai: string,
  grade: "again" | "hard" | "good" | "easy",
) {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE}/vocab/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ thai, grade }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Failed to submit vocab answer");
  }

  return data;
}
