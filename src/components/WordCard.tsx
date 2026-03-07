import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface WordCardProps {
  thai: string;
  english: string;
  backgroundColor: string;
  rotation?: number;
  onPress?: () => void;
}

export default function WordCard({
  thai,
  english,
  backgroundColor,
  rotation = 0,
  onPress,
}: WordCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor, transform: [{ rotate: `${rotation}deg` }] },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.thaiText}>{thai}</Text>
      <Text style={styles.englishText}>{english.toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
    minHeight: 90,
    margin: 5,

    // Comic shadow
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  thaiText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
    textAlign: "center",
  },

  englishText: {
    fontSize: 12,
    fontWeight: "900",
    color: "white",
    opacity: 0.9,
    textAlign: "center",
  },
});
