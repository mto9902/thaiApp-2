import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { canAccessApp, isGuestUser } from "../../src/utils/auth";

import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import KeystoneLogo from "../../src/components/KeystoneLogo";
import { API_BASE } from "../../src/config";
import { grammarPoints } from "../../src/data/grammar";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  GrammarStage,
} from "../../src/data/grammarStages";
import {
  getAllProgress,
  isGrammarPracticed,
} from "../../src/utils/grammarProgress";
import { getAuthToken } from "../../src/utils/authStorage";

// Thresholds: 0 = nothing, 1-14 = light, 15-39 = medium, 40-79 = dark, 80+ = darkest
function activityToLevel(count: number): number {
  if (count === 0) return 0;
  if (count < 15) return 1;
  if (count < 40) return 2;
  if (count < 80) return 3;
  return 4;
}

/** Format date as "YYYY-MM-DD" in local time (avoids timezone issues with toISOString). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const HEATMAP_COLORS = ["#E8E8E8", "#D0D0D0", "#B0B0B0", "#888888", "#555555"];

type ModuleInfo = {
  stage: GrammarStage;
  title: string;
  grammarIds: string[];
};

function formatReviewDelay(nextDueAt: string): string {
  const msUntilDue = Math.max(new Date(nextDueAt).getTime() - Date.now(), 0);
  const minsUntilDue = Math.ceil(msUntilDue / 60000);

  if (minsUntilDue <= 1) return "<1m";
  if (minsUntilDue < 60) return `${minsUntilDue}m`;

  const hoursUntilDue = Math.ceil(minsUntilDue / 60);
  if (hoursUntilDue < 24) return `${hoursUntilDue}h`;

  const daysUntilDue = Math.ceil(hoursUntilDue / 24);
  return `${daysUntilDue}d`;
}

const MODULES: ModuleInfo[] = [
  ...GRAMMAR_STAGES.filter((stage) =>
    grammarPoints.some((g) => g.stage === stage),
  ).map((stage) => ({
    stage,
    title: GRAMMAR_STAGE_META[stage].shortTitle,
    grammarIds: grammarPoints.filter((g) => g.stage === stage).map((g) => g.id),
  })),
];

export default function HomeScreen() {
  const router = useRouter();
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [isGuest, setIsGuest] = useState(false);
  const [moduleProgress, setModuleProgress] = useState<number[]>(() =>
    MODULES.map(() => 0),
  );
  const [overallGrammarProgress, setOverallGrammarProgress] = useState(0);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [reviewStatusText, setReviewStatusText] = useState("You're caught up");
  const [progressPage, setProgressPage] = useState(0);

  const checkAuth = useCallback(async () => {
    const allowed = await canAccessApp();
    if (!allowed) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
      loadReviewStatus();
      loadHeatmap();
    }, []),
  );

  async function loadProgress() {
    try {
      const allProgress = await getAllProgress();
      const totalPracticed = grammarPoints.filter((point) =>
        isGrammarPracticed(allProgress[point.id]),
      ).length;
      const newModuleProgress = MODULES.map((mod) => {
        if (mod.grammarIds.length === 0) return 0;
        const practiced = mod.grammarIds.filter((id) =>
          isGrammarPracticed(allProgress[id]),
        ).length;
        return Math.round((practiced / mod.grammarIds.length) * 100);
      });
      const overallPercent =
        grammarPoints.length > 0
          ? Math.round((totalPracticed / grammarPoints.length) * 100)
          : 0;

      setModuleProgress(newModuleProgress);
      setOverallGrammarProgress(overallPercent);
    } catch (err) {
      console.error("Failed to load progress:", err);
    }
  }

  const progressCards = useMemo(() => {
    const cards: {
      key: string;
      label: string;
      title: string;
      percent: number;
      route: string;
    }[] = [];

    if (moduleProgress.some((p) => p > 0)) {
      cards.push({
        key: "overview",
        label: "Overview",
        title: "All Grammar",
        percent: overallGrammarProgress,
        route: "/progress",
      });

      MODULES.forEach((mod, i) => {
        if (moduleProgress[i] === 0) return;
        cards.push({
          key: mod.stage,
          label: mod.stage,
          title: mod.title,
          percent: moduleProgress[i],
          route: `/practice/CSVGrammarIndex?stage=${mod.stage}`,
        });
      });
    }

    return cards;
  }, [moduleProgress, overallGrammarProgress]);

  const progressPageCount = Math.ceil(progressCards.length / 3);
  const visibleProgressCards = progressCards.slice(
    progressPage * 3,
    progressPage * 3 + 3,
  );

  useEffect(() => {
    setProgressPage((current) => {
      if (progressPageCount === 0) return 0;
      return Math.min(current, progressPageCount - 1);
    });
  }, [progressPageCount]);

  async function loadReviewStatus() {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);
      if (guest) {
        setReviewsDue(0);
        setReviewStatusText("Log in to review");
        return;
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data?.waiting && data?.nextDueAt) {
        setReviewsDue(0);
        setReviewStatusText(
          `Next card in ${formatReviewDelay(data.nextDueAt)}`,
        );
        return;
      }

      if (data?.done) {
        setReviewsDue(0);
        setReviewStatusText("You're caught up");
        return;
      }

      const counts = data?.counts ?? {};
      const actionableReviews =
        (counts.newCount ?? 0) +
        (counts.learningCount ?? 0) +
        (counts.reviewCount ?? 0);
      const dueNow = actionableReviews > 0 ? actionableReviews : 1;

      setReviewsDue(dueNow);
      setReviewStatusText(
        `Est. time: ${Math.max(1, Math.round(dueNow * 0.15))}m`,
      );
    } catch {
      setReviewsDue(0);
      setReviewStatusText("Review unavailable");
    }
  }

  async function loadHeatmap() {
    try {
      const guest = await isGuestUser();
      if (guest) return;
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setActivityMap(await res.json());
    } catch {
      // keep default empty
    }
  }

  function renderHeatmap() {
    const SQ = 11;
    const GAP = 2;
    const CELL = SQ + GAP;
    const DAY_LABEL_W = 28;
    const MONTH_LABEL_H = 16;
    const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
    const MONTH_NAMES = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    // Fixed 26-week grid (like GitHub contributions).
    // Start = Sunday of the week containing earliest activity, or 26 weeks back.
    // Grid always extends forward to fill 26 columns total.
    const TOTAL_WEEKS = 26;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = localDateKey(today);

    // Find earliest activity
    const activityDates = Object.keys(activityMap).sort();
    let startSunday: Date;
    if (activityDates.length > 0) {
      const earliest = new Date(activityDates[0] + "T00:00:00");
      startSunday = new Date(earliest);
      startSunday.setDate(startSunday.getDate() - startSunday.getDay());
    } else {
      // No activity — start 26 weeks back from this Saturday
      const endSat = new Date(today);
      endSat.setDate(endSat.getDate() + (6 - endSat.getDay()));
      startSunday = new Date(endSat);
      startSunday.setDate(startSunday.getDate() - (TOTAL_WEEKS * 7 - 1));
    }

    const numWeeks = TOTAL_WEEKS;

    // Month labels: check first day of each week column
    const monthLabels: { col: number; label: string }[] = [];
    let prevMonth = -1;
    for (let w = 0; w < numWeeks; w++) {
      const d = new Date(startSunday);
      d.setDate(d.getDate() + w * 7);
      const m = d.getMonth();
      if (m !== prevMonth) {
        monthLabels.push({ col: w, label: MONTH_NAMES[m] });
        prevMonth = m;
      }
    }

    return (
      <View style={styles.heatmapContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Month labels */}
            <View
              style={{
                flexDirection: "row",
                height: MONTH_LABEL_H,
                marginLeft: DAY_LABEL_W,
              }}
            >
              {monthLabels.map((ml, i) => (
                <Text
                  key={i}
                  style={{
                    position: "absolute",
                    left: ml.col * CELL,
                    fontSize: 10,
                    color: Sketch.inkMuted,
                    fontWeight: "500",
                  }}
                >
                  {ml.label}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: "row" }}>
              {/* Day-of-week labels */}
              <View style={{ width: DAY_LABEL_W }}>
                {DAY_LABELS.map((label, i) => (
                  <View
                    key={i}
                    style={{ height: CELL, justifyContent: "center" }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        color: Sketch.inkMuted,
                        fontWeight: "500",
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Squares: rows = day-of-week (0=Sun..6=Sat), cols = weeks */}
              <View style={styles.heatmapGrid}>
                {Array.from({ length: 7 }).map((_, dow) => (
                  <View key={dow} style={styles.heatmapRow}>
                    {Array.from({ length: numWeeks }).map((_, week) => {
                      const d = new Date(startSunday);
                      d.setDate(d.getDate() + week * 7 + dow);
                      const key = localDateKey(d);
                      const isFuture = key > todayKey;
                      const count = activityMap[key] || 0;
                      const level = isFuture ? 0 : activityToLevel(count);

                      return (
                        <View
                          key={week}
                          style={{
                            width: SQ,
                            height: SQ,
                            backgroundColor: HEATMAP_COLORS[level],
                            marginRight: GAP,
                            marginBottom: GAP,
                            borderRadius: 4,
                          }}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Branded Header */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>Keystone</Text>
          <Text style={styles.brandSubtitle}>Thai Grammar Blueprint</Text>
          <View style={styles.brandAccentLine} />
        </View>

        <View style={styles.spacing} />

        {/* Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Activity</Text>
            {isGuest ? (
              <Text style={styles.sectionHint}>Log in to track heatmap</Text>
            ) : null}
          </View>
          <View style={styles.heatmapCard}>{renderHeatmap()}</View>
        </View>

        <View style={styles.spacing} />

        {/* Action Tiles */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => router.push("/review/" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionTileValue}>
              {reviewsDue > 0 ? reviewsDue : 0}
            </Text>
            <Text style={styles.actionTileLabel}>cards due</Text>
            <Text style={styles.actionTileMeta}>{reviewStatusText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => router.push("/trainer" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="text-outline" size={22} color={Sketch.accent} />
            <Text style={styles.actionTileTitle}>Alphabet Trainer</Text>
            <Text style={styles.actionTileLabel}>Consonants & vowels</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacing} />

        {/* Grammar Modules */}
        <View style={styles.section}>
          <View style={styles.progressSectionHeader}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            {progressPageCount > 1 ? (
              <View style={styles.progressPager}>
                <TouchableOpacity
                  style={[
                    styles.progressPagerButton,
                    progressPage === 0 && styles.progressPagerButtonDisabled,
                  ]}
                  onPress={() =>
                    setProgressPage((current) => Math.max(0, current - 1))
                  }
                  activeOpacity={0.75}
                  disabled={progressPage === 0}
                >
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={progressPage === 0 ? Sketch.inkFaint : Sketch.inkMuted}
                  />
                </TouchableOpacity>
                <Text style={styles.progressPagerText}>
                  {progressPage + 1}/{progressPageCount}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.progressPagerButton,
                    progressPage >= progressPageCount - 1 &&
                      styles.progressPagerButtonDisabled,
                  ]}
                  onPress={() =>
                    setProgressPage((current) =>
                      Math.min(progressPageCount - 1, current + 1),
                    )
                  }
                  activeOpacity={0.75}
                  disabled={progressPage >= progressPageCount - 1}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={
                      progressPage >= progressPageCount - 1
                        ? Sketch.inkFaint
                        : Sketch.inkMuted
                    }
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {moduleProgress.some((p) => p > 0) ? (
            <View style={styles.modulesGrid}>
              {visibleProgressCards.map((card) => (
                <TouchableOpacity
                  key={card.key}
                  style={styles.moduleCard}
                  onPress={() => router.push(card.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.moduleCardHeader}>
                    <Text style={styles.moduleLevel}>{card.label}</Text>
                  </View>
                  <Text style={styles.moduleTitle}>{card.title}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${card.percent}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressPercent}>
                      {card.percent}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startGrammarCard}
              onPress={() => router.push("/progress" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={28} color={Sketch.accent} />
              <View style={styles.startGrammarText}>
                <Text style={styles.startGrammarTitle}>
                  Begin your grammar journey
                </Text>
                <Text style={styles.startGrammarSub}>
                  Explore Thai grammar from A1.1 onward
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Sketch.inkMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.spacing} />

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.quickLinks}>
            {[
              {
                label: "Alphabet",
                icon: "text-outline" as const,
                route: "/alphabet/",
              },
              {
                label: "Tones",
                icon: "musical-notes-outline" as const,
                route: "/tones/",
              },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickLinkCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={24} color={Sketch.accent} />
                <Text style={styles.quickLinkText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  spacing: {
    height: 32,
  },
  // Branded Header
  brandHeader: {
    paddingVertical: 24,
    paddingBottom: 32,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginBottom: 16,
    fontStyle: "italic",
  },
  brandAccentLine: {
    width: 40,
    height: 2,
    backgroundColor: Sketch.accent,
  },
  // Action Tiles
  actionRow: {
    flexDirection: "row",
    gap: 16,
  },
  actionTile: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 0,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    minHeight: 140,
  },
  actionTileValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.accent,
  },
  actionTileTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  actionTileLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  actionTileMeta: {
    fontSize: 11,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  // Sections
  section: {
    gap: 16,
  },
  progressSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  progressPager: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressPagerButton: {
    width: 32,
    height: 32,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  progressPagerButtonDisabled: {
    opacity: 0.5,
  },
  progressPagerText: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  heatmapCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 0,
    padding: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  heatmapContainer: {
    marginTop: 0,
  },
  heatmapGrid: {
    flexDirection: "column",
  },
  heatmapRow: {
    flexDirection: "row",
  },
  // Module Cards
  modulesGrid: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  moduleCardHeader: {
    marginBottom: 10,
  },
  moduleLevel: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
    marginBottom: 14,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Sketch.paperDark,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Sketch.accent,
    borderRadius: 0,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    minWidth: 30,
    textAlign: "right",
  },
  // Start Grammar CTA
  startGrammarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Sketch.cardBg,
    borderRadius: 0,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  startGrammarText: {
    flex: 1,
    gap: 6,
  },
  startGrammarTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  startGrammarSub: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  // Quick Links
  quickLinks: {
    flexDirection: "row",
    gap: 12,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 0,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.ink,
  },
});
