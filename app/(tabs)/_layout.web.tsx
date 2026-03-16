import { Ionicons } from "@expo/vector-icons";
import { Slot, usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import { canAccessApp } from "@/src/utils/auth";

type NavItem = {
  label: string;
  subtitle: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    subtitle: "Dashboard",
    href: "/",
    icon: "home-outline",
  },
  {
    label: "Grammar",
    subtitle: "Units",
    href: "/progress",
    icon: "book-outline",
  },
  {
    label: "Bookmarks",
    subtitle: "Practice",
    href: "/explore",
    icon: "bookmark-outline",
  },
  {
    label: "Profile",
    subtitle: "Account",
    href: "/profile",
    icon: "person-outline",
  },
];

export default function WebTabsLayout() {
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
    if (pathname.startsWith("/profile")) return "/profile";
    return "/";
  }, [pathname]);

  if (!checkedAuth) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.sidebar}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandEyebrow}>Keystone Thai</Text>
            <Text style={styles.brandTitle}>Desktop</Text>
            <Text style={styles.brandBody}>
              A desktop workspace for grammar, review, and curriculum editing.
            </Text>
          </View>

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
                      size={18}
                      color={active ? "#fff" : Sketch.inkMuted}
                    />
                  </View>
                  <View style={styles.navText}>
                    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.navSubtitle}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.contentShell}>
          <Slot />
        </View>
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
    width: 260,
    borderRightWidth: 1,
    borderRightColor: Sketch.inkFaint,
    backgroundColor: "#FCFCFA",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 28,
  },
  brandBlock: {
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  brandEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  brandTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.7,
  },
  brandBody: {
    fontSize: 13,
    lineHeight: 21,
    color: Sketch.inkMuted,
  },
  navList: {
    gap: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  navItemActive: {
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  navIconBox: {
    width: 36,
    height: 36,
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
  navText: {
    flex: 1,
    gap: 1,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
  },
  navLabelActive: {
    color: Sketch.ink,
  },
  navSubtitle: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  contentShell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Sketch.paper,
  },
});
