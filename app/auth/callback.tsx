import { Sketch } from "@/constants/theme";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { StyleSheet, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.paper,
  },
});
