import { generateTrainer } from "../api/generateTrainer";
import { alphabet } from "../data/alphabet";
import { TrainerDifficulty, TrainerWord } from "../data/trainerOptions";
import { vowels } from "../data/vowels";

const TARGET_WORDS = 10;
const MAX_ATTEMPTS = 5;

function getSelectedConsonants(groupIds: number[]) {
  return [
    ...new Set(
      alphabet
        .filter((item) => groupIds.includes(item.group))
        .map((item) => item.letter),
    ),
  ];
}

function getSelectedVowels(groupIds: number[]) {
  return [
    ...new Set(
      vowels
        .filter((item) => groupIds.includes(item.group))
        .map((item) => item.symbol.replace("◌", "")),
    ),
  ];
}

function wordUsesOnlyAllowedConsonants(word: string, allowedConsonants: string[]) {
  const allowedSet = new Set(allowedConsonants);
  const consonantSet = new Set(alphabet.map((item) => item.letter));

  for (const char of word) {
    if (consonantSet.has(char) && !allowedSet.has(char)) {
      return false;
    }
  }

  return true;
}

export async function generateTrainerBatch(params: {
  difficulty: TrainerDifficulty;
  consonantGroups: number[];
  vowelGroups: number[];
}) {
  const consonants = getSelectedConsonants(params.consonantGroups);
  const selectedVowels = getSelectedVowels(params.vowelGroups);

  let collected: TrainerWord[] = [];
  let attempts = 0;

  while (collected.length < TARGET_WORDS && attempts < MAX_ATTEMPTS) {
    attempts += 1;

    const result = await generateTrainer(
      consonants,
      selectedVowels,
      params.difficulty,
    );

    const filtered = (result.words || []).filter((word: TrainerWord) =>
      wordUsesOnlyAllowedConsonants(word.thai, consonants),
    );

    collected = [...collected, ...filtered];
  }

  return {
    words: collected.slice(0, TARGET_WORDS),
    noResults: collected.length === 0,
    consonants,
    selectedVowels,
  };
}
