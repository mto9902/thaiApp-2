import { API_BASE } from "../config";
import { getAuthToken } from "../utils/authStorage";

export async function fetchVocabProgress() {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE}/vocab/progress`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}
