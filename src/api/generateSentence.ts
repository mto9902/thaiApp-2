import { sessionId } from "../session/session";

export async function generateSentence(grammar: string) {
  const res = await fetch("http://192.168.1.121:3000/generate", {
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
