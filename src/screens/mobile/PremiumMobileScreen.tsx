import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  consumeRecentPaddleCheckout,
  isWebCheckoutPlan,
  WEB_CHECKOUT_PLANS,
  type WebCheckoutPlan,
  type WebPlanCard,
} from "@/src/subscription/paddleWeb";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import {
  BRAND,
  CARD_SHADOW,
  SettledPressable,
  SurfaceButton,
  SURFACE_PRESSED,
  SURFACE_SHADOW,
} from "@/src/screens/mobile/dashboardSurface";
import { API_BASE } from "@/src/config";

type RevenueCatPackage = {
  identifier: string;
  packageType?: string;
  product: {
    title?: string;
    price?: number;
    priceString?: string;
    pricePerMonthString?: string | null;
    subscriptionPeriod?: string | null;
    introPrice?: { priceString?: string | null } | null;
  };
};

function getCurrentRoute() {
  if (typeof window === "undefined") return "/premium";
  return `${window.location.pathname}${window.location.search}`;
}

function parsePriceLabelAmount(priceLabel: string) {
  const numeric = Number(priceLabel.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function formatMonthlyEquivalent(amount: number) {
  const rounded =
    Math.abs(amount - Math.round(amount)) < 0.05
      ? String(Math.round(amount))
      : amount.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");

  return `$${rounded}/month billed yearly`;
}

function getPackageKind(aPackage: RevenueCatPackage) {
  return String(aPackage.packageType || "").toLowerCase();
}

function getPackageHeadline(aPackage: RevenueCatPackage) {
  const packageKind = getPackageKind(aPackage);
  if (packageKind.includes("month")) return "Monthly";
  if (packageKind.includes("annual") || packageKind.includes("year")) return "Yearly";
  if (packageKind.includes("week")) return "Weekly";
  if (packageKind.includes("life")) return "Lifetime";
  return aPackage.product.title || "Keystone Access";
}

function getPackageSupportText(aPackage: RevenueCatPackage) {
  const introPrice = aPackage.product.introPrice?.priceString;
  if (introPrice) return `${introPrice} intro available`;
  if (aPackage.product.pricePerMonthString && !getPackageKind(aPackage).includes("month")) {
    return `${aPackage.product.pricePerMonthString}/month equivalent`;
  }
  if (aPackage.product.subscriptionPeriod === "P1Y") return "Renews yearly";
  if (aPackage.product.subscriptionPeriod === "P1M") return "Renews monthly";
  if (aPackage.product.subscriptionPeriod === "P1W") return "Renews weekly";
  return "Auto-renewing subscription";
}

function getPackageOrder(aPackage: RevenueCatPackage) {
  const kind = getPackageKind(aPackage);
  if (kind.includes("month")) return 0;
  if (kind.includes("annual") || kind.includes("year")) return 1;
  if (kind.includes("week")) return 2;
  if (kind.includes("life")) return 3;
  return 4;
}

function getWebPlanSupport(plan: WebPlanCard) {
  if (plan.id !== "yearly") return plan.supportText;
  const yearlyAmount = parsePriceLabelAmount(plan.priceLabel);
  if (yearlyAmount == null) return plan.supportText;
  return formatMonthlyEquivalent(yearlyAmount / 12);
}

function getWebPlanPrice(plan: WebPlanCard) {
  return `${plan.priceLabel}${plan.cadenceLabel.replace(/\s+/g, "")}`;
}

export default function PremiumMobileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    label?: string;
    redirectTo?: string;
    plan?: string;
    checkout?: string;
  }>();
  const promptLabel = Array.isArray(params.label) ? params.label[0] : params.label;
  const redirectTo = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;
  const checkoutParam = Array.isArray(params.checkout)
    ? params.checkout[0]
    : params.checkout;
  const requestedPlanParam = Array.isArray(params.plan) ? params.plan[0] : params.plan;
  const requestedPlan = isWebCheckoutPlan(requestedPlanParam)
    ? requestedPlanParam
    : "monthly";
  const [recentCheckoutCompletion] = useState(() => consumeRecentPaddleCheckout());
  const completedCheckout =
    checkoutParam === "success" || Boolean(recentCheckoutCompletion);

  const {
    billingProvider,
    busy,
    canMakePurchases,
    currentOffering,
    isPremium,
    offeringsLoading,
    openCustomerCenter,
    purchasePackage,
    refresh,
    refreshOfferings,
    restorePremiumAccess,
    startWebCheckout,
    webCheckoutReady,
  } = usePremiumAccess();

  const [checkingGuest, setCheckingGuest] = useState(true);
  const [selectedNativePackageId, setSelectedNativePackageId] = useState<string | null>(null);
  const [selectedWebPlan, setSelectedWebPlan] = useState<WebCheckoutPlan>(requestedPlan);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [syncingCheckout, setSyncingCheckout] = useState(completedCheckout);

  useEffect(() => {
    let active = true;

    void (async () => {
      const guest = await isGuestUser();
      if (!active) return;

      if (guest) {
        const route = Platform.OS === "web" ? getCurrentRoute() : "/premium";
        router.replace(`/login?redirectTo=${encodeURIComponent(route)}` as any);
        return;
      }

      setCheckingGuest(false);
    })();

    return () => {
      active = false;
    };
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      if (Platform.OS !== "web") {
        void refreshOfferings();
      }
    }, [refresh, refreshOfferings]),
  );

  const nativePackages = useMemo(() => {
    const packages = (currentOffering?.availablePackages ?? []) as RevenueCatPackage[];
    return [...packages].sort((a, b) => {
      const orderDelta = getPackageOrder(a) - getPackageOrder(b);
      if (orderDelta !== 0) return orderDelta;
      return (a.product.price ?? 0) - (b.product.price ?? 0);
    });
  }, [currentOffering]);

  useEffect(() => {
    if (nativePackages.length === 0) {
      setSelectedNativePackageId(null);
      return;
    }

    setSelectedNativePackageId((current) => {
      if (current && nativePackages.some((item) => item.identifier === current)) {
        return current;
      }
      return nativePackages[0]?.identifier ?? null;
    });
  }, [nativePackages]);

  const selectedNativePackage =
    nativePackages.find((item) => item.identifier === selectedNativePackageId) ?? null;

  const webPlans = useMemo(() => {
    const byId = new Map(WEB_CHECKOUT_PLANS.map((plan) => [plan.id, plan]));
    return (["monthly", "yearly"] as const)
      .map((planId) => byId.get(planId))
      .filter(Boolean) as WebPlanCard[];
  }, []);

  const finishFlow = useCallback(() => {
    if (redirectTo) {
      router.replace(redirectTo as any);
      return;
    }
    router.back();
  }, [redirectTo, router]);

  const waitForPremiumSync = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return false;

    const deadline = Date.now() + 25_000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Boolean(data?.has_keystone_access)) {
            await refresh();
            return true;
          }
        }
      } catch {
        // Retry during the short checkout sync window.
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    await refresh();
    return false;
  }, [refresh]);

  useEffect(() => {
    if (!completedCheckout) return;
    let active = true;

    void (async () => {
      const synced = await waitForPremiumSync();
      if (!active) return;
      setSyncingCheckout(false);

      if (synced) {
        setBillingMessage("Checkout confirmed. Keystone Access is ready.");
        if (redirectTo) router.replace(redirectTo as any);
        return;
      }

      setBillingMessage("Checkout finished, but access is still syncing. Try refreshing in a moment.");
    })();

    return () => {
      active = false;
    };
  }, [completedCheckout, redirectTo, router, waitForPremiumSync]);

  const handleManage = useCallback(async () => {
    try {
      setPurchaseBusy(true);
      setBillingMessage(null);
      await openCustomerCenter();
    } catch (error) {
      setBillingMessage(
        error instanceof Error
          ? error.message
          : "We could not open subscription management right now.",
      );
    } finally {
      setPurchaseBusy(false);
    }
  }, [openCustomerCenter]);

  const handleNativePurchase = useCallback(async () => {
    if (!selectedNativePackage || purchaseBusy || busy) return;

    try {
      setPurchaseBusy(true);
      setBillingMessage(null);
      const unlocked = await purchasePackage(selectedNativePackage as any);
      if (unlocked) {
        finishFlow();
        return;
      }
      setBillingMessage("Purchase finished, but access has not activated yet. Try restoring in a moment.");
    } catch (error) {
      if ((error as any)?.userCancelled) return;
      Alert.alert(
        "Purchase failed",
        error instanceof Error ? error.message : "We could not complete the purchase right now.",
      );
    } finally {
      setPurchaseBusy(false);
    }
  }, [busy, finishFlow, purchaseBusy, purchasePackage, selectedNativePackage]);

  const handleWebCheckout = useCallback(async () => {
    if (purchaseBusy || busy || billingProvider !== "paddle") return;

    try {
      setPurchaseBusy(true);
      setBillingMessage(null);
      const launched = await startWebCheckout(selectedWebPlan, { redirectTo });
      if (!launched) {
        setBillingMessage("Checkout could not open. Log in and try again.");
      }
    } catch (error) {
      setBillingMessage(
        error instanceof Error
          ? error.message
          : "We could not open checkout right now.",
      );
    } finally {
      setPurchaseBusy(false);
    }
  }, [billingProvider, busy, purchaseBusy, redirectTo, selectedWebPlan, startWebCheckout]);

  const shouldShowWebPlans = billingProvider === "paddle";
  const shouldShowNativePlans = billingProvider === "revenuecat";
  const canCheckoutWeb = billingProvider === "paddle" && webCheckoutReady;
  const canCheckoutNative = canMakePurchases && nativePackages.length > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView
          testID="keystone-mobile-page-scroll"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View style={styles.topCopy}>
              <Text style={styles.eyebrow}>Keystone Access</Text>
              <Text style={styles.title}>Upgrade</Text>
            </View>
            <SurfaceButton
              label="Back"
              icon="arrow-back"
              size="compact"
              onPress={() => router.back()}
            />
          </View>

          {checkingGuest ? (
            <View style={styles.card}>
              <ActivityIndicator size="large" color={BRAND.inkSoft} />
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Full Thai path</Text>
                <Text style={styles.bodyText}>
                  Unlock every lesson beyond the free start, mixed practice, and unlimited bookmarks on this account.
                </Text>
                {promptLabel ? (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>You were opening</Text>
                    <Text style={styles.infoValue}>{promptLabel}</Text>
                  </View>
                ) : null}
                <View style={styles.benefitList}>
                  {[
                    "Continue past the free lessons",
                    "Use mixed practice as you progress",
                    "Save unlimited bookmarks",
                    "Keep access across web and mobile",
                  ].map((benefit) => (
                    <View key={benefit} style={styles.benefitRow}>
                      <Ionicons name="checkmark" size={15} color={BRAND.ink} />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {isPremium ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Access is active</Text>
                  <Text style={styles.bodyText}>
                    This account already has Keystone Access.
                  </Text>
                  {billingMessage ? (
                    <Text style={styles.messageText}>{billingMessage}</Text>
                  ) : null}
                  <SurfaceButton
                    label={purchaseBusy ? "Opening..." : "Manage subscription"}
                    onPress={() => void handleManage()}
                    variant="primary"
                    disabled={purchaseBusy}
                  />
                  {redirectTo ? (
                    <SurfaceButton label="Continue" onPress={finishFlow} />
                  ) : null}
                </View>
              ) : syncingCheckout ? (
                <View style={styles.card}>
                  <ActivityIndicator size="small" color={BRAND.inkSoft} />
                  <Text style={styles.bodyText}>Confirming your Keystone Access...</Text>
                </View>
              ) : shouldShowWebPlans ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Plans</Text>
                  <View style={styles.planStack}>
                    {webPlans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        title={plan.title}
                        price={getWebPlanPrice(plan)}
                        support={getWebPlanSupport(plan)}
                        detail={plan.detailText}
                        selected={selectedWebPlan === plan.id}
                        onPress={() => setSelectedWebPlan(plan.id)}
                      />
                    ))}
                  </View>
                  {billingMessage ? (
                    <Text style={styles.messageText}>{billingMessage}</Text>
                  ) : null}
                  <SurfaceButton
                    label={purchaseBusy || busy ? "Opening checkout..." : `Choose ${selectedWebPlan}`}
                    onPress={() => void handleWebCheckout()}
                    variant="primary"
                    disabled={!canCheckoutWeb || purchaseBusy || busy}
                  />
                </View>
              ) : shouldShowNativePlans ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Plans</Text>
                  {offeringsLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={BRAND.inkSoft} />
                      <Text style={styles.bodyText}>Loading plans...</Text>
                    </View>
                  ) : canCheckoutNative ? (
                    <View style={styles.planStack}>
                      {nativePackages.map((aPackage) => (
                        <PlanCard
                          key={aPackage.identifier}
                          title={getPackageHeadline(aPackage)}
                          price={aPackage.product.priceString || "Keystone Access"}
                          support={getPackageSupportText(aPackage)}
                          detail="Unlock the full Thai course on this account."
                          selected={selectedNativePackageId === aPackage.identifier}
                          onPress={() => setSelectedNativePackageId(aPackage.identifier)}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.bodyText}>
                      Plans are not ready in this build yet.
                    </Text>
                  )}
                  {billingMessage ? (
                    <Text style={styles.messageText}>{billingMessage}</Text>
                  ) : null}
                  <SurfaceButton
                    label={purchaseBusy || busy ? "Processing..." : "Continue"}
                    onPress={() => void handleNativePurchase()}
                    variant="primary"
                    disabled={!canCheckoutNative || !selectedNativePackage || purchaseBusy || busy}
                  />
                  <SurfaceButton
                    label="Restore purchases"
                    onPress={() => void restorePremiumAccess()}
                    disabled={purchaseBusy || busy}
                  />
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Checkout unavailable</Text>
                  <Text style={styles.bodyText}>
                    Keystone Access checkout is not configured for this build yet.
                  </Text>
                </View>
              )}

              <Text style={styles.legalText}>
                Web payments are processed by Paddle. App Store and Google Play purchases keep using their own billing systems, but access stays tied to this account.
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function PlanCard({
  title,
  price,
  support,
  detail,
  selected,
  onPress,
}: {
  title: string;
  price: string;
  support: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <SettledPressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.planCard,
        selected ? styles.planCardSelected : null,
        pressed ? styles.planCardPressed : null,
      ]}
    >
      <View style={styles.planTop}>
        <View style={styles.planTitleWrap}>
          <Text style={styles.planTitle}>{title}</Text>
          <Text style={styles.planSupport}>{support}</Text>
        </View>
        <View style={styles.radioOuter}>
          {selected ? <View style={styles.radioInner} /> : null}
        </View>
      </View>
      <Text style={styles.planPrice}>{price}</Text>
      <Text style={styles.planDetail}>{detail}</Text>
    </SettledPressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  topCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: BRAND.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.8,
  },
  card: {
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 24,
    backgroundColor: BRAND.paper,
    padding: 18,
    gap: 12,
    ...CARD_SHADOW,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    padding: 14,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  infoLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: BRAND.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: BRAND.ink,
  },
  benefitList: {
    gap: 9,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
  },
  planStack: {
    gap: 10,
  },
  planCard: {
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 20,
    backgroundColor: BRAND.panel,
    padding: 15,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  planCardSelected: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.line,
  },
  planCardPressed: {
    ...SURFACE_PRESSED,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  planTitleWrap: {
    flex: 1,
    gap: 3,
  },
  planTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  planSupport: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  planPrice: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.4,
  },
  planDetail: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: BRAND.ink,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.paper,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BRAND.ink,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  legalText: {
    paddingHorizontal: 4,
    fontSize: 12,
    lineHeight: 19,
    color: BRAND.muted,
  },
});
