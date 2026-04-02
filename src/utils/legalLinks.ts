import { Alert, Linking, Platform } from "react-native";

export const TERMS_URL = "https://keystonelanguages.com/terms/";
export const PRIVACY_URL = "https://keystonelanguages.com/privacy/";
export const SUPPORT_EMAIL = "hello@keystonelanguages.com";

async function openExternalUrl(url: string, label: string) {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error(`Unsupported URL: ${url}`);
    }

    await Linking.openURL(url);
  } catch (error) {
    console.error(`Failed to open ${label}:`, error);
    Alert.alert("Link unavailable", `Couldn't open the ${label.toLowerCase()} right now.`);
  }
}

export function openTermsOfService() {
  return openExternalUrl(TERMS_URL, "Terms of Service");
}

export function openPrivacyPolicy() {
  return openExternalUrl(PRIVACY_URL, "Privacy Policy");
}

export function openSupportEmail() {
  return openExternalUrl(`mailto:${SUPPORT_EMAIL}`, "Support Email");
}
