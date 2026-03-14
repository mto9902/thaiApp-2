import { Sketch } from "@/constants/theme";

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
  easy: { label: "Easy", color: Sketch.green },
  medium: { label: "Medium", color: Sketch.yellow },
  hard: { label: "Hard", color: Sketch.red },
};

export const CONSONANT_INFO = [
  { id: 1, title: "Mid Class", color: Sketch.yellow },
  { id: 2, title: "High Class", color: Sketch.blue },
  { id: 3, title: "Low Class I", color: Sketch.red },
  { id: 4, title: "Low Class II", color: Sketch.green },
];

export const VOWEL_INFO = [
  { id: 1, title: "Before", description: "เ แ โ", color: Sketch.yellow },
  { id: 2, title: "After", description: "ะ า", color: Sketch.orange },
  { id: 3, title: "Above", description: "ิ ี ึ", color: Sketch.red },
  { id: 4, title: "Below", description: "ุ ู", color: Sketch.blue },
  { id: 5, title: "Around 1", description: "เ◌ะ แ◌", color: Sketch.purple },
  { id: 6, title: "Around 2", description: "เ◌อ เ◌าะ", color: Sketch.green },
];
