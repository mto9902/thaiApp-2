import React, { PropsWithChildren } from "react";
import {
  StyleProp,
  View,
  ViewStyle,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { AppSketch, AppRadius, appShadow, AppSpacing } from "@/constants/theme-app";

type CardVariant = "default" | "flat" | "elevated" | "ghost";
type CardSize = "sm" | "md" | "lg";

interface AppCardProps extends PropsWithChildren {
  variant?: CardVariant;
  size?: CardSize;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
}

const sizePadding: Record<CardSize, { padding: number; gap: number }> = {
  sm: { padding: AppSpacing.md, gap: AppSpacing.sm },
  md: { padding: AppSpacing.lg, gap: AppSpacing.md },
  lg: { padding: AppSpacing.xl, gap: AppSpacing.md },
};

export default function AppCard({
  children,
  variant = "default",
  size = "md",
  style,
  onPress,
  disabled = false,
  activeOpacity = 0.9,
}: AppCardProps) {
  const { padding, gap } = sizePadding[size];
  
  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    { padding, gap },
    variant === "default" && styles.default,
    variant === "flat" && styles.flat,
    variant === "elevated" && styles.elevated,
    variant === "ghost" && styles.ghost,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: AppRadius.lg,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: AppSketch.surface,
    ...appShadow('md'),
  },
  flat: {
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  elevated: {
    backgroundColor: AppSketch.surface,
    ...appShadow('lg'),
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});
