/**
 * Keystone — Clean, minimal UI theme
 * Inspired by modern language learning apps with terracotta accent
 */

import { Platform, ViewStyle, TextStyle } from 'react-native';

// ── Core palette ──────────────────────────────────────────────────────────────
export const Sketch = {
  // Backgrounds
  paper: '#FFFFFF',
  paperDark: '#F5F5F5',
  cardBg: '#FFFFFF',

  // Primary accent
  orange: '#C4613C',         // terracotta / burnt orange
  orangeLight: '#D4795A',
  orangeDark: '#A8502F',

  // Secondary
  yellow: '#E8C547',
  yellowLight: '#F5E6A3',

  // Neutrals
  ink: '#1A1A1A',
  inkLight: '#555555',
  inkMuted: '#999999',
  inkFaint: '#E0E0E0',

  // Functional
  green: '#4CAF50',
  red: '#E05252',
  blue: '#5B8DB8',
  purple: '#8B6BAE',
  pink: '#D98BAF',

  // Level colors
  beginner: '#4CAF50',
  intermediate: '#5B8DB8',
  advanced: '#E05252',
};

// ── Shadow (subtle, modern) ──────────────────────────────────────────────────
export const sketchShadow = (size: number = 4): ViewStyle => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: size / 2 },
  shadowOpacity: 0.06,
  shadowRadius: size,
  elevation: size / 2,
});

// ── Common card style ─────────────────────────────────────────────────────────
export const sketchCard: ViewStyle = {
  backgroundColor: Sketch.cardBg,
  borderRadius: 12,
  ...sketchShadow(4),
};

// ── Button base ──────────────────────────────────────────────────────────────
export const sketchButton: ViewStyle = {
  borderRadius: 10,
  ...sketchShadow(2),
};

// ── Input ────────────────────────────────────────────────────────────────────
export const sketchInput: ViewStyle = {
  borderWidth: 1,
  borderColor: Sketch.inkFaint,
  borderRadius: 10,
  backgroundColor: Sketch.cardBg,
  padding: 14,
};

// ── Typography presets ───────────────────────────────────────────────────────
export const sketchText = {
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Sketch.ink,
    letterSpacing: -0.5,
  } as TextStyle,

  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Sketch.ink,
  } as TextStyle,

  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Sketch.ink,
    lineHeight: 22,
  } as TextStyle,

  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Sketch.inkLight,
  } as TextStyle,
};

// ── Legacy colors (for themed components) ────────────────────────────────────
const tintColorLight = Sketch.ink;
const tintColorDark = '#fff';

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
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
