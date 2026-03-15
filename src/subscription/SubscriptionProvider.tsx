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
  useState,
} from "react";
import { Platform } from "react-native";
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
  const apiKey = getRevenueCatApiKeyForCurrentPlatform();
  const canMakePurchases = isNativeMobile && !!apiKey;
  const [loading, setLoading] = useState(canMakePurchases);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(
    null,
  );
  const [offeringsLoading, setOfferingsLoading] = useState(canMakePurchases);

  const refresh = useCallback(async () => {
    if (!canMakePurchases || !apiKey) {
      setCustomerInfo(null);
      setLoading(false);
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
        }
      } else if (configuredAppUserId !== null) {
        await Purchases.logOut();
        configuredAppUserId = null;
      }

      if (!customerInfoListener) {
        customerInfoListener = (nextCustomerInfo) => {
          setCustomerInfo(nextCustomerInfo);
        };
        Purchases.addCustomerInfoUpdateListener(customerInfoListener);
      }

      if (!storedUser) {
        setCustomerInfo(null);
        setCurrentOffering(null);
        setOfferingsLoading(false);
        return;
      }

      if (storedUser.email) {
        await Purchases.setEmail(storedUser.email);
      }

      const [nextCustomerInfo, nextOfferings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);
      setCustomerInfo(nextCustomerInfo);
      setCurrentOffering(nextOfferings.current);
    } catch (err) {
      console.error("Failed to refresh subscription state:", err);
      setCustomerInfo(null);
      setCurrentOffering(null);
    } finally {
      setLoading(false);
      setOfferingsLoading(false);
    }
  }, [apiKey, canMakePurchases]);

  useEffect(() => {
    void refresh();
  }, [authRefreshKey, refresh]);

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
    return nextCustomerInfo;
  }, [canMakePurchases]);

  const refreshOfferings = useCallback(async () => {
    if (!canMakePurchases || !purchasesConfigured) {
      setCurrentOffering(null);
      setOfferingsLoading(false);
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
  }, [canMakePurchases]);

  const purchasePackage = useCallback(
    async (aPackage: PurchasesPackage) => {
      if (!canMakePurchases || !purchasesConfigured) return false;

      const purchaseResult = await Purchases.purchasePackage(aPackage);
      setCustomerInfo(purchaseResult.customerInfo);
      return hasPremiumEntitlement(purchaseResult.customerInfo);
    },
    [canMakePurchases],
  );

  const restorePurchases = useCallback(async () => {
    if (!canMakePurchases || !purchasesConfigured) return false;

    const nextCustomerInfo = await Purchases.restorePurchases();
    setCustomerInfo(nextCustomerInfo);
    return hasPremiumEntitlement(nextCustomerInfo);
  }, [canMakePurchases]);

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
      isPremium: hasPremiumEntitlement(customerInfo),
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
