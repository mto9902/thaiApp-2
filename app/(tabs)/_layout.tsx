import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
    <Ionicons size={24} name={name} color={color} />
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
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setCheckedAuth(true);
  }

  if (!checkedAuth) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "#757575",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 90,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontWeight: "900",
          fontSize: 10,
          marginTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "LEARN",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon focused={focused} name="book" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "REVIEW",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon focused={focused} name="refresh" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "PROGRESS",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon
              focused={focused}
              name="bar-chart"
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon focused={focused} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  tabIconFocused: {
    backgroundColor: "#FFFF00",
    borderWidth: 2,
    borderColor: "black",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
});
