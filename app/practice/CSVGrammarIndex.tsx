import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
import { getAllProgress, GrammarProgressData } from "../../src/utils/grammarProgress";

export default function CSVGrammarIndex() {
  const router = useRouter();
  const { level } = useLocalSearchParams<{ level?: string }>();
  const selectedLevel = level as CefrLevel | undefined;
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});

  useFocusEffect(
    useCallback(() => {
      getAllProgress().then(setProgress);
    }, [])
  );

  const filtered = useMemo(() => {
    if (!selectedLevel) return grammarPoints;
    return grammarPoints.filter((p) => p.level === selectedLevel);
  }, [selectedLevel]);

  const meta = selectedLevel ? CEFR_LEVEL_META[selectedLevel] : null;
  const practiced = filtered.filter((g) => progress[g.id]).length;
  const percentage = filtered.length > 0 ? Math.round((practiced / filtered.length) * 100) : 0;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Sketch.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedLevel ? `${selectedLevel} Grammar` : "Grammar"}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          meta ? (
            <View style={styles.levelSummary}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{selectedLevel}</Text>
              </View>
              <Text style={styles.levelTitle}>{meta.homeTitle}</Text>
              <Text style={styles.levelSubtitle}>
                {practiced} of {filtered.length} topics practiced
              </Text>
              <View style={styles.summaryProgressBar}>
                <View style={[styles.summaryProgressFill, { width: `${percentage}%` }]} />
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const done = !!progress[item.id];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/practice/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.statusDot, done && styles.statusDotDone]} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {done ? "Practiced" : "Not started"}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Sketch.inkMuted} />
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
  // Header
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
  // Level Summary
  levelSummary: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 8,
    alignItems: "flex-start",
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
  levelTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.3,
  },
  levelSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  summaryProgressBar: {
    width: "100%",
    height: 6,
    backgroundColor: Sketch.inkFaint,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
  },
  summaryProgressFill: {
    height: "100%",
    backgroundColor: Sketch.orange,
    borderRadius: 3,
  },
  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Sketch.inkFaint,
  },
  statusDotDone: {
    backgroundColor: Sketch.orange,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
});
