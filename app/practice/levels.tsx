import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  GrammarStage,
} from "../../src/data/grammarStages";
import { useGrammarCatalog } from "../../src/grammar/GrammarCatalogProvider";
import { Sketch, sketchShadow } from "@/constants/theme";

const LEVEL_COLORS = {
  A1: Sketch.green,
  A2: Sketch.blue,
  B1: Sketch.orange,
  B2: Sketch.red,
  C1: Sketch.purple,
  C2: Sketch.pink,
};

const LEVEL_ICONS = {
  A1: "leaf-outline",
  A2: "sparkles-outline",
  B1: "trending-up-outline",
  B2: "flash-outline",
  C1: "library-outline",
  C2: "diamond-outline",
};

function getStages(grammarPoints: { stage: GrammarStage }[]) {
  const stageMap = new Map<GrammarStage, number>();
  for (const point of grammarPoints) {
    stageMap.set(point.stage, (stageMap.get(point.stage) || 0) + 1);
  }
  return GRAMMAR_STAGES.filter((stage) => stageMap.has(stage)).map((stage) => ({
    stage,
    count: stageMap.get(stage) || 0,
  }));
}

export default function GrammarLevels() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const stages = getStages(grammarPoints);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Header title="Grammar Stages" onBack={() => router.back()} />

      <FlatList
        data={stages}
        keyExtractor={(item) => String(item.stage)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: LEVEL_COLORS[GRAMMAR_STAGE_META[item.stage].level] || Sketch.blue },
            ]}
            onPress={() =>
              router.push(`/practice/topics?stage=${item.stage}`)
            }
          >
              <View style={styles.cardHeader}>
              <View style={styles.textContainer}>
                <Text style={styles.levelLabel}>{item.stage}</Text>
                <Text style={styles.grammarTitle}>
                  {GRAMMAR_STAGE_META[item.stage].shortTitle.toUpperCase()}
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <Ionicons
                  name={LEVEL_ICONS[GRAMMAR_STAGE_META[item.stage].level] || "book-outline"}
                  size={22}
                  color={Sketch.ink}
                />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>
                {item.count} {item.count === 1 ? "LESSON" : "LESSONS"}
              </Text>
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
