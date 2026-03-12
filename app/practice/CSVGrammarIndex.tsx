import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import { grammarPoints } from "../../src/data/grammar";
import { Sketch, sketchShadow } from "@/constants/theme";

const COLORS = [
  Sketch.blue,
  Sketch.red,
  Sketch.green,
  Sketch.orange,
  Sketch.purple,
  Sketch.pink,
];

const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

export default function CSVGrammarIndex() {
  const router = useRouter();
  const { level } = useLocalSearchParams<{ level?: string }>();

  const filtered = useMemo(() => {
    if (!level) return grammarPoints;
    return grammarPoints.filter((p) => p.level === Number(level));
  }, [level]);

  const title = level
    ? `${LEVEL_NAMES[Number(level)] || `Level ${level}`} Grammar`
    : "Grammar";

  function openPractice(id: string) {
    router.push(`/practice/${id}`);
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Header title={title} onBack={() => router.back()} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: COLORS[index % COLORS.length] },
            ]}
            onPress={() => openPractice(item.id)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.textContainer}>
                <Text style={styles.levelLabel}>LEVEL {item.level}</Text>
                <Text style={styles.grammarTitle}>
                  {item.title.toUpperCase()}
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <Ionicons name="flash" size={22} color={Sketch.ink} />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>START PRACTICE</Text>
              <Ionicons name="arrow-forward" size={14} color={Sketch.ink} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },

  listContent: {
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

  grammarTitle: {
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
