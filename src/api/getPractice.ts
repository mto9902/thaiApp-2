import { API_BASE } from "../config";

export async function getPractice(grammar?: string) {
  const response = await fetch(`${API_BASE}/practice-csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grammar,
    }),
  });

  if (!response.ok) {
    throw new Error("Practice fetch failed");
  }

  return response.json();
}
