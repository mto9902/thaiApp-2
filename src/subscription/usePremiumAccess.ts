import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { isGuestUser } from "../utils/auth";
import { useSubscription } from "./SubscriptionProvider";

export function usePremiumAccess() {
  const router = useRouter();
  const subscription = useSubscription();
  const [busy, setBusy] = useState(false);

  const openPremiumScreen = useCallback(
    async (
      label = "Keystone Access content",
      redirectTo?: string | null,
    ) => {
      const guest = await isGuestUser();
      if (guest) {
        Alert.alert(
          "Log in to unlock Keystone Access",
          `Create or log in to a Keystone account to unlock ${label}.`,
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Log in",
              onPress: () => router.push("/login"),
            },
          ],
        );
        return false;
      }

      const params = new URLSearchParams();
      if (label) params.set("label", label);
      if (redirectTo) params.set("redirectTo", redirectTo);
      const route = params.size > 0 ? `/premium?${params.toString()}` : "/premium";

      router.push(route as any);

      return true;
    },
    [router],
  );

  const ensurePremiumAccess = useCallback(
    async (label = "Keystone Access content", redirectTo?: string | null) => {
      if (subscription.isPremium) return true;
      return openPremiumScreen(label, redirectTo);
    },
    [openPremiumScreen, subscription.isPremium],
  );

  const openSubscriptionManager = useCallback(async (redirectTo?: string | null) => {
    const guest = await isGuestUser();
      if (guest) {
        Alert.alert(
        "Log in to manage Keystone Access",
        "Use your Keystone account to subscribe or restore purchases.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Log in",
            onPress: () => router.push("/login"),
          },
        ],
      );
      return false;
    }

    try {
      setBusy(true);
      if (subscription.isPremium) {
        if (!subscription.isSupported) {
          Alert.alert(
            "Available on mobile",
            "Keystone Access management is available in the iOS and Android app for now.",
          );
          return false;
        }

        if (!subscription.canMakePurchases) {
          Alert.alert(
            "Subscriptions aren't configured yet",
            "Add your RevenueCat mobile API key to enable Keystone Access purchases.",
          );
          return false;
        }

        await subscription.openCustomerCenter();
        return true;
      }

      return await openPremiumScreen("Keystone Access", redirectTo);
    } finally {
      setBusy(false);
    }
  }, [openPremiumScreen, router, subscription]);

  const restorePremiumAccess = useCallback(async () => {
    const guest = await isGuestUser();
    if (guest) {
      Alert.alert(
        "Log in to restore",
        "Use the account you want to restore purchases to.",
      );
      return false;
    }

    if (!subscription.isSupported) {
      Alert.alert(
        "Available on mobile",
        "Purchase restore is available in the iOS and Android app for now.",
      );
      return false;
    }

      if (!subscription.canMakePurchases) {
        Alert.alert(
          "Subscriptions aren't configured yet",
          "Add your RevenueCat mobile API key to enable Keystone Access purchases.",
        );
        return false;
      }

    try {
      setBusy(true);
      const restored = await subscription.restorePurchases();
      if (!restored) {
        Alert.alert(
          "No subscription found",
          "We couldn't find an active Keystone Access subscription to restore.",
        );
      }
      return restored;
    } finally {
      setBusy(false);
    }
  }, [subscription]);

  return {
    ...subscription,
    busy,
    openPremiumScreen,
    ensurePremiumAccess,
    openSubscriptionManager,
    restorePremiumAccess,
  };
}
