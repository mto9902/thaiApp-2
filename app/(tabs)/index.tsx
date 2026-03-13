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
                            borderRadius: 2,
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
        <View style={styles.header}>
          <Text style={styles.appTitle}>Keystone</Text>
          <Text style={styles.appSubtitle}>Thai Grammar Blueprint</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          {renderHeatmap()}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SRS Review</Text>
          <View style={styles.reviewCard}>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => router.push("/review/" as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.reviewButtonText}>START REVIEW</Text>
            </TouchableOpacity>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewStat}>
                <Text style={styles.reviewStatBold}>{reviewsDue}</Text> cards
                due
              </Text>
              <Text style={styles.reviewEstimate}>{reviewStatusText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Grammar Foundations{" "}
            <Text style={styles.sectionTitleLight}>(The Keystone)</Text>
          </Text>

          {MODULES.map((mod, i) => (
            <TouchableOpacity
              key={mod.level}
              style={styles.moduleRow}
              onPress={() =>
                router.push(`/practice/CSVGrammarIndex?level=${mod.level}` as any)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.moduleText}>
                {mod.level} - {mod.title} ({moduleProgress[i]}%)
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Sketch.inkMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
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
              {
                label: "Vowels",
                icon: "ellipse-outline" as const,
                route: "/vowels/",
              },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickLinkCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={20} color={Sketch.inkLight} />
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
  header: {
    paddingVertical: 12,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
    marginVertical: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Sketch.ink,
  },
  sectionTitleLight: {
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  heatmapContainer: {
    marginTop: 4,
  },
  heatmapGrid: {
    flexDirection: "column",
  },
  heatmapRow: {
    flexDirection: "row",
  },
  heatmapSquare: {
    borderRadius: 2,
  },
  reviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  reviewButton: {
    backgroundColor: Sketch.orange,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  reviewInfo: {
    gap: 2,
  },
  reviewStat: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.ink,
  },
  reviewStatBold: {
    fontWeight: "700",
  },
  reviewEstimate: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  moduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  moduleText: {
    fontSize: 15,
    fontWeight: "400",
    color: Sketch.ink,
  },
  quickLinks: {
    flexDirection: "row",
    gap: 12,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
});
