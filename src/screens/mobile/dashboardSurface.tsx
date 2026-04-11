import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";

import {
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED as WEB_LIGHT_BUTTON_PRESSED_SHADOW,
  WEB_LIGHT_BUTTON_SHADOW as WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED as WEB_NAVY_BUTTON_PRESSED_SHADOW,
  WEB_NAVY_BUTTON_SHADOW as WEB_NAVY_BUTTON_SHADOW,
} from "@/src/components/web/designSystem";

export const BRAND = {
  bg: "#FAFAFA",
  paper: "#FFFFFF",
  panel: "#FAFAFA",
  ink: "#102A43",
  inkSoft: "#486581",
  body: "#52606D",
  muted: "#7B8794",
  line: "#E5E7EB",
  navy: "#17324D",
  white: "#FFFFFF",
};

export const CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;

export const SURFACE_SHADOW = {
  shadowColor: "#111827",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;

const LIGHT_BUTTON_SHADOW = {
  shadowColor: "#111827",
  shadowOpacity: 0.1,
  shadowRadius: 7,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

export const LIGHT_BUTTON_PRESSED = {
  transform: [{ translateY: 1.25 }],
  shadowOpacity: 0.05,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

const NAVY_BUTTON_SHADOW = {
  shadowColor: "#102A43",
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 3,
} as const;

const NAVY_BUTTON_PRESSED = {
  transform: [{ translateY: 1.25 }],
  shadowOpacity: 0.1,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

export const SURFACE_PRESSED = {
  transform: [{ translateY: 1.5 }],
  shadowOpacity: 0.04,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;

const TAP_SETTLE_MS = 140;

const WEB_DEFAULT_BUTTON_STYLE =
  Platform.OS === "web"
    ? ({
        minHeight: 48,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        boxShadow: WEB_LIGHT_BUTTON_SHADOW,
        userSelect: "none",
        ...WEB_INTERACTIVE_TRANSITION,
      } as any)
    : null;

const WEB_DEFAULT_BUTTON_PRESSED =
  Platform.OS === "web"
    ? ({
        transform: WEB_DEPRESSED_TRANSFORM as any,
        boxShadow: WEB_LIGHT_BUTTON_PRESSED_SHADOW,
      } as any)
    : null;

const WEB_PRIMARY_BUTTON_STYLE =
  Platform.OS === "web"
    ? ({
        minHeight: 48,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: BRAND.navy,
        borderWidth: 1,
        borderColor: "#0D2237",
        boxShadow: WEB_NAVY_BUTTON_SHADOW,
        userSelect: "none",
        ...WEB_INTERACTIVE_TRANSITION,
      } as any)
    : null;

const WEB_PRIMARY_BUTTON_PRESSED =
  Platform.OS === "web"
    ? ({
        transform: WEB_DEPRESSED_TRANSFORM as any,
        boxShadow: WEB_NAVY_BUTTON_PRESSED_SHADOW,
      } as any)
    : null;

const WEB_UTILITY_BUTTON_STYLE =
  Platform.OS === "web"
    ? ({
        minHeight: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BRAND.line,
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 12,
        paddingVertical: 0,
        boxShadow: WEB_LIGHT_BUTTON_SHADOW,
        userSelect: "none",
        ...WEB_INTERACTIVE_TRANSITION,
      } as any)
    : null;

const WEB_UTILITY_BUTTON_PRESSED =
  Platform.OS === "web"
    ? ({
        transform: WEB_DEPRESSED_TRANSFORM as any,
        boxShadow: WEB_LIGHT_BUTTON_PRESSED_SHADOW,
      } as any)
    : null;

export function useTransientPressed(disabled = false) {
  const [transientPressed, setTransientPressed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTransientPressed(true);
  }, [disabled]);

  const onPressOut = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setTransientPressed(false), TAP_SETTLE_MS);
  }, [disabled]);

  return {
    transientPressed,
    onPressIn,
    onPressOut,
  };
}

export function SettledPressable({
  disabled,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: any) {
  const { transientPressed, onPressIn: handlePressIn, onPressOut: handlePressOut } =
    useTransientPressed(Boolean(disabled));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        handlePressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        handlePressOut();
        onPressOut?.(event);
      }}
      style={(state) =>
        typeof style === "function"
          ? style({ ...state, pressed: state.pressed || transientPressed })
          : style
      }
    >
      {typeof children === "function"
        ? children({ pressed: transientPressed, hovered: false, focused: false })
        : children}
    </Pressable>
  );
}

export function SurfaceButton({
  label,
  onPress,
  variant = "secondary",
  size = "default",
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  size?: "default" | "compact";
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle | ViewStyle[];
}) {
  const { transientPressed, onPressIn, onPressOut } = useTransientPressed(Boolean(disabled));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={({ pressed }) => [
        styles.buttonBase,
        Platform.OS === "web"
          ? size === "compact"
            ? variant === "primary"
              ? WEB_PRIMARY_BUTTON_STYLE
              : WEB_UTILITY_BUTTON_STYLE
            : variant === "primary"
              ? WEB_PRIMARY_BUTTON_STYLE
              : WEB_DEFAULT_BUTTON_STYLE
          : size === "compact"
            ? styles.buttonCompact
            : null,
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        (pressed || transientPressed) && !disabled
          ? variant === "primary"
            ? [
                styles.primaryButtonPressed,
                Platform.OS === "web" ? WEB_PRIMARY_BUTTON_PRESSED : null,
              ]
            : [
                styles.secondaryButtonPressed,
                Platform.OS === "web"
                  ? size === "compact"
                    ? WEB_UTILITY_BUTTON_PRESSED
                    : WEB_DEFAULT_BUTTON_PRESSED
                  : null,
              ]
          : null,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={size === "compact" ? 15 : 16}
          color={variant === "primary" ? BRAND.white : BRAND.ink}
          style={styles.buttonIcon}
        />
      ) : null}
      <Text
        style={[
          styles.buttonLabel,
          size === "compact" ? styles.buttonLabelCompact : null,
          variant === "primary" ? styles.primaryButtonLabel : styles.secondaryButtonLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
  },
  buttonCompact: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  primaryButton: {
    backgroundColor: BRAND.navy,
    borderColor: BRAND.navy,
    ...(Platform.OS === "web" ? null : NAVY_BUTTON_SHADOW),
  },
  secondaryButton: {
    backgroundColor: BRAND.paper,
    borderColor: BRAND.line,
    ...(Platform.OS === "web" ? null : LIGHT_BUTTON_SHADOW),
  },
  primaryButtonPressed: {
    ...(Platform.OS === "web" ? null : NAVY_BUTTON_PRESSED),
  },
  secondaryButtonPressed: {
    ...(Platform.OS === "web" ? null : LIGHT_BUTTON_PRESSED),
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  buttonLabelCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  primaryButtonLabel: {
    color: BRAND.white,
  },
  secondaryButtonLabel: {
    color: BRAND.ink,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
