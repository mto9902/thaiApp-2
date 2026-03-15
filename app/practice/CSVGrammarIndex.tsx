import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import { grammarPoints } from "../../src/data/grammar";
import { CEFR_LEVEL_META, CefrLevel } from "../../src/data/grammarLevels";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  GrammarStage,
} from "../../src/data/grammarStages";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";
import { getGrammarCardCopy } from "../../src/utils/grammarCardCopy";

export default function CSVGrammarIndex() {
  const router = useRouter();
  const { level, stage } = useLocalSearchParams<{ level?: string; stage?: string }>();
  const rawLevel = Array.isArray(level) ? level[0] : level;
  const rawStage = Array.isArray(stage) ? stage[0] : stage;
  const selectedLevel =
    rawLevel && rawLevel in CEFR_LEVEL_META
      ? (rawLevel as CefrLevel)
      : undefined;
  const selectedStage =
    rawStage && GRAMMAR_STAGES.includes(rawStage as GrammarStage)
      ? (rawStage as GrammarStage)
      : undefined;
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});

  useFocusEffect(
    useCallback(() => {
      getAllProgress().then(setProgress);
    }, [])
  );

  const filtered = useMemo(() => {
    if (selectedStage) return grammarPoints.filter((p) => p.stage === selectedStage);
    if (!selectedLevel) return grammarPoints;
    return grammarPoints.filter((p) => p.level === selectedLevel);
  }, [selectedLevel, selectedStage]);

  const levelMeta = selectedLevel ? CEFR_LEVEL_META[selectedLevel] : null;
  const stageMeta = selectedStage ? GRAMMAR_STAGE_META[selectedStage] : null;
  const practiced = filtered.filter((g) =>
    isGrammarPracticed(progress[g.id]),
  ).length;
  const percentage = filtered.length > 0 ? Math.round((practiced / filtered.length) * 100) : 0;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedStage
            ? stageMeta?.title ?? "Grammar"
            : selectedLevel
              ? `${selectedLevel} Grammar`
              : "Grammar"}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          stageMeta ? (
            <View style={styles.levelSummary}>
              <Text style={styles.levelTitle}>{stageMeta.title}</Text>
              <Text style={styles.levelSubtitle}>
                {stageMeta.subtitle}
              </Text>
              <Text style={styles.progressHint}>
                {practiced} of {filtered.length} topics practiced
              </Text>
              <View style={styles.summaryProgressRow}>
                <View style={styles.summaryProgressBar}>
                  <View style={[styles.summaryProgressFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.summaryPercent}>{percentage}%</Text>
              </View>
            </View>
          ) : levelMeta ? (
            <View style={styles.levelSummary}>
              <Text style={styles.levelTitle}>{levelMeta.homeTitle}</Text>
              <Text style={styles.levelSubtitle}>
                {practiced} of {filtered.length} topics practiced
              </Text>
              <View style={styles.summaryProgressRow}>
                <View style={styles.summaryProgressBar}>
                  <View style={[styles.summaryProgressFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.summaryPercent}>{percentage}%</Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const done = isGrammarPracticed(progress[item.id]);
          const cardCopy = getGrammarCardCopy(item);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/practice/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardNumberCol}>
                  <Text style={[styles.cardNumber, done && styles.cardNumberDone]}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {cardCopy.title}
                  </Text>
                  <View style={styles.patternRow}>
                    <Text style={styles.patternText} numberOfLines={2}>
                      {cardCopy.pattern}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {done ? (
                    <View style={styles.doneBadge}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={Sketch.inkMuted} />
                  )}
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.focusPill}>
                  <Text style={styles.focusParticle} numberOfLines={1}>
                    {cardCopy.focus}
                  </Text>
                </View>
                <Text style={styles.focusMeaning} numberOfLines={2}>
                  {cardCopy.meaning}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={<View style={{ height: 30 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Sketch.ink,
  },
  // Level Summary — clean, no badge box
  levelSummary: {
    marginBottom: 24,
    gap: 6,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  levelSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  progressHint: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  summaryProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  summaryProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Sketch.inkFaint,
    borderRadius: 3,
    overflow: "hidden",
  },
  summaryProgressFill: {
    height: "100%",
    backgroundColor: Sketch.orange,
    borderRadius: 3,
  },
  summaryPercent: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.orange,
    minWidth: 32,
    textAlign: "right",
  },
  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Cards
  card: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardNumberCol: {
    width: 28,
    paddingTop: 2,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.inkFaint,
    fontVariant: ["tabular-nums"],
  },
  cardNumberDone: {
    color: Sketch.orange,
  },
  cardContent: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
    lineHeight: 21,
  },
  patternRow: {
    backgroundColor: Sketch.paperDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  patternText: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkLight,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  cardRight: {
    paddingTop: 2,
  },
  doneBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Sketch.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  // Bottom row — focus particle
  cardBottom: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    paddingLeft: 28 + 12, // align with content after number
  },
  focusPill: {
    backgroundColor: Sketch.orange + "12",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  focusParticle: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.orange,
  },
  focusMeaning: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
    lineHeight: 17,
    width: "100%",
  },
});
