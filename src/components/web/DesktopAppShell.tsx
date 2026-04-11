import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppSketch, AppRadius, AppSpacing, AppTypography } from "@/constants/theme-app";
import BrandMark from "@/src/components/BrandMark";
import KimiIcon from "@/src/components/app/KimiIcon";
import {
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
} from "@/src/components/web/designSystem";
import { DESKTOP_PAGE_WIDTH } from "@/src/components/web/desktopLayout";
import { canAccessApp } from "@/src/utils/auth";

type NavItem = {
  label: string;
  href: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: "alphabet" | "numbers";
  badge?: number;
};

const SHOW_NAV_ICONS = false;

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
    if (pathname.startsWith("/practice")) return "/progress";
    if (pathname.startsWith("/progress")) return "/progress";
    if (pathname.startsWith("/explore")) return "/explore";
    if (pathname.startsWith("/review")) return "/review";
    if (pathname.startsWith("/profile")) return "/profile";
    if (pathname.startsWith("/settings")) return "/settings";
    if (pathname.startsWith("/alphabet")) return "/alphabet/";
    if (pathname.startsWith("/vowels")) return "/alphabet/";
    if (pathname.startsWith("/trainer")) return "/alphabet/";
    if (pathname.startsWith("/numbers")) return "/numbers/";
    return "/";
  }, [pathname]);

  if (!checkedAuth) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.topbar}>
          <View style={styles.topbarInner}>
            <Pressable
              onPress={() => router.push("/" as any)}
              style={({ hovered, pressed }) => [
                styles.brandButton,
                (hovered || pressed) && styles.brandButtonHover,
              ]}
            >
              <BrandMark size={28} />
              <Text style={styles.brandText}>Keystone Thai</Text>
            </Pressable>

            <View style={styles.navCluster}>
              <View style={styles.navList}>
                {NAV_ITEMS.map((item) => {
                  const active = activeHref === item.href;
                  return (
                    <Pressable
                      key={item.href}
                      onPress={() => router.push(item.href as any)}
                      style={({ hovered, pressed }) => [
                        styles.navItem,
                        !SHOW_NAV_ICONS && styles.navItemTextOnly,
                        active && styles.navItemActive,
                        (hovered || pressed) && styles.navItemHover,
                      ]}
                    >
                      {SHOW_NAV_ICONS ? (
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
                      ) : null}
                      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                        {item.label}
                      </Text>
                      {item.badge ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.toolsDivider} />

              <View style={styles.toolsRow}>
                {TOOLS_ITEMS.map((item) => {
                  const active = activeHref === item.href;
                  return (
                    <Pressable
                      key={item.href}
                      onPress={() => router.push(item.href as any)}
                      style={({ hovered, pressed }) => [
                        styles.toolLink,
                        !SHOW_NAV_ICONS && styles.toolLinkTextOnly,
                        active && styles.toolLinkActive,
                        (hovered || pressed) && styles.toolLinkHover,
                      ]}
                    >
                      {SHOW_NAV_ICONS ? (
                        item.customIcon ? (
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
                        )
                      ) : null}
                      <Text style={[styles.toolLabel, active && styles.navLabelActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.accountRow}>
              <Pressable
                onPress={() => router.push("/profile" as any)}
                style={({ hovered, pressed }) => [
                  styles.profileButton,
                  (hovered || pressed) && styles.profileButtonActive,
                ]}
              >
                <View style={styles.avatar}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={AppSketch.inkMuted}
                  />
                </View>
                <Text style={styles.userLabel}>Profile</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/settings" as any)}
                style={({ hovered, pressed }) => [
                  styles.settingsItem,
                  (hovered || pressed) && styles.settingsItemActive,
                ]}
              >
                <Ionicons
                  name="settings-outline"
                  size={16}
                  color={AppSketch.inkMuted}
                />
              </Pressable>
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
    maxWidth: DESKTOP_PAGE_WIDTH,
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
    flexDirection: "row",
    gap: AppSpacing.sm,
    minWidth: 150,
    borderRadius: AppRadius.md,
    paddingHorizontal: 4,
    paddingVertical: 4,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  brandButtonHover: {
    opacity: 0.92,
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
    borderRadius: AppRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
    ...WEB_INTERACTIVE_TRANSITION,
  },
  navItemTextOnly: {
    gap: 0,
  },
  navItemActive: {
    backgroundColor: AppSketch.surface,
    borderColor: AppSketch.border,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  navItemHover: {
    opacity: 0.96,
    backgroundColor: AppSketch.surface,
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
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
    ...WEB_INTERACTIVE_TRANSITION,
  },
  toolLinkTextOnly: {
    gap: 0,
  },
  toolLinkActive: {
    backgroundColor: AppSketch.surface,
    borderColor: AppSketch.border,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  toolLinkHover: {
    opacity: 0.96,
    backgroundColor: AppSketch.surface,
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
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: AppRadius.md,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: AppSketch.border,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  profileButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  avatar: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  userLabel: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkSecondary,
  },
  settingsItem: {
    width: 40,
    height: 40,
    borderRadius: AppRadius.md,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: AppSketch.border,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    alignItems: "center",
    justifyContent: "center",
    ...WEB_INTERACTIVE_TRANSITION,
  },
  settingsItemActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
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
