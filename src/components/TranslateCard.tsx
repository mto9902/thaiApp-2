import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Word = {
  thai: string;
  english: string;
  grammar?: boolean;
};

interface TranslateCardProps {
  sentence: string;
  breakdown: Word[];
  romanization: string;
  english?: string;
  grammarPoint?: string;
}

export default function TranslateCard({
  sentence,
  breakdown,
  romanization,
  english,
  grammarPoint = "FORMING QUESTIONS",
}: TranslateCardProps) {
  const playAudio = () => {
    Speech.speak(sentence, {
      language: "th-TH",
      rate: 0.9,
      pitch: 1.0,
    });
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.card}>
        <Text style={styles.grammarLabel}>GRAMMAR POINT</Text>
        <Text style={styles.grammarValue}>{grammarPoint.toUpperCase()}</Text>

        <View style={styles.divider} />

        <View style={styles.sentenceRow}>
          {breakdown && breakdown.length > 0 ? (
            breakdown.map((word, index) => (
              <Text
                key={index}
                style={[
                  styles.thaiText,
                  word.grammar && styles.grammarHighlight,
                ]}
              >
                {word.thai}
              </Text>
            ))
          ) : (
            <Text style={styles.thaiText}>{sentence}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
          <Ionicons name="volume-high" size={32} color="black" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.romanizationText}>"{romanization}"</Text>

        {english && (
          <View style={styles.englishContainer}>
            <Text style={styles.englishLabel}>ENGLISH TRANSLATION</Text>
            <Text style={styles.englishText}>{english}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },

  card: {
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  grammarLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9E9E9E",
    marginBottom: 4,
  },

  grammarValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "black",
    marginBottom: 5,
  },

  sentenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },

  thaiText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 10,
  },

  grammarHighlight: {
    backgroundColor: "#FFFF00",
    borderWidth: 2,
    borderColor: "black",
    paddingHorizontal: 6,
    borderRadius: 6,
  },

  audioButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  divider: {
    height: 2,
    backgroundColor: "#E0E0E0",
    width: "100%",
    marginVertical: 15,
  },

  romanizationText: {
    fontSize: 20,
    fontStyle: "italic",
    color: "#757575",
    textAlign: "center",
    fontWeight: "600",
  },

  englishContainer: {
    marginTop: 20,
    backgroundColor: "#FAFAFA",
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    width: "100%",
    alignItems: "center",
  },

  englishLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#9E9E9E",
    marginBottom: 4,
    letterSpacing: 1,
  },

  englishText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
  },
});
