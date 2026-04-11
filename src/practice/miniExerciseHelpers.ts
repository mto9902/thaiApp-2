import { getBreakdownTones } from "@/src/utils/breakdownTones";

export type PracticeBreakdownItem = {
  thai: string;
  english: string;
  tone?: string;
  tones?: string[];
  displayThaiSegments?: string[];
  grammar?: boolean;
  romanization?: string;
  roman?: string;
};

export type PracticeSentenceData = {
  thai: string;
  romanization: string;
  english: string;
  breakdown: PracticeBreakdownItem[];
};

export type PracticeMatchOption = {
  thai: string;
  romanization: string;
  breakdown: PracticeBreakdownItem[];
  isCorrect: boolean;
};

export type PracticeBuilderWord = {
  id: number;
  breakdownIndex: number;
  thai: string;
  english: string;
  roman: string;
  tones: ReturnType<typeof getBreakdownTones>;
  displayThaiSegments?: string[];
  rotation: number;
};

const MAX_FREE_TILES = 4;

export function getBreakdownRomanizations(
  romanization: string,
  breakdown: { romanization?: string; roman?: string }[],
): string[] {
  const tokens = romanization.split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return breakdown.map((item) => item.romanization || item.roman || "");
  }

  const hasExplicitRomanization = breakdown.some(
    (item) => item.romanization || item.roman,
  );

  if (!hasExplicitRomanization && tokens.length === breakdown.length) {
    return breakdown.map((_, index) => tokens[index] ?? "");
  }

  if (!hasExplicitRomanization) {
    return breakdown.map(() => "");
  }

  return breakdown.map((item) => item.romanization || item.roman || "");
}

export function computePrefill(
  breakdown: PracticeSentenceData["breakdown"],
): (string | null)[] {
  const total = breakdown.length;
  if (total <= MAX_FREE_TILES) return breakdown.map(() => null);

  const numToPrefill = total - MAX_FREE_TILES;
  const eligible = breakdown.map((_, index) => index);
  const shuffled = shuffleArray(eligible);
  const prefillIndices = new Set(shuffled.slice(0, numToPrefill));
  return breakdown.map((word, index) =>
    prefillIndices.has(index) ? word.thai : null,
  );
}

export function buildBuilderWords(
  sentence: PracticeSentenceData,
  prefilled: (string | null)[],
  romanTokens: string[],
): PracticeBuilderWord[] {
  const freeIndices: number[] = [];
  prefilled.forEach((slot, index) => {
    if (slot === null) {
      freeIndices.push(index);
    }
  });

  return freeIndices.map((index, wordIndex) => {
    const word = sentence.breakdown[index];
    return {
      id: wordIndex,
      breakdownIndex: index,
      thai: word.thai,
      english: word.english.toUpperCase(),
      roman: romanTokens[index] ?? "",
      tones: getBreakdownTones(word),
      displayThaiSegments: word.displayThaiSegments,
      rotation: Math.random() * 6 - 3,
    };
  });
}

export function buildMatchOptions(
  correct: PracticeSentenceData,
  distractors: PracticeSentenceData[],
): PracticeMatchOption[] {
  const unique = distractors.filter((item) => item.thai !== correct.thai);
  const picked = unique.slice(0, 3);
  return shuffleArray([
    {
      thai: correct.thai,
      romanization: correct.romanization,
      breakdown: correct.breakdown,
      isCorrect: true,
    },
    ...picked.map((item) => ({
      thai: item.thai,
      romanization: item.romanization,
      breakdown: item.breakdown,
      isCorrect: false,
    })),
  ]);
}

export function shuffleArray<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function shuffleNotSame<T>(
  items: T[],
  compareKey: (item: T) => string,
): T[] {
  if (items.length <= 1) return [...items];

  const original = JSON.stringify(items.map(compareKey));
  let shuffled = shuffleArray(items);

  if (JSON.stringify(shuffled.map(compareKey)) === original) {
    shuffled = shuffleArray(items);
  }

  return shuffled;
}

export function buildSentenceSlots(
  prefilled: (string | null)[],
  builtSentence: PracticeBuilderWord[],
): (string | null)[] {
  const slots: (string | null)[] = [];
  let userIndex = 0;

  for (let index = 0; index < prefilled.length; index += 1) {
    if (prefilled[index] !== null) {
      slots.push(prefilled[index]);
      continue;
    }

    slots.push(builtSentence[userIndex]?.thai ?? null);
    userIndex += 1;
  }

  return slots;
}

export function normalizePracticeSentence(
  input: Partial<PracticeSentenceData> | null | undefined,
): PracticeSentenceData | null {
  if (!input?.thai || !Array.isArray(input.breakdown)) {
    return null;
  }

  return {
    thai: input.thai || "",
    romanization: input.romanization || "",
    english: input.english || "",
    breakdown: input.breakdown.map((item) => ({
      thai: item.thai || "",
      english: item.english || "",
      tone: item.tone,
      tones: item.tones,
      displayThaiSegments: item.displayThaiSegments,
      grammar: item.grammar,
      romanization: item.romanization,
      roman: item.roman,
    })),
  };
}

export function getNextMiniMode(
  currentMode: "wordScraps" | "matchThai",
): "wordScraps" | "matchThai" {
  return currentMode === "wordScraps" ? "matchThai" : "wordScraps";
}
