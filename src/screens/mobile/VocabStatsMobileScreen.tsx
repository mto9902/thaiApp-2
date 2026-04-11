import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AccentSwitch from "@/src/components/AccentSwitch";
import VocabSrsInfoSheet from "@/src/components/VocabSrsInfoSheet";
import { API_BASE } from "@/src/config";
import {
  BRAND,
  CARD_SHADOW,
  SurfaceButton,
  SURFACE_SHADOW,
} from "@/src/screens/mobile/dashboardSurface";
import {
  getPracticeWordTrackingEnabled,
  setPracticeWordTrackingEnabled,
} from "@/src/utils/practiceWordPreference";
import { getAuthToken } from "@/src/utils/authStorage";

type VocabStatsData = {
  total_words: number;
  new_words: number;
  learning_words: number;
  reviewing_words: number;
  mastered_words: number;
  reviews_due: number;
  avg_ease: string | number | null;
  total_lapses: number;
};

type VocabProgressData = {
  reviews_today: number;
  words_learned_today: number;
  mastered_words: number;
};

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DeckMetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.deckMetricCard}>
      <Text style={styles.deckMetricValue}>{value}</Text>
      <Text style={styles.deckMetricLabel}>{label}</Text>
    </View>
  );
}

export default function VocabStatsMobileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VocabStatsData | null>(null);
  const [progress, setProgress] = useState<VocabProgressData | null>(null);
  const [trackPracticeVocab, setTrackPracticeVocab] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [showSrsInfo, setShowSrsInfo] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const [statsRes, progressRes, practiceWordSetting] = await Promise.all([
        fetch(`${API_BASE}/vocab/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/vocab/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        getPracticeWordTrackingEnabled(),
      ]);

      const [statsData, progressData] = await Promise.all([
        statsRes.json(),
        progressRes.json(),
      ]);

      setStats(statsData);
      setProgress(progressData);
      setTrackPracticeVocab(practiceWordSetting);
    } catch (err) {
      console.error("Failed to load vocab stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData]),
  );

  const togglePracticeWordTracking = useCallback(
    async (value: boolean) => {
      setTrackPracticeVocab(value);
      setSavingPreference(true);

      try {
        const saved = await setPracticeWordTrackingEnabled(value);
        setTrackPracticeVocab(saved);
      } catch (err) {
        console.error("Failed to save practice word preference:", err);
        setTrackPracticeVocab((current) => !current);
      } finally {
        setSavingPreference(false);
      }
    },
    [],
  );

  const summaryMetrics = useMemo(
    () => [
      { label: "Tracked words", value: stats?.total_words || 0 },
      { label: "Reviews due", value: stats?.reviews_due || 0 },
      { label: "Learned today", value: progress?.words_learned_today || 0 },
      { label: "Reviews today", value: progress?.reviews_today || 0 },
    ],
    [progress?.reviews_today, progress?.words_learned_today, stats?.reviews_due, stats?.total_words],
  );

  const deckMetrics = useMemo(
    () => [
      { label: "New", value: stats?.new_words || 0 },
      { label: "Learning", value: stats?.learning_words || 0 },
      { label: "In review", value: stats?.reviewing_words || 0 },
      { label: "Mastered", value: stats?.mastered_words || 0 },
      { label: "Average ease", value: stats?.avg_ease ?? "-" },
      { label: "Lapses", value: stats?.total_lapses || 0 },
    ],
    [
      stats?.avg_ease,
      stats?.learning_words,
      stats?.mastered_words,
      stats?.new_words,
      stats?.reviewing_words,
      stats?.total_lapses,
    ],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView
          testID="keystone-mobile-page-scroll"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Text style={styles.topTitle}>Vocab stats</Text>
            <SurfaceButton
              label="Back"
              icon="arrow-back"
              size="compact"
              onPress={() => router.back()}
            />
          </View>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator size="large" color={BRAND.inkSoft} />
            </View>
          ) : !stats ? (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Unable to load vocab stats</Text>
              <Text style={styles.bodyText}>
                Try again in a moment.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryGrid}>
                {summaryMetrics.map((metric) => (
                  <SummaryCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                  />
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Adding vocab</Text>
                <Text style={styles.bodyText}>
                  Add grammar words to your review deck automatically.
                </Text>

                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceCopy}>
                    <Text style={styles.preferenceLabel}>From grammar practice</Text>
                    <Text style={styles.preferenceHint}>
                      {savingPreference
                        ? "Saving..."
                        : trackPracticeVocab
                          ? "Currently on"
                          : "Currently off"}
                    </Text>
                  </View>
                  <AccentSwitch
                    value={trackPracticeVocab}
                    onValueChange={(next) => void togglePracticeWordTracking(next)}
                    disabled={savingPreference}
                  />
                </View>

                <SurfaceButton
                  label="How SRS works"
                  onPress={() => setShowSrsInfo(true)}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Deck state</Text>
                <View style={styles.deckGrid}>
                  {deckMetrics.map((metric) => (
                    <DeckMetricCard
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                    />
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <VocabSrsInfoSheet
          visible={showSrsInfo}
          onClose={() => setShowSrsInfo(false)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topTitle: {
    flex: 1,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 12,
    ...CARD_SHADOW,
  },
  sectionHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.3,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryCard: {
    width: "48.4%",
    minWidth: 150,
    backgroundColor: BRAND.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  summaryValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...SURFACE_SHADOW,
  },
  preferenceCopy: {
    flex: 1,
    gap: 2,
  },
  preferenceLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
  },
  preferenceHint: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  deckGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  deckMetricCard: {
    width: "48.4%",
    minWidth: 150,
    backgroundColor: BRAND.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  deckMetricValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
  },
  deckMetricLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.inkSoft,
  },
});
