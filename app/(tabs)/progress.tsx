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

export default function GrammarScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [expandedLevel, setExpandedLevel] = useState<CefrLevel | null>(null);

  useFocusEffect(
    useCallback(() => {
      getAllProgress().then(setProgress);
    }, [])
  );

  // Compute overall stats
  const totalPoints = grammarPoints.length;
  const totalPracticed = grammarPoints.filter((g) => progress[g.id]).length;
  const overallPercent = totalPoints > 0 ? Math.round((totalPracticed / totalPoints) * 100) : 0;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Grammar</Text>

        <View style={styles.spacing} />

        {/* Overall progress summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryPercent}>{overallPercent}%</Text>
            <Text style={styles.summaryLabel}>overall progress</Text>
          </View>
          <View style={styles.summaryBarContainer}>
            <View style={styles.summaryBar}>
              <View style={[styles.summaryBarFill, { width: `${overallPercent}%` }]} />
            </View>
            <Text style={styles.summaryCount}>{totalPracticed}/{totalPoints}</Text>
          </View>
        </View>

        <View style={styles.spacing} />

        {CEFR_LEVELS.map((level) => {
          const meta = CEFR_LEVEL_META[level];
          const points = grammarPoints.filter((g) => g.level === level);
          const practiced = points.filter((g) => progress[g.id]).length;
          const percentage = points.length > 0 ? Math.round((practiced / points.length) * 100) : 0;
          const isExpanded = expandedLevel === level;

          return (
            <View key={level} style={styles.levelCard}>
              <TouchableOpacity
                style={styles.levelHeader}
                onPress={() => setExpandedLevel(isExpanded ? null : level)}
                activeOpacity={0.7}
              >
                <View style={styles.levelHeaderTop}>
                  <View style={styles.levelBadgeRow}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>{level}</Text>
                    </View>
                    <View style={styles.levelTitleBlock}>
                      <Text style={styles.levelTitle}>{meta.homeTitle}</Text>
                      <Text style={styles.levelSubtitle}>
                        {practiced}/{points.length} completed
                      </Text>
                    </View>
                  </View>
                  <View style={styles.levelRight}>
                    <Text style={styles.levelPercent}>{percentage}%</Text>
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
                        { width: `${percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.pointsList}>
                  {points.map((point, idx) => {
                    const p = progress[point.id];
                    const isLast = idx === points.length - 1;
                    return (
                      <TouchableOpacity
                        key={point.id}
                        style={[styles.pointRow, isLast && styles.pointRowLast]}
                        onPress={() => router.push(`/practice/${point.id}` as any)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.pointLeft}>
                          <View style={[styles.pointDot, p && styles.pointDotDone]} />
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
  // Summary Card
  summaryCard: {
    backgroundColor: Sketch.orangeDark,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  summaryPercent: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
  summaryBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  summaryBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
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
    gap: 12,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: Sketch.orange + "15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.5,
  },
  levelTitleBlock: {
    flex: 1,
    gap: 2,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
  },
  levelSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  levelRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  levelPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.orange,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 5,
    backgroundColor: Sketch.paperDark,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Sketch.orange,
  },
  // Expanded Points List
  pointsList: {
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
    backgroundColor: Sketch.paperDark,
  },
  pointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  pointRowLast: {
    borderBottomWidth: 0,
  },
  pointLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Sketch.inkFaint,
  },
  pointDotDone: {
    backgroundColor: Sketch.orange,
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
