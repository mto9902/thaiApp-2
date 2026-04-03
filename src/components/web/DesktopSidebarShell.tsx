import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import BrandMark from "@/src/components/BrandMark";
import { canAccessApp } from "@/src/utils/auth";

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: "home-outline",
  },
  {
    label: "Grammar",
    href: "/progress",
    icon: "book-outline",
  },
  {
    label: "Bookmarks",
    href: "/explore",
    icon: "bookmark-outline",
  },
  {
    label: "Vocabulary",
    href: "/review",
    icon: "albums-outline",
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  {
    label: "Profile",
    href: "/profile",
    icon: "person-outline",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "settings-outline",
  },
];

export default function DesktopSidebarShell({
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
    return "/";
  }, [pathname]);

  if (!checkedAuth) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.sidebar}>
          <View style={styles.brandBlock}>
            <View style={styles.brandRow}>
              <BrandMark size={34} />
              <View style={styles.brandTitleWrap}>
                <Text style={styles.brandEyebrow}>Keystone</Text>
                <Text style={styles.brandTitle}>Thai</Text>
              </View>
            </View>
          </View>

          <View style={styles.sidebarBody}>
            <View style={styles.navList}>
              {NAV_ITEMS.map((item) => {
                const active = activeHref === item.href;
                return (
                  <TouchableOpacity
                    key={item.href}
                    style={[styles.navItem, active && styles.navItemActive]}
                    onPress={() => router.push(item.href as any)}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.navIconBox, active && styles.navIconBoxActive]}>
                      <Ionicons
                        name={item.icon}
                        size={17}
                        color={active ? Sketch.paperDark : Sketch.inkMuted}
                      />
                    </View>
                    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.accountDock}>
              <Text style={styles.accountLabel}>Account</Text>
              <View style={styles.accountList}>
                {ACCOUNT_ITEMS.map((item) => {
                  const active = activeHref === item.href;
                  return (
                    <TouchableOpacity
                      key={item.href}
                      style={[styles.navItem, active && styles.navItemActive]}
                      onPress={() => router.push(item.href as any)}
                      activeOpacity={0.82}
                    >
                      <View style={[styles.navIconBox, active && styles.navIconBoxActive]}>
                        <Ionicons
                          name={item.icon}
                          size={17}
                          color={active ? Sketch.paperDark : Sketch.inkMuted}
                        />
                      </View>
                      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
    backgroundColor: Sketch.paper,
  },
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Sketch.paper,
  },
  sidebar: {
    width: 220,
    borderRightWidth: 1,
    borderRightColor: Sketch.inkFaint,
    backgroundColor: "#FAFAF8",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 20,
  },
  brandBlock: {
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandTitleWrap: {
    flex: 1,
    gap: 2,
  },
  brandEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  brandTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.4,
  },
  sidebarBody: {
    flex: 1,
    justifyContent: "space-between",
    gap: 18,
  },
  navList: {
    gap: 6,
  },
  accountDock: {
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  accountLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  accountList: {
    gap: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Sketch.paper,
    backgroundColor: Sketch.paper,
  },
  navItemActive: {
    borderColor: Sketch.accent,
    backgroundColor: Sketch.paper,
  },
  navIconBox: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  navIconBoxActive: {
    backgroundColor: Sketch.accent,
    borderColor: Sketch.accent,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
  navLabelActive: {
    color: Sketch.ink,
  },
  contentShell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Sketch.paper,
  },
});
