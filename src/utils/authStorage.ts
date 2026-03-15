import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "token";
const canUseSecureStore = Platform.OS === "ios" || Platform.OS === "android";

async function readLegacyToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getAuthToken(): Promise<string | null> {
  if (!canUseSecureStore) {
    return readLegacyToken();
  }

  try {
    const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (secureToken) {
      return secureToken;
    }

    const legacyToken = await readLegacyToken();
    if (!legacyToken) {
      return null;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
    await AsyncStorage.removeItem(TOKEN_KEY);
    return legacyToken;
  } catch (error) {
    console.error("Failed to read secure auth token:", error);
    return readLegacyToken();
  }
}

export async function setAuthToken(token: string): Promise<void> {
  if (!canUseSecureStore) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }

  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to write secure auth token:", error);
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

export async function clearAuthToken(): Promise<void> {
  if (!canUseSecureStore) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      AsyncStorage.removeItem(TOKEN_KEY),
    ]);
  } catch (error) {
    console.error("Failed to clear secure auth token:", error);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}
