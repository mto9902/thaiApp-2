import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, SketchRadius, sketchShadow } from "@/constants/theme";
import { API_BASE } from "../../src/config";
import { useGrammarCatalog } from "../../src/grammar/GrammarCatalogProvider";
import { usePremiumAccess } from "../../src/subscription/usePremiumAccess";
import { clearAuthState, isGuestUser } from "../../src/utils/auth";
import { getAuthToken } from "../../src/utils/authStorage";
import {
  getAllProgress,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";
import { getProfileDisplayName } from "../../src/utils/profileName";

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

export default function Profile() {
  const tabBarHeight = useBottomTabBarHeight();
  const { grammarPoints } = useGrammarCatalog();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<VocabProgress | null>(null);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [bookmarkedCount, setBookmarkedCount] = useState(0);
  const [grammarPracticedCount, setGrammarPracticedCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);

  const router = useRouter();
  const {
    busy: premiumBusy,
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

      const [meData, progressData, reviewData, bookmarksData] = await Promise.all(
        [
          meRes.ok ? meRes.json() : Promise.resolve(fallbackProfile),
          progressRes.json(),
          reviewRes.json(),
          bookmarksRes.ok ? bookmarksRes.json() : Promise.resolve([]),
        ],
      );

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
      let isActive = true;

      (async () => {
        const guest = await isGuestUser();
        if (!isActive) return;
        setIsGuest(guest);
        if (!guest) {
          await loadData();
        }
      })();

      return () => {
        isActive = false;
      };
    }, [loadData]),
  );

  async function logout() {
    await clearAuthState();
    router.replace("/login");
  }

  if (isGuest) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.centerWrap}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={28} color={Sketch.inkMuted} />
          </View>
          <Text style={styles.guestTitle}>Guest mode</Text>
          <Text style={styles.guestSub}>
            Log in to save your progress, bookmarks, vocabulary, and grammar
            history.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={logout}>
            <Text style={styles.primaryBtnText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const profileName = getProfileDisplayName(profile);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabBarHeight + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.accountHeader}>
          <Text style={styles.accountName}>{profileName}</Text>
          <Text style={styles.accountEmail}>
            {profile?.email || "Loading email..."}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Today&apos;s Vocabulary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Sketch.orange }]}>
              {reviewsDue}
            </Text>
            <Text style={styles.statLabel}>Vocab Reviews Due</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Sketch.blue }]}>
              {progress?.words_learned_today || 0}
            </Text>
            <Text style={styles.statLabel}>New Words Added</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Sketch.green }]}>
              {progress?.mastered_words || 0}
            </Text>
            <Text style={styles.statLabel}>Total Mastered</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Grammar</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/explore")}
            activeOpacity={0.8}
          >
            <Text style={[styles.statNum, { color: Sketch.orange }]}>
              {bookmarkedCount}
            </Text>
            <Text style={styles.statLabel}>Bookmarked</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, styles.wideStatCard]}
            onPress={() => router.push("/progress")}
            activeOpacity={0.8}
          >
            <Text style={[styles.statNum, { color: Sketch.ink }]}>
              {grammarPracticedCount}
              <Text style={styles.statNumMuted}> / {grammarPoints.length}</Text>
            </Text>
            <Text style={styles.statLabel}>Topics Practiced</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Keystone Access</Text>
        <View style={styles.premiumCard}>
          <View style={styles.premiumCardText}>
            <Text style={styles.premiumCardTitle}>
              {isPremium ? "Keystone Access is active" : "Unlock A1.2 and above"}
            </Text>
            <Text style={styles.premiumCardBody}>
              {isPremium
                ? "Manage your subscription and keep access to the full Keystone Access path."
                : isSupported
                  ? canMakePurchases
                    ? "Keystone Access opens the A1.2 to C2 curriculum and higher-level practice on mobile."
                    : "Add your RevenueCat mobile API keys to turn on Keystone Access in this build."
                  : "Keystone Access checkout is available in the mobile app for now."}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, premiumBusy && styles.primaryBtnDisabled]}
            onPress={() => void openSubscriptionManager()}
            activeOpacity={0.82}
            disabled={premiumBusy}
          >
            <Text style={styles.primaryBtnText}>
              {premiumBusy
                ? "Loading..."
                : isPremium
                  ? "Manage Keystone Access"
                  : isSupported && canMakePurchases
                    ? "Unlock Keystone Access"
                    : "Keystone Access on mobile"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.menuCard}>
          {[
            {
              label: "Settings",
              route: "/settings",
              icon: "settings-outline",
            },
            ...(profile?.can_review_content
              ? [
                  {
                    label: "Content Review",
                    route: "/content-review",
                    icon: "reader-outline",
                  },
                ]
              : []),
            ...(profile?.is_admin
              ? [
                  {
                    label: "Admin Console",
                    route: "/admin",
                    icon: "construct-outline",
                  },
                ]
              : []),
            {
              label: "Vocab Stats",
              route: "/stats/vocab",
              icon: "bar-chart-outline",
            },
            {
              label: "Grammar Stats",
              route: "/stats/grammar",
              icon: "analytics-outline",
            },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuRow,
                index < arr.length - 1 && styles.menuRowBorder,
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuRowLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={Sketch.inkLight}
                />
                <Text style={styles.menuRowText}>{item.label}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Sketch.inkMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { padding: 24, paddingBottom: 40, gap: 18 },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 12,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: SketchRadius.card,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    alignItems: "center",
    ...sketchShadow(2),
  },
  accountHeader: {
    paddingTop: 12,
    gap: 4,
  },
  accountName: {
    fontSize: 22,
    fontWeight: "600",
    color: Sketch.ink,
  },
  accountEmail: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  guestTitle: { fontSize: 22, fontWeight: "600", color: Sketch.ink },
  guestSub: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    alignItems: "center",
    ...sketchShadow(2),
  },
  wideStatCard: {
    flex: 2,
  },
  statNum: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statNumMuted: {
    fontSize: 18,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  premiumCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 16,
    gap: 14,
    ...sketchShadow(2),
  },
  premiumCardText: {
    gap: 6,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  premiumCardBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  menuCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    ...sketchShadow(2),
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuRowText: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.ink,
  },
  primaryBtn: {
    backgroundColor: Sketch.orange,
    borderRadius: SketchRadius.control,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  logoutBtn: {
    backgroundColor: Sketch.paperDark,
    borderRadius: SketchRadius.control,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    ...sketchShadow(2),
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.red,
  },
});
