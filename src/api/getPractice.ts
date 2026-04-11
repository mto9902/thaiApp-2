import { API_BASE } from "../config";
import { fetchWithTimeout } from "./fetchWithTimeout";

export async function getPractice(grammar?: string) {
  const response = await fetchWithTimeout(
    `${API_BASE}/practice-csv`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grammar,
      }),
    },
    12000,
  );

  if (!response.ok) {
    let details = "";
    try {
      const body = await response.text();
      details = body ? `: ${body}` : "";
    } catch {
      details = "";
    }

    throw new Error(`Practice fetch failed (${response.status})${details}`);
  }

  return response.json();
}
