import AsyncStorage from "@react-native-async-storage/async-storage";

export async function fetchVocabProgress() {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch("http://YOUR-IP:3000/vocab/progress", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}
