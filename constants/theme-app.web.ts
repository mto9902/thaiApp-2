import { TextStyle, ViewStyle } from "react-native";

import {
  WEB_BODY_FONT,
  WEB_BRAND,
  WEB_CARD_SHADOW,
  WEB_CARD_SHADOW_HOVER,
  WEB_DISPLAY_FONT,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";

export const AppSketch = {
  background: WEB_BRAND.bg,
  surface: WEB_BRAND.paper,
  surfaceHover: "#F6F7F9",
  surfaceActive: "#F1F3F5",

  primary: WEB_BRAND.navy,
  primaryLight: WEB_BRAND.navyAlt,
  primaryDark: WEB_BRAND.navyDeep,

  success: "#7B9470",
  successLight: "#EFF4EC",
  warning: "#C8A951",
  warningLight: "#F5EFDA",
  danger: "#A16A6A",
  dangerLight: "#F3ECEC",

  ink: WEB_BRAND.ink,
  inkSecondary: WEB_BRAND.inkSoft,
  inkMuted: WEB_BRAND.muted,
  inkFaint: "#9CA3AF",

  border: WEB_BRAND.line,
  borderLight: "#F0F2F5",

  accent: WEB_BRAND.navy,
  paper: WEB_BRAND.bg,
  cardBg: WEB_BRAND.paper,
};

export const AppRadius = {
  xs: WEB_RADIUS.xs,
  sm: WEB_RADIUS.sm,
  md: WEB_RADIUS.md,
  lg: WEB_RADIUS.lg,
  xl: WEB_RADIUS.xl,
  full: WEB_RADIUS.full,
} as const;

export const appShadow = (size: "sm" | "md" | "lg" | "none" = "md"): ViewStyle => {
  if (size === "none") {
    return {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
      boxShadow: "none",
    } as any;
  }

  const boxShadow = size === "lg" ? WEB_CARD_SHADOW_HOVER : WEB_CARD_SHADOW;
  return {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    boxShadow,
  } as any;
};

export const AppTypography = {
  hero: {
    fontSize: 32,
    fontWeight: "800" as const,
    lineHeight: 40,
    color: AppSketch.ink,
    letterSpacing: -0.8,
    fontFamily: WEB_DISPLAY_FONT,
  } as TextStyle,

  title: {
    fontSize: 24,
    fontWeight: "800" as const,
    lineHeight: 32,
    color: AppSketch.ink,
    letterSpacing: -0.45,
    fontFamily: WEB_DISPLAY_FONT,
  } as TextStyle,

  heading: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
    color: AppSketch.ink,
    letterSpacing: -0.25,
    fontFamily: WEB_DISPLAY_FONT,
  } as TextStyle,

  subheading: {
    fontSize: 17,
    fontWeight: "700" as const,
    lineHeight: 24,
    color: AppSketch.ink,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  bodyLarge: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
    color: AppSketch.ink,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 24,
    color: AppSketch.ink,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 21,
    color: AppSketch.inkSecondary,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  label: {
    fontSize: 13,
    fontWeight: "700" as const,
    lineHeight: 18,
    color: AppSketch.ink,
    letterSpacing: 0.2,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  labelSmall: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
    color: AppSketch.inkSecondary,
    letterSpacing: 0.35,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
    color: AppSketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,

  captionSmall: {
    fontSize: 11,
    fontWeight: "600" as const,
    lineHeight: 14,
    color: AppSketch.inkFaint,
    fontFamily: WEB_BODY_FONT,
  } as TextStyle,
};

export const AppCard: ViewStyle = {
  backgroundColor: AppSketch.surface,
  borderRadius: AppRadius.lg,
  borderWidth: 1,
  borderColor: AppSketch.border,
  ...(appShadow("md") as any),
};

export const AppCardFlat: ViewStyle = {
  backgroundColor: AppSketch.surface,
  borderRadius: AppRadius.lg,
  borderWidth: 1,
  borderColor: AppSketch.border,
};

export const AppButtonPrimary: ViewStyle = {
  backgroundColor: AppSketch.primary,
  borderRadius: AppRadius.md,
  paddingHorizontal: 20,
  paddingVertical: 12,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: AppSketch.primaryDark,
  boxShadow: WEB_NAVY_BUTTON_SHADOW,
} as any;

export const AppButtonSecondary: ViewStyle = {
  backgroundColor: AppSketch.surface,
  borderRadius: AppRadius.md,
  borderWidth: 1,
  borderColor: AppSketch.border,
  paddingHorizontal: 20,
  paddingVertical: 12,
  alignItems: "center",
  justifyContent: "center",
  boxShadow: WEB_LIGHT_BUTTON_SHADOW,
} as any;

export const AppButtonGhost: ViewStyle = {
  backgroundColor: "transparent",
  borderRadius: AppRadius.md,
  paddingHorizontal: 16,
  paddingVertical: 10,
  alignItems: "center",
  justifyContent: "center",
};

export const AppSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const AppAnimation = {
  fast: 100,
  normal: 160,
  slow: 260,
} as const;

export const AppZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  tooltip: 40,
} as const;
