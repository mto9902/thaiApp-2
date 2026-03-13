import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import { grammarPoints } from "../../src/data/grammar";
import {
  CEFR_LEVEL_META,
  CEFR_LEVELS,
  CefrLevel,
} from "../../src/data/grammarLevels";
import { getAllProgress, GrammarProgressData } from "../../src/utils/grammarProgress";

const LEVEL_COLORS: Record<CefrLevel, string> = {
  A1: Sketch.green,
  A2: Sketch.blue,
  B1: Sketch.orange,
  B2: Sketch.red,
  C1: Sketch.purple,
  C2: Sketch.pink,
};

export default function GrammarScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});

  useFocusEffect(
    useCallback(() => {
      getAllProgress().then(setProgress);
    }, [])
  );

  const levels = CEFR_LEVELS;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Grammar</Text>
        <Text style={styles.pageSubtitle}>Thai Grammar Blueprint</Text>

        <View style={styles.divider} />

        {levels.map((level) => {
          const points = grammarPoints.filter((g) => g.level === level);
          const practiced = points.filter((g) => progress[g.id]).length;
          const percentage = points.length > 0 ? Math.round((practiced / points.length) * 100) : 0;

          return (
            <View key={level} style={styles.levelSection}>
              <View style={styles.levelHeader}>
                <View style={styles.levelHeaderLeft}>
                  <View style={[styles.levelDot, { backgroundColor: LEVEL_COLORS[level] }]} />
                  <Text style={styles.levelTitle}>{CEFR_LEVEL_META[level].title}</Text>
                </View>
                <Text style={styles.levelProgress}>{percentage}%</Text>
              </View>

              {points.map((point) => {
                const p = progress[point.id];
                return (
                  <TouchableOpacity
                    key={point.id}
                    style={styles.grammarRow}
                    onPress={() => router.push(`/practice/${point.id}` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.grammarRowLeft}>
                      <Ionicons
                        name={p ? "checkmark-circle" : "ellipse-outline"}
                        size={18}
                        color={p ? Sketch.green : Sketch.inkFaint}
                      />
                      <Text style={[styles.grammarRowText, p && styles.grammarRowPracticed]}>
                        {point.title}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Sketch.inkMuted} />
                  </TouchableOpacity>
                );
              })}

              <View style={styles.divider} />
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
    marginVertical: 20,
  },

  levelSection: {},
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  levelProgress: {
    fontSize: 14,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },

  grammarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 18,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  grammarRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  grammarRowText: {
    fontSize: 15,
    fontWeight: "400",
    color: Sketch.ink,
  },
  grammarRowPracticed: {
    color: Sketch.inkLight,
  },
});
