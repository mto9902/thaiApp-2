import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
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

export default function ProfileWeb() {
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
      <DesktopPage
        density="compact"
        eyebrow="Profile"
        title="Guest mode"
        subtitle="Log in to save progress, bookmarks, vocabulary, and grammar history."
      >
        <DesktopPanel style={styles.centerPanel}>
          <TouchableOpacity style={styles.primaryButton} onPress={logout} activeOpacity={0.82}>
            <Text style={styles.primaryButtonText}>Log in</Text>
          </TouchableOpacity>
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

  return (
    <DesktopPage
      density="compact"
      eyebrow="Profile"
      title={profileName}
      subtitle="Account, access, and progress in one place."
    >
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
          <View style={styles.accountText}>
            <Text style={styles.accountName}>{profileName}</Text>
            <Text style={styles.accountEmail}>{profile?.email}</Text>
            <Text style={styles.accountMeta}>
              {profile?.is_admin ? "Admin account" : "Progress stays tied to this account"}
            </Text>
          </View>
        </DesktopPanel>

        <DesktopPanel style={styles.accessPanel}>
          <DesktopSectionTitle
            title="Keystone Access"
            caption={accessCopy.caption}
          />
          <Text style={styles.accessBody}>{accessCopy.body}</Text>
          <TouchableOpacity
            style={[styles.primaryButton, premiumBusy && styles.disabledButton]}
            onPress={() => void openSubscriptionManager()}
            disabled={premiumBusy}
            activeOpacity={0.82}
          >
            <Text style={styles.primaryButtonText}>
              {premiumBusy ? "Loading..." : accessCopy.cta}
            </Text>
          </TouchableOpacity>
        </DesktopPanel>
      </View>

      <DesktopPanel>
        <DesktopSectionTitle
          title="Today’s Vocabulary"
          caption="See what needs attention today and keep new words moving."
        />
        <View style={styles.statGrid}>
          {[
            { label: "Reviews Due", value: reviewsDue, tone: Sketch.accent },
            { label: "Added Today", value: progress?.words_learned_today || 0, tone: Sketch.blue },
            { label: "Mastered", value: progress?.mastered_words || 0, tone: Sketch.green },
          ].map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: item.tone }]}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
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
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/explore" as any)}
              activeOpacity={0.82}
            >
              <Text style={[styles.statValue, { color: Sketch.accent }]}>{bookmarkedCount}</Text>
              <Text style={styles.statLabel}>Bookmarked</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCard, styles.wideStatCard]}
              onPress={() => router.push("/progress" as any)}
              activeOpacity={0.82}
            >
              <Text style={[styles.statValue, { color: Sketch.ink }]}>
                {grammarPracticedCount}
                <Text style={styles.statValueMuted}> / {grammarPoints.length}</Text>
              </Text>
              <Text style={styles.statLabel}>Topics Practiced</Text>
            </TouchableOpacity>
          </View>
        </DesktopPanel>

        <DesktopPanel style={styles.insightPanel}>
          <DesktopSectionTitle
            title="Insights"
            caption="Settings, stats, and account tools in one place."
          />
          <View style={styles.linkList}>
            {[
              { label: "Settings", route: "/settings", icon: "settings-outline" },
              ...(profile?.can_review_content
                ? [{ label: "Content Review", route: "/content-review", icon: "reader-outline" }]
                : []),
              ...(profile?.is_admin
                ? [{ label: "Admin Console", route: "/admin", icon: "construct-outline" }]
                : []),
              { label: "Vocab Stats", route: "/stats/vocab", icon: "bar-chart-outline" },
              { label: "Grammar Stats", route: "/stats/grammar", icon: "analytics-outline" },
            ].map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.linkRow}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.82}
              >
                <View style={styles.linkRowLeft}>
                  <Ionicons name={item.icon as any} size={18} color={Sketch.inkLight} />
                  <Text style={styles.linkText}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Sketch.inkMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.82}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
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
  },
  accessPanel: {
    flex: 0.95,
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
  },
  centerPanel: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  accountText: {
    gap: 4,
  },
  accountName: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.7,
  },
  accountEmail: {
    fontSize: 16,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  accountMeta: {
    fontSize: 13,
    color: Sketch.inkLight,
  },
  accessBody: {
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
  disabledButton: {
    opacity: 0.5,
  },
  statGrid: {
    flexDirection: "row",
    gap: 14,
  },
  grammarStatGrid: {
    flexDirection: "row",
    gap: 14,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 6,
  },
  wideStatCard: {
    flex: 1.35,
  },
  statValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "700",
    letterSpacing: -1,
  },
  statValueMuted: {
    color: Sketch.inkMuted,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  linkList: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  linkRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
  },
  logoutButton: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.red,
  },
});
