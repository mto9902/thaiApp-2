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
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => router.replace("/")}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{title || "LESSON"}</Text>
      </View>

      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="settings-outline" size={24} color="black" />
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
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },

  titleContainer: {
    backgroundColor: "#FFFF00",
    borderWidth: 2,
    borderColor: "black",
    paddingHorizontal: 16,
    paddingVertical: 6,

    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  titleText: {
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
});
