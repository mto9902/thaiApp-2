import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  AppRadius,
  AppSketch,
  AppSpacing,
  AppTypography,
  appShadow,
} from "@/constants/theme-app";
import VocabSrsInfoSheet from "@/src/components/VocabSrsInfoSheet";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
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

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

function DeckStateCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.deckCard}>
      <Text style={styles.deckCardValue}>{value}</Text>
      <Text style={styles.deckCardLabel}>{label}</Text>
    </View>
  );
}

export default function VocabStatsWebScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VocabStatsData | null>(null);
  const [progress, setProgress] = useState<VocabProgressData | null>(null);
  const [trackPracticeVocab, setTrackPracticeVocab] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [showSrsInfo, setShowSrsInfo] = useState(false);

  const compactMetrics = width < 1260;
  const stackMainGrid = width < 1180;

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const token = await getAuthToken();
      const [statsRes, progressRes] = await Promise.all([
        fetch(`${API_BASE}/vocab/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/vocab/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [statsData, progressData] = await Promise.all([
        statsRes.json(),
        progressRes.json(),
      ]);
      const practiceWordSetting = await getPracticeWordTrackingEnabled();

      setStats(statsData);
      setProgress(progressData);
      setTrackPracticeVocab(practiceWordSetting);
    } catch (err) {
      console.error("Failed to load vocab stats:", err);
    } finally {
      setLoading(false);
    }
  }

  async function togglePracticeWordTracking(value: boolean) {
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
  }

  const deckMetrics = useMemo(
    () => [
      { label: "New", value: stats?.new_words || 0 },
      { label: "Learning", value: stats?.learning_words || 0 },
      { label: "In review", value: stats?.reviewing_words || 0 },
      { label: "Average ease", value: stats?.avg_ease ?? "-" },
      { label: "Total lapses", value: stats?.total_lapses || 0 },
    ],
    [stats],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Vocabulary"
        title="Vocab stats"
        subtitle="Track your review queue, deck growth, and the way grammar practice feeds vocabulary into SRS."
        density="compact"
        toolbar={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={AppSketch.ink} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={AppSketch.inkMuted} />
          </DesktopPanel>
        ) : !stats ? (
          <DesktopPanel style={styles.loadingPanel}>
            <Text style={styles.emptyText}>Unable to load vocabulary stats.</Text>
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={[styles.summaryStrip, compactMetrics && styles.summaryStripWrap]}>
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Vocabulary overview</Text>
                <Text style={styles.heroValue}>{stats.total_words || 0}</Text>
                <Text style={styles.heroSubtitle}>tracked words in your deck</Text>
              </View>

              <MetricCard
                label="Reviews due"
                value={stats.reviews_due || 0}
                detail="ready to review now"
              />
              <MetricCard
                label="Learned today"
                value={progress?.words_learned_today || 0}
                detail="new words added today"
              />
              <MetricCard
                label="Reviews today"
                value={progress?.reviews_today || 0}
                detail="cards answered today"
              />
              <MetricCard
                label="Mastered"
                value={stats.mastered_words || 0}
                detail="stable words in your deck"
              />
            </View>

            <View style={[styles.mainGrid, stackMainGrid && styles.mainGridStack]}>
              <DesktopPanel style={styles.preferencePanel}>
                <DesktopSectionTitle
                  title="Adding vocab"
                  caption="Words from grammar practice can be added to your review deck automatically."
                  action={
                    <TouchableOpacity
                      style={styles.infoButton}
                      onPress={() => setShowSrsInfo(true)}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.infoButtonText}>What is SRS?</Text>
                    </TouchableOpacity>
                  }
                />

                <View style={styles.preferenceBody}>
                  <View style={styles.preferenceCopy}>
                    <Text style={styles.preferenceText}>
                      If this is on, grammar words are added to SRS when you answer
                      them correctly in practice.
                    </Text>
                    <Text style={styles.preferenceText}>
                      That keeps your review deck growing from the lessons you actually use.
                    </Text>
                    <Text style={styles.preferenceStatus}>
                      {trackPracticeVocab ? "Currently on" : "Currently off"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.preferenceToggleWrap}
                    onPress={() => {
                      if (savingPreference) return;
                      void togglePracticeWordTracking(!trackPracticeVocab);
                    }}
                    activeOpacity={0.85}
                    disabled={savingPreference}
                  >
                    <View
                      style={[
                        styles.preferenceToggle,
                        trackPracticeVocab && styles.preferenceToggleOn,
                      ]}
                    >
                      <View
                        style={[
                          styles.preferenceToggleKnob,
                          trackPracticeVocab && styles.preferenceToggleKnobOn,
                        ]}
                      />
                    </View>
                    <Text style={styles.preferenceToggleLabel}>
                      {savingPreference ? "Saving..." : trackPracticeVocab ? "On" : "Off"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </DesktopPanel>

              <DesktopPanel style={styles.deckPanel}>
                <DesktopSectionTitle
                  title="Deck state"
                  caption="A compact view of where your current cards sit in SRS."
                />
                <View style={styles.deckGrid}>
                  {deckMetrics.map((metric) => (
                    <DeckStateCard
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                    />
                  ))}
                </View>
              </DesktopPanel>
            </View>
          </View>
        )}
      </DesktopPage>

      <VocabSrsInfoSheet
        visible={showSrsInfo}
        onClose={() => setShowSrsInfo(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
  },
  backButtonText: {
    ...AppTypography.label,
    color: AppSketch.ink,
  },
  loadingPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...AppTypography.body,
    color: AppSketch.inkMuted,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: AppSpacing.md,
  },
  summaryStripWrap: {
    flexWrap: "wrap",
  },
  heroCard: {
    flex: 1.18,
    minWidth: 260,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.lg,
    backgroundColor: AppSketch.surface,
    padding: 22,
    gap: 6,
    ...appShadow("sm"),
  },
  heroLabel: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroValue: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -1,
  },
  heroSubtitle: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
  },
  metricCard: {
    flex: 0.92,
    minWidth: 190,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.lg,
    backgroundColor: AppSketch.surface,
    padding: 20,
    gap: 4,
    ...appShadow("sm"),
  },
  metricLabel: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  metricDetail: {
    ...AppTypography.caption,
    color: AppSketch.inkSecondary,
  },
  mainGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: AppSpacing.md,
  },
  mainGridStack: {
    flexDirection: "column",
  },
  preferencePanel: {
    flex: 1.05,
    minWidth: 0,
  },
  deckPanel: {
    flex: 0.95,
    minWidth: 0,
  },
  infoButton: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  infoButtonText: {
    ...AppTypography.caption,
    color: AppSketch.ink,
    fontWeight: "700",
  },
  preferenceBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: AppSpacing.lg,
  },
  preferenceCopy: {
    flex: 1,
    gap: 8,
  },
  preferenceText: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkSecondary,
    maxWidth: 560,
  },
  preferenceStatus: {
    ...AppTypography.captionSmall,
    color: AppSketch.primary,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: "700",
  },
  preferenceToggleWrap: {
    minWidth: 112,
    alignItems: "center",
    gap: 8,
  },
  preferenceToggle: {
    width: 52,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8D4CE",
    backgroundColor: "#E7E4DF",
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  preferenceToggleOn: {
    borderColor: "#5A6470",
    backgroundColor: "#3F4B58",
    alignItems: "flex-end",
  },
  preferenceToggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D4CE",
  },
  preferenceToggleKnobOn: {
    borderColor: "#FFFFFF",
  },
  preferenceToggleLabel: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
    fontWeight: "700",
  },
  deckGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
  },
  deckCard: {
    width: "48.6%",
    minWidth: 180,
    borderWidth: 1,
    borderColor: AppSketch.borderLight,
    borderRadius: AppRadius.md,
    backgroundColor: AppSketch.background,
    padding: 16,
    gap: 4,
  },
  deckCardValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  deckCardLabel: {
    ...AppTypography.caption,
    color: AppSketch.inkMuted,
  },
});
