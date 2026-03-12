import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sketch, sketchShadow } from "@/constants/theme";

type LessonHeaderProps = {
  title?: string;
};

export default function LessonHeader({ title }: LessonHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{title || "LESSON"}</Text>
      </View>

      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="settings-outline" size={22} color={Sketch.ink} />
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
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 10,
    backgroundColor: Sketch.cardBg,
    ...sketchShadow(2),
  },

  titleContainer: {
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    ...sketchShadow(3),
  },

  titleText: {
    fontWeight: "900",
    fontSize: 15,
    color: Sketch.cardBg,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
