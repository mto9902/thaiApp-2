import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PACKAGE_TYPE,
  PurchasesError,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
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

  if (intro) {
    return `${intro.priceString} intro available`;
  }

  if (aPackage.product.pricePerMonthString && aPackage.packageType !== PACKAGE_TYPE.MONTHLY) {
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

export default function PremiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ label?: string; redirectTo?: string }>();
  const promptLabel = Array.isArray(params.label) ? params.label[0] : params.label;
  const redirectTo = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;

  const {
    busy,
    canMakePurchases,
    currentOffering,
    isPremium,
    offeringsLoading,
    openCustomerCenter,
    refreshOfferings,
    purchasePackage,
    restorePremiumAccess,
  } = usePremiumAccess();

  const [checkingGuest, setCheckingGuest] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);

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

  useEffect(() => {
    if (sortedPackages.length === 0) {
      setSelectedPackageId(null);
      return;
    }

    setSelectedPackageId((current) => {
      if (current && sortedPackages.some((item) => item.identifier === current)) {
        return current;
      }
      return sortedPackages[0].identifier;
    });
  }, [sortedPackages]);

  const selectedPackage =
    sortedPackages.find((item) => item.identifier === selectedPackageId) ?? null;

  const finishPurchaseFlow = useCallback(() => {
    if (redirectTo) {
      router.replace(redirectTo as any);
      return;
    }

    router.back();
  }, [redirectTo, router]);

  async function handlePurchase() {
    if (!selectedPackage || purchaseBusy || busy) return;

    try {
      setPurchaseBusy(true);
      const unlocked = await purchasePackage(selectedPackage);
      if (unlocked) {
        finishPurchaseFlow();
      } else {
        Alert.alert(
          "Keystone Access is not active yet",
          "Your purchase finished, but Keystone Access has not activated yet. Try restoring purchases in a moment.",
        );
      }
    } catch (error) {
      const purchaseError = error as PurchasesError;
      if (
        purchaseError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
        purchaseError?.userCancelled
      ) {
        return;
      }

      Alert.alert(
        "Purchase failed",
        purchaseError?.message || "We couldn't complete the purchase right now.",
      );
    } finally {
      setPurchaseBusy(false);
    }
  }

  if (checkingGuest) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Sketch.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Keystone Access</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>UNLOCK MORE THAI</Text>
          <Text style={styles.title}>Continue beyond A1.1</Text>
          <Text style={styles.subtitle}>
            Unlock every grammar lesson after A1.1, practice mixed sets across the
            full curriculum, and save unlimited bookmarks.
          </Text>
          {promptLabel ? (
            <Text style={styles.contextLine}>You&apos;re trying to open: {promptLabel}</Text>
          ) : null}
        </View>

        <View style={styles.benefitsCard}>
          {[
            "A1.2 to C2 grammar access",
            "Mixed practice across studied grammar",
            "Unlimited bookmarks",
          ].map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark" size={16} color={Sketch.orange} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {isPremium ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Keystone Access is active</Text>
            <Text style={styles.stateBody}>
              Your account already has access to the full Keystone Access curriculum.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => void openCustomerCenter()}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Manage Keystone Access</Text>
            </TouchableOpacity>
            {redirectTo ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={finishPurchaseFlow}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Continue</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : offeringsLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={Sketch.orange} />
            <Text style={styles.stateBody}>Loading plans...</Text>
          </View>
        ) : !canMakePurchases ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Subscriptions aren&apos;t configured yet</Text>
            <Text style={styles.stateBody}>
              Add your RevenueCat mobile API keys to turn on Keystone Access in this build.
            </Text>
          </View>
        ) : sortedPackages.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Plans aren&apos;t ready yet</Text>
            <Text style={styles.stateBody}>
              Add an offering and package in RevenueCat, then this screen will show
              your plans automatically.
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => void refreshOfferings()}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Choose a plan</Text>
              <Text style={styles.sectionHint}>Billing and prices come from RevenueCat</Text>
            </View>

            <View style={styles.packagesList}>
              {sortedPackages.map((aPackage) => {
                const isSelected = aPackage.identifier === selectedPackageId;
                const badge = getPackageBadge(aPackage);

                return (
                  <TouchableOpacity
                    key={aPackage.identifier}
                    style={[
                      styles.packageCard,
                      isSelected && styles.packageCardSelected,
                    ]}
                    onPress={() => setSelectedPackageId(aPackage.identifier)}
                    activeOpacity={0.82}
                  >
                    <View style={styles.packageHeader}>
                      <View style={styles.packageHeaderText}>
                        <View style={styles.packageTitleRow}>
                          <Text style={styles.packageTitle}>
                            {getPackageHeadline(aPackage)}
                          </Text>
                          {badge ? (
                            <View style={styles.packageBadge}>
                              <Text style={styles.packageBadgeText}>{badge}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.packageSupport}>
                          {getPackageSupportText(aPackage)}
                        </Text>
                      </View>
                      <View style={styles.packagePriceWrap}>
                        <Text style={styles.packagePrice}>
                          {aPackage.product.priceString}
                        </Text>
                        {aPackage.product.pricePerMonthString &&
                        aPackage.packageType !== PACKAGE_TYPE.MONTHLY ? (
                          <Text style={styles.packagePriceDetail}>
                            {aPackage.product.pricePerMonthString}/month
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (purchaseBusy || busy || !selectedPackage) && styles.primaryButtonDisabled,
              ]}
              onPress={() => void handlePurchase()}
              activeOpacity={0.84}
              disabled={purchaseBusy || busy || !selectedPackage}
            >
              <Text style={styles.primaryButtonText}>
                {purchaseBusy || busy
                  ? "Processing..."
                  : selectedPackage
                    ? `Continue with ${getPackageHeadline(selectedPackage)}`
                    : "Choose a plan"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => void restorePremiumAccess()}
              activeOpacity={0.8}
              disabled={purchaseBusy || busy}
            >
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 18,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  headerSpacer: {
    width: 40,
  },
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Sketch.inkMuted,
  },
  contextLine: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkLight,
  },
  benefitsCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    gap: 12,
    ...sketchShadow(4),
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: "500",
    color: Sketch.ink,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sectionHint: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  packagesList: {
    gap: 12,
  },
  packageCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    ...sketchShadow(4),
  },
  packageCardSelected: {
    borderColor: Sketch.orange,
    backgroundColor: "rgba(196, 97, 60, 0.05)",
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  packageHeaderText: {
    flex: 1,
    gap: 6,
  },
  packageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  packageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(196, 97, 60, 0.12)",
  },
  packageBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.2,
  },
  packageSupport: {
    fontSize: 13,
    lineHeight: 18,
    color: Sketch.inkMuted,
  },
  packagePriceWrap: {
    alignItems: "flex-end",
    gap: 2,
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  packagePriceDetail: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.orange,
  },
  stateCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 14,
    alignItems: "center",
    ...sketchShadow(4),
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  stateBody: {
    fontSize: 14,
    lineHeight: 21,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.orange,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    ...sketchShadow(3),
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  restoreButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.orange,
  },
});
