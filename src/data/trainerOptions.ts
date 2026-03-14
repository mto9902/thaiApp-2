import { MUTED_APP_ACCENTS } from "../utils/toneAccent";

export type TrainerDifficulty = "easy" | "medium" | "hard";

export type TrainerWord = {
  thai: string;
  english: string;
  romanization?: string;
};

export const DIFFICULTY_META: Record<
  TrainerDifficulty,
  { label: string; color: string }
> = {
  easy: { label: "Easy", color: MUTED_APP_ACCENTS.sage },
  medium: { label: "Medium", color: MUTED_APP_ACCENTS.slate },
  hard: { label: "Hard", color: MUTED_APP_ACCENTS.rose },
};

export const CONSONANT_INFO = [
  { id: 1, title: "Mid Class", color: MUTED_APP_ACCENTS.stone },
  { id: 2, title: "High Class", color: MUTED_APP_ACCENTS.slate },
  { id: 3, title: "Low Class I", color: MUTED_APP_ACCENTS.rose },
  { id: 4, title: "Low Class II", color: MUTED_APP_ACCENTS.sage },
];

export const VOWEL_INFO = [
  { id: 1, title: "Before", description: "เ แ โ", color: MUTED_APP_ACCENTS.stone },
  { id: 2, title: "After", description: "ะ า", color: MUTED_APP_ACCENTS.clay },
  { id: 3, title: "Above", description: "ิ ี ึ", color: MUTED_APP_ACCENTS.rose },
  { id: 4, title: "Below", description: "ุ ู", color: MUTED_APP_ACCENTS.slate },
  { id: 5, title: "Around 1", description: "เ◌ะ แ◌", color: MUTED_APP_ACCENTS.sand },
  { id: 6, title: "Around 2", description: "เ◌อ เ◌าะ", color: MUTED_APP_ACCENTS.sage },
];
