import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import { canAccessApp } from "../../src/utils/auth";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Sketch } from "@/constants/theme";
import "react-native-get-random-values";

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    checkAuth();
  }, [checkAuth]);

  if (!checkedAuth) return null;

  const isMobileWeb = Platform.OS === "web";
  const tabBarTopPadding = isMobileWeb ? 4 : 8;
  const tabBarBottomPadding = isMobileWeb
    ? 6
    : Platform.OS === "android"
      ? Math.max(insets.bottom, 18)
      : Math.max(insets.bottom, 12);
  const tabBarHeight = isMobileWeb
    ? 58
    : 56 + tabBarBottomPadding + tabBarTopPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Sketch.ink,
        tabBarInactiveTintColor: Sketch.inkMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
        tabBarStyle: {
          ...(isMobileWeb
            ? ({
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1200,
              } as any)
            : null),
          height: tabBarHeight,
          paddingBottom: tabBarBottomPadding,
          paddingTop: tabBarTopPadding,
          paddingHorizontal: isMobileWeb ? 8 : 10,
          backgroundColor: Sketch.paper,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontWeight: "700",
          fontSize: isMobileWeb ? 10 : 11,
          marginTop: isMobileWeb ? 1 : 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "home" : "home-outline"}
              color={focused ? Sketch.ink : Sketch.inkMuted}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Grammar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "book" : "book-outline"}
              color={focused ? Sketch.ink : Sketch.inkMuted}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Bookmarks",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "bookmark" : "bookmark-outline"}
              color={focused ? Sketch.ink : Sketch.inkMuted}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "person" : "person-outline"}
              color={focused ? Sketch.ink : Sketch.inkMuted}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="sandbox"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="grammar-topics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="grammar-lesson/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
