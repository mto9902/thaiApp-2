import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppRadius, AppSketch, AppTypography } from "@/constants/theme-app";
import { DESKTOP_PAGE_WIDTHS } from "@/src/components/web/desktopLayout";

type RouteLink = {
  label: string;
  route: string;
  note: string;
  public: boolean;
  priority?: boolean;
};

const PUBLIC_LINKS: RouteLink[] = [
  {
    label: "Login",
    route: "/login",
    note: "Best starting point if a route redirects or needs guest access.",
    public: true,
    priority: true,
  },
  {
    label: "Premium",
    route: "/premium",
    note: "Public paywall and billing flow.",
    public: true,
    priority: true,
  },
  {
    label: "Alphabet",
    route: "/alphabet/",
    note: "Reading foundations and consonant groups.",
    public: true,
  },
  {
    label: "Numbers",
    route: "/numbers/",
    note: "Counting, quantities, and time.",
    public: true,
  },
  {
    label: "Tones",
    route: "/tones/",
    note: "Tone examples and listening.",
    public: true,
    priority: true,
  },
  {
    label: "Trainer",
    route: "/trainer/",
    note: "Reading drills and quick recall.",
    public: true,
  },
];

const AUTH_LINKS: RouteLink[] = [
  {
    label: "Home",
    route: "/",
    note: "Main app home and current progress.",
    public: false,
    priority: true,
  },
  {
    label: "Grammar Path",
    route: "/progress",
    note: "Curriculum detail and path overview.",
    public: false,
    priority: true,
  },
  {
    label: "Review",
    route: "/review/",
    note: "Vocabulary review queue.",
    public: false,
    priority: true,
  },
  {
    label: "Bookmarks",
    route: "/explore",
    note: "Saved grammar and practice.",
    public: false,
  },
  {
    label: "Profile",
    route: "/profile",
    note: "Account and subscription status.",
    public: false,
  },
  {
    label: "Settings",
    route: "/settings",
    note: "Display, exercise, and account preferences.",
    public: false,
  },
];

function LinkCard({
  item,
  origin,
  onPress,
}: {
  item: RouteLink;
  origin: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.linkCard, item.priority && styles.linkCardPriority]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.linkTop}>
        <View style={styles.linkHeading}>
          <Text style={styles.linkTitle}>{item.label}</Text>
          <Text style={styles.linkPath}>{origin}{item.route}</Text>
        </View>
        <View style={[styles.badge, item.public ? styles.badgePublic : styles.badgeAuth]}>
          <Text style={[styles.badgeText, item.public ? styles.badgeTextPublic : styles.badgeTextAuth]}>
            {item.public ? "Public" : "Login"}
          </Text>
        </View>
      </View>
      <Text style={styles.linkNote}>{item.note}</Text>
    </TouchableOpacity>
  );
}

export default function SkimPage() {
  const router = useRouter();

  const origin = useMemo(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return "https://thai.keystonelanguages.com";
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Bug Skim Hub</Text>
          <Text style={styles.title}>Temporary cloud-AI test page</Text>
          <Text style={styles.subtitle}>
            Feed this page to a cloud AI when you want a quick skim of the app. It links to
            the main public surfaces first, then the signed-in routes.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => router.push("/login" as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="log-in-outline" size={16} color="#fff" />
              <Text style={styles.primaryActionText}>Start at login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => router.push("/premium" as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="rocket-outline" size={16} color={AppSketch.primary} />
              <Text style={styles.secondaryActionText}>Open premium</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.noteStrip}>
          <Text style={styles.noteStripTitle}>Recommended flow</Text>
          <Text style={styles.noteStripBody}>
            1. Open Login. 2. Continue as guest or sign in. 3. Check Home, Grammar Path,
            Review, and Premium. 4. Skim Alphabet, Numbers, and Tones for public-tool regressions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Public routes</Text>
          <Text style={styles.sectionSubtitle}>
            These should open without requiring auth.
          </Text>
          <View style={styles.grid}>
            {PUBLIC_LINKS.map((item) => (
              <LinkCard
                key={item.route}
                item={item}
                origin={origin}
                onPress={() => router.push(item.route as any)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signed-in routes</Text>
          <Text style={styles.sectionSubtitle}>
            These are the main app surfaces once auth or guest access is active.
          </Text>
          <View style={styles.grid}>
            {AUTH_LINKS.map((item) => (
              <LinkCard
                key={item.route}
                item={item}
                origin={origin}
                onPress={() => router.push(item.route as any)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppSketch.background,
  },
  content: {
    width: "100%",
    maxWidth: DESKTOP_PAGE_WIDTHS.utility,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
  },
  hero: {
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.sm,
    padding: 28,
    gap: 10,
  },
  eyebrow: {
    ...AppTypography.labelSmall,
    color: AppSketch.primary,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  title: {
    ...AppTypography.hero,
  },
  subtitle: {
    ...AppTypography.body,
    color: AppSketch.inkSecondary,
    maxWidth: 760,
  },
  heroActions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 6,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: AppRadius.xs,
    backgroundColor: AppSketch.primary,
  },
  primaryActionText: {
    ...AppTypography.label,
    color: "#fff",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: AppRadius.xs,
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  secondaryActionText: {
    ...AppTypography.label,
    color: AppSketch.primary,
  },
  noteStrip: {
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.sm,
    padding: 20,
    gap: 6,
  },
  noteStripTitle: {
    ...AppTypography.subheading,
  },
  noteStripBody: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkSecondary,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...AppTypography.heading,
  },
  sectionSubtitle: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  linkCard: {
    width: Platform.select({ web: "48.8%" as const, default: "100%" as const }),
    minWidth: 280,
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.sm,
    padding: 18,
    gap: 10,
  },
  linkCardPriority: {
    borderColor: `${AppSketch.primary}28`,
    backgroundColor: `${AppSketch.primary}04`,
  },
  linkTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  linkHeading: {
    flex: 1,
    gap: 4,
  },
  linkTitle: {
    ...AppTypography.subheading,
  },
  linkPath: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
  },
  linkNote: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppRadius.xs,
    borderWidth: 1,
  },
  badgePublic: {
    backgroundColor: AppSketch.surface,
    borderColor: `${AppSketch.primary}24`,
  },
  badgeAuth: {
    backgroundColor: AppSketch.surface,
    borderColor: AppSketch.border,
  },
  badgeText: {
    ...AppTypography.captionSmall,
  },
  badgeTextPublic: {
    color: AppSketch.primary,
  },
  badgeTextAuth: {
    color: AppSketch.inkMuted,
  },
});
