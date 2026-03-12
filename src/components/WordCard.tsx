import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WordCardProps {
  thai: string;
  english: string;
  romanization?: string;
  backgroundColor: string;
  rotation?: number;
  isGrammar?: boolean;
  onPress?: () => void;
}

export default function WordCard({
  thai,
  english,
  romanization,
  backgroundColor,
  rotation = 0,
  isGrammar = false,
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
      {isGrammar && (
        <View style={styles.grammarBadge}>
          <Text style={styles.grammarBadgeIcon}>🧩</Text>
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

  grammarCard: {
    borderStyle: "dashed",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.85)",
  },

  grammarBadge: {
    position: "absolute",
    top: 4,
    right: 4,
  },

  grammarBadgeIcon: {
    fontSize: 12,
  },

  thaiText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
    textAlign: "center",
  },

  romanText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    opacity: 0.85,
    marginBottom: 3,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  englishText: {
    fontSize: 12,
    fontWeight: "900",
    color: "white",
    opacity: 0.9,
    textAlign: "center",
  },
});
