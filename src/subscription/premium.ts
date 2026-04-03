import { Platform } from "react-native";
import { GrammarStage } from "../data/grammarStages";

export const PREMIUM_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID?.trim() || "Keystone Access";

export const FREE_GRAMMAR_STAGE: GrammarStage = "A1.1";
export const FREE_GRAMMAR_IDS = [
  "svo",
  "negative-mai",
  "identity-pen",
  "polite-particles",
  "name-chue",
  "question-mai",
] as const;
export const FREE_GRAMMAR_COUNT = FREE_GRAMMAR_IDS.length;
export const FREE_GRAMMAR_LABEL = `first ${FREE_GRAMMAR_COUNT} lessons`;

export function isPremiumGrammarStage(stage?: string | null): boolean {
  return Boolean(stage) && stage !== FREE_GRAMMAR_STAGE;
}

export function isFreeGrammarPointId(id?: string | null): boolean {
  return Boolean(id) && FREE_GRAMMAR_IDS.includes(id as (typeof FREE_GRAMMAR_IDS)[number]);
}

export function isFreeGrammarPoint(
  point?: { id?: string | null } | null,
): boolean {
  return isFreeGrammarPointId(point?.id);
}

export function isPremiumGrammarPoint(
  point?: { id?: string | null; stage?: string | null } | null,
): boolean {
  if (!point) return false;
  if (point.id) return !isFreeGrammarPointId(point.id);
  return isPremiumGrammarStage(point?.stage);
}

export function getRevenueCatApiKeyForCurrentPlatform(): string | null {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_RC_IOS_API_KEY?.trim() || null;
  }

  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY?.trim() || null;
  }

  return null;
}
