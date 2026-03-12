import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config";

export async function submitVocabAnswer(
  thai: string,
  correct: boolean,
  responseMs?: number,
) {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API_BASE}/vocab/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ thai, correct, responseMs }),
  });

  return res.json();
}
