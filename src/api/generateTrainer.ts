export async function generateTrainer(
  consonants: string[],
  vowels: string[],
  difficulty: "easy" | "medium" | "hard",
) {
  const response = await fetch("http://192.168.1.121:3000/alphabet-trainer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      consonants,
      vowels,
      difficulty,
    }),
  });

  if (!response.ok) {
    throw new Error("Trainer generation failed");
  }

  const data = await response.json();

  return data;
}
