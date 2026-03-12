import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sketch, sketchShadow } from "@/constants/theme";

interface GenerateButtonProps {
  onPress: () => void;
  title?: string;
}

export default function GenerateButton({
  onPress,
  title = "NEW SENTENCE",
}: GenerateButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 30,
    paddingVertical: 16,
    alignItems: "center",
    ...sketchShadow(5),
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontSize: 20,
    fontWeight: "900",
    color: Sketch.cardBg,
    textTransform: "uppercase",
  },
});
