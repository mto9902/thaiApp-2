import React from "react";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { AppSketch, AppRadius, appShadow, AppTypography, AppSpacing } from "@/constants/theme-app";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps extends Omit<TouchableOpacityProps, 'title'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, { padding: number; height: number }> = {
  sm: { padding: AppSpacing.md, height: 36 },
  md: { padding: AppSpacing.lg, height: 44 },
  lg: { padding: AppSpacing.xl, height: 52 },
};

export default function AppButton({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...touchableProps
}: AppButtonProps) {
  const { padding, height } = sizeStyles[size];

  const containerStyle = [
    styles.base,
    { paddingHorizontal: padding, height, minWidth: height },
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "ghost" && styles.ghost,
    variant === "danger" && styles.danger,
    (disabled || loading) && styles.disabled,
    fullWidth && styles.fullWidth,
  ];

  const textStyle = [
    styles.text,
    variant === "primary" && styles.primaryText,
    variant === "secondary" && styles.secondaryText,
    variant === "ghost" && styles.ghostText,
    variant === "danger" && styles.dangerText,
    (disabled || loading) && styles.disabledText,
    size === "sm" && styles.textSm,
    size === "lg" && styles.textLg,
  ];

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...touchableProps}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#fff" : AppSketch.primary}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyle}>{title}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: AppRadius.sm,
  },
  primary: {
    backgroundColor: AppSketch.primary,
    ...appShadow('sm'),
  },
  secondary: {
    backgroundColor: AppSketch.surface,
    borderWidth: 1,
    borderColor: AppSketch.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: AppSketch.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    ...AppTypography.label,
  },
  textSm: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 15,
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: AppSketch.ink,
  },
  ghostText: {
    color: AppSketch.primary,
  },
  dangerText: {
    color: "#fff",
  },
  disabledText: {
    color: AppSketch.inkFaint,
  },
});
