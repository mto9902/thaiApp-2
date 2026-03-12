import { API_BASE } from "../config";

export async function generateTransform(grammar: string) {
  const response = await fetch(`${API_BASE}/transform`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grammar,
    }),
  });

  if (!response.ok) {
    throw new Error("Transform generation failed");
  }

  return response.json();
}
