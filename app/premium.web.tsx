import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import {
  WEB_BODY_FONT,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";
import { API_BASE } from "@/src/config";
import PremiumMobileScreen from "@/src/screens/mobile/PremiumMobileScreen";
import {
  consumeRecentPaddleCheckout,
  isWebCheckoutPlan,
  WEB_CHECKOUT_PLANS,
  type WebCheckoutPlan,
} from "@/src/subscription/paddleWeb";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";

function getCurrentWebRoute() {
  if (typeof window === "undefined") {
    return "/premium";
  }

  return `${window.location.pathname}${window.location.search}`;
}

type BillingMoney = {
  amount: string;
  currencyCode: string;
};

type WebBillingSummary = {
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPlan?: WebCheckoutPlan | null;
  currentPriceId?: string | null;
  nextBilledAt?: string | null;
  hasAccess?: boolean;
};

type WebPlanSwitchPreview = WebBillingSummary & {
  targetPlan: WebCheckoutPlan;
  prorationBillingMode?: string | null;
  immediateCharge?: BillingMoney | null;
  recurringCharge?: BillingMoney | null;
};

type BillingActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
};

const SOFT_LINE = "#E5E5E5";

function BillingActionButton({
  label,
  onPress,
  variant = "secondary",
  disabled,
  style,
  textStyle,
  icon,
}: BillingActionButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.buttonBase,
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        (hovered || pressed) &&
          !disabled &&
          (variant === "primary"
            ? styles.primaryButtonActive
            : styles.secondaryButtonActive),
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={variant === "primary" ? "#FFFFFF" : Sketch.ink}
        />
      ) : null}
      <Text
        selectable={false}
        style={[
          styles.buttonText,
          variant === "primary"
            ? styles.primaryButtonText
            : styles.secondaryButtonText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

async function fetchAuthenticatedBillingJson<T>(
  path: string,
  init?: RequestInit & { body?: string },
) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Log in to manage billing");
  }

  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };

  if (!res.ok) {
    throw new Error(data?.error || `Billing request failed (${res.status})`);
  }

  return data;
}

function formatBillingMoney(money?: BillingMoney | null) {
  if (!money?.amount || !money?.currencyCode) {
    return null;
  }

  const amount = Number(money.amount) / 100;
  if (!Number.isFinite(amount)) {
    return null;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: money.currencyCode,
    }).format(amount);
  } catch {
    return `${money.currencyCode} ${amount.toFixed(2)}`;
  }
}

function formatBillingDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function parsePriceLabelAmount(priceLabel: string) {
  const numeric = Number(priceLabel.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function formatCompactMonthlyEquivalent(amount: number) {
  if (!Number.isFinite(amount)) {
    return null;
  }

  const rounded =
    Math.abs(amount - Math.round(amount)) < 0.05
      ? String(Math.round(amount))
      : amount.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");

  return `$${rounded}/month billed yearly`;
}

export default function PremiumWebScreen() {
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <PremiumMobileScreen />;
  }

  return <PremiumWebDesktopScreen />;
}

function PremiumWebDesktopScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    label?: string;
    redirectTo?: string;
    plan?: string;
    checkout?: string;
  }>();
  const redirectTo = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;
  const requestedPlanParam = Array.isArray(params.plan) ? params.plan[0] : params.plan;
  const checkoutParam = Array.isArray(params.checkout)
    ? params.checkout[0]
    : params.checkout;
  const requestedPlan = isWebCheckoutPlan(requestedPlanParam)
    ? requestedPlanParam
    : "monthly";
  const [recentCheckoutCompletion] = useState(() => consumeRecentPaddleCheckout());
  const completedCheckout =
    checkoutParam === "success" || Boolean(recentCheckoutCompletion);

  const {
    billingProvider,
    busy,
    isPremium,
    openCustomerCenter,
    refresh,
    startWebCheckout,
  } = usePremiumAccess();

  const [checkingGuest, setCheckingGuest] = useState(true);
  const [checkoutPlanBusy, setCheckoutPlanBusy] = useState<WebCheckoutPlan | null>(
    null,
  );
  const [syncingCheckout, setSyncingCheckout] = useState(completedCheckout);
  const [syncMessage, setSyncMessage] = useState<string | null>(
    completedCheckout ? "Confirming your Keystone Access..." : null,
  );
  const [billingSummary, setBillingSummary] = useState<WebBillingSummary | null>(
    null,
  );
  const [billingSummaryLoading, setBillingSummaryLoading] = useState(false);
  const [billingSummaryMessage, setBillingSummaryMessage] = useState<string | null>(
    null,
  );
  const [manageBillingBusy, setManageBillingBusy] = useState(false);
  const [manageBillingMessage, setManageBillingMessage] = useState<string | null>(
    null,
  );
  const [switchPreview, setSwitchPreview] = useState<WebPlanSwitchPreview | null>(
    null,
  );
  const [switchPreviewBusyPlan, setSwitchPreviewBusyPlan] =
    useState<WebCheckoutPlan | null>(null);
  const [switchConfirmBusy, setSwitchConfirmBusy] = useState(false);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);

  const stackHero = width < 1120;
  const cardWidth = width >= 980 ? "48.8%" : "100%";

  useEffect(() => {
    let active = true;

    (async () => {
      const guest = await isGuestUser();
      if (!active) return;

      if (guest) {
        router.replace(
          `/login?redirectTo=${encodeURIComponent(getCurrentWebRoute())}` as any,
        );
        return;
      }

      setCheckingGuest(false);
    })();

    return () => {
      active = false;
    };
  }, [router]);

  const loadBillingSummary = useCallback(async () => {
    if (billingProvider !== "paddle" || !isPremium) {
      setBillingSummary(null);
      setBillingSummaryMessage(null);
      return null;
    }

    try {
      setBillingSummaryLoading(true);
      setBillingSummaryMessage(null);
      const data = await fetchAuthenticatedBillingJson<WebBillingSummary>(
        "/billing/paddle/subscription",
      );
      setBillingSummary(data);
      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not load the current billing details.";
      setBillingSummary(null);
      setBillingSummaryMessage(message);
      return null;
    } finally {
      setBillingSummaryLoading(false);
    }
  }, [billingProvider, isPremium]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      if (!checkingGuest) {
        void loadBillingSummary();
      }
    }, [checkingGuest, loadBillingSummary, refresh]),
  );

  const waitForPremiumSync = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      return false;
    }

    const deadline = Date.now() + 25_000;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Boolean(data?.has_keystone_access)) {
            await refresh();
            return true;
          }
        }
      } catch {
        // Try again until the sync window expires.
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    await refresh();
    return false;
  }, [refresh]);

  useEffect(() => {
    if (!completedCheckout) {
      return;
    }

    let active = true;

    void (async () => {
      const synced = await waitForPremiumSync();
      if (!active) return;

      setSyncingCheckout(false);

      if (synced) {
        setSyncMessage("Checkout confirmed. Keystone Access is ready.");
        if (redirectTo) {
          router.replace(redirectTo as any);
        }
        return;
      }

      setSyncMessage(
        "Your payment finished, but access is still syncing. Refresh in a moment if it does not appear automatically.",
      );
    })();

    return () => {
      active = false;
    };
  }, [completedCheckout, redirectTo, router, waitForPremiumSync]);

  useEffect(() => {
    if (checkingGuest) {
      return;
    }

    if (billingProvider === "paddle" && isPremium) {
      void loadBillingSummary();
      return;
    }

    setBillingSummary(null);
    setBillingSummaryMessage(null);
    setSwitchPreview(null);
    setSwitchMessage(null);
  }, [billingProvider, checkingGuest, isPremium, loadBillingSummary]);

  const orderedPlans = useMemo(() => {
    const plansById = new Map(WEB_CHECKOUT_PLANS.map((plan) => [plan.id, plan]));
    return (["monthly", "yearly"] as const)
      .map((planId) => plansById.get(planId))
      .filter(Boolean) as typeof WEB_CHECKOUT_PLANS;
  }, []);

  const yearlyMonthlyEquivalent = useMemo(() => {
    const yearlyPlan = WEB_CHECKOUT_PLANS.find((plan) => plan.id === "yearly");
    if (!yearlyPlan) {
      return null;
    }

    const yearlyAmount = parsePriceLabelAmount(yearlyPlan.priceLabel);
    if (yearlyAmount == null) {
      return null;
    }

    return formatCompactMonthlyEquivalent(yearlyAmount / 12);
  }, []);

  const handleCheckout = useCallback(
    async (plan: WebCheckoutPlan) => {
      if (billingProvider !== "paddle" || checkoutPlanBusy || busy) {
        return;
      }

      try {
        setCheckoutPlanBusy(plan);
        setSyncMessage(null);
        const launched = await startWebCheckout(plan, { redirectTo });

        if (!launched) {
          Alert.alert(
            "Checkout unavailable",
            "Log in first, then try opening checkout again.",
          );
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "We could not open secure checkout right now.";
        Alert.alert("Checkout unavailable", message);
      } finally {
        setCheckoutPlanBusy(null);
      }
    },
    [billingProvider, busy, checkoutPlanBusy, redirectTo, startWebCheckout],
  );

  const handleManageBilling = useCallback(async () => {
    try {
      setManageBillingBusy(true);
      setManageBillingMessage("Opening your billing portal...");
      await openCustomerCenter();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not open billing management right now.";
      setManageBillingMessage(message);
    } finally {
      setManageBillingBusy(false);
    }
  }, [openCustomerCenter]);

  const handlePreviewSwitch = useCallback(async (targetPlan: WebCheckoutPlan) => {
    try {
      setSwitchPreviewBusyPlan(targetPlan);
      setSwitchMessage(null);
      const data = await fetchAuthenticatedBillingJson<WebPlanSwitchPreview>(
        "/billing/paddle/subscription/switch-preview",
        {
          method: "POST",
          body: JSON.stringify({ targetPlan }),
        },
      );
      setSwitchPreview(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not review that plan change right now.";
      setSwitchPreview(null);
      setSwitchMessage(message);
    } finally {
      setSwitchPreviewBusyPlan(null);
    }
  }, []);

  const handleConfirmSwitch = useCallback(async () => {
    if (!switchPreview?.targetPlan) {
      return;
    }

    try {
      setSwitchConfirmBusy(true);
      setSwitchMessage(null);
      const data = await fetchAuthenticatedBillingJson<WebBillingSummary>(
        "/billing/paddle/subscription/switch",
        {
          method: "POST",
          body: JSON.stringify({ targetPlan: switchPreview.targetPlan }),
        },
      );
      setBillingSummary(data);
      setSwitchPreview(null);
      setSwitchMessage(
        `Your subscription now renews ${
          switchPreview.targetPlan === "yearly" ? "yearly" : "monthly"
        }.`,
      );
      await refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "We could not switch plans right now.";
      setSwitchMessage(message);
    } finally {
      setSwitchConfirmBusy(false);
    }
  }, [refresh, switchPreview]);

  const currentPlan = billingSummary?.currentPlan || null;
  const nextBilledLabel = formatBillingDate(billingSummary?.nextBilledAt);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Keystone Access"
        title="Upgrade this account"
        subtitle="Add Keystone Access to this signed-in account so you can continue through the Thai course on web and mobile."
        toolbar={
          <BillingActionButton
            label="Back"
            onPress={() => router.back()}
            icon="arrow-back"
            style={styles.backButton}
          />
        }
      >
        {checkingGuest ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={Sketch.inkMuted} />
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={[styles.heroGrid, stackHero && styles.heroGridStacked]}>
              <DesktopPanel style={styles.heroPanel}>
                <DesktopSectionTitle
                  title="What this account gets"
                  caption="Keystone Access upgrades this account with the rest of the Thai course and the full study tools."
                />
                <View style={styles.benefitsList}>
                  {[
                    "Continue past the free lessons in the Thai course",
                    "Keep mixed practice available as you progress",
                    "Save unlimited bookmarks on this account",
                    "Use the same access on web and mobile",
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
                  title="Billing Status"
                  caption="Payments are securely processed via Paddle for your Keystone account."
                />

                {isPremium ? (
                  <>
                    <Text style={styles.stateTitle}>Keystone Access is active</Text>
                    <Text style={styles.bodyText}>
                      This account already has access to the full Thai course on
                      web and mobile.
                    </Text>
                    {billingSummaryLoading ? (
                      <Text style={styles.bodyText}>Loading current billing details...</Text>
                    ) : currentPlan ? (
                      <Text style={styles.bodyText}>
                        Current billing cadence:{" "}
                        {currentPlan === "yearly" ? "Yearly" : "Monthly"}
                        {nextBilledLabel ? `. Next renewal: ${nextBilledLabel}.` : "."}
                      </Text>
                    ) : billingSummaryMessage ? (
                      <Text style={styles.syncNote}>{billingSummaryMessage}</Text>
                    ) : null}
                    <BillingActionButton
                      label={
                        manageBillingBusy
                          ? "Opening billing portal..."
                          : "Manage subscription"
                      }
                      onPress={() => void handleManageBilling()}
                      variant="primary"
                      disabled={manageBillingBusy}
                    />
                    {manageBillingMessage ? (
                      <Text style={styles.syncNote}>{manageBillingMessage}</Text>
                    ) : null}
                    {redirectTo ? (
                      <BillingActionButton
                        label="Continue"
                        onPress={() => router.replace(redirectTo as any)}
                      />
                    ) : null}
                  </>
                ) : syncingCheckout ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="small" color={Sketch.inkMuted} />
                    <Text style={styles.bodyText}>
                      {syncMessage || "Confirming your Keystone Access..."}
                    </Text>
                  </View>
                ) : billingProvider !== "paddle" ? (
                  <>
                    <Text style={styles.stateTitle}>Checkout isn&apos;t configured yet</Text>
                    <Text style={styles.bodyText}>
                      This build cannot launch Paddle checkout yet.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.stateTitle}>Ready to upgrade?</Text>
                    <Text style={styles.bodyText}>
                      Select a monthly or yearly plan below. Your account will be
                      updated automatically as soon as your payment is complete.
                    </Text>
                    {syncMessage ? <Text style={styles.syncNote}>{syncMessage}</Text> : null}
                  </>
                )}
              </DesktopPanel>
            </View>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Plans"
                caption={
                  isPremium
                    ? "Your active billing cadence is shown below. Switching updates the existing subscription instead of opening a second checkout."
                    : "Pick the cadence that fits your pace through the Thai course."
                }
              />
              {switchMessage ? <Text style={styles.syncNote}>{switchMessage}</Text> : null}
              <View style={styles.planGrid}>
                {orderedPlans.map((plan) => {
                  const isSelected = requestedPlan === plan.id;
                  const isBusy = checkoutPlanBusy === plan.id;
                  const isCurrentPlan = Boolean(isPremium && currentPlan === plan.id);
                  const isSwitchTarget = Boolean(
                    isPremium && currentPlan && currentPlan !== plan.id,
                  );
                  const isReviewingSwitch = switchPreviewBusyPlan === plan.id;
                  const isShowingSwitchPreview =
                    switchPreview?.targetPlan === plan.id;
                  const recurringChargeLabel = formatBillingMoney(
                    switchPreview?.recurringCharge,
                  );
                  const immediateChargeLabel = formatBillingMoney(
                    switchPreview?.immediateCharge,
                  );
                  const switchNextBilledLabel = formatBillingDate(
                    switchPreview?.nextBilledAt,
                  );
                  const disablePlanButton = isPremium
                    ? billingSummaryLoading ||
                      (!isCurrentPlan && !isSwitchTarget) ||
                      isReviewingSwitch ||
                      switchConfirmBusy
                    : isBusy || busy || billingProvider !== "paddle";
                  const planButtonLabel = isPremium
                    ? billingSummaryLoading
                      ? "Loading billing details..."
                      : isCurrentPlan
                        ? "Current plan"
                        : isSwitchTarget
                          ? isReviewingSwitch
                            ? "Reviewing switch..."
                            : `Switch to ${plan.id}`
                          : "Manage in billing portal"
                    : isBusy || busy
                      ? "Opening checkout..."
                      : plan.id === "yearly"
                        ? "Choose yearly"
                        : "Choose monthly";

                  return (
                    <View
                      key={plan.id}
                      style={[
                        styles.planCard,
                        { width: cardWidth },
                        isSelected && styles.planCardSelected,
                      ]}
                    >
                      <View style={styles.planTop}>
                        <View style={styles.planTitleWrap}>
                          <View style={styles.planTitleRow}>
                            <Text style={styles.planTitle}>{plan.title}</Text>
                            {plan.badge ? (
                              <View style={styles.planTag}>
                                <Text style={styles.planTagText}>{plan.badge}</Text>
                              </View>
                            ) : null}
                            {isCurrentPlan ? (
                              <View style={styles.planTag}>
                                <Text style={styles.planTagText}>Current plan</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.planSupport}>{plan.supportText}</Text>
                        </View>
                        <View style={styles.planPriceWrap}>
                          <Text style={styles.planPrice}>
                            {plan.priceLabel}
                            <Text style={styles.planCadence}>{plan.cadenceLabel}</Text>
                          </Text>
                          {plan.id === "yearly" && yearlyMonthlyEquivalent ? (
                            <Text style={styles.planEquivalent}>
                              {yearlyMonthlyEquivalent}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <Text style={styles.planDetail}>{plan.detailText}</Text>

                      <BillingActionButton
                        label={planButtonLabel}
                        onPress={() =>
                          isPremium
                            ? isSwitchTarget
                              ? void handlePreviewSwitch(plan.id)
                              : undefined
                            : void handleCheckout(plan.id)
                        }
                        variant="primary"
                        disabled={disablePlanButton}
                      />

                      {isShowingSwitchPreview ? (
                        <View style={styles.switchPreviewCard}>
                          <Text style={styles.switchPreviewTitle}>
                            Switch to {plan.title.toLowerCase()}?
                          </Text>
                          <Text style={styles.switchPreviewText}>
                            {immediateChargeLabel
                              ? `Paddle will charge ${immediateChargeLabel} today.`
                              : "No additional charge is due today."}
                          </Text>
                          <Text style={styles.switchPreviewText}>
                            {recurringChargeLabel && switchNextBilledLabel
                              ? `After that, this subscription renews for ${recurringChargeLabel} on ${switchNextBilledLabel}.`
                              : switchNextBilledLabel
                                ? `The new billing cadence takes effect now, with the next renewal on ${switchNextBilledLabel}.`
                                : "The new billing cadence takes effect as soon as you confirm."}
                          </Text>
                          <View style={styles.switchPreviewActions}>
                            <BillingActionButton
                              label={
                                switchConfirmBusy
                                  ? "Switching..."
                                  : `Confirm ${plan.id}`
                              }
                              onPress={() => void handleConfirmSwitch()}
                              variant="primary"
                              disabled={switchConfirmBusy}
                              style={styles.switchActionButton}
                            />
                            <BillingActionButton
                              label="Keep current plan"
                              onPress={() => setSwitchPreview(null)}
                              disabled={switchConfirmBusy}
                              style={styles.switchActionButton}
                            />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <Text style={styles.legalNote}>
                Web subscriptions are billed securely through Paddle. App Store
                and Google Play purchases keep using their own billing systems,
                but access stays tied to the same account.
              </Text>
            </DesktopPanel>

            {redirectTo ? (
              <DesktopPanel>
                <DesktopSectionTitle
                  title="After purchase"
                  caption="The web flow can return you straight to the lesson or practice route that opened the paywall."
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

const styles = StyleSheet.create<Record<string, any>>({
  pageStack: {
    gap: 28,
  },
  heroGrid: {
    flexDirection: "row",
    gap: 20,
  },
  heroGridStacked: {
    flexDirection: "column",
  },
  heroPanel: {
    flex: 1.15,
  },
  statePanel: {
    flex: 0.85,
    gap: 16,
  },
  backButton: {
    paddingHorizontal: 16,
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
    fontFamily: WEB_BODY_FONT,
  },
  planHint: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
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
    fontFamily: WEB_BODY_FONT,
  },
  stateTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: Sketch.ink,
    letterSpacing: -0.6,
    fontFamily: WEB_DISPLAY_FONT,
  },
  loadingState: {
    gap: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  syncNote: {
    fontSize: 13,
    lineHeight: 21,
    color: Sketch.accent,
    fontFamily: WEB_BODY_FONT,
  },
  buttonBase: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: WEB_RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    userSelect: "none",
    outlineStyle: "none",
    ...WEB_INTERACTIVE_TRANSITION,
  },
  primaryButton: {
    borderColor: Sketch.accentDark,
    backgroundColor: Sketch.accent,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  primaryButtonText: {
    color: "#fff",
  },
  secondaryButton: {
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  secondaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  secondaryButtonText: {
    color: Sketch.ink,
  },
  disabledButton: {
    opacity: 0.55,
  },
  switchPreviewCard: {
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#FAFAFA",
    borderRadius: WEB_RADIUS.lg,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  switchPreviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  switchPreviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  switchPreviewActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  switchActionButton: {
    minWidth: 188,
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  planCard: {
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    gap: 16,
    minHeight: 212,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  planCardSelected: {
    borderColor: SOFT_LINE,
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
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  planTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: Sketch.ink,
    letterSpacing: -0.5,
    fontFamily: WEB_DISPLAY_FONT,
  },
  planTag: {
    minHeight: 30,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  planTagText: {
    color: Sketch.inkLight,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: WEB_BODY_FONT,
  },
  planSupport: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  },
  planEquivalent: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.inkMuted,
    fontWeight: "600",
    fontFamily: WEB_BODY_FONT,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "800",
    color: Sketch.ink,
    fontFamily: WEB_DISPLAY_FONT,
  },
  planPriceWrap: {
    alignItems: "flex-end",
    gap: 4,
  },
  planCadence: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  planDetail: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  },
  legalNote: {
    fontSize: 13,
    lineHeight: 21,
    color: Sketch.inkMuted,
    marginTop: 18,
  },
});
