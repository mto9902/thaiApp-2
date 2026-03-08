import AsyncStorage from "@react-native-async-storage/async-storage";

export async function submitVocabAnswer(thai: string, correct: boolean) {
  const token = await AsyncStorage.getItem("token");

  await fetch("http://192.168.1.121:3000/vocab/answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      thai,
      correct,
    }),
  });
}
