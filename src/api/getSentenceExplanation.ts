import { API_BASE } from "@/src/config";
import { getAuthToken } from "@/src/utils/authStorage";

import { fetchWithTimeout } from "./fetchWithTimeout";

export type SentenceExplanationFocus = {
  particle?: string | null;
  meaning?: string | null;
  romanization?: string | null;
} | null;

export type SentenceExplanationBreakdownItem = {
  thai?: string | null;
  english?: string | null;
  romanization?: string | null;
  roman?: string | null;
  tone?: string | null;
  tones?: string[] | null;
  grammar?: boolean | null;
  displayThaiSegments?: string[] | null;
};

export type SentenceExplanationSentence = {
  thai?: string | null;
  romanization?: string | null;
  english?: string | null;
  breakdown?: SentenceExplanationBreakdownItem[] | null;
};

export type SentenceExplanationGrammar = {
  id?: string | null;
  title?: string | null;
  level?: string | null;
  stage?: string | null;
  pattern?: string | null;
  explanation?: string | null;
  focus?: SentenceExplanationFocus;
};

export type SentenceExplanationRequest = {
  grammar: SentenceExplanationGrammar;
  sentence: SentenceExplanationSentence;
};

function safePart(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export async function getSentenceExplanation(
  request: SentenceExplanationRequest,
): Promise<string> {
  if (!safePart(request.grammar.id) && !safePart(request.grammar.title)) {
    throw new Error("No lesson is ready to explain yet.");
  }

  if (!safePart(request.sentence.thai)) {
    throw new Error("Reveal an answer first, then ask for an explanation.");
  }

  const token = await getAuthToken();

  const res = await fetchWithTimeout(
    `${API_BASE}/grammar/explain-sentence`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    },
    20000,
  );

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Failed to generate explanation (${res.status}).`);
  }

  if (!data?.explanation || typeof data.explanation !== "string") {
    throw new Error("The explanation came back empty. Please try again.");
  }

  return data.explanation;
}
