import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { Sketch } from "@/constants/theme";

const TAP_SETTLE_MS = 140;

function useTransientPressed(disabled = false) {
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

  return { transientPressed, onPressIn, onPressOut };
}

export function HapticTab({
  children,
  style,
  onPressIn,
  onPressOut,
  accessibilityState,
  ...props
}: BottomTabBarButtonProps) {
  const disabled = Boolean(props.disabled);
  const selected = Boolean(accessibilityState?.selected);
  const { transientPressed, onPressIn: handlePressIn, onPressOut: handlePressOut } =
    useTransientPressed(disabled);

  return (
    <PlatformPressable
      {...props}
      accessibilityState={accessibilityState}
      onPressIn={(ev) => {
        handlePressIn();
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
      onPressOut={(ev) => {
        handlePressOut();
        onPressOut?.(ev);
      }}
      style={(state) => {
        const incomingStyle =
          typeof style === "function" ? style(state) : style;

        return [styles.button, incomingStyle];
      }}
    >
      <View
        style={[
          styles.inner,
          selected ? styles.innerSelected : null,
          (transientPressed || false) ? styles.innerPressed : null,
          selected && (transientPressed || false) ? styles.innerSelectedPressed : null,
          Platform.OS === "web" ? styles.innerWeb : null,
          Platform.OS === "web" && selected ? styles.innerSelectedWeb : null,
          Platform.OS === "web" && transientPressed ? styles.innerPressedWeb : null,
        ]}
      >
        {children}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Platform.OS === "web" ? 4 : 6,
    paddingVertical: Platform.OS === "web" ? 0 : 2,
    alignItems: "stretch",
    justifyContent: "center",
  },
  inner: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#102A43",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  innerSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: Sketch.inkFaint,
    shadowColor: "#102A43",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  innerPressed: {
    transform: [{ translateY: 1.25 }],
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    backgroundColor: "#F6F8FB",
  },
  innerSelectedPressed: {
    backgroundColor: "#FAFBFD",
  },
  innerWeb: {
    minHeight: 40,
    borderRadius: 14,
    transitionDuration: "150ms",
    transitionProperty: "transform, box-shadow, background-color, border-color",
    transitionTimingFunction: "ease",
    userSelect: "none",
  } as any,
  innerSelectedWeb: {
    boxShadow: "0px 3px 8px rgba(16, 42, 67, 0.08)",
  } as any,
  innerPressedWeb: {
    transform: "translateY(1.25px)",
    boxShadow: "0px 1px 3px rgba(16, 42, 67, 0.05)",
  } as any,
});
