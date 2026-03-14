import { Sketch } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LessonHeaderProps = {
  title?: string;
};

export default function LessonHeader({ title }: LessonHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={Sketch.inkLight} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{title || "LESSON"}</Text>
      </View>

      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="settings-outline" size={20} color={Sketch.inkLight} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
  },

  iconButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: 10,
    backgroundColor: Sketch.paperDark,
  },

  titleContainer: {
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  titleText: {
    fontWeight: "600",
    fontSize: 14,
    color: Sketch.ink,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
