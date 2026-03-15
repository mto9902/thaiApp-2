import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAuthToken, getAuthToken } from "./authStorage";

/** Returns true if the user is in guest mode (no JWT token). */
export async function isGuestUser(): Promise<boolean> {
  const token = await getAuthToken();
  if (token) return false;

  const flag = await AsyncStorage.getItem("isGuest");
  return flag === "true";
}

/** Returns true if the user can access the app (either logged in or guest). */
export async function canAccessApp(): Promise<boolean> {
  const token = await getAuthToken();
  const guest = await AsyncStorage.getItem("isGuest");
  return !!token || guest === "true";
}

/** Clears all auth state (token + guest flag). Used on logout. */
export async function clearAuthState(): Promise<void> {
  await clearAuthToken();
  await AsyncStorage.removeItem("isGuest");
}
