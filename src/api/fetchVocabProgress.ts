import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config";

export async function fetchVocabProgress() {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API_BASE}/vocab/progress`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}
