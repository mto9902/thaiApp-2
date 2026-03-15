import { Platform } from "react-native";
import { GrammarStage } from "../data/grammarStages";

export const PREMIUM_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID?.trim() || "Keystone Access";

export const FREE_GRAMMAR_STAGE: GrammarStage = "A1.1";

export function isPremiumGrammarStage(stage?: string | null): boolean {
  return Boolean(stage) && stage !== FREE_GRAMMAR_STAGE;
}

export function isPremiumGrammarPoint(
  point?: { stage?: string | null } | null,
): boolean {
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
