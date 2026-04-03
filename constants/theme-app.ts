/**
 * Keystone App Theme — Modern, app-like design system
 * Softer corners, subtle shadows, focused actions
 */

import { Platform, ViewStyle, TextStyle } from 'react-native';
import { Sketch as BaseSketch } from './theme';

// ── Core Palette (App Feel) ───────────────────────────────────────────────────
export const AppSketch = {
  // Backgrounds (warmer, softer)
  background: '#F5F5F3',           // Main page background
  surface: '#FFFFFF',              // Cards, elevated surfaces
  surfaceHover: '#FAFAF9',         // Hover state
  surfaceActive: '#F3F4F6',        // Active/pressed state
  
  // Primary accent (keeping brand color)
  primary: BaseSketch.accent,      // #2E4057
  primaryLight: '#3D5470',
  primaryDark: '#1F2D3F',
  
  // Semantic colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  
  // Neutrals
  ink: '#111827',                  // Primary text
  inkSecondary: '#4B5563',         // Secondary text
  inkMuted: '#6B7280',             // Tertiary/muted text
  inkFaint: '#9CA3AF',             // Placeholder, disabled
  
  // Borders (subtle)
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Legacy compatibility
  accent: BaseSketch.accent,
  paper: BaseSketch.paper,
  cardBg: '#FFFFFF',
};

// ── Radius (softened for app feel) ────────────────────────────────────────────
export const AppRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ── Shadows (soft, modern) ────────────────────────────────────────────────────
export const appShadow = (size: 'sm' | 'md' | 'lg' | 'none' = 'md'): ViewStyle => {
  if (size === 'none') {
    return {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    };
  }
  
  const shadows = {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  };
  
  return shadows[size];
};

// ── Typography (refined scale) ────────────────────────────────────────────────
export const AppTypography = {
  // Display
  hero: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    color: AppSketch.ink,
    letterSpacing: -0.5,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    color: AppSketch.ink,
    letterSpacing: -0.3,
  },
  
  // Headings
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: AppSketch.ink,
  },
  
  subheading: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: AppSketch.ink,
  },
  
  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: AppSketch.ink,
  },
  
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: AppSketch.ink,
  },
  
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: AppSketch.inkSecondary,
  },
  
  // UI
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    color: AppSketch.ink,
    letterSpacing: 0.2,
  },
  
  labelSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    color: AppSketch.inkSecondary,
    letterSpacing: 0.3,
  },
  
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: AppSketch.inkMuted,
  },
  
  captionSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
    color: AppSketch.inkFaint,
  },
};

// ── Component Presets ─────────────────────────────────────────────────────────
export const AppCard: ViewStyle = {
  backgroundColor: AppSketch.surface,
  borderRadius: AppRadius.lg,
  ...appShadow('md'),
};

export const AppCardFlat: ViewStyle = {
  backgroundColor: AppSketch.surface,
  borderRadius: AppRadius.lg,
  borderWidth: 1,
  borderColor: AppSketch.border,
};

export const AppButtonPrimary: ViewStyle = {
  backgroundColor: AppSketch.primary,
  borderRadius: AppRadius.sm,
  paddingHorizontal: 20,
  paddingVertical: 12,
  alignItems: 'center',
  justifyContent: 'center',
};

export const AppButtonSecondary: ViewStyle = {
  backgroundColor: AppSketch.surface,
  borderRadius: AppRadius.sm,
  borderWidth: 1,
  borderColor: AppSketch.border,
  paddingHorizontal: 20,
  paddingVertical: 12,
  alignItems: 'center',
  justifyContent: 'center',
};

export const AppButtonGhost: ViewStyle = {
  backgroundColor: 'transparent',
  borderRadius: AppRadius.sm,
  paddingHorizontal: 16,
  paddingVertical: 10,
  alignItems: 'center',
  justifyContent: 'center',
};

// ── Spacing Scale ─────────────────────────────────────────────────────────────
export const AppSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// ── Animation Durations ───────────────────────────────────────────────────────
export const AppAnimation = {
  fast: 100,
  normal: 200,
  slow: 300,
} as const;

// ── Z-Index Scale ─────────────────────────────────────────────────────────────
export const AppZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  tooltip: 40,
} as const;
