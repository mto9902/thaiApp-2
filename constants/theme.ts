/**
 * Sketch / hand-drawn UI theme
 * Inspired by notebook-style design with warm orange accents
 */

import { Platform, ViewStyle, TextStyle } from 'react-native';

// ── Core palette ──────────────────────────────────────────────────────────────
export const Sketch = {
  // Backgrounds
  paper: '#F5EFE6',          // warm cream paper
  paperDark: '#EDE6DA',      // slightly darker paper
  cardBg: '#FFFDF8',         // warm white for cards
  
  // Primary accent
  orange: '#E8844A',         // warm orange (primary)
  orangeLight: '#F2A66A',    // lighter orange
  orangeDark: '#D4693A',     // darker orange for pressed
  
  // Secondary
  yellow: '#F5CE6E',         // warm yellow (sticky notes)
  yellowLight: '#FBE8A6',    // light yellow
  
  // Neutrals
  ink: '#2D2926',            // dark charcoal (text, borders)
  inkLight: '#5C5550',       // lighter ink
  inkMuted: '#9B9490',       // muted text
  inkFaint: '#C8C0B8',       // faint borders/dividers
  
  // Functional
  green: '#6EAB73',          // success/correct
  red: '#D96B6B',            // error/wrong
  blue: '#6A9EC8',           // info
  purple: '#9B7CB8',         // accent
  pink: '#D98BAF',           // accent

  // Level colors  
  beginner: '#6EAB73',
  intermediate: '#6A9EC8',
  advanced: '#D96B6B',
};

// ── Sketch shadow (offset, no blur — comic-style) ────────────────────────────
export const sketchShadow = (size: number = 4): ViewStyle => ({
  shadowColor: Sketch.ink,
  shadowOffset: { width: size, height: size },
  shadowOpacity: 0.9,
  shadowRadius: 0,
  elevation: size,
});

// ── Common sketch card style ──────────────────────────────────────────────────
export const sketchCard: ViewStyle = {
  backgroundColor: Sketch.cardBg,
  borderWidth: 2.5,
  borderColor: Sketch.ink,
  borderRadius: 14,
  ...sketchShadow(4),
};

// ── Sketch button base ───────────────────────────────────────────────────────
export const sketchButton: ViewStyle = {
  borderWidth: 2.5,
  borderColor: Sketch.ink,
  borderRadius: 12,
  ...sketchShadow(3),
};

// ── Sketch input ─────────────────────────────────────────────────────────────
export const sketchInput: ViewStyle = {
  borderWidth: 2,
  borderColor: Sketch.ink,
  borderRadius: 10,
  backgroundColor: Sketch.cardBg,
  padding: 14,
};

// ── Typography presets ───────────────────────────────────────────────────────
export const sketchText = {
  heading: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Sketch.ink,
    letterSpacing: -0.5,
  } as TextStyle,
  
  title: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Sketch.ink,
  } as TextStyle,
  
  body: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Sketch.ink,
    lineHeight: 22,
  } as TextStyle,
  
  label: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Sketch.inkMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  
  caption: {
    fontSize: 12,
    fontWeight: '700' as const,
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
