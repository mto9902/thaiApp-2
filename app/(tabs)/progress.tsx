import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sketch, sketchShadow } from "@/constants/theme";
import Header from "../../src/components/Header";
import { useRouter } from "expo-router";

export default function ProgressScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Progress" onBack={() => router.back()} showSettings={false} />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.text}>Progress Screen</Text>
          <Text style={styles.sub}>Coming soon</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    ...sketchShadow(5),
  },
  text: {
    fontSize: 22,
    fontWeight: "900",
    color: Sketch.ink,
  },
  sub: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.inkMuted,
    marginTop: 8,
  },
});
