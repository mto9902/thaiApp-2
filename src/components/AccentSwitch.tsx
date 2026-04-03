import { Pressable, StyleSheet, View } from "react-native";

import { AppSketch } from "@/constants/theme-app";

type AccentSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export default function AccentSwitch({
  value,
  onValueChange,
  disabled = false,
}: AccentSwitchProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        value ? styles.trackOn : styles.trackOff,
        disabled && styles.trackDisabled,
      ]}
    >
      <View
        style={[
          styles.thumb,
          value ? styles.thumbOn : styles.thumbOff,
          disabled && styles.thumbDisabled,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  trackOn: {
    backgroundColor: AppSketch.primary,
    borderColor: AppSketch.primary,
    alignItems: "flex-end",
  },
  trackOff: {
    backgroundColor: AppSketch.border,
    borderColor: AppSketch.border,
    alignItems: "flex-start",
  },
  trackDisabled: {
    opacity: 0.45,
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
  thumbOn: {
    backgroundColor: AppSketch.surface,
    borderColor: "rgba(0,0,0,0.08)",
  },
  thumbOff: {
    backgroundColor: AppSketch.surface,
    borderColor: "rgba(0,0,0,0.06)",
  },
  thumbDisabled: {
    opacity: 0.9,
  },
});
