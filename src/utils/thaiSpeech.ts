import { Platform } from "react-native";

export function normalizeThaiTtsText(text: string) {
  const normalized = text.trim();
  if (!normalized) return normalized;

  if (Platform.OS === "android") {
    return normalized;
  }

  return normalized;
}
