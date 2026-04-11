import { Platform, TextStyle, ViewStyle } from "react-native";

import {
  WEB_BODY_FONT,
  WEB_BRAND,
  WEB_CARD_SHADOW,
  WEB_CARD_SHADOW_HOVER,
  WEB_DISPLAY_FONT,
  WEB_RADIUS,
  WEB_TONE,
} from "@/src/components/web/designSystem";

export const Sketch = {
  paper: WEB_BRAND.bg,
  paperDark: WEB_BRAND.paper,
  cardBg: WEB_BRAND.paper,

  accent: WEB_BRAND.navy,
  accentLight: WEB_BRAND.navyAlt,
  accentDark: WEB_BRAND.navyDeep,

  orange: WEB_BRAND.navy,

  yellow: "#C8A951",
  yellowLight: "#E8DBA8",

  ink: WEB_BRAND.ink,
  inkLight: WEB_BRAND.inkSoft,
  inkMuted: WEB_BRAND.muted,
  inkFaint: WEB_BRAND.line,

  green: WEB_TONE.rising,
  red: "#9D6B6B",
  blue: WEB_TONE.high,
  purple: WEB_TONE.falling,
  pink: "#B889A2",

  beginner: WEB_TONE.rising,
  intermediate: WEB_TONE.high,
  advanced: WEB_TONE.low,
};

export const SketchRadius = {
  card: WEB_RADIUS.lg,
  control: WEB_RADIUS.md,
  track: WEB_RADIUS.full,
  badge: WEB_RADIUS.full,
} as const;

export const sketchShadow = (size: number = 2): ViewStyle =>
  ({
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    boxShadow: size >= 3 ? WEB_CARD_SHADOW_HOVER : WEB_CARD_SHADOW,
  } as any);

export const sketchCard: ViewStyle = {
  backgroundColor: Sketch.cardBg,
  borderRadius: SketchRadius.card,
  borderWidth: 1,
  borderColor: Sketch.inkFaint,
  ...(sketchShadow(2) as any),
};

export const sketchButton: ViewStyle = {
  borderRadius: SketchRadius.control,
  borderWidth: 1,
  borderColor: Sketch.inkFaint,
};

export const sketchInput: ViewStyle = {
  borderWidth: 1,
  borderColor: Sketch.inkFaint,
  borderRadius: SketchRadius.control,
  backgroundColor: Sketch.cardBg,
  padding: 14,
};

export const sketchText = {
  heading: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Sketch.ink,
    letterSpacing: -0.5,
    fontFamily: WEB_DISPLAY_FONT,
  } as TextStyle,

  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Sketch.ink,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    color: Sketch.ink,
    lineHeight: 22,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,
};

const tintColorLight = Sketch.ink;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: Sketch.ink,
    background: Sketch.paper,
    tint: tintColorLight,
    icon: Sketch.inkMuted,
    tabIconDefault: Sketch.inkMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: WEB_BODY_FONT,
    serif: "ui-serif",
    rounded: WEB_BODY_FONT,
    mono: "ui-monospace",
  },
  default: {
    sans: WEB_BODY_FONT,
    serif: "serif",
    rounded: WEB_BODY_FONT,
    mono: "monospace",
  },
  web: {
    sans: WEB_BODY_FONT,
    serif: "Georgia, 'Times New Roman', serif",
    rounded: WEB_BODY_FONT,
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
