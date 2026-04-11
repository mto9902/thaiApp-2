import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";

import { AppSketch } from "@/constants/theme-app";

type AccentSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 18;
const TRACK_PADDING = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;

export default function AccentSwitch({
  value,
  onValueChange,
  disabled = false,
}: AccentSwitchProps) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, value]);

  const trackAnimatedStyle = {
    backgroundColor: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [AppSketch.border, AppSketch.primary],
    }),
    borderColor: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [AppSketch.border, AppSketch.primary],
    }),
  };

  const thumbAnimatedStyle = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, THUMB_TRAVEL],
        }),
      },
    ],
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.root,
        disabled && styles.trackDisabled,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.track,
          trackAnimatedStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          thumbAnimatedStyle,
          disabled && styles.thumbDisabled,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
  },
  track: {
    position: "absolute",
    top: 0,
    left: 0,
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: AppSketch.border,
  },
  trackDisabled: {
    opacity: 0.45,
  },
  thumb: {
    position: "absolute",
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    zIndex: 1,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: AppSketch.surface,
    borderColor: "rgba(0,0,0,0.08)",
  },
  thumbDisabled: {
    opacity: 0.9,
  },
});
