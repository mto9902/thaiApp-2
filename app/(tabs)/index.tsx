import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { canAccessApp, isGuestUser } from "../../src/utils/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import KeystoneLogo from "../../src/components/KeystoneLogo";
import { API_BASE } from "../../src/config";
import { grammarPoints } from "../../src/data/grammar";
import { CEFR_LEVEL_META, CEFR_LEVELS, CefrLevel } from "../../src/data/grammarLevels";
import { getAllProgress } from "../../src/utils/grammarProgress";

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
  level: CefrLevel;
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
  ...CEFR_LEVELS.map((level) => ({
    level,
    title: CEFR_LEVEL_META[level].homeTitle,
    grammarIds: grammarPoints.filter((g) => g.level === level).map((g) => g.id),
  })),
];

export default function HomeScreen() {
  const router = useRouter();
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [moduleProgress, setModuleProgress] = useState<number[]>(
    () => MODULES.map(() => 0),
  );
  const [reviewsDue, setReviewsDue] = useState(0);
  const [reviewStatusText, setReviewStatusText] = useState("You're caught up");

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
      const newModuleProgress = MODULES.map((mod) => {
        if (mod.grammarIds.length === 0) return 0;
        const practiced = mod.grammarIds.filter((id) => allProgress[id]).length;
        return Math.round((practiced / mod.grammarIds.length) * 100);
      });
      setModuleProgress(newModuleProgress);
    } catch (err) {
      console.error("Failed to load progress:", err);
    }
  }

  async function loadReviewStatus() {
    try {
      const guest = await isGuestUser();
      if (guest) {
        setReviewsDue(0);
        setReviewStatusText("Log in to review");
        return;
      }

      const token = await AsyncStorage.getItem("token");
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
      const token = await AsyncStorage.getItem("token");
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
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View>
            {/* Month labels */}
            <View style={{ flexDirection: "row", height: MONTH_LABEL_H, marginLeft: DAY_LABEL_W }}>
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
                  <View key={i} style={{ height: CELL, justifyContent: "center" }}>
                    <Text style={{ fontSize: 9, color: Sketch.inkMuted, fontWeight: "500" }}>
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
          <KeystoneLogo size={44} />
          <View>
            <Text style={styles.brandTitle}>Keystone</Text>
            <Text style={styles.brandSubtitle}>Thai Grammar Blueprint</Text>
          </View>
        </View>

        <View style={styles.spacing} />

        {/* Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.heatmapCard}>
            {renderHeatmap()}
          </View>
        </View>

        <View style={styles.spacing} />

        {/* Action Tiles */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => router.push("/review/" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="albums-outline" size={22} color={Sketch.orange} />
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
            <Ionicons name="text-outline" size={22} color={Sketch.orange} />
            <Text style={styles.actionTileTitle}>Alphabet Trainer</Text>
            <Text style={styles.actionTileLabel}>Consonants & vowels</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacing} />

        {/* Grammar Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>

          {moduleProgress.some((p) => p > 0) ? (
            <View style={styles.modulesGrid}>
              {MODULES.map((mod, i) => {
                if (moduleProgress[i] === 0) return null;
                return (
                  <TouchableOpacity
                    key={mod.level}
                    style={styles.moduleCard}
                    onPress={() =>
                      router.push(`/practice/CSVGrammarIndex?level=${mod.level}` as any)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.moduleCardHeader}>
                      <Text style={styles.moduleLevel}>{mod.level}</Text>
                    </View>
                    <Text style={styles.moduleTitle}>{mod.title}</Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${moduleProgress[i]}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressPercent}>
                        {moduleProgress[i]}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startGrammarCard}
              onPress={() => router.push("/practice/levels" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={28} color={Sketch.orange} />
              <View style={styles.startGrammarText}>
                <Text style={styles.startGrammarTitle}>Begin your grammar journey</Text>
                <Text style={styles.startGrammarSub}>
                  Explore Thai grammar from A1 to C1
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Sketch.inkMuted} />
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
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={Sketch.orange}
                />
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  spacing: {
    height: 24,
  },
  // Branded Header
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 1,
  },
  // Action Tiles
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionTile: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    minHeight: 120,
  },
  actionTileValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  actionTileTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  actionTileLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  heatmapCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    padding: 16,
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleCardHeader: {
    marginBottom: 10,
  },
  moduleLevel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.orange,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.ink,
    marginBottom: 12,
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
    backgroundColor: Sketch.orange,
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkLight,
    minWidth: 30,
    textAlign: "right",
  },
  // Start Grammar CTA
  startGrammarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  startGrammarText: {
    flex: 1,
    gap: 4,
  },
  startGrammarTitle: {
    fontSize: 15,
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
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
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
