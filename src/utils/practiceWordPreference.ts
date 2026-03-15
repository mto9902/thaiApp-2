import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

import { API_BASE } from "../config";
import { getAuthToken } from "./authStorage";

const GUEST_KEY = "pref_track_practice_vocab_guest";
const USER_KEY_PREFIX = "pref_track_practice_vocab_user_";
const DEFAULT_TRACK_PRACTICE_VOCAB = true;

type TokenPayload = {
  userId?: number | string;
};

function getPreferenceKey(token: string | null) {
  if (!token) return GUEST_KEY;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (decoded.userId !== undefined && decoded.userId !== null) {
      return `${USER_KEY_PREFIX}${decoded.userId}`;
    }
  } catch {
    // Fall back to the guest key if the token cannot be decoded.
  }

  return GUEST_KEY;
}

async function readCachedPreference(token: string | null) {
  const stored = await AsyncStorage.getItem(getPreferenceKey(token));
  if (stored === null) return null;
  return stored === "true";
}

async function writeCachedPreference(token: string | null, enabled: boolean) {
  await AsyncStorage.setItem(getPreferenceKey(token), String(enabled));
}

export async function getPracticeWordTrackingEnabled() {
  const token = await getAuthToken();
  const cached = await readCachedPreference(token);

  if (!token) {
    return cached ?? DEFAULT_TRACK_PRACTICE_VOCAB;
  }

  try {
    const res = await fetch(`${API_BASE}/user/preferences`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user preferences");
    }

    const data = await res.json();
    const enabled = data?.trackPracticeVocab !== false;
    await writeCachedPreference(token, enabled);
    return enabled;
  } catch (err) {
    console.error("Failed to load practice word preference:", err);
    return cached ?? DEFAULT_TRACK_PRACTICE_VOCAB;
  }
}

export async function setPracticeWordTrackingEnabled(enabled: boolean) {
  const token = await getAuthToken();
  await writeCachedPreference(token, enabled);

  if (!token) {
    return enabled;
  }

  const res = await fetch(`${API_BASE}/user/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ trackPracticeVocab: enabled }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "Failed to save user preferences");
  }

  const serverValue = data?.trackPracticeVocab !== false;
  await writeCachedPreference(token, serverValue);
  return serverValue;
}
