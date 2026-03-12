import { API_BASE } from "../config";

export async function generateTrainer(
  consonants: string[],
  vowels: string[],
  difficulty: "easy" | "medium" | "hard",
) {
  const response = await fetch(`${API_BASE}/alphabet-trainer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      consonants,
      vowels,
      difficulty,
    }),
  });

  if (!response.ok) {
    throw new Error("Trainer generation failed");
  }

  const data = await response.json();

  return data;
}
