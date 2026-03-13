import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import { canAccessApp } from "../../src/utils/auth";
import { StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Sketch } from "@/constants/theme";
import "react-native-get-random-values";

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const allowed = await canAccessApp();

    if (!allowed) {
      router.replace("/login");
      return;
    }

    setCheckedAuth(true);
  }

  if (!checkedAuth) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Sketch.ink,
        tabBarInactiveTintColor: Sketch.inkMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 84,
          paddingBottom: 24,
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
        tabBarActiveTintColor: Sketch.ink,
        tabBarInactiveTintColor: Sketch.inkMuted,
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
        name="explore"
        options={{
          title: "Decks",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "layers" : "layers-outline"}
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
