import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import { canAccessApp } from "../../src/utils/auth";
import { StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Sketch, sketchShadow } from "@/constants/theme";
import "react-native-get-random-values";

const CustomTabBarIcon = ({
  focused,
  name,
  color,
}: {
  focused: boolean;
  name: any;
  color: string;
}) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
    <Ionicons size={22} name={name} color={focused ? Sketch.ink : Sketch.inkMuted} />
  </View>
);

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
          height: 88,
          paddingBottom: 24,
          paddingTop: 8,
          backgroundColor: Sketch.paper,
          borderTopWidth: 2,
          borderTopColor: Sketch.ink,
        },
        tabBarLabelStyle: {
          fontWeight: "800",
          fontSize: 10,
          marginTop: 4,
          color: Sketch.ink,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon focused={focused} name="home-outline" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Library",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon focused={focused} name="book-outline" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Write",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon focused={focused} name="pencil-outline" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon focused={focused} name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  tabIconFocused: {
    backgroundColor: Sketch.orange,
    borderWidth: 2,
    borderColor: Sketch.ink,
    ...sketchShadow(2),
  },
});
