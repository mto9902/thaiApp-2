import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { clearAuthState, isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getAllProgress, isGrammarPracticed } from "@/src/utils/grammarProgress";
import { getProfileDisplayName } from "@/src/utils/profileName";

import {
  BRAND,
  CARD_SHADOW,
  SettledPressable,
  SurfaceButton,
  SURFACE_PRESSED,
  SURFACE_SHADOW,
} from "./dashboardSurface";

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
      heading: "Keystone Access is active",
      body: "Manage your subscription or keep this account ready across web and mobile.",
      cta: "Manage Keystone Access",
    };
  }

  if (billingProvider === "paddle") {
    return {
      heading: "Unlock the rest of the course",
      body: "Keystone Access opens everything beyond the first 6 lessons, mixed practice, and unlimited bookmarks.",
      cta: "See plans",
    };
  }

  if (isSupported && canMakePurchases) {
    return {
      heading: "Unlock the rest of the course",
      body: "Keystone Access opens everything beyond the first 6 lessons, plus higher-level practice on mobile.",
      cta: "Unlock Keystone Access",
    };
  }

  return {
    heading: "Keystone Access unavailable",
    body: "This build is not configured for mobile checkout yet.",
    cta: "Keystone Access unavailable",
  };
}

export default function ProfileMobileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<VocabProgress | null>(null);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [bookmarkedCount, setBookmarkedCount] = useState(0);
  const [grammarPracticedCount, setGrammarPracticedCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const guest = await isGuestUser();
      setIsGuest(guest);

      if (guest) {
        setProfile(null);
        setProgress(null);
        setReviewsDue(0);
        setBookmarkedCount(0);
        setGrammarPracticedCount(0);
        return;
      }

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
    } catch (error) {
      console.error("[ProfileMobileScreen] loadData failed:", error);
    } finally {
      setLoading(false);
    }
  }, [grammarPoints]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData]),
  );

  const logout = useCallback(async () => {
    await clearAuthState();
    router.replace("/login");
  }, [router]);

  const accountName = isGuest ? "Guest User" : getProfileDisplayName(profile);
  const accessCopy = getAccessCopy({
    isPremium,
    billingProvider,
    isSupported,
    canMakePurchases,
  });
  const canOpenPlans =
    isPremium || billingProvider === "paddle" || isSupported || canMakePurchases;

  const insightItems = [
    { label: "Settings", route: "/settings" },
    ...(profile?.can_review_content
      ? [{ label: "Content Review", route: "/content-review" }]
      : []),
    ...(profile?.is_admin ? [{ label: "Admin Console", route: "/admin" }] : []),
    { label: "Vocab Stats", route: "/stats/vocab" },
    { label: "Grammar Stats", route: "/stats/grammar" },
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={BRAND.inkSoft} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isGuest ? styles.guestScrollContent : null,
            { paddingBottom: tabBarHeight + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isGuest ? (
            <View style={styles.guestStateWrap}>
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>Profile</Text>
              </View>
              <View style={styles.guestCardWrap}>
                <View style={[styles.card, styles.guestCard]}>
                  <View style={styles.guestIconWrap}>
                    <Ionicons name="person-outline" size={26} color={BRAND.inkSoft} />
                  </View>
                  <Text style={[styles.cardTitle, styles.centerText]}>Guest User</Text>
                  <Text style={[styles.bodyText, styles.centerText]}>
                    Log in to save your progress, bookmarks, vocabulary, and grammar history.
                  </Text>
                  <SurfaceButton label="Log in" variant="primary" onPress={logout} />
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Account</Text>
                <View style={styles.identityRow}>
                  <View style={styles.avatarWrap}>
                    <Ionicons name="person-outline" size={28} color={BRAND.ink} />
                  </View>
                  <View style={styles.identityCopy}>
                    <View style={styles.identityNameRow}>
                      <Text style={styles.accountName}>{accountName}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
                          {isPremium ? "Keystone Access" : "Standard"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.accountEmail}>
                      {profile?.email || "Loading email..."}
                    </Text>
                    <Text style={styles.accountMeta}>
                      {profile?.is_admin
                        ? "Admin tools are enabled on this account."
                        : "Your progress stays tied to this account."}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Keystone Access</Text>
                <Text style={styles.bodyText}>{accessCopy.body}</Text>
                <SurfaceButton
                  label={premiumBusy ? "Loading..." : accessCopy.cta}
                  variant="primary"
                  disabled={premiumBusy || !canOpenPlans}
                  onPress={() => void openSubscriptionManager()}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Today&apos;s vocabulary</Text>
                <Text style={styles.bodyText}>
                  See what needs attention today and keep new words moving.
                </Text>

                <View style={styles.metricGrid}>
                  {[
                    { label: "Reviews due", value: reviewsDue },
                    { label: "Added today", value: progress?.words_learned_today || 0 },
                    { label: "Mastered", value: progress?.mastered_words || 0 },
                  ].map((item) => (
                    <View key={item.label} style={styles.metricCard}>
                      <Text style={styles.metricValue}>{item.value}</Text>
                      <Text style={styles.metricLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Grammar</Text>
                <Text style={styles.bodyText}>
                  Track saved lessons and see how much of the path you have practiced.
                </Text>

                <View style={styles.metricButtonGrid}>
                  <SettledPressable
                    onPress={() => router.push("/explore" as any)}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.metricActionCard,
                      pressed ? styles.surfacePressed : null,
                    ]}
                  >
                    <Text style={styles.metricValue}>{bookmarkedCount}</Text>
                    <Text style={styles.metricLabel}>Bookmarked</Text>
                  </SettledPressable>

                  <SettledPressable
                    onPress={() => router.push("/progress" as any)}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.metricActionCard,
                      pressed ? styles.surfacePressed : null,
                    ]}
                  >
                    <Text style={styles.metricValue}>
                      {grammarPracticedCount}
                      <Text style={styles.metricValueSoft}> / {grammarPoints.length}</Text>
                    </Text>
                    <Text style={styles.metricLabel}>Topics practiced</Text>
                  </SettledPressable>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Insights</Text>
                <Text style={styles.bodyText}>
                  Settings, stats, and account tools in one place.
                </Text>

                <View style={styles.linkList}>
                  {insightItems.map((item, index) => (
                    <SettledPressable
                      key={item.route}
                      onPress={() => router.push(item.route as any)}
                      style={({ pressed }: { pressed: boolean }) => [
                        styles.linkRow,
                        index < insightItems.length - 1 ? styles.linkRowDivider : null,
                        pressed ? styles.surfacePressed : null,
                      ]}
                    >
                      <Text style={styles.linkText}>{item.label}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={BRAND.inkSoft}
                      />
                    </SettledPressable>
                  ))}
                </View>

                <SurfaceButton label="Log out" onPress={logout} />
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    flexGrow: 1,
    gap: 16,
  },
  guestScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  guestStateWrap: {
    flex: 1,
    gap: 16,
    justifyContent: "center",
  },
  guestCardWrap: {
    flex: 1,
    justifyContent: "center",
  },
  hero: {
    paddingTop: 4,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 14,
    ...CARD_SHADOW,
  },
  cardEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  centerText: {
    textAlign: "center",
  },
  guestCard: {
    alignItems: "center",
  },
  guestIconWrap: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    alignSelf: "center",
    ...SURFACE_SHADOW,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    ...SURFACE_SHADOW,
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  identityNameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  accountName: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
    flexShrink: 1,
  },
  accountEmail: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  accountMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  statusBadge: {
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
    ...SURFACE_SHADOW,
  },
  statusBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: BRAND.inkSoft,
  },
  metricGrid: {
    gap: 10,
  },
  metricCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  metricButtonGrid: {
    gap: 10,
  },
  metricActionCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
  },
  metricValueSoft: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  metricLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  linkList: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    overflow: "hidden",
    backgroundColor: BRAND.paper,
    ...SURFACE_SHADOW,
  },
  linkRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: BRAND.paper,
  },
  linkRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  linkText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
  },
  surfacePressed: {
    ...SURFACE_PRESSED,
  },
});
