import { vocabulary } from "../data/words";

function randomWord() {
  return vocabulary[Math.floor(Math.random() * vocabulary.length)];
}

export function getRandomWords(count = 3) {
  const words: string[] = [];

  for (let i = 0; i < count; i++) {
    words.push(randomWord());
  }

  return words;
}
