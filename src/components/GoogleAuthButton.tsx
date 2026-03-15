import { Sketch } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { API_BASE } from "../config";

WebBrowser.maybeCompleteAuthSession();

const googleClientConfig = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

function getCurrentPlatformClientId() {
  if (Platform.OS === "android") {
    return (
      googleClientConfig.androidClientId ??
      googleClientConfig.clientId ??
      null
    );
  }

  if (Platform.OS === "ios") {
    return googleClientConfig.iosClientId ?? googleClientConfig.clientId ?? null;
  }

  return googleClientConfig.webClientId ?? googleClientConfig.clientId ?? null;
}

function GoogleAuthButtonReady() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: googleClientConfig.clientId,
      androidClientId: googleClientConfig.androidClientId,
      iosClientId: googleClientConfig.iosClientId,
      webClientId: googleClientConfig.webClientId,
      selectAccount: true,
    },
    {
      scheme: "thaiapp",
      path: "oauthredirect",
      preferLocalhost: true,
    },
  );

  useEffect(() => {
    if (response?.type === "cancel" || response?.type === "dismiss") {
      setIsSubmitting(false);
      return;
    }

    if (response?.type === "error") {
      setIsSubmitting(false);
      Alert.alert("Google sign-in failed", "Please try again.");
      return;
    }

    const idToken =
      response?.params?.id_token ?? response?.authentication?.idToken ?? "";

    if (response?.type !== "success") {
      return;
    }

    if (!idToken) {
      setIsSubmitting(false);
      Alert.alert(
        "Google sign-in failed",
        "Google did not return a sign-in token. Please try again.",
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const authResponse = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        const data = await authResponse.json();

        if (!authResponse.ok) {
          throw new Error(data.error || "Google sign-in failed");
        }

        await AsyncStorage.multiRemove(["isGuest"]);
        await AsyncStorage.setItem("token", data.token);

        if (!cancelled) {
          router.replace("/(tabs)");
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Google sign-in failed";
          Alert.alert("Google sign-in failed", message);
        }
      } finally {
        if (!cancelled) {
          setIsSubmitting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [response, router]);

  async function handlePress() {
    if (!request || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await promptAsync();

      if (
        result.type === "cancel" ||
        result.type === "dismiss" ||
        result.type === "locked"
      ) {
        setIsSubmitting(false);
      }

      if (result.type === "error") {
        setIsSubmitting(false);
        Alert.alert("Google sign-in failed", "Please try again.");
      }
    } catch {
      setIsSubmitting(false);
      Alert.alert("Google sign-in failed", "Please try again.");
    }
  }

  return (
    <TouchableOpacity
      style={[styles.button, isSubmitting && styles.buttonDisabled]}
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={!request || isSubmitting}
    >
      <Text style={styles.buttonText}>
        {isSubmitting ? "Connecting to Google..." : "Continue with Google"}
      </Text>
    </TouchableOpacity>
  );
}

export default function GoogleAuthButton() {
  const hasClientId = !!getCurrentPlatformClientId();
  const isExpoGoNative =
    Platform.OS !== "web" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGoNative) {
    return (
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert(
            "Google sign-in needs a development build",
            "Expo Go cannot be used to test OAuth sign-in flows like Google on native. Use web for now, or run a development build and test again.",
          )
        }
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    );
  }

  if (!hasClientId) {
    return (
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert(
            "Google sign-in isn't configured yet",
            "Add your Google client IDs to the Expo environment first.",
          )
        }
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    );
  }

  return <GoogleAuthButtonReady />;
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: 10,
    backgroundColor: Sketch.paper,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: "500",
    color: Sketch.ink,
    fontSize: 15,
  },
});
