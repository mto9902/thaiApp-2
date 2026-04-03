import { Sketch } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { usePremiumAccess } from "../subscription/usePremiumAccess";

type PremiumGateCardProps = {
  title: string;
  body: string;
  redirectTo?: string;
};

export default function PremiumGateCard({
  title,
  body,
  redirectTo,
}: PremiumGateCardProps) {
  const {
    busy,
    billingProvider,
    isSupported,
    canMakePurchases,
    openSubscriptionManager,
    restorePremiumAccess,
  } = usePremiumAccess();

  const primaryLabel = busy
    ? "Loading..."
    : billingProvider === "paddle"
      ? "See web plans"
      : !isSupported
        ? "Available on mobile"
        : !canMakePurchases
          ? "Subscriptions unavailable"
          : "Unlock Keystone Access";

  const supportText =
    billingProvider === "paddle"
      ? "Secure web checkout unlocks the same Keystone account you already use."
      : isSupported && canMakePurchases
        ? "Your purchase stays tied to this account."
        : "Keystone Access is not available in this build yet.";

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed-outline" size={18} color={Sketch.orange} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <TouchableOpacity
        style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}
        onPress={() => void openSubscriptionManager(redirectTo)}
        activeOpacity={0.82}
        disabled={busy}
      >
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </TouchableOpacity>

      <Text style={styles.supportText}>{supportText}</Text>

      {isSupported && canMakePurchases ? (
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => void restorePremiumAccess()}
          activeOpacity={0.78}
          disabled={busy}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 22,
    gap: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: Sketch.orange,
    borderWidth: 1,
    borderColor: Sketch.orange,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  supportText: {
    fontSize: 12,
    lineHeight: 18,
    color: Sketch.inkLight,
  },
  restoreButton: {
    alignSelf: "center",
    paddingTop: 4,
    paddingBottom: 2,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.orange,
  },
});
