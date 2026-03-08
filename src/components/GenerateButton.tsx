import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    backgroundColor: "#FFFF00",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 40,
    marginBottom: 40,
    paddingVertical: 18,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontSize: 22,
    fontWeight: "900",
    color: "black",
    marginLeft: 10,
    textTransform: "uppercase",
  },
});
