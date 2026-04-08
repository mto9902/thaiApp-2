import type { StyleProp, TextStyle } from "react-native";
import { Text } from "react-native";

import { buildThaiToneSegments } from "@/src/utils/thaiToneSegments";
import type { ToneName } from "@/src/utils/toneAccent";
import { getToneAccent } from "@/src/utils/toneAccent";

type ToneThaiTextProps = {
  thai: string;
  tones?: ToneName[] | null;
  romanization?: string | null;
  displayThaiSegments?: string[] | null;
  style?: StyleProp<TextStyle>;
  fallbackColor?: string;
};

export default function ToneThaiText({
  thai,
  tones,
  romanization,
  displayThaiSegments,
  style,
  fallbackColor,
}: ToneThaiTextProps) {
  const segments = buildThaiToneSegments(
    thai,
    tones,
    romanization,
    displayThaiSegments,
  );

  return (
    <Text style={style}>
      {segments.map((segment, index) => (
        <Text
          key={`${segment.text}-${index}`}
          style={{
            color: segment.tone
              ? getToneAccent(segment.tone)
              : fallbackColor,
          }}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}
