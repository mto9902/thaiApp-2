import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config";
import {
  CEFR_LEVEL_META,
  PUBLIC_CEFR_LEVELS,
  type PublicCefrLevel,
} from "@/src/data/grammarLevels";
import {
  GRAMMAR_STAGE_META,
  PUBLIC_GRAMMAR_STAGES,
  type PublicGrammarStage,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { getAuthToken } from "@/src/utils/authStorage";
import { getGrammarCardCopy } from "@/src/utils/grammarCardCopy";
import {
  getAllProgress,
  type GrammarProgressData,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

import {
  BRAND,
  CARD_SHADOW,
  SettledPressable,
  SurfaceButton,
  SURFACE_PRESSED,
  SURFACE_SHADOW,
} from "./dashboardSurface";

export default function GrammarTopicsMobileScreen() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const { level, stage } = useLocalSearchParams<{ level?: string; stage?: string }>();
  const { isPremium } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();
  const [progress, setProgress] = useState<Record<string, GrammarProgressData>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const rawLevel = Array.isArray(level) ? level[0] : level;
  const rawStage = Array.isArray(stage) ? stage[0] : stage;
  const selectedLevel =
    rawLevel && PUBLIC_CEFR_LEVELS.includes(rawLevel as PublicCefrLevel)
      ? (rawLevel as PublicCefrLevel)
      : undefined;
  const selectedStage =
    rawStage && PUBLIC_GRAMMAR_STAGES.includes(rawStage as PublicGrammarStage)
      ? (rawStage as PublicGrammarStage)
      : undefined;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const [nextProgress, token] = await Promise.all([
          getAllProgress(),
          getAuthToken(),
        ]);

        if (!active) return;
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
          if (!active) return;
          setBookmarkedIds(
            new Set(
              Array.isArray(data)
                ? data
                    .map((item: { grammar_id?: string }) => item.grammar_id)
                    .filter((value): value is string => Boolean(value))
                : [],
            ),
          );
        } catch (error) {
          console.error("[GrammarTopicsMobileScreen] load bookmarks failed:", error);
          if (!active) return;
          setBookmarkedIds(new Set());
        }
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  const filtered = useMemo(() => {
    if (selectedStage) return grammarPoints.filter((point) => point.stage === selectedStage);
    if (!selectedLevel) return grammarPoints;
    return grammarPoints.filter((point) => point.level === selectedLevel);
  }, [grammarPoints, selectedLevel, selectedStage]);

  const practiced = filtered.filter((point) => isGrammarPracticed(progress[point.id])).length;
  const percentage =
    filtered.length > 0 ? Math.round((practiced / filtered.length) * 100) : 0;
  const remaining = Math.max(filtered.length - practiced, 0);
  const nextUnlearned =
    filtered.find((point) => !isGrammarPracticed(progress[point.id])) ?? null;

  const levelMeta = selectedLevel ? CEFR_LEVEL_META[selectedLevel] : null;
  const stageMeta = selectedStage ? GRAMMAR_STAGE_META[selectedStage] : null;
  const isTemporaryMaintenance = selectedStage === "C1" || selectedLevel === "C1";

  const pageTitle = stageMeta?.title ?? levelMeta?.homeTitle ?? "Grammar path";
  const pageSubtitle =
    stageMeta?.subtitle ??
    levelMeta?.subtitle ??
    "Open any lesson and continue where you left off.";
  const nextCardCopy = nextUnlearned ? getGrammarCardCopy(nextUnlearned) : null;

  const openPoint = useCallback(
    (grammarId: string, title: string, locked: boolean) => {
      if (locked) {
        void ensurePremiumAccess(title, `/practice/${grammarId}`);
        return;
      }

      router.push(`/grammar-lesson/${grammarId}` as any);
    },
    [ensurePremiumAccess, router],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        testID="keystone-mobile-page-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>{selectedStage ?? selectedLevel ?? "Grammar"}</Text>
              <Text style={styles.heroTitle}>{pageTitle}</Text>
              <Text style={styles.heroSubtitle}>{pageSubtitle}</Text>
            </View>
            <SurfaceButton
              label="Back"
              icon="arrow-back"
              size="compact"
              onPress={() => router.push("/progress" as any)}
            />
          </View>
        </View>

        {isTemporaryMaintenance ? (
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Temporarily unavailable</Text>
            <Text style={styles.bodyText}>
              C1 lessons are being updated right now. Please try again later.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Progress</Text>
              <Text style={styles.bodyText}>See how much of this section you have practiced.</Text>

              <View style={styles.progressRow}>
                <Text style={styles.bigPercent}>{percentage}%</Text>
                <View style={styles.progressCopy}>
                  <Text style={styles.metricText}>
                    {practiced}/{filtered.length} topics practiced
                  </Text>
                  <Text style={styles.progressHint}>{remaining} still open</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percentage}%` }]} />
              </View>
            </View>

            {nextUnlearned && nextCardCopy ? (
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Next lesson</Text>
                <Text style={styles.bodyText}>
                  Continue with the first lesson you have not practiced yet.
                </Text>

                <View style={styles.nextLessonCard}>
                  <View style={styles.nextLessonHeader}>
                    <Text style={styles.cardEyebrow}>Next</Text>
                    <Text style={styles.nextLessonStage}>{nextUnlearned.stage}</Text>
                  </View>
                  <Text style={styles.nextLessonTitle}>{nextCardCopy.title}</Text>
                  <Text style={styles.nextLessonBody}>{nextCardCopy.meaning}</Text>
                  <SurfaceButton
                    label="Continue"
                    variant="primary"
                    onPress={() =>
                      openPoint(
                        nextUnlearned.id,
                        nextCardCopy.title,
                        isPremiumGrammarPoint(nextUnlearned) && !isPremium,
                      )
                    }
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Topics</Text>
              <Text style={styles.bodyText}>Open any lesson in this section whenever you are ready.</Text>

              <View style={styles.topicList}>
                {filtered.map((point) => {
                  const copy = getGrammarCardCopy(point);
                  const done = isGrammarPracticed(progress[point.id]);
                  const locked = isPremiumGrammarPoint(point) && !isPremium;
                  const bookmarked = bookmarkedIds.has(point.id);

                  return (
                    <SettledPressable
                      key={point.id}
                      onPress={() => openPoint(point.id, copy.title, locked)}
                      style={({ pressed }: { pressed: boolean }) => [
                        styles.topicCard,
                        pressed ? styles.surfacePressed : null,
                      ]}
                    >
                      <View style={styles.topicTopRow}>
                        <View style={styles.topicMetaRow}>
                          <Text style={styles.cardEyebrow}>{point.stage}</Text>
                          <Text style={styles.topicOrderLabel}>
                            {String(filtered.indexOf(point) + 1).padStart(2, "0")}
                          </Text>
                        </View>

                        <View style={styles.topicStatusRow}>
                          {bookmarked ? (
                            <Ionicons
                              name="bookmark"
                              size={15}
                              color={BRAND.inkSoft}
                              style={styles.topicStatusIcon}
                            />
                          ) : null}
                          {locked ? (
                            <Ionicons
                              name="lock-closed-outline"
                              size={15}
                              color={BRAND.inkSoft}
                            />
                          ) : done ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={17}
                              color={BRAND.navy}
                            />
                          ) : (
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={BRAND.inkSoft}
                            />
                          )}
                        </View>
                      </View>

                      <Text style={styles.topicTitle}>{copy.title}</Text>
                      <Text style={styles.topicPattern}>{copy.pattern}</Text>
                      <Text style={styles.topicMeaning}>{copy.meaning}</Text>

                      <View style={styles.topicFooter}>
                        <Text style={styles.topicFooterText}>
                          {locked
                            ? "Keystone Access required"
                            : done
                              ? "Completed"
                              : "Ready to open"}
                        </Text>
                        <View style={styles.openRow}>
                          <Text style={styles.openText}>{done ? "Review lesson" : "Open lesson"}</Text>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={BRAND.ink}
                          />
                        </View>
                      </View>
                    </SettledPressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },
  hero: {
    gap: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 14,
    ...CARD_SHADOW,
  },
  sectionHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
  },
  bigPercent: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "800",
    color: BRAND.ink,
  },
  progressCopy: {
    flex: 1,
    gap: 4,
    paddingBottom: 4,
  },
  metricText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
  },
  progressHint: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E9EEF5",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: BRAND.navy,
  },
  nextLessonCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  nextLessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  nextLessonStage: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  nextLessonTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
  },
  nextLessonBody: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  topicList: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  surfacePressed: {
    ...SURFACE_PRESSED,
  },
  topicTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topicMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topicOrderLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  topicStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  topicStatusIcon: {
    marginRight: 8,
  },
  topicTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  topicPattern: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.inkSoft,
    fontWeight: "700",
  },
  topicMeaning: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  topicFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topicFooterText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.ink,
  },
});
