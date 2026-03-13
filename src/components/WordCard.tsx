import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sketch } from "@/constants/theme";

interface WordCardProps {
  thai: string;
  english: string;
  romanization?: string;
  backgroundColor: string;
  rotation?: number;
  isGrammar?: boolean;
  toneColor?: string;
  onPress?: () => void;
}

export default function WordCard({
  thai,
  english,
  romanization,
  backgroundColor,
  rotation = 0,
  isGrammar = false,
  toneColor,
  onPress,
}: WordCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor, transform: [{ rotate: `${rotation}deg` }] },
        isGrammar && styles.grammarCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {toneColor && (
        <View style={[styles.toneDot, { backgroundColor: toneColor }]} />
      )}
      {isGrammar && (
        <View style={styles.grammarBadge}>
          <Text style={styles.grammarBadgeIcon}>*</Text>
        </View>
      )}
      <Text style={styles.thaiText}>{thai}</Text>
      {romanization ? (
        <Text style={styles.romanText}>{romanization}</Text>
      ) : null}
      <Text style={styles.englishText}>{english.toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
    minHeight: 90,
    margin: 5,
  },

  grammarCard: {
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: Sketch.inkFaint,
  },

  grammarBadge: {
    position: "absolute",
    top: 4,
    right: 6,
  },

  grammarBadgeIcon: {
    fontSize: 14,
    fontWeight: "900",
    color: Sketch.ink,
  },

  toneDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.4)",
  },

  thaiText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Sketch.ink,
    marginBottom: 4,
    textAlign: "center",
  },

  romanText: {
    fontSize: 10,
    fontWeight: "600",
    color: Sketch.inkMuted,
    opacity: 0.9,
    marginBottom: 3,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  englishText: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkLight,
    opacity: 0.9,
    textAlign: "center",
  },
});
