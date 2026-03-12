import { API_BASE } from "../config";
import { sessionId } from "../session/session";

export async function generateSentence(grammar: string) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grammar,
      sessionId,
    }),
  });

  return res.json();
}
