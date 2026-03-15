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
import Svg, { Circle } from "react-native-svg";

import { Sketch } from "@/constants/theme";
import { grammarPoints } from "../../src/data/grammar";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
} from "../../src/data/grammarStages";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";

function ProgressRing({ percent, size = 72, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Sketch.inkFaint}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Sketch.orange}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringPercent}>{percent}%</Text>
    </View>
  );
}

export default function GrammarScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const stages = GRAMMAR_STAGES.filter((stage) =>
    grammarPoints.some((point) => point.stage === stage),
  );

  useFocusEffect(
    useCallback(() => {
      getAllProgress().then(setProgress);
    }, [])
  );

  const totalPoints = grammarPoints.length;
  const totalPracticed = grammarPoints.filter((g) =>
    isGrammarPracticed(progress[g.id]),
  ).length;
  const overallPercent = totalPoints > 0 ? Math.round((totalPracticed / totalPoints) * 100) : 0;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Grammar</Text>

        <View style={styles.spacing} />

        {/* Overall progress with ring */}
        <View style={styles.summaryRow}>
          <ProgressRing percent={overallPercent} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Overall Progress</Text>
            <Text style={styles.summarySubtitle}>
              {totalPracticed} of {totalPoints} topics practiced
            </Text>
          </View>
        </View>

        <View style={styles.spacingLg} />

        {/* Stage Grid */}
        <View style={styles.grid}>
          {stages.map((stage) => {
            const meta = GRAMMAR_STAGE_META[stage];
            const points = grammarPoints.filter((g) => g.stage === stage);
            const practiced = points.filter((g) =>
              isGrammarPracticed(progress[g.id]),
            ).length;
            const percentage = points.length > 0 ? Math.round((practiced / points.length) * 100) : 0;

            return (
              <TouchableOpacity
                key={stage}
                style={styles.gridTile}
                onPress={() => router.push(`/practice/CSVGrammarIndex?stage=${stage}` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.tileLevel}>{stage}</Text>
                <Text style={styles.tileTitle} numberOfLines={2}>{meta.shortTitle}</Text>
                <Text style={styles.tileSubtitle} numberOfLines={2}>{meta.subtitle}</Text>

                <View style={styles.tileProgressRow}>
                  <View style={styles.tileProgressBar}>
                    <View style={[styles.tileProgressFill, { width: `${percentage}%` }]} />
                  </View>
                </View>

                <View style={styles.tileFooter}>
                  <Text style={styles.tilePercent}>{percentage}%</Text>
                  <Text style={styles.tileCount}>{practiced}/{points.length}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

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
  spacingLg: {
    height: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  // Summary
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  summaryText: {
    flex: 1,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  summarySubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  ringPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.orange,
  },
  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridTile: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
    justifyContent: "space-between",
    minHeight: 130,
  },
  tileLevel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.5,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
    lineHeight: 19,
  },
  tileSubtitle: {
    fontSize: 11,
    fontWeight: "400",
    color: Sketch.inkMuted,
    lineHeight: 15,
    flex: 1,
  },
  tileProgressRow: {
    marginTop: 4,
  },
  tileProgressBar: {
    height: 5,
    backgroundColor: Sketch.paperDark,
    borderRadius: 3,
    overflow: "hidden",
  },
  tileProgressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Sketch.orange,
  },
  tileFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tilePercent: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.orange,
  },
  tileCount: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
});
