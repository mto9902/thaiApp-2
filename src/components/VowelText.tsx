/**
 * VowelText
 *
 * Renders a Thai vowel example (e.g. "เกะ", "กา", "กิ") with the consonant
 * placeholder ก in one color and vowel characters in another.
 *
 * Special case: Thai combining marks (ิ ี ึ ื ุ ู) sit visually above/below ก
 * and cannot be placed in a separate Text span — React Native renders them
 * attached to the preceding character's color. So when ก is immediately
 * followed by a combining mark (e.g. "กิ", "กือ"), the whole cluster is
 * treated as a vowel unit and colored violet, since ก is just a placeholder.
 *
 * Result by group:
 *   Group 1 – before:  [violet เ] + [grey ก] + [violet ะ]  →  เกะ
 *   Group 2 – after:   [grey ก] + [violet า]               →  กา
 *   Group 3 – above:   [violet กิ] (whole cluster)         →  กิ
 *   Group 4 – below:   [violet กุ] (whole cluster)         →  กุ
 *   Group 5-6 – mixed: combination of the above            →  เกือ
 *
 * Usage:
 *   <VowelText example="เกะ" style={styles.bigChar} />
 */
import React from "react";
import { Text, TextStyle } from "react-native";

export const VOWEL_COLOR = "#7C3AED"; // violet — vowel highlight
export const CONSONANT_COLOR = "#1A1A1A"; // near-black — consonant

// Thai combining marks: characters that sit above or below their base consonant.
// These cannot be separately colored from their base in React Native Text spans.
// Ranges: Mai Han Akat (0E31), Sara I–Phinthu (0E34–0E3A), Mai Taikhu–Thanthakat (0E47–0E4E)
const COMBINING = /^[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]+/;

type Segment =
  | { type: "consonant"; text: string }   // bare ก — no combining marks
  | { type: "vowel"; text: string }        // standalone vowel chars (เ า ะ อ …)
  | { type: "vowel-cluster"; text: string }; // ก + combining marks (กิ กี กื …)

function segmentExample(example: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let vowelBuf = "";

  while (i < example.length) {
    if (example[i] === "ก") {
      // Flush any buffered vowel characters before ก
      if (vowelBuf) {
        segments.push({ type: "vowel", text: vowelBuf });
        vowelBuf = "";
      }

      // Scan ahead: does ก have combining marks immediately after it?
      const rest = example.slice(i + 1);
      const combMatch = rest.match(COMBINING);

      if (combMatch) {
        // ก + combining mark(s) → one inseparable vowel cluster
        segments.push({ type: "vowel-cluster", text: "ก" + combMatch[0] });
        i += 1 + combMatch[0].length;
      } else {
        // Bare ก with no combining marks → consonant placeholder
        segments.push({ type: "consonant", text: "ก" });
        i += 1;
      }
    } else {
      vowelBuf += example[i];
      i += 1;
    }
  }

  // Flush any trailing vowel characters
  if (vowelBuf) {
    segments.push({ type: "vowel", text: vowelBuf });
  }

  return segments;
}

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
  const segments = segmentExample(example);

  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        const color =
          seg.type === "consonant" ? consonantColor : vowelColor;
        return (
          <Text key={i} style={{ color }}>
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}
