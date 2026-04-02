import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
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

export default function PremiumWebScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
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
  const requestedPlanParam = Array.isArray(params.plan) ? params.plan[0] : params.plan;
  const checkoutParam = Array.isArray(params.checkout)
    ? params.checkout[0]
    : params.checkout;
  const requestedPlan = isWebCheckoutPlan(requestedPlanParam)
    ? requestedPlanParam
    : "yearly";
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
    const priority: Record<WebCheckoutPlan, number> = {
      yearly: requestedPlan === "yearly" ? 0 : 1,
      monthly: requestedPlan === "monthly" ? 0 : 1,
    };

    return [...WEB_CHECKOUT_PLANS].sort(
      (a, b) => priority[a.id] - priority[b.id],
    );
  }, [requestedPlan]);

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
        title="Continue beyond A1.1"
        subtitle="Unlock the full path on web, then keep the same access on the rest of your account."
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
            <View style={[styles.heroGrid, stackHero && styles.heroGridStacked]}>
              <DesktopPanel style={styles.heroPanel}>
                <DesktopSectionTitle
                  title="What unlocks"
                  caption="Keystone Access expands the curriculum after A1.1 and removes the free-plan bookmark cap."
                />
                {promptLabel ? (
                  <Text style={styles.contextLine}>Trying to open: {promptLabel}</Text>
                ) : null}
                {requestedPlan ? (
                  <Text style={styles.planHint}>
                    Selected from pricing:{" "}
                    {requestedPlan === "yearly" ? "Yearly" : "Monthly"}
                  </Text>
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
                  caption="Web checkout is billed through Paddle and synced back to your Keystone account."
                />

                {isPremium ? (
                  <>
                    <Text style={styles.stateTitle}>Keystone Access is active</Text>
                    <Text style={styles.bodyText}>
                      This account already has access to the full curriculum on web
                      and mobile.
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
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        manageBillingBusy && styles.primaryButtonDisabled,
                      ]}
                      onPress={() => void handleManageBilling()}
                      disabled={manageBillingBusy}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.primaryButtonText}>
                        {manageBillingBusy
                          ? "Opening billing portal..."
                          : "Manage subscription"}
                      </Text>
                    </TouchableOpacity>
                    {manageBillingMessage ? (
                      <Text style={styles.syncNote}>{manageBillingMessage}</Text>
                    ) : null}
                    {redirectTo ? (
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.replace(redirectTo as any)}
                        activeOpacity={0.82}
                      >
                        <Text style={styles.secondaryButtonText}>Continue</Text>
                      </TouchableOpacity>
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
                      Add the Paddle client token and plan price IDs to the web
                      environment, then this screen will launch checkout directly.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.stateTitle}>Checkout is ready on web</Text>
                    <Text style={styles.bodyText}>
                      Choose monthly or yearly below. Secure checkout opens in an
                      overlay and this account unlocks as soon as billing syncs.
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
                    : "Pick the cadence that fits your study pace."
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
                              <View style={styles.planBadge}>
                                <Text style={styles.planBadgeText}>{plan.badge}</Text>
                              </View>
                            ) : null}
                            {isCurrentPlan ? (
                              <View style={styles.planCurrentBadge}>
                                <Text style={styles.planCurrentBadgeText}>
                                  Current plan
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.planSupport}>{plan.supportText}</Text>
                        </View>
                        <Text style={styles.planPrice}>
                          {plan.priceLabel}
                          <Text style={styles.planCadence}>{plan.cadenceLabel}</Text>
                        </Text>
                      </View>

                      <Text style={styles.planDetail}>{plan.detailText}</Text>

                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          disablePlanButton && styles.disabledButton,
                        ]}
                        onPress={() =>
                          isPremium
                            ? isSwitchTarget
                              ? void handlePreviewSwitch(plan.id)
                              : undefined
                            : void handleCheckout(plan.id)
                        }
                        activeOpacity={0.82}
                        disabled={disablePlanButton}
                      >
                        <Text style={styles.primaryButtonText}>{planButtonLabel}</Text>
                      </TouchableOpacity>

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
                            <TouchableOpacity
                              style={[
                                styles.primaryButton,
                                styles.switchActionButton,
                                switchConfirmBusy && styles.disabledButton,
                              ]}
                              onPress={() => void handleConfirmSwitch()}
                              disabled={switchConfirmBusy}
                              activeOpacity={0.82}
                            >
                              <Text style={styles.primaryButtonText}>
                                {switchConfirmBusy
                                  ? "Switching..."
                                  : `Confirm ${plan.id}`}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.secondaryButton, styles.switchActionButton]}
                              onPress={() => setSwitchPreview(null)}
                              disabled={switchConfirmBusy}
                              activeOpacity={0.82}
                            >
                              <Text style={styles.secondaryButtonText}>
                                Keep current plan
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <Text style={styles.legalNote}>
                Web subscriptions are billed securely through Paddle. App Store
                and Google Play purchases continue to use their own billing
                systems.
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

const styles = StyleSheet.create({
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
  planHint: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.inkLight,
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
  syncNote: {
    fontSize: 13,
    lineHeight: 21,
    color: Sketch.accent,
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
  primaryButtonDisabled: {
    opacity: 0.72,
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
  disabledButton: {
    opacity: 0.55,
  },
  switchPreviewCard: {
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.line,
    backgroundColor: Sketch.cardBg,
  },
  switchPreviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  switchPreviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
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
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 14,
    minHeight: 212,
  },
  planCardSelected: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.cardBg,
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
  planCurrentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.paper,
  },
  planCurrentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.accent,
  },
  planSupport: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  planCadence: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  planDetail: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.accent,
  },
  legalNote: {
    fontSize: 13,
    lineHeight: 21,
    color: Sketch.inkMuted,
    marginTop: 18,
  },
});
