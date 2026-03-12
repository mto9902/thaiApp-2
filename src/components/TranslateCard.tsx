import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sketch, sketchShadow } from "@/constants/theme";

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
          {breakdown?.length ? (
            breakdown.map((word, index) => (
              <Text
                key={index}
                style={[
                  styles.thaiText,
                  word?.grammar && styles.grammarHighlight,
                ]}
              >
                {word?.thai}
              </Text>
            ))
          ) : (
            <Text style={styles.thaiText}>{sentence}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
          <Ionicons name="volume-high" size={28} color={Sketch.ink} />
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
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    ...sketchShadow(6),
  },

  grammarLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Sketch.inkMuted,
    marginBottom: 4,
    letterSpacing: 1.5,
  },

  grammarValue: {
    fontSize: 18,
    fontWeight: "900",
    color: Sketch.ink,
    marginBottom: 5,
  },

  sentenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },

  thaiText: {
    fontSize: 44,
    fontWeight: "bold",
    color: Sketch.ink,
    textAlign: "center",
    marginBottom: 10,
  },

  grammarHighlight: {
    backgroundColor: Sketch.orange,
    borderWidth: 2,
    borderColor: Sketch.ink,
    paddingHorizontal: 6,
    borderRadius: 6,
    color: Sketch.cardBg,
  },

  audioButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Sketch.ink,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: Sketch.cardBg,
    ...sketchShadow(2),
  },

  divider: {
    height: 2,
    backgroundColor: Sketch.inkFaint,
    width: "100%",
    marginVertical: 15,
  },

  romanizationText: {
    fontSize: 18,
    fontStyle: "italic",
    color: Sketch.inkLight,
    textAlign: "center",
    fontWeight: "600",
  },

  englishContainer: {
    marginTop: 18,
    backgroundColor: Sketch.paperDark,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Sketch.inkFaint,
    borderStyle: "dashed",
    width: "100%",
    alignItems: "center",
  },

  englishLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: Sketch.inkMuted,
    marginBottom: 4,
    letterSpacing: 1,
  },

  englishText: {
    fontSize: 17,
    fontWeight: "800",
    color: Sketch.inkLight,
    textAlign: "center",
  },
});
