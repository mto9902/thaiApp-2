import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import {
  GRAMMAR_STAGE_META,
  GRAMMAR_STAGES,
  GrammarStage,
} from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { canAccessApp, isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import {
  getAllProgress,
  isGrammarPracticed,
} from "@/src/utils/grammarProgress";

function activityToLevel(count: number): number {
  if (count === 0) return 0;
  if (count < 15) return 1;
  if (count < 40) return 2;
  if (count < 80) return 3;
  return 4;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

const HEATMAP_COLORS = ["#E8E8E8", "#D0D0D0", "#B0B0B0", "#888888", "#555555"];

type ModuleInfo = {
  stage: GrammarStage;
  title: string;
  grammarIds: string[];
};

export default function HomeScreenWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [isGuest, setIsGuest] = useState(false);
  const [moduleProgress, setModuleProgress] = useState<number[]>([]);
  const [overallGrammarProgress, setOverallGrammarProgress] = useState(0);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [reviewStatusText, setReviewStatusText] = useState("You're caught up");

  const modules = useMemo<ModuleInfo[]>(
    () =>
      GRAMMAR_STAGES.filter((stage) =>
        grammarPoints.some((g) => g.stage === stage),
      ).map((stage) => ({
        stage,
        title: GRAMMAR_STAGE_META[stage].shortTitle,
        grammarIds: grammarPoints
          .filter((g) => g.stage === stage)
          .map((g) => g.id),
      })),
    [grammarPoints],
  );

  const quickColumns = width >= 1280 ? 4 : width >= 980 ? 2 : 1;
  const quickCardWidth =
    quickColumns === 4 ? "23.6%" : quickColumns === 2 ? "48.8%" : "100%";

  const checkAuth = useCallback(async () => {
    const allowed = await canAccessApp();
    if (!allowed) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const loadProgress = useCallback(async () => {
    try {
      const allProgress = await getAllProgress();
      const totalPracticed = grammarPoints.filter((point) =>
        isGrammarPracticed(allProgress[point.id]),
      ).length;
      const nextModuleProgress = modules.map((mod) => {
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

      setModuleProgress(nextModuleProgress);
      setOverallGrammarProgress(overallPercent);
    } catch (err) {
      console.error("Failed to load progress:", err);
    }
  }, [grammarPoints, modules]);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
      void loadReviewStatus();
      void loadHeatmap();
    }, [loadProgress]),
  );

  useEffect(() => {
    setModuleProgress(modules.map(() => 0));
  }, [modules]);

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
      // noop
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

      modules.forEach((mod, index) => {
        if (moduleProgress[index] === 0) return;
        cards.push({
          key: mod.stage,
          label: mod.stage,
          title: mod.title,
          percent: moduleProgress[index],
          route: `/practice/CSVGrammarIndex?stage=${mod.stage}`,
        });
      });
    }

    return cards.slice(0, 4);
  }, [moduleProgress, modules, overallGrammarProgress]);

  function renderHeatmap() {
    const sq = width >= 1280 ? 12 : 11;
    const gap = 5;
    const cell = sq + gap;
    const totalWeeks = 26;
    const dayLabelWidth = 38;
    const monthLabelHeight = 20;
    const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
    const monthNames = [
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = localDateKey(today);

    const activityDates = Object.keys(activityMap).sort();
    let startSunday: Date;
    if (activityDates.length > 0) {
      const earliest = new Date(`${activityDates[0]}T00:00:00`);
      startSunday = new Date(earliest);
      startSunday.setDate(startSunday.getDate() - startSunday.getDay());
    } else {
      const endSat = new Date(today);
      endSat.setDate(endSat.getDate() + (6 - endSat.getDay()));
      startSunday = new Date(endSat);
      startSunday.setDate(startSunday.getDate() - (totalWeeks * 7 - 1));
    }

    const monthLabels: { col: number; label: string }[] = [];
    let prevMonth = -1;
    for (let week = 0; week < totalWeeks; week += 1) {
      const d = new Date(startSunday);
      d.setDate(d.getDate() + week * 7);
      const month = d.getMonth();
      if (month !== prevMonth) {
        monthLabels.push({ col: week, label: monthNames[month] });
        prevMonth = month;
      }
    }

    return (
      <View style={styles.heatmapFrame}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View
              style={[
                styles.monthRow,
                { marginLeft: dayLabelWidth, height: monthLabelHeight },
              ]}
            >
              {monthLabels.map((label, index) => (
                <Text
                  key={`${label.label}-${index}`}
                  style={[styles.monthLabel, { left: label.col * cell }]}
                >
                  {label.label}
                </Text>
              ))}
            </View>
            <View style={styles.heatmapBody}>
              <View style={{ width: dayLabelWidth }}>
                {dayLabels.map((label, index) => (
                  <View
                    key={`${label}-${index}`}
                    style={{ height: cell, justifyContent: "center" }}
                  >
                    <Text style={styles.dayLabel}>{label}</Text>
                  </View>
                ))}
              </View>
              <View>
                {Array.from({ length: 7 }).map((_, dow) => (
                  <View key={dow} style={styles.heatmapRow}>
                    {Array.from({ length: totalWeeks }).map((_, week) => {
                      const d = new Date(startSunday);
                      d.setDate(d.getDate() + week * 7 + dow);
                      const key = localDateKey(d);
                      const isFuture = key > todayKey;
                      const count = activityMap[key] || 0;
                      const level = isFuture ? 0 : activityToLevel(count);
                      return (
                        <View
                          key={`${week}-${dow}`}
                          style={[
                            styles.heatmapCell,
                            {
                              width: sq,
                              height: sq,
                              backgroundColor: HEATMAP_COLORS[level],
                              marginRight: gap,
                              marginBottom: gap,
                            },
                          ]}
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
    <DesktopPage
      eyebrow="Workspace"
      title="Keystone"
      subtitle="A desktop study workspace for review, grammar progress, and quick access into the Thai curriculum."
    >
      <View style={styles.pageStack}>
      <View style={styles.metricStrip}>
        {[
          {
            label: "Cards due",
            value: reviewsDue > 0 ? String(reviewsDue) : "0",
            meta: reviewStatusText,
            action: () => router.push("/review/" as any),
          },
          {
            label: "Grammar progress",
            value: `${overallGrammarProgress}%`,
            meta: `${progressCards.length > 0 ? progressCards.length - 1 : 0} active units`,
            action: () => router.push("/progress" as any),
          },
          {
            label: "Bookmarks",
            value: isGuest ? "—" : "Open",
            meta: "Saved grammar practice",
            action: () => router.push("/explore" as any),
          },
          {
            label: "Trainer",
            value: "Aa",
            meta: "Alphabet and reading drills",
            action: () => router.push("/trainer" as any),
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.metricCard, { width: quickCardWidth }]}
            onPress={item.action}
            activeOpacity={0.82}
          >
            <Text style={styles.metricValue}>{item.value}</Text>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricMeta}>{item.meta}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mainGrid}>
        <DesktopPanel style={styles.focusPanel}>
          <DesktopSectionTitle
            title="Focus"
            caption="Use the desktop home page as a launchpad instead of a single large hero block."
          />
          <View style={styles.focusActions}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => router.push("/review/" as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryActionText}>Open Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => router.push("/progress" as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.secondaryActionText}>View Grammar Units</Text>
            </TouchableOpacity>
          </View>

          {progressCards.length > 0 ? (
            <View style={styles.focusProgressList}>
              {progressCards.map((card) => (
                <TouchableOpacity
                  key={card.key}
                  style={styles.focusProgressCard}
                  onPress={() => router.push(card.route as any)}
                  activeOpacity={0.82}
                >
                  <View style={styles.focusProgressTop}>
                    <Text style={styles.focusProgressLabel}>{card.label}</Text>
                    <Text style={styles.focusProgressPercent}>{card.percent}%</Text>
                  </View>
                  <Text style={styles.focusProgressTitle}>{card.title}</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${card.percent}%` }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyProgressCard}
              onPress={() => router.push("/progress" as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.emptyProgressTitle}>Begin your grammar journey</Text>
              <Text style={styles.emptyProgressBody}>
                Explore Thai grammar from A1.1 onward.
              </Text>
            </TouchableOpacity>
          )}
        </DesktopPanel>

        <DesktopPanel style={styles.activityPanel}>
          <DesktopSectionTitle
            title="Activity"
            caption={
              isGuest
                ? "Log in to track the vocabulary heatmap."
                : "A 26-week overview of your vocabulary activity."
            }
          />
          {renderHeatmap()}
        </DesktopPanel>
      </View>

      <DesktopPanel>
        <DesktopSectionTitle
          title="Explore"
          caption="Desktop quick links are separated into smaller cards instead of one large block."
        />
        <View style={styles.exploreGrid}>
          {[
            {
              title: "Alphabet",
              body: "Browse consonants and sound classes.",
              route: "/alphabet/",
              icon: "text-outline" as const,
            },
            {
              title: "Tones",
              body: "Use the tone reference and listening guide.",
              route: "/tones/",
              icon: "musical-notes-outline" as const,
            },
            {
              title: "Bookmarks",
              body: "Open saved grammar practice sets.",
              route: "/explore",
              icon: "bookmark-outline" as const,
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.exploreCard, { width: width >= 1180 ? "31.8%" : "100%" }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.82}
            >
              <Ionicons name={item.icon} size={18} color={Sketch.accent} />
              <Text style={styles.exploreTitle}>{item.title}</Text>
              <Text style={styles.exploreBody}>{item.body}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </DesktopPanel>
      </View>
    </DesktopPage>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 28,
  },
  metricStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metricCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 20,
    gap: 4,
    minHeight: 132,
  },
  metricValue: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: Sketch.accent,
    letterSpacing: -0.8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
  metricMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
  mainGrid: {
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },
  focusPanel: {
    flex: 1.1,
  },
  activityPanel: {
    flex: 0.95,
  },
  focusActions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryAction: {
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryAction: {
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  focusProgressList: {
    gap: 12,
    marginTop: 6,
  },
  focusProgressCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
    gap: 10,
  },
  focusProgressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  focusProgressLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  focusProgressPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.accent,
  },
  focusProgressTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  track: {
    height: 7,
    backgroundColor: Sketch.inkFaint,
  },
  fill: {
    height: "100%",
    backgroundColor: Sketch.accent,
  },
  emptyProgressCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 8,
  },
  emptyProgressTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  emptyProgressBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  monthRow: {
    position: "relative",
    marginBottom: 8,
  },
  monthLabel: {
    position: "absolute",
    fontSize: 11,
    color: Sketch.inkMuted,
  },
  heatmapBody: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dayLabel: {
    fontSize: 11,
    color: Sketch.inkMuted,
  },
  heatmapRow: {
    flexDirection: "row",
  },
  heatmapCell: {
    borderRadius: 3,
  },
  heatmapFrame: {
    paddingTop: 6,
    alignSelf: "flex-start",
  },
  exploreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 4,
  },
  exploreCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 20,
    gap: 10,
    minHeight: 156,
  },
  exploreTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  exploreBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
});
