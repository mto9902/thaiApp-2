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
  const [expandedLevel, setExpandedLevel] = useState<CefrLevel | null>(null);

  useFocusEffect(
    useCallback(() => {
      getAllProgress().then(setProgress);
    }, [])
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Grammar</Text>

        <View style={styles.spacing} />

        {CEFR_LEVELS.map((level) => {
          const meta = CEFR_LEVEL_META[level];
          const points = grammarPoints.filter((g) => g.level === level);
          const practiced = points.filter((g) => progress[g.id]).length;
          const percentage = points.length > 0 ? Math.round((practiced / points.length) * 100) : 0;
          const isExpanded = expandedLevel === level;
          const color = LEVEL_COLORS[level];

          return (
            <View key={level} style={styles.levelCard}>
              <TouchableOpacity
                style={styles.levelHeader}
                onPress={() => setExpandedLevel(isExpanded ? null : level)}
                activeOpacity={0.7}
              >
                <View style={styles.levelHeaderTop}>
                  <View style={styles.levelBadgeRow}>
                    <View style={[styles.levelBadge, { backgroundColor: color + "18" }]}>
                      <Text style={[styles.levelBadgeText, { color }]}>{level}</Text>
                    </View>
                    <Text style={styles.levelTitle}>{meta.homeTitle}</Text>
                  </View>
                  <View style={styles.levelRight}>
                    <Text style={[styles.levelPercent, { color }]}>{percentage}%</Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={Sketch.inkMuted}
                    />
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentage}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressCount}>
                    {practiced}/{points.length}
                  </Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.pointsList}>
                  {points.map((point) => {
                    const p = progress[point.id];
                    return (
                      <TouchableOpacity
                        key={point.id}
                        style={styles.pointRow}
                        onPress={() => router.push(`/practice/${point.id}` as any)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.pointLeft}>
                          <Ionicons
                            name={p ? "checkmark-circle" : "ellipse-outline"}
                            size={18}
                            color={p ? color : Sketch.inkFaint}
                          />
                          <Text style={[styles.pointText, p && styles.pointPracticed]}>
                            {point.title}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Sketch.inkMuted} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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
  spacing: {
    height: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  // Level Cards
  levelCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  levelHeader: {
    padding: 16,
    gap: 12,
  },
  levelHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
    flex: 1,
  },
  levelRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  levelPercent: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Sketch.paperDark,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressCount: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
    minWidth: 30,
    textAlign: "right",
  },
  // Expanded Points List
  pointsList: {
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  pointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  pointLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pointText: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.ink,
  },
  pointPracticed: {
    color: Sketch.inkLight,
  },
});
