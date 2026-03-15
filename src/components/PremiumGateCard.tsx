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
    isSupported,
    canMakePurchases,
    openSubscriptionManager,
    restorePremiumAccess,
  } = usePremiumAccess();

  const primaryLabel = !isSupported
    ? "Available on mobile"
    : !canMakePurchases
      ? "Set up subscriptions"
      : busy
        ? "Loading..."
        : "Unlock Keystone Access";

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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(196, 97, 60, 0.12)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: Sketch.inkMuted,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: Sketch.orange,
    borderRadius: 12,
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
  restoreButton: {
    alignSelf: "center",
    paddingTop: 2,
    paddingBottom: 4,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.orange,
  },
});
