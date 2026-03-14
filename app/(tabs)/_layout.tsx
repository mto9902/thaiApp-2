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

  const tabBarBottomPadding =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 18)
      : Math.max(insets.bottom, 12);
  const tabBarHeight = 50 + tabBarBottomPadding + 10;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Sketch.ink,
        tabBarInactiveTintColor: Sketch.inkMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: tabBarBottomPadding,
          paddingTop: 10,
          backgroundColor: Sketch.paper,
          borderTopWidth: 1,
          borderTopColor: Sketch.inkFaint,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontWeight: "500",
          fontSize: 11,
          marginTop: 4,
          color: Sketch.inkMuted,
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
    </Tabs>
  );
}
