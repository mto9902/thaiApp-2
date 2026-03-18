import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Purchases, {
  CustomerInfo,
  CustomerInfoUpdateListener,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { API_BASE } from "../config";
import { getAuthToken } from "../utils/authStorage";

import {
  getRevenueCatApiKeyForCurrentPlatform,
  PREMIUM_ENTITLEMENT_ID,
} from "./premium";

type JwtPayload = {
  userId?: number;
  email?: string;
};

type SubscriptionContextValue = {
  loading: boolean;
  isSupported: boolean;
  canMakePurchases: boolean;
  isPremium: boolean;
  entitlementId: string;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  offeringsLoading: boolean;
  refresh: () => Promise<void>;
  refreshOfferings: () => Promise<PurchasesOffering | null>;
  purchasePackage: (aPackage: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  openCustomerCenter: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const isNativeMobile = Platform.OS === "ios" || Platform.OS === "android";
let purchasesConfigured = false;
let configuredAppUserId: string | null = null;
let configuredEmail: string | null = null;
let customerInfoListener: CustomerInfoUpdateListener | null = null;

function hasPremiumEntitlement(customerInfo: CustomerInfo | null): boolean {
  return !!customerInfo?.entitlements.active?.[PREMIUM_ENTITLEMENT_ID];
}

async function getStoredUser() {
  const [token, guestFlag] = await Promise.all([
    getAuthToken(),
    AsyncStorage.getItem("isGuest"),
  ]);

  if (!token || guestFlag === "true") {
    return null;
  }

  const decoded = jwtDecode<JwtPayload>(token);
  if (!decoded.userId) return null;

  return {
    appUserId: String(decoded.userId),
    email: decoded.email?.trim()?.toLowerCase() || null,
  };
}

type SubscriptionProviderProps = {
  authRefreshKey?: string;
  children: ReactNode;
};

export function SubscriptionProvider({
  authRefreshKey,
  children,
}: SubscriptionProviderProps) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const apiKey = getRevenueCatApiKeyForCurrentPlatform();
  const canMakePurchases = isNativeMobile && !!apiKey;
  const [loading, setLoading] = useState(canMakePurchases);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [serverHasPremium, setServerHasPremium] = useState(false);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(
    null,
  );
  const [offeringsLoading, setOfferingsLoading] = useState(canMakePurchases);

  const loadServerPremium = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setServerHasPremium(false);
      return false;
    }

    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to load subscription status (${res.status})`);
    }

    const data = await res.json();
    const hasAccess = Boolean(data?.has_keystone_access);
    setServerHasPremium(hasAccess);
    return hasAccess;
  }, []);

  const syncPremiumToServer = useCallback(async (hasAccess: boolean) => {
    const token = await getAuthToken();
    if (!token) {
      setServerHasPremium(false);
      return;
    }

    if (!hasAccess) {
      // The app cannot authoritatively revoke access because premium can
      // come from another provider (for example, web billing). In that case
      // the backend remains the shared source of truth.
      await loadServerPremium();
      return;
    }

    const res = await fetch(`${API_BASE}/me/keystone-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ hasAccess }),
    });

    if (!res.ok) {
      const syncUnavailable = res.status === 404 || res.status === 405;
      if (syncUnavailable) {
        // Keep the local entitlement state usable even if the backend
        // has not deployed the subscription sync endpoint yet.
        setServerHasPremium(hasAccess);
        return;
      }

      const errorText = await res.text().catch(() => "");
      console.warn(
        "Failed to sync subscription status:",
        errorText || `HTTP ${res.status}`,
      );
      setServerHasPremium(hasAccess);
      return;
    }

    setServerHasPremium(hasAccess);
  }, [loadServerPremium]);

  const refresh = useCallback(async () => {
    if (!canMakePurchases || !apiKey) {
      try {
        setLoading(true);
        const storedUser = await getStoredUser();
        if (!storedUser) {
          setCustomerInfo(null);
          setCurrentOffering(null);
          setServerHasPremium(false);
          return;
        }
        await loadServerPremium();
      } catch (err) {
        console.error("Failed to refresh web subscription state:", err);
        setServerHasPremium(false);
        setCustomerInfo(null);
        setCurrentOffering(null);
      } finally {
        setLoading(false);
        setOfferingsLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const storedUser = await getStoredUser();

      if (!purchasesConfigured) {
        await Purchases.setLogLevel(
          __DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR,
        );
        Purchases.configure({
          apiKey,
          appUserID: storedUser?.appUserId,
        });
        purchasesConfigured = true;
        configuredAppUserId = storedUser?.appUserId ?? null;
      } else if (storedUser?.appUserId) {
        if (configuredAppUserId !== storedUser.appUserId) {
          await Purchases.logIn(storedUser.appUserId);
          configuredAppUserId = storedUser.appUserId;
          configuredEmail = null;
        }
      } else if (configuredAppUserId !== null) {
        await Purchases.logOut();
        configuredAppUserId = null;
        configuredEmail = null;
      }

      if (!customerInfoListener) {
        customerInfoListener = (nextCustomerInfo) => {
          setCustomerInfo(nextCustomerInfo);
          void syncPremiumToServer(hasPremiumEntitlement(nextCustomerInfo));
        };
        Purchases.addCustomerInfoUpdateListener(customerInfoListener);
      }

      if (!storedUser) {
        setCustomerInfo(null);
        setCurrentOffering(null);
        setServerHasPremium(false);
        setOfferingsLoading(false);
        return;
      }

      if (storedUser.email && configuredEmail !== storedUser.email) {
        await Purchases.setEmail(storedUser.email);
        configuredEmail = storedUser.email;
      }

      const [nextCustomerInfo, nextOfferings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);
      setCustomerInfo(nextCustomerInfo);
      await syncPremiumToServer(hasPremiumEntitlement(nextCustomerInfo));
      setCurrentOffering(nextOfferings.current);
    } catch (err) {
      console.error("Failed to refresh subscription state:", err);
      setCustomerInfo(null);
      setCurrentOffering(null);
      setServerHasPremium(false);
    } finally {
      setLoading(false);
      setOfferingsLoading(false);
    }
  }, [apiKey, canMakePurchases, loadServerPremium, syncPremiumToServer]);

  useEffect(() => {
    void refresh();
  }, [authRefreshKey, refresh]);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const refreshOnFocus = () => {
      void refresh();
    };

    const refreshOnVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    if (!isNativeMobile) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      const wasBackgrounded =
        previousState === "background" || previousState === "inactive";

      if (wasBackgrounded && nextState === "active") {
        void refresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (customerInfoListener) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
        customerInfoListener = null;
      }
    };
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    if (!canMakePurchases || !purchasesConfigured) return null;

    const nextCustomerInfo = await Purchases.getCustomerInfo();
    setCustomerInfo(nextCustomerInfo);
    await syncPremiumToServer(hasPremiumEntitlement(nextCustomerInfo));
    return nextCustomerInfo;
  }, [canMakePurchases, syncPremiumToServer]);

  const refreshOfferings = useCallback(async () => {
    if (!canMakePurchases || !purchasesConfigured) {
      try {
        setOfferingsLoading(true);
        await loadServerPremium();
      } catch (err) {
        console.error("Failed to refresh web offerings state:", err);
        setServerHasPremium(false);
      } finally {
        setCurrentOffering(null);
        setOfferingsLoading(false);
      }
      return null;
    }

    try {
      setOfferingsLoading(true);
      const offerings = await Purchases.getOfferings();
      setCurrentOffering(offerings.current);
      return offerings.current;
    } catch (err) {
      console.error("Failed to refresh offerings:", err);
      setCurrentOffering(null);
      return null;
    } finally {
      setOfferingsLoading(false);
    }
  }, [canMakePurchases, loadServerPremium]);

  const purchasePackage = useCallback(
    async (aPackage: PurchasesPackage) => {
      if (!canMakePurchases || !purchasesConfigured) return false;

      const purchaseResult = await Purchases.purchasePackage(aPackage);
      setCustomerInfo(purchaseResult.customerInfo);
      await syncPremiumToServer(
        hasPremiumEntitlement(purchaseResult.customerInfo),
      );
      return hasPremiumEntitlement(purchaseResult.customerInfo);
    },
    [canMakePurchases, syncPremiumToServer],
  );

  const restorePurchases = useCallback(async () => {
    if (!canMakePurchases || !purchasesConfigured) return false;

    const nextCustomerInfo = await Purchases.restorePurchases();
    setCustomerInfo(nextCustomerInfo);
    await syncPremiumToServer(hasPremiumEntitlement(nextCustomerInfo));
    return hasPremiumEntitlement(nextCustomerInfo);
  }, [canMakePurchases, syncPremiumToServer]);

  const openCustomerCenter = useCallback(async () => {
    if (!canMakePurchases || !purchasesConfigured) return;
    await RevenueCatUI.presentCustomerCenter();
    await refreshCustomerInfo();
  }, [canMakePurchases, refreshCustomerInfo]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      loading,
      isSupported: isNativeMobile,
      canMakePurchases,
      isPremium: serverHasPremium || hasPremiumEntitlement(customerInfo),
      entitlementId: PREMIUM_ENTITLEMENT_ID,
      customerInfo,
      currentOffering,
      offeringsLoading,
      refresh,
      refreshOfferings,
      purchasePackage,
      restorePurchases,
      openCustomerCenter,
    }),
    [
      canMakePurchases,
      customerInfo,
      currentOffering,
      loading,
      openCustomerCenter,
      offeringsLoading,
      purchasePackage,
      refresh,
      refreshOfferings,
      restorePurchases,
      serverHasPremium,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }

  return context;
}
