import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppSketch, AppRadius, AppSpacing, AppTypography } from "@/constants/theme-app";
import KimiIcon from "@/src/components/app/KimiIcon";
import { canAccessApp } from "@/src/utils/auth";

type NavItem = {
  label: string;
  href: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: "alphabet" | "numbers";
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
    customIcon: "alphabet",
  },
  {
    label: "Numbers",
    href: "/numbers/",
    customIcon: "numbers",
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
        <View style={styles.topbar}>
          <View style={styles.topbarInner}>
            <TouchableOpacity
              style={styles.brandButton}
              onPress={() => router.push("/" as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.brandText}>Keystone Thai</Text>
            </TouchableOpacity>

            <View style={styles.navCluster}>
              <View style={styles.navList}>
                {NAV_ITEMS.map((item) => {
                  const active = activeHref === item.href;
                  return (
                    <TouchableOpacity
                      key={item.href}
                      style={[styles.navItem, active && styles.navItemActive]}
                      onPress={() => router.push(item.href as any)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.navIcon}>
                        {item.customIcon ? (
                          <KimiIcon
                            name={item.customIcon}
                            size={17}
                            color={active ? AppSketch.primary : AppSketch.inkMuted}
                          />
                        ) : (
                          <Ionicons
                            name={item.icon as keyof typeof Ionicons.glyphMap}
                            size={17}
                            color={active ? AppSketch.primary : AppSketch.inkMuted}
                            style={styles.navIconGlyph}
                          />
                        )}
                      </View>
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

              <View style={styles.toolsDivider} />

              <View style={styles.toolsRow}>
                {TOOLS_ITEMS.map((item) => {
                  const active = activeHref === item.href;
                  return (
                    <TouchableOpacity
                      key={item.href}
                      style={[styles.toolLink, active && styles.toolLinkActive]}
                      onPress={() => router.push(item.href as any)}
                      activeOpacity={0.85}
                    >
                      {item.customIcon ? (
                        <KimiIcon
                          name={item.customIcon}
                          size={16}
                          color={active ? AppSketch.primary : AppSketch.inkMuted}
                        />
                      ) : (
                        <Ionicons
                          name={item.icon as keyof typeof Ionicons.glyphMap}
                          size={16}
                          color={active ? AppSketch.primary : AppSketch.inkMuted}
                        />
                      )}
                      <Text style={[styles.toolLabel, active && styles.navLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.accountRow}>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push("/profile" as any)}
                activeOpacity={0.85}
              >
                <View style={styles.avatar}>
                  <Ionicons name="person" size={14} color={AppSketch.inkMuted} />
                </View>
                <Text style={styles.userLabel}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => router.push("/settings" as any)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="settings-outline"
                  size={16}
                  color={AppSketch.inkMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
    backgroundColor: AppSketch.background,
  },

  topbar: {
    backgroundColor: AppSketch.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppSketch.border,
    ...Platform.select({
      web: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
      },
    }),
  },
  topbarInner: {
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
    minHeight: 72,
    paddingHorizontal: AppSpacing.xl,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: AppSpacing.lg,
  },

  brandButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 150,
  },
  brandText: {
    ...AppTypography.subheading,
    color: AppSketch.ink,
  },

  navCluster: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: AppSpacing.md,
  },
  navList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: AppRadius.xs,
    gap: 8,
  },
  navItemActive: {
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  navIcon: {
    width: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconGlyph: {
    width: 18,
    textAlign: "center",
  },
  navLabel: {
    ...AppTypography.label,
    color: AppSketch.inkSecondary,
  },
  navLabelActive: {
    color: AppSketch.primary,
  },
  badge: {
    marginLeft: 2,
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.xs,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  toolsDivider: {
    width: 1,
    height: 24,
    backgroundColor: AppSketch.border,
  },
  toolsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toolLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: AppRadius.xs,
  },
  toolLinkActive: {
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  toolLabel: {
    ...AppTypography.labelSmall,
    color: AppSketch.inkMuted,
  },

  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 140,
    justifyContent: "flex-end",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: AppRadius.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: AppRadius.xs,
    backgroundColor: AppSketch.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  userLabel: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkSecondary,
  },
  settingsItem: {
    padding: 8,
    borderRadius: AppRadius.xs,
  },

  contentShell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: AppSketch.background,
    ...Platform.select({
      web: {
        paddingTop: 78,
      },
    }),
  },
});
