import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import { grammarPoints } from "../../src/data/grammar";

const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "#66BB6A",
  2: "#42A5F5",
  3: "#FF4081",
};

const LEVEL_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: "leaf-outline",
  2: "flame-outline",
  3: "diamond-outline",
};

function getLevels() {
  const levelMap = new Map<number, number>();
  for (const point of grammarPoints) {
    levelMap.set(point.level, (levelMap.get(point.level) || 0) + 1);
  }
  return Array.from(levelMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, count]) => ({ level, count }));
}

export default function GrammarLevels() {
  const router = useRouter();
  const levels = getLevels();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Header title="Grammar Levels" onBack={() => router.back()} />

      <FlatList
        data={levels}
        keyExtractor={(item) => String(item.level)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: LEVEL_COLORS[item.level] || "#42A5F5" },
            ]}
            onPress={() =>
              router.push(`/practice/CSVGrammarIndex?level=${item.level}`)
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.textContainer}>
                <Text style={styles.levelLabel}>LEVEL {item.level}</Text>
                <Text style={styles.grammarTitle}>
                  {(LEVEL_NAMES[item.level] || `Level ${item.level}`).toUpperCase()}
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <Ionicons
                  name={LEVEL_ICONS[item.level] || "book-outline"}
                  size={24}
                  color="black"
                />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>
                {item.count} {item.count === 1 ? "LESSON" : "LESSONS"}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="black" />
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
    backgroundColor: "#F5F5F5",
  },

  listContent: {
    padding: 20,
    paddingTop: 10,
  },

  card: {
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,

    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },

  textContainer: {
    flex: 1,
  },

  levelLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(0,0,0,0.6)",
    marginBottom: 4,
    letterSpacing: 1,
  },

  grammarTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "black",
    lineHeight: 26,
  },

  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },

  footerText: {
    fontSize: 12,
    fontWeight: "900",
    color: "black",
  },
});
