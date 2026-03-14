import AsyncStorage from "@react-native-async-storage/async-storage";

/** Returns true if the user is in guest mode (no JWT token). */
export async function isGuestUser(): Promise<boolean> {
  const token = await AsyncStorage.getItem("token");
  if (token) return false;

  const flag = await AsyncStorage.getItem("isGuest");
  return flag === "true";
}

/** Returns true if the user can access the app (either logged in or guest). */
export async function canAccessApp(): Promise<boolean> {
  const token = await AsyncStorage.getItem("token");
  const guest = await AsyncStorage.getItem("isGuest");
  return !!token || guest === "true";
}

/** Clears all auth state (token + guest flag). Used on logout. */
export async function clearAuthState(): Promise<void> {
  await AsyncStorage.multiRemove(["token", "isGuest"]);
}
