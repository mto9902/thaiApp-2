import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useCallback, useState } from "react";
import {
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
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";
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
import { API_BASE } from "@/src/config";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import ProfileMobileScreen from "@/src/screens/mobile/ProfileMobileScreen";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { clearAuthState, isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getAllProgress, isGrammarPracticed } from "@/src/utils/grammarProgress";

type UserProfile = {
  id: number;
  email: string;
  display_name?: string | null;
  is_admin?: boolean;
  can_review_content?: boolean;
};

type VocabProgress = {
  words_learned_today: number;
  mastered_words: number;
};

type JwtPayload = {
  userId?: number;
};

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
};

type MetricCardProps = {
  label: string;
  value: number | string;
  onPress: () => void;
  valueSuffix?: string;
  wide?: boolean;
};

type LinkRowProps = {
  label: string;
  onPress: () => void;
  isLast?: boolean;
};

const SOFT_LINE = "#E5E5E5";
const SOFT_PANEL = "#FAFAFA";

function titleCaseWords(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAccessCopy({
  isPremium,
  billingProvider,
  isSupported,
  canMakePurchases,
}: {
  isPremium: boolean;
  billingProvider: string | null;
  isSupported: boolean;
  canMakePurchases: boolean;
}) {
  if (isPremium) {
    return {
      caption: "Active on this account.",
      body: "Manage your subscription, switch plans, or keep this account ready across web and mobile.",
      cta: "Manage Keystone Access",
    };
  }

  if (billingProvider === "paddle") {
    return {
      caption: "Unlock the full Thai path on web.",
      body: "Keystone Access opens every Thai lesson beyond the first 6 lessons, mixed practice across what you study, and unlimited bookmarks.",
      cta: "See plans",
    };
  }

  if (isSupported && canMakePurchases) {
    return {
      caption: "Unlock the full Thai path on mobile.",
      body: "Keystone Access opens every Thai lesson beyond the first 6 lessons, along with mixed practice and higher-level study across the course.",
      cta: "Unlock Keystone Access",
    };
  }

  return {
    caption: "Unavailable in this build.",
    body: "Keystone Access is not configured in this build yet.",
    cta: "Keystone Access unavailable",
  };
}

function ActionButton({
  label,
  onPress,
  variant = "secondary",
  disabled,
  style,
  textStyle,
  icon,
}: ActionButtonProps) {
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

function MetricLinkCard({
  label,
  value,
  onPress,
  valueSuffix,
  wide,
}: MetricCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.metricActionCard,
        wide && styles.wideMetricCard,
        (hovered || pressed) && styles.metricActionCardActive,
      ]}
    >
      <Text selectable={false} style={styles.metricValue}>
        {value}
        {valueSuffix ? (
          <Text style={styles.metricValueMuted}>{valueSuffix}</Text>
        ) : null}
      </Text>
      <Text selectable={false} style={styles.metricLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function InsightLinkRow({ label, onPress, isLast }: LinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.linkRow,
        isLast && styles.linkRowLast,
        (hovered || pressed) && styles.linkRowActive,
      ]}
    >
      <View style={styles.linkRowLeft}>
        <Text selectable={false} style={styles.linkText}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Sketch.inkMuted} />
    </Pressable>
  );
}

export default function ProfileWeb() {
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <ProfileMobileScreen />;
  }

  return <DesktopProfileContent />;
}

function DesktopProfileContent() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<VocabProgress | null>(null);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [bookmarkedCount, setBookmarkedCount] = useState(0);
  const [grammarPracticedCount, setGrammarPracticedCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);

  const {
    busy: premiumBusy,
    billingProvider,
    isPremium,
    isSupported,
    canMakePurchases,
    openSubscriptionManager,
  } = usePremiumAccess();

  const loadData = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const decoded = jwtDecode<JwtPayload>(token);
      const fallbackProfile = {
        id: decoded.userId || 0,
        email: "",
        display_name: null,
      };

      const [meRes, progressRes, reviewRes, bookmarksRes, grammarProgress] =
        await Promise.all([
          fetch(`${API_BASE}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/vocab/progress`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/vocab/review`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/bookmarks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          getAllProgress(),
        ]);

      const [meData, progressData, reviewData, bookmarksData] = await Promise.all([
        meRes.ok ? meRes.json() : Promise.resolve(fallbackProfile),
        progressRes.json(),
        reviewRes.json(),
        bookmarksRes.ok ? bookmarksRes.json() : Promise.resolve([]),
      ]);

      setProfile({
        id: meData.id ?? fallbackProfile.id,
        email: meData.email ?? "",
        display_name: meData.display_name ?? null,
        is_admin: meData.is_admin ?? false,
        can_review_content: meData.can_review_content ?? false,
      });
      setProgress(progressData);

      const validBookmarkCount = Array.isArray(bookmarksData)
        ? bookmarksData.filter((bookmark: { grammar_id?: string }) =>
            grammarPoints.some((point) => point.id === bookmark.grammar_id),
          ).length
        : 0;
      setBookmarkedCount(validBookmarkCount);

      const practicedGrammarCount = grammarPoints.filter((point) =>
        isGrammarPracticed(grammarProgress[point.id]),
      ).length;
      setGrammarPracticedCount(practicedGrammarCount);

      if (reviewData?.done || reviewData?.waiting) {
        setReviewsDue(0);
      } else {
        const counts = reviewData?.counts ?? {};
        setReviewsDue(
          (counts.newCount ?? 0) +
            (counts.learningCount ?? 0) +
            (counts.reviewCount ?? 0),
        );
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }, [grammarPoints]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const guest = await isGuestUser();
        if (!active) return;
        setIsGuest(guest);
        if (!guest) {
          await loadData();
        }
      })();
      return () => {
        active = false;
      };
    }, [loadData]),
  );

  async function logout() {
    await clearAuthState();
    router.replace("/login");
  }

  if (isGuest) {
    return (
      <DesktopPage density="compact">
        <DesktopPanel style={[styles.centerPanel, styles.guestPanel]}>
          <View style={styles.guestPanelContent}>
            <View style={styles.guestAvatar}>
              <Ionicons name="person-outline" size={28} color={Sketch.inkMuted} />
            </View>
            <Text style={styles.guestTitle}>Guest User</Text>
            <Text style={styles.guestBody}>
              Log in to save your progress, bookmarks, vocabulary, and grammar history.
            </Text>
            <ActionButton
              label="Log in"
              onPress={logout}
              variant="primary"
              style={styles.guestButton}
            />
          </View>
        </DesktopPanel>
      </DesktopPage>
    );
  }

  const profileName =
    profile?.display_name?.trim() ||
    (profile?.email ? titleCaseWords(profile.email.split("@")[0] || "") : "") ||
    "Your account";
  const accessCopy = getAccessCopy({
    isPremium,
    billingProvider,
    isSupported,
    canMakePurchases,
  });
  const insightItems = [
    { label: "Settings", route: "/settings" },
    ...(profile?.can_review_content
      ? [
          {
            label: "Content Review",
            route: "/content-review",
          },
        ]
      : []),
    ...(profile?.is_admin
      ? [
          {
            label: "Admin Console",
            route: "/admin",
          },
        ]
      : []),
    { label: "Vocab Stats", route: "/stats/vocab" },
    { label: "Grammar Stats", route: "/stats/grammar" },
  ];

  return (
    <DesktopPage density="compact">
      <View style={styles.pageStack}>
        <View style={styles.topGrid}>
          <DesktopPanel style={styles.accountPanel}>
            <DesktopSectionTitle
              title="Account"
              caption={
                profile?.is_admin
                  ? "Admin tools are enabled on this account."
                  : "Your Keystone account details and synced study progress."
              }
            />

            <View style={styles.accountIdentityRow}>
              <View style={styles.accountAvatar}>
                <Ionicons name="person-outline" size={28} color={Sketch.ink} />
              </View>
              <View style={styles.accountText}>
                <View style={styles.accountNameRow}>
                  <Text style={styles.accountName}>{profileName}</Text>
                  <View style={styles.accountBadge}>
                    <Text style={styles.accountBadgeText}>
                      {isPremium ? "Keystone Access" : "Standard"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.accountEmail}>{profile?.email}</Text>
                <Text style={styles.accountMeta}>
                  {profile?.is_admin
                    ? "Admin account"
                    : "Progress stays tied to this account"}
                </Text>
              </View>
            </View>
          </DesktopPanel>

          <DesktopPanel style={styles.accessPanel}>
            <DesktopSectionTitle
              title="Keystone Access"
              caption={accessCopy.caption}
            />
            <Text style={styles.accessBody}>{accessCopy.body}</Text>
            <ActionButton
              label={premiumBusy ? "Loading..." : accessCopy.cta}
              onPress={() => void openSubscriptionManager()}
              variant="primary"
              disabled={premiumBusy}
              style={styles.accessButton}
            />
          </DesktopPanel>
        </View>

        <DesktopPanel>
          <DesktopSectionTitle
            title="Today’s Vocabulary"
            caption="See what needs attention today and keep new words moving."
          />
          <View style={styles.statGrid}>
            {[
              { label: "Reviews Due", value: reviewsDue },
              { label: "Added Today", value: progress?.words_learned_today || 0 },
              { label: "Mastered", value: progress?.mastered_words || 0 },
            ].map((item) => (
              <View key={item.label} style={styles.metricCard}>
                <Text style={styles.metricValue}>{item.value}</Text>
                <Text style={styles.metricLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </DesktopPanel>

        <View style={styles.bottomGrid}>
          <DesktopPanel style={styles.grammarPanel}>
            <DesktopSectionTitle
              title="Grammar"
              caption="Track saved lessons and how much of the Thai path you have practiced."
            />
            <View style={styles.grammarStatGrid}>
              <MetricLinkCard
                label="Bookmarked"
                value={bookmarkedCount}
                onPress={() => router.push("/explore" as any)}
              />
              <MetricLinkCard
                label="Topics Practiced"
                value={grammarPracticedCount}
                valueSuffix={` / ${grammarPoints.length}`}
                onPress={() => router.push("/progress" as any)}
                wide
              />
            </View>
          </DesktopPanel>

          <DesktopPanel style={styles.insightPanel}>
            <DesktopSectionTitle
              title="Insights"
              caption="Settings, stats, and account tools in one place."
            />
            <View style={styles.linkList}>
              {insightItems.map((item, index) => (
                <InsightLinkRow
                  key={item.route}
                  label={item.label}
                  onPress={() => router.push(item.route as any)}
                  isLast={index === insightItems.length - 1}
                />
              ))}
            </View>

            <ActionButton
              label="Log out"
              onPress={logout}
              style={styles.logoutButton}
            />
          </DesktopPanel>
        </View>
      </View>
    </DesktopPage>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 22,
  },
  topGrid: {
    flexDirection: "row",
    gap: 20,
  },
  accountPanel: {
    flex: 1.05,
    gap: 18,
  },
  accessPanel: {
    flex: 0.95,
    gap: 18,
  },
  bottomGrid: {
    flexDirection: "row",
    gap: 20,
  },
  grammarPanel: {
    flex: 0.95,
  },
  insightPanel: {
    flex: 1.05,
    gap: 16,
  },
  centerPanel: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  guestPanel: {
    minHeight: 320,
  },
  guestPanelContent: {
    width: "100%",
    maxWidth: 440,
    alignItems: "center",
    gap: 14,
  },
  guestAvatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  guestTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: Sketch.ink,
    fontFamily: WEB_DISPLAY_FONT,
    textAlign: "center",
  },
  guestBody: {
    maxWidth: 380,
    fontSize: 16,
    lineHeight: 26,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
    textAlign: "center",
  },
  guestButton: {
    minWidth: 180,
  },
  accountIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  accountAvatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  accountText: {
    flex: 1,
    gap: 4,
  },
  accountNameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  accountName: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    color: Sketch.ink,
    letterSpacing: -0.8,
    fontFamily: WEB_DISPLAY_FONT,
    flexShrink: 1,
  },
  accountEmail: {
    fontSize: 16,
    lineHeight: 24,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  accountMeta: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  },
  accountBadge: {
    minHeight: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  accountBadgeText: {
    color: Sketch.inkLight,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: WEB_BODY_FONT,
  },
  accessBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  accessButton: {
    width: "100%",
  },
  statGrid: {
    flexDirection: "row",
    gap: 14,
  },
  grammarStatGrid: {
    flexDirection: "row",
    gap: 14,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: SOFT_PANEL,
    padding: 20,
    gap: 8,
  },
  metricActionCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: SOFT_PANEL,
    padding: 20,
    gap: 8,
    boxShadow: WEB_CARD_SHADOW as any,
    userSelect: "none",
    ...WEB_INTERACTIVE_TRANSITION,
  },
  metricActionCardActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  wideMetricCard: {
    flex: 1.35,
  },
  metricValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1,
    color: Sketch.ink,
    fontFamily: WEB_DISPLAY_FONT,
  },
  metricValueMuted: {
    color: Sketch.inkLight,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    fontFamily: WEB_DISPLAY_FONT,
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  linkList: {
    borderWidth: 1,
    borderColor: SOFT_LINE,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    boxShadow: WEB_CARD_SHADOW as any,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_LINE,
    backgroundColor: "#FFFFFF",
    userSelect: "none",
    ...WEB_INTERACTIVE_TRANSITION,
  },
  linkRowLast: {
    borderBottomWidth: 0,
  },
  linkRowActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  linkRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: Sketch.ink,
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
    ...WEB_INTERACTIVE_TRANSITION,
  },
  primaryButton: {
    borderColor: "#0D2237",
    backgroundColor: Sketch.accent,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
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
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: Sketch.ink,
  },
  disabledButton: {
    opacity: 0.48,
  },
  logoutButton: {
    width: "100%",
  },
});
