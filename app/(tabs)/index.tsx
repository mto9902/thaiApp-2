import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { canAccessApp, isGuestUser } from "../../src/utils/auth";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Sketch } from "@/constants/theme";
import { grammarPoints } from "../../src/data/grammar";
import { getAllProgress } from "../../src/utils/grammarProgress";
import { API_BASE } from "../../src/config";

// Generate mock heatmap data (26 weeks x 7 days = ~6 months)
function generateHeatmapData(): number[] {
  const data: number[] = [];
  for (let i = 0; i < 182; i++) {
    const rand = Math.random();
    if (rand < 0.3) data.push(0);
    else if (rand < 0.55) data.push(1);
    else if (rand < 0.75) data.push(2);
    else if (rand < 0.9) data.push(3);
    else data.push(4);
  }
  return data;
}

const HEATMAP_COLORS = [
  '#E8E8E8', // 0 - no activity
  '#D0D0D0', // 1 - light
  '#B0B0B0', // 2 - medium
  '#888888', // 3 - high
  '#555555', // 4 - very high
];

type ModuleInfo = {
  title: string;
  grammarIds: string[];
};

const MODULES: ModuleInfo[] = [
  {
    title: "Module 1: Thai Script & Tones",
    grammarIds: grammarPoints.filter((g) => g.level === 1).slice(0, 7).map((g) => g.id),
  },
  {
    title: "Module 2: Sentence Structure",
    grammarIds: grammarPoints.filter((g) => g.level === 1).slice(7, 14).map((g) => g.id),
  },
  {
    title: "Module 3: Verb Conjugation",
    grammarIds: grammarPoints.filter((g) => g.level === 1).slice(14).map((g) => g.id),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [heatmapData] = useState(() => generateHeatmapData());
  const [moduleProgress, setModuleProgress] = useState<number[]>([0, 0, 0]);
  const [reviewsDue, setReviewsDue] = useState(0);

  useEffect(() => {
    checkAuth();
    isGuestUser().then(setIsGuest);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
      loadVocabStats();
    }, [])
  );

  async function checkAuth() {
    const allowed = await canAccessApp();
    if (!allowed) {
      router.replace("/login");
    }
  }

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

  async function loadVocabStats() {
    try {
      const guest = await isGuestUser();
      if (guest) return;
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE}/vocab/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReviewsDue(data?.reviews_due || 0);
    } catch (err) {
      // silently fail
    }
  }

  // Render heatmap as rows of 7 (days per week), columns = weeks
  function renderHeatmap() {
    const weeks = 26;
    const days = 7;
    const squareSize = 10;
    const gap = 2;

    return (
      <View style={styles.heatmapContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.heatmapGrid}>
            {Array.from({ length: days }).map((_, dayIndex) => (
              <View key={dayIndex} style={styles.heatmapRow}>
                {Array.from({ length: weeks }).map((_, weekIndex) => {
                  const dataIndex = weekIndex * days + dayIndex;
                  const level = heatmapData[dataIndex] || 0;
                  return (
                    <View
                      key={weekIndex}
                      style={[
                        styles.heatmapSquare,
                        {
                          width: squareSize,
                          height: squareSize,
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
        </ScrollView>
      </View>
    );
  }

  const estimatedTime = Math.max(1, Math.round(reviewsDue * 0.15));

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Keystone</Text>
          <Text style={styles.appSubtitle}>Thai Grammar Blueprint</Text>
        </View>

        <View style={styles.divider} />

        {/* Learning Velocity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Velocity (6 Months)</Text>
          {renderHeatmap()}
        </View>

        <View style={styles.divider} />

        {/* SRS Review */}
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
                <Text style={styles.reviewStatBold}>{reviewsDue || 78}</Text> cards due
              </Text>
              <Text style={styles.reviewEstimate}>
                Est. time: {estimatedTime}m
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Grammar Foundations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Grammar Foundations{" "}
            <Text style={styles.sectionTitleLight}>(The Keystone)</Text>
          </Text>

          {MODULES.map((mod, i) => (
            <TouchableOpacity
              key={i}
              style={styles.moduleRow}
              onPress={() => router.push("/practice/levels" as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.moduleText}>
                {mod.title} ({moduleProgress[i]}%)
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Sketch.inkMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickLinks}>
            {[
              { label: "Alphabet", icon: "text-outline" as const, route: "/alphabet/" },
              { label: "Tones", icon: "musical-notes-outline" as const, route: "/tones/" },
              { label: "Vowels", icon: "ellipse-outline" as const, route: "/vowels/" },
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

  // Header
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

  // Divider
  divider: {
    height: 1,
    backgroundColor: Sketch.inkFaint,
    marginVertical: 20,
  },

  // Section
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

  // Heatmap
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

  // SRS Review
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

  // Modules
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

  // Quick Links
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
