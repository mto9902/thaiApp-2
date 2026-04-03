import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppSketch, AppRadius, appShadow, AppTypography } from "@/constants/theme-app";
import BrandMark from "@/src/components/BrandMark";
import { canAccessApp } from "@/src/utils/auth";

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: "home-outline",
  },
  {
    label: "Grammar Path",
    href: "/progress",
    icon: "book-outline",
  },
  {
    label: "Vocabulary",
    href: "/review",
    icon: "albums-outline",
  },
  {
    label: "Bookmarks",
    href: "/explore",
    icon: "bookmark-outline",
  },
];

const TOOLS_ITEMS: NavItem[] = [
  {
    label: "Alphabet",
    href: "/alphabet/",
    icon: "language-outline",
  },
  {
    label: "Numbers",
    href: "/numbers/",
    icon: "calculator-outline",
  },
  {
    label: "Tones",
    href: "/tones/",
    icon: "musical-notes-outline",
  },
];

export default function DesktopAppShell({
  children,
}: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  const checkAuth = useCallback(async () => {
    const allowed = await canAccessApp();
    if (!allowed) {
      router.replace("/login");
      return;
    }
    setCheckedAuth(true);
  }, [router]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const activeHref = useMemo(() => {
    if (pathname === "/" || pathname === "") return "/";
    if (pathname.startsWith("/progress")) return "/progress";
    if (pathname.startsWith("/explore")) return "/explore";
    if (pathname.startsWith("/review")) return "/review";
    if (pathname.startsWith("/profile")) return "/profile";
    if (pathname.startsWith("/settings")) return "/settings";
    if (pathname.startsWith("/alphabet")) return "/alphabet/";
    if (pathname.startsWith("/numbers")) return "/numbers/";
    if (pathname.startsWith("/tones")) return "/tones/";
    return "/";
  }, [pathname]);

  if (!checkedAuth) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.shell}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          {/* Brand */}
          <View style={styles.brandSection}>
            <View style={styles.brandRow}>
              <BrandMark size={28} />
              <Text style={styles.brandText}>Keystone</Text>
            </View>
          </View>

          {/* Main Navigation */}
          <View style={styles.navSection}>
            <Text style={styles.sectionLabel}>Learn</Text>
            <View style={styles.navList}>
              {NAV_ITEMS.map((item) => {
                const active = activeHref === item.href;
                return (
                  <TouchableOpacity
                    key={item.href}
                    style={[styles.navItem, active && styles.navItemActive]}
                    onPress={() => router.push(item.href as any)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? AppSketch.primary : AppSketch.inkMuted}
                      style={styles.navIcon}
                    />
                    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                    {item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tools Section */}
          <View style={styles.navSection}>
            <Text style={styles.sectionLabel}>Tools</Text>
            <View style={styles.navList}>
              {TOOLS_ITEMS.map((item) => {
                const active = activeHref === item.href;
                return (
                  <TouchableOpacity
                    key={item.href}
                    style={[styles.navItem, active && styles.navItemActive]}
                    onPress={() => router.push(item.href as any)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? AppSketch.primary : AppSketch.inkMuted}
                      style={styles.navIcon}
                    />
                    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => router.push("/profile" as any)}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={14} color={AppSketch.inkMuted} />
              </View>
              <Text style={styles.userLabel}>Profile</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={AppSketch.inkFaint}
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => router.push("/settings" as any)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="settings-outline"
                size={16}
                color={AppSketch.inkMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentShell}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppSketch.background,
  },
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: AppSketch.background,
  },
  
  // Sidebar
  sidebar: {
    width: 240,
    backgroundColor: AppSketch.surface,
    borderRightWidth: 1,
    borderRightColor: AppSketch.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 24,
    ...Platform.select({
      web: {
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
      },
    }),
  },
  
  // Brand
  brandSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppSketch.borderLight,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandText: {
    ...AppTypography.subheading,
    color: AppSketch.ink,
  },
  
  // Navigation Sections
  navSection: {
    gap: 10,
  },
  sectionLabel: {
    ...AppTypography.labelSmall,
    color: AppSketch.inkFaint,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: AppRadius.sm,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: `${AppSketch.primary}10`,
  },
  navIcon: {
    width: 20,
    textAlign: 'center',
  },
  navLabel: {
    ...AppTypography.label,
    color: AppSketch.inkSecondary,
  },
  navLabelActive: {
    color: AppSketch.primary,
  },
  badge: {
    marginLeft: 'auto',
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Bottom Section
  bottomSection: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppSketch.borderLight,
    gap: 8,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: AppRadius.sm,
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: AppRadius.full,
    backgroundColor: AppSketch.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLabel: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkSecondary,
  },
  settingsItem: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: AppRadius.sm,
  },
  
  // Content
  contentShell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: AppSketch.background,
    ...Platform.select({
      web: {
        marginLeft: 240,
      },
    }),
  },
});
