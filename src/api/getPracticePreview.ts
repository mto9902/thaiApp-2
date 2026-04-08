import { API_BASE } from "../config";

export type PracticePreview = {
  thai: string;
  romanization: string;
  english: string;
  breakdown: {
    thai: string;
    english: string;
    tone?: string;
    tones?: string[];
    displayThaiSegments?: string[];
    grammar?: boolean;
    romanization?: string;
    roman?: string;
  }[];
};

export async function getPracticePreview(grammar?: string) {
  const response = await fetch(`${API_BASE}/practice-csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grammar,
      preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error("Practice preview fetch failed");
  }

  return (await response.json()) as PracticePreview;
}
