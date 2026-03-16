import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { PACKAGE_TYPE, PurchasesPackage } from "react-native-purchases";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { isGuestUser } from "@/src/utils/auth";

const PACKAGE_ORDER: Record<string, number> = {
  [PACKAGE_TYPE.ANNUAL]: 0,
  [PACKAGE_TYPE.SIX_MONTH]: 1,
  [PACKAGE_TYPE.THREE_MONTH]: 2,
  [PACKAGE_TYPE.TWO_MONTH]: 3,
  [PACKAGE_TYPE.MONTHLY]: 4,
  [PACKAGE_TYPE.WEEKLY]: 5,
  [PACKAGE_TYPE.LIFETIME]: 6,
  [PACKAGE_TYPE.CUSTOM]: 7,
  [PACKAGE_TYPE.UNKNOWN]: 8,
};

function getPackageHeadline(aPackage: PurchasesPackage): string {
  switch (aPackage.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return "Annual";
    case PACKAGE_TYPE.MONTHLY:
      return "Monthly";
    case PACKAGE_TYPE.SIX_MONTH:
      return "6 Months";
    case PACKAGE_TYPE.THREE_MONTH:
      return "3 Months";
    case PACKAGE_TYPE.TWO_MONTH:
      return "2 Months";
    case PACKAGE_TYPE.WEEKLY:
      return "Weekly";
    case PACKAGE_TYPE.LIFETIME:
      return "Lifetime";
    default:
      return aPackage.product.title || "Keystone Access";
  }
}

function getPackageSupportText(aPackage: PurchasesPackage): string {
  const intro = aPackage.product.introPrice;
  if (intro) return `${intro.priceString} intro available`;
  if (
    aPackage.product.pricePerMonthString &&
    aPackage.packageType !== PACKAGE_TYPE.MONTHLY
  ) {
    return `${aPackage.product.pricePerMonthString}/month equivalent`;
  }
  if (aPackage.product.subscriptionPeriod === "P1Y") return "Renews yearly";
  if (aPackage.product.subscriptionPeriod === "P6M") return "Renews every 6 months";
  if (aPackage.product.subscriptionPeriod === "P3M") return "Renews every 3 months";
  if (aPackage.product.subscriptionPeriod === "P2M") return "Renews every 2 months";
  if (aPackage.product.subscriptionPeriod === "P1M") return "Renews monthly";
  if (aPackage.product.subscriptionPeriod === "P1W") return "Renews weekly";
  return "Auto-renewing subscription";
}

function getPackageBadge(aPackage: PurchasesPackage): string | null {
  if (aPackage.packageType === PACKAGE_TYPE.ANNUAL) return "Best value";
  if (aPackage.packageType === PACKAGE_TYPE.MONTHLY) return "Most flexible";
  return null;
}

export default function PremiumWebScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ label?: string; redirectTo?: string }>();
  const promptLabel = Array.isArray(params.label) ? params.label[0] : params.label;
  const redirectTo = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;

  const {
    currentOffering,
    isPremium,
    offeringsLoading,
    refreshOfferings,
    restorePremiumAccess,
  } = usePremiumAccess();

  const [checkingGuest, setCheckingGuest] = useState(true);
  const columns = width >= 1320 ? 3 : width >= 980 ? 2 : 1;
  const cardWidth =
    columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

  useEffect(() => {
    let active = true;
    (async () => {
      const guest = await isGuestUser();
      if (!active) return;
      if (guest) {
        router.replace("/login");
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
      void refreshOfferings();
    }, [refreshOfferings]),
  );

  const sortedPackages = useMemo(() => {
    const packages = currentOffering?.availablePackages ?? [];
    return [...packages].sort((a, b) => {
      const aOrder = PACKAGE_ORDER[a.packageType] ?? 99;
      const bOrder = PACKAGE_ORDER[b.packageType] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.product.price - b.product.price;
    });
  }, [currentOffering]);

  const manageStoreSubscription = useCallback(async () => {
    const url =
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) return;
      await Linking.openURL(url);
    } catch {
      // noop
    }
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Keystone Access"
        title="Continue beyond A1.1"
        subtitle="Review plans and benefits on desktop, then complete Keystone Access on mobile where purchases are enabled."
        toolbar={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={Sketch.ink} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        {checkingGuest ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={Sketch.inkMuted} />
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={styles.heroGrid}>
              <DesktopPanel style={styles.heroPanel}>
                <DesktopSectionTitle
                  title="What unlocks"
                  caption="Keystone Access expands the curriculum after A1.1 and removes the free-plan bookmark cap."
                />
                {promptLabel ? (
                  <Text style={styles.contextLine}>Trying to open: {promptLabel}</Text>
                ) : null}
                <View style={styles.benefitsList}>
                  {[
                    "A1.2 to C2 grammar access",
                    "Mixed practice across studied grammar",
                    "Unlimited bookmarks",
                  ].map((item) => (
                    <View key={item} style={styles.benefitRow}>
                      <Ionicons name="checkmark" size={16} color={Sketch.accent} />
                      <Text style={styles.benefitText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </DesktopPanel>

              <DesktopPanel style={styles.statePanel}>
                <DesktopSectionTitle
                  title="Purchase status"
                  caption="Desktop acts as the plan review and account-management view."
                />
                {isPremium ? (
                  <>
                    <Text style={styles.stateTitle}>Keystone Access is active</Text>
                    <Text style={styles.bodyText}>
                      This account already has access to the full curriculum.
                    </Text>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => void manageStoreSubscription()}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.primaryButtonText}>Manage subscription</Text>
                    </TouchableOpacity>
                  </>
                ) : offeringsLoading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="small" color={Sketch.inkMuted} />
                    <Text style={styles.bodyText}>Loading plans...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.stateTitle}>Checkout happens on mobile</Text>
                    <Text style={styles.bodyText}>
                      Use this page to review plans on desktop, then continue on your phone to complete the purchase.
                    </Text>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => void restorePremiumAccess()}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
                    </TouchableOpacity>
                  </>
                )}
              </DesktopPanel>
            </View>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Plans"
                caption="Pricing and plan names still come from RevenueCat even though checkout is mobile-only."
              />
              {sortedPackages.length === 0 ? (
                <Text style={styles.bodyText}>
                  No offering is available yet. Configure packages in RevenueCat and they will appear here automatically.
                </Text>
              ) : (
                <View style={styles.planGrid}>
                  {sortedPackages.map((aPackage) => {
                    const badge = getPackageBadge(aPackage);
                    return (
                      <View
                        key={aPackage.identifier}
                        style={[styles.planCard, { width: cardWidth }]}
                      >
                        <View style={styles.planTop}>
                          <View style={styles.planTitleWrap}>
                            <Text style={styles.planTitle}>
                              {getPackageHeadline(aPackage)}
                            </Text>
                            {badge ? (
                              <View style={styles.planBadge}>
                                <Text style={styles.planBadgeText}>{badge}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.planPrice}>
                            {aPackage.product.priceString}
                          </Text>
                        </View>
                        <Text style={styles.planSupport}>
                          {getPackageSupportText(aPackage)}
                        </Text>
                        {aPackage.product.pricePerMonthString &&
                        aPackage.packageType !== PACKAGE_TYPE.MONTHLY ? (
                          <Text style={styles.planDetail}>
                            {aPackage.product.pricePerMonthString}/month
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </DesktopPanel>

            {redirectTo ? (
              <DesktopPanel>
                <DesktopSectionTitle
                  title="After purchase"
                  caption="The mobile flow returns to the blocked lesson or practice route."
                />
                <Text style={styles.bodyText}>{redirectTo}</Text>
              </DesktopPanel>
            ) : null}
          </View>
        )}
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 28,
  },
  heroGrid: {
    flexDirection: "row",
    gap: 20,
  },
  heroPanel: {
    flex: 1.15,
  },
  statePanel: {
    flex: 0.85,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  loadingPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  contextLine: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.accent,
  },
  benefitsList: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    fontSize: 16,
    color: Sketch.ink,
    fontWeight: "500",
  },
  stateTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  loadingState: {
    gap: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  planCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 10,
    minHeight: 176,
  },
  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  planTitleWrap: {
    flex: 1,
    gap: 8,
  },
  planTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  planBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(196, 97, 60, 0.18)",
    backgroundColor: "rgba(196, 97, 60, 0.08)",
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.accent,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  planSupport: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  planDetail: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accent,
  },
});
