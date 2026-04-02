import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { getToneAccent, ToneName } from "@/src/utils/toneAccent";

type ToneDotsProps = {
  tones?: readonly ToneName[];
  size?: number;
  style?: StyleProp<ViewStyle>;
  dotStyle?: StyleProp<ViewStyle>;
};

export default function ToneDots({
  tones,
  size = 10,
  style,
  dotStyle,
}: ToneDotsProps) {
  if (!tones || tones.length === 0) {
    return null;
  }

  const dotRadius = size / 2;

  return (
    <View style={[styles.row, style]}>
      {tones.map((tone, index) => (
        <View
          key={`${tone}-${index}`}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: dotRadius,
              backgroundColor: getToneAccent(tone),
            },
            dotStyle,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
  },
});
