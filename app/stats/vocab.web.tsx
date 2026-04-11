import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import VocabSrsInfoSheet from "@/src/components/VocabSrsInfoSheet";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import {
  WEB_BODY_FONT,
  WEB_BRAND as BRAND,
  WEB_CARD_SHADOW as CARD_SHADOW,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED as LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW as LIGHT_BUTTON,
} from "@/src/components/web/designSystem";
import { API_BASE } from "@/src/config";
import {
  getPracticeWordTrackingEnabled,
  setPracticeWordTrackingEnabled,
} from "@/src/utils/practiceWordPreference";
import { getAuthToken } from "@/src/utils/authStorage";
import VocabStatsMobileScreen from "@/src/screens/mobile/VocabStatsMobileScreen";

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
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <VocabStatsMobileScreen />;
  }

  return <DesktopVocabStatsContent />;
}

function DesktopVocabStatsContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VocabStatsData | null>(null);
  const [progress, setProgress] = useState<VocabProgressData | null>(null);
  const [trackPracticeVocab, setTrackPracticeVocab] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [showSrsInfo, setShowSrsInfo] = useState(false);
  const { width } = useWindowDimensions();

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
          <Pressable
            onPress={() => router.back()}
            style={({ hovered, pressed }) => [
              styles.backButton,
              (hovered || pressed) && styles.backButtonActive,
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={BRAND.ink} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.loadingPanel}>
            <ActivityIndicator size="large" color={BRAND.inkSoft} />
          </DesktopPanel>
        ) : !stats ? (
          <DesktopPanel style={styles.loadingPanel}>
            <Text style={styles.emptyText}>Unable to load vocabulary stats.</Text>
          </DesktopPanel>
        ) : (
          <View style={styles.pageStack}>
            <View style={[styles.summaryStrip, compactMetrics && styles.summaryStripWrap]}>
              <View style={styles.heroCard}>
                <Text style={styles.metricLabel}>Vocabulary overview</Text>
                <Text style={styles.heroValue}>{stats.total_words || 0}</Text>
                <Text style={styles.metricDetail}>tracked words in your deck</Text>
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
                    <Pressable
                      onPress={() => setShowSrsInfo(true)}
                      style={({ hovered, pressed }) => [
                        styles.infoButton,
                        (hovered || pressed) && styles.infoButtonActive,
                      ]}
                    >
                      <Text style={styles.infoButtonText}>How SRS works</Text>
                    </Pressable>
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

                  <Pressable
                    onPress={() => {
                      if (savingPreference) return;
                      void togglePracticeWordTracking(!trackPracticeVocab);
                    }}
                    disabled={savingPreference}
                    style={({ hovered, pressed }) => [
                      styles.preferenceToggleWrap,
                      (hovered || pressed) && styles.preferenceToggleWrapActive,
                      savingPreference && styles.preferenceToggleWrapDisabled,
                    ]}
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
                  </Pressable>
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
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 0,
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  backButtonActive: {
    transform: [{ translateY: 1.6 }],
    boxShadow: LIGHT_BUTTON_PRESSED as any,
  },
  backButtonText: {
    color: BRAND.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  loadingPanel: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: WEB_BODY_FONT,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: 16,
  },
  summaryStripWrap: {
    flexWrap: "wrap",
  },
  heroCard: {
    flex: 1.18,
    minWidth: 260,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.paper,
    padding: 22,
    gap: 6,
    boxShadow: CARD_SHADOW as any,
  },
  metricCard: {
    flex: 0.92,
    minWidth: 190,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.paper,
    padding: 20,
    gap: 4,
    boxShadow: CARD_SHADOW as any,
  },
  metricLabel: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: WEB_BODY_FONT,
  },
  heroValue: {
    color: BRAND.ink,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: -1,
    fontFamily: WEB_DISPLAY_FONT,
  },
  metricValue: {
    color: BRAND.ink,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    fontFamily: WEB_DISPLAY_FONT,
  },
  metricDetail: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: WEB_BODY_FONT,
  },
  mainGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
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
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 14,
    paddingVertical: 0,
    justifyContent: "center",
    boxShadow: LIGHT_BUTTON as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  infoButtonActive: {
    transform: [{ translateY: 1.6 }],
    boxShadow: LIGHT_BUTTON_PRESSED as any,
  },
  infoButtonText: {
    color: BRAND.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  preferenceBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  preferenceCopy: {
    flex: 1,
    gap: 8,
  },
  preferenceText: {
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: WEB_BODY_FONT,
    maxWidth: 560,
  },
  preferenceStatus: {
    color: BRAND.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: WEB_BODY_FONT,
  },
  preferenceToggleWrap: {
    minWidth: 112,
    alignItems: "center",
    gap: 8,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  preferenceToggleWrapActive: {
    opacity: 0.92,
  },
  preferenceToggleWrapDisabled: {
    opacity: 0.55,
  },
  preferenceToggle: {
    width: 52,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#E7EAEF",
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  preferenceToggleOn: {
    borderColor: BRAND.navy,
    backgroundColor: "#405165",
    alignItems: "flex-end",
  },
  preferenceToggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  preferenceToggleKnobOn: {
    borderColor: "#FFFFFF",
  },
  preferenceToggleLabel: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  deckGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  deckCard: {
    width: "48.6%",
    minWidth: 180,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 16,
    backgroundColor: BRAND.panel,
    padding: 16,
    gap: 4,
  },
  deckCardValue: {
    color: BRAND.ink,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    fontFamily: WEB_DISPLAY_FONT,
  },
  deckCardLabel: {
    color: BRAND.inkSoft,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: WEB_BODY_FONT,
  },
});
