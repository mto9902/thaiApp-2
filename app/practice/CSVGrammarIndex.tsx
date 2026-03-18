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

import { Sketch, SketchRadius, sketchShadow } from "@/constants/theme";
import { CEFR_LEVEL_META, CefrLevel } from "../../src/data/grammarLevels";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  GrammarStage,
} from "../../src/data/grammarStages";
import { useGrammarCatalog } from "../../src/grammar/GrammarCatalogProvider";
import {
  getAllProgress,
  GrammarProgressData,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";
import { getAuthToken } from "../../src/utils/authStorage";
import { getGrammarCardCopy } from "../../src/utils/grammarCardCopy";
import { API_BASE } from "../../src/config";
import { isPremiumGrammarPoint } from "../../src/subscription/premium";
import { useSubscription } from "../../src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "../../src/subscription/usePremiumAccess";

export default function GrammarTopicsScreen() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
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
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

        (async () => {
          const [nextProgress, token] = await Promise.all([
            getAllProgress(),
            getAuthToken(),
          ]);
        if (!isActive) return;
        setProgress(nextProgress);

        if (!token) {
          setBookmarkedIds(new Set());
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/bookmarks`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = res.ok ? await res.json() : [];
          if (!isActive) return;
          setBookmarkedIds(
            new Set(
              Array.isArray(data)
                ? data
                    .map((item: { grammar_id?: string }) => item.grammar_id)
                    .filter((value): value is string => Boolean(value))
                : [],
            ),
          );
        } catch (err) {
          console.error("[GrammarTopicsScreen] load bookmarks failed:", err);
          if (!isActive) return;
          setBookmarkedIds(new Set());
        }
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const filtered = useMemo(() => {
    if (selectedStage) return grammarPoints.filter((p) => p.stage === selectedStage);
    if (!selectedLevel) return grammarPoints;
    return grammarPoints.filter((p) => p.level === selectedLevel);
  }, [grammarPoints, selectedLevel, selectedStage]);
  const nextUnlearned = useMemo(
    () =>
      filtered.find((point) => !isGrammarPracticed(progress[point.id])) ??
      null,
    [filtered, progress],
  );
  const nextCardCopy = nextUnlearned ? getGrammarCardCopy(nextUnlearned) : null;

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
            <View style={styles.levelSummary}>
              {stageMeta ? (
                <>
                  <Text style={styles.levelTitle}>{stageMeta.title}</Text>
                  <Text style={styles.levelSubtitle}>
                    {stageMeta.subtitle}
                  </Text>
                  <Text style={styles.progressHint}>
                    {practiced} of {filtered.length} topics practiced
                  </Text>
                </>
              ) : levelMeta ? (
                <>
                  <Text style={styles.levelTitle}>{levelMeta.homeTitle}</Text>
                  <Text style={styles.levelSubtitle}>
                    {practiced} of {filtered.length} topics practiced
                  </Text>
                </>
              ) : null}
              {(stageMeta || levelMeta) ? (
                <View style={styles.summaryProgressRow}>
                  <View style={styles.summaryProgressBar}>
                    <View style={[styles.summaryProgressFill, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.summaryPercent}>{percentage}%</Text>
                </View>
              ) : null}

              {nextUnlearned && nextCardCopy ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() =>
                    !isPremium && isPremiumGrammarPoint(nextUnlearned)
                      ? void ensurePremiumAccess(
                          nextCardCopy.title,
                          `/practice/${nextUnlearned.id}`,
                        )
                      : router.push(`/practice/${nextUnlearned.id}`)
                  }
                  activeOpacity={0.78}
                >
                  <View style={styles.nextButtonText}>
                    <Text style={styles.nextButtonLabel}>Next up</Text>
                    <Text style={styles.nextButtonTitle} numberOfLines={1}>
                      {nextCardCopy.title}
                    </Text>
                  </View>
                  <View style={styles.nextButtonAction}>
                    <Text style={styles.nextButtonActionText}>Learn</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={Sketch.orange}
                    />
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
        }
        renderItem={({ item, index }) => {
          const done = isGrammarPracticed(progress[item.id]);
          const bookmarked = bookmarkedIds.has(item.id);
          const cardCopy = getGrammarCardCopy(item);
          const locked = isPremiumGrammarPoint(item) && !isPremium;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                locked
                  ? void ensurePremiumAccess(cardCopy.title, `/practice/${item.id}`)
                  : router.push(`/practice/${item.id}`)
              }
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardNumberCol}>
                  <Text style={[styles.cardNumber, done && styles.cardNumberDone]}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                  {bookmarked ? (
                    <View style={styles.cardMarker}>
                      <Ionicons
                        name="bookmark"
                        size={16}
                        color={Sketch.orange}
                      />
                    </View>
                  ) : null}
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
                  {locked ? (
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={Sketch.orange}
                    />
                  ) : done ? (
                    <View style={styles.doneBadge}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={Sketch.inkMuted} />
                  )}
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.metaRow}>
                  {locked ? (
                    <View style={styles.premiumPill}>
                      <Text style={styles.premiumPillText}>Keystone Access</Text>
                    </View>
                  ) : null}
                  <View style={styles.focusPill}>
                    <Text style={styles.focusParticle} numberOfLines={1}>
                      {cardCopy.focus}
                    </Text>
                  </View>
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
    height: 4,
    backgroundColor: Sketch.inkFaint,
    borderRadius: SketchRadius.track,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  summaryProgressFill: {
    height: "100%",
    backgroundColor: Sketch.orange,
    borderRadius: SketchRadius.track,
  },
  summaryPercent: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.orange,
    minWidth: 32,
    textAlign: "right",
  },
  nextButton: {
    marginTop: 12,
    paddingTop: 14,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  nextButtonText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  nextButtonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  nextButtonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
    lineHeight: 20,
  },
  nextButtonAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 1,
  },
  nextButtonActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.orange,
  },
  // List
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  // Cards
  card: {
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 12,
    ...sketchShadow(2),
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardNumberCol: {
    width: 28,
    paddingTop: 2,
    alignItems: "center",
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
  cardMarker: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: SketchRadius.badge,
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
    borderRadius: SketchRadius.badge,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  premiumPill: {
    backgroundColor: "rgba(196, 97, 60, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SketchRadius.badge,
  },
  premiumPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.orange,
  },
  focusPill: {
    backgroundColor: Sketch.orange + "12",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SketchRadius.badge,
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
