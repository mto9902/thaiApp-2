/**
 * VowelText
 *
 * Renders a Thai vowel example (e.g. "เกะ", "กา") with the consonant
 * placeholder ก in one color and the surrounding vowel characters in another.
 *
 * Usage:
 *   <VowelText example="เกะ" style={styles.bigChar} />
 */
import React from "react";
import { Text, TextStyle } from "react-native";

export const VOWEL_COLOR = "#7C3AED"; // violet — vowel highlight
export const CONSONANT_COLOR = "#1A1A1A"; // near-black — consonant

interface Props {
  example: string;
  style?: TextStyle | TextStyle[];
  vowelColor?: string;
  consonantColor?: string;
}

export default function VowelText({
  example,
  style,
  vowelColor = VOWEL_COLOR,
  consonantColor = CONSONANT_COLOR,
}: Props) {
  // Split on ก — every piece between/around it is a vowel character
  const parts = example.split("ก");

  const nodes: React.ReactNode[] = [];

  parts.forEach((part, i) => {
    // Vowel fragment (before / after ก)
    if (part.length > 0) {
      nodes.push(
        <Text key={`v-${i}`} style={{ color: vowelColor }}>
          {part}
        </Text>,
      );
    }
    // Consonant ก (between fragments)
    if (i < parts.length - 1) {
      nodes.push(
        <Text key={`c-${i}`} style={{ color: consonantColor }}>
          ก
        </Text>,
      );
    }
  });

  return <Text style={style}>{nodes}</Text>;
}
