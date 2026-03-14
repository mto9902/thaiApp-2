import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config";

export async function submitVocabAnswer(
  thai: string,
  grade: "again" | "hard" | "good" | "easy",
) {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API_BASE}/vocab/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ thai, grade }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Failed to submit vocab answer");
  }

  return data;
}
