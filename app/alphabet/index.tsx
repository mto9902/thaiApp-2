import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import { Sketch, sketchShadow } from "@/constants/theme";

export default function AlphabetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Alphabet" onBack={() => router.back()} />

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: Sketch.yellow }]}
          onPress={() => router.push("/alphabet/consonants" as any)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.textContainer}>
              <Text style={styles.levelLabel}>44 LETTERS</Text>
              <Text style={styles.cardTitle}>CONSONANTS</Text>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name="language-outline" size={22} color={Sketch.ink} />
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>START LEARNING</Text>
            <Ionicons name="arrow-forward" size={14} color={Sketch.ink} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: Sketch.green }]}
          onPress={() => router.push("/vowels/")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.textContainer}>
              <Text style={styles.levelLabel}>GROUPS 1-6</Text>
              <Text style={styles.cardTitle}>VOWELS</Text>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-outline" size={22} color={Sketch.ink} />
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>START LEARNING</Text>
            <Ionicons name="arrow-forward" size={14} color={Sketch.ink} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },

  content: {
    padding: 20,
    paddingTop: 10,
  },

  card: {
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    marginBottom: 18,
    padding: 20,
    ...sketchShadow(5),
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  textContainer: {
    flex: 1,
  },

  levelLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(0,0,0,0.5)",
    marginBottom: 4,
    letterSpacing: 1,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Sketch.ink,
    lineHeight: 26,
  },

  iconContainer: {
    width: 42,
    height: 42,
    backgroundColor: Sketch.cardBg,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    ...sketchShadow(2),
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
  },

  footerText: {
    fontSize: 11,
    fontWeight: "900",
    color: Sketch.ink,
  },
});
