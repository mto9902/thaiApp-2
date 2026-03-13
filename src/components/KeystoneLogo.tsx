import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
};

/**
 * Keystone arch logo — a minimal arch with a gold keystone piece at the top.
 * Inspired by the architectural keystone concept.
 */
export default function KeystoneLogo({ size = 48 }: Props) {
  // viewBox is 100x100, scale with size
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Left pillar */}
      <Path
        d="M20 92 L20 45 Q20 42 22 40 L38 28 Q40 26.5 40 24 L40 92 Z"
        fill="#3A3A3A"
      />
      {/* Right pillar */}
      <Path
        d="M80 92 L80 45 Q80 42 78 40 L62 28 Q60 26.5 60 24 L60 92 Z"
        fill="#3A3A3A"
      />
      {/* Arch curve - left side */}
      <Path
        d="M22 40 Q22 20 50 12 L40 24 Q40 26.5 38 28 Z"
        fill="#4A4A4A"
      />
      {/* Arch curve - right side */}
      <Path
        d="M78 40 Q78 20 50 12 L60 24 Q60 26.5 62 28 Z"
        fill="#4A4A4A"
      />
      {/* Keystone piece (gold accent) */}
      <Path
        d="M43 8 L50 5 L57 8 L60 24 L50 12 L40 24 Z"
        fill="#E8C547"
      />
    </Svg>
  );
}
