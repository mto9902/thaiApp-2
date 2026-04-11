import { API_BASE } from "../config";
import { fetchWithTimeout } from "./fetchWithTimeout";

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

const previewCache = new Map<string, PracticePreview>();
const inflightPreviewRequests = new Map<string, Promise<PracticePreview>>();

function getPreviewCacheKey(grammar?: string) {
  return typeof grammar === "string" && grammar.trim().length > 0
    ? grammar.trim()
    : "__default__";
}

export async function getPracticePreview(grammar?: string) {
  const cacheKey = getPreviewCacheKey(grammar);
  const cached = previewCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const inflight = inflightPreviewRequests.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const response = await fetchWithTimeout(
      `${API_BASE}/practice-csv`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grammar,
          preview: true,
        }),
      },
      8000,
    );

    if (!response.ok) {
      let details = "";
      try {
        const body = await response.text();
        details = body ? `: ${body}` : "";
      } catch {
        details = "";
      }

      throw new Error(
        `Practice preview fetch failed (${response.status})${details}`,
      );
    }

    const preview = (await response.json()) as PracticePreview;
    previewCache.set(cacheKey, preview);
    return preview;
  })();

  inflightPreviewRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inflightPreviewRequests.delete(cacheKey);
  }
}
