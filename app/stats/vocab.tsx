import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import Header from "../../src/components/Header";
import VocabSrsInfoSheet from "../../src/components/VocabSrsInfoSheet";
import { API_BASE } from "../../src/config";
import {
  getPracticeWordTrackingEnabled,
  setPracticeWordTrackingEnabled,
} from "../../src/utils/practiceWordPreference";
import { getAuthToken } from "../../src/utils/authStorage";
import { MUTED_APP_ACCENTS, withAlpha } from "../../src/utils/toneAccent";

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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function VocabStatsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VocabStatsData | null>(null);
  const [progress, setProgress] = useState<VocabProgressData | null>(null);
  const [trackPracticeVocab, setTrackPracticeVocab] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [showSrsInfo, setShowSrsInfo] = useState(false);

  useEffect(() => {
    loadData();
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

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Vocab Stats"
        onBack={() => router.back()}
        showSettings={false}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      ) : !stats ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>Unable to load vocabulary stats.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Vocabulary Overview</Text>
            <Text style={styles.heroValue}>{stats.total_words || 0}</Text>
            <Text style={styles.heroSubtitle}>tracked words in your deck</Text>
          </View>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowSrsInfo(true)}
            activeOpacity={0.82}
          >
            <Text style={styles.infoButtonMark}>?</Text>
            <Text style={styles.infoButtonText}>What is SRS?</Text>
          </TouchableOpacity>

          <View style={styles.statsGrid}>
            <StatCard
              label="Reviews Due"
              value={stats.reviews_due || 0}
              accent={MUTED_APP_ACCENTS.clay}
            />
            <StatCard
              label="Mastered"
              value={stats.mastered_words || 0}
              accent={MUTED_APP_ACCENTS.sage}
            />
            <StatCard
              label="Learned Today"
              value={progress?.words_learned_today || 0}
              accent={MUTED_APP_ACCENTS.slate}
            />
            <StatCard
              label="Reviews Today"
              value={progress?.reviews_today || 0}
            />
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceCopy}>
              <Text style={styles.sectionTitle}>Adding Vocab</Text>
              <Text style={styles.preferenceText}>
                If `Add Vocabulary` is on, words from grammar practice are
                added to your deck when you answer them correctly.
              </Text>
              <Text style={styles.preferenceText}>
                Those grammar words are added to SRS for later review
                automatically.
              </Text>
              <Text style={styles.preferenceStatus}>
                {trackPracticeVocab ? "Currently on" : "Currently off"}
              </Text>
            </View>
            <View style={styles.preferenceControl}>
              {savingPreference ? (
                <ActivityIndicator
                  size="small"
                  color={MUTED_APP_ACCENTS.clay}
                />
              ) : null}
              <Switch
                value={trackPracticeVocab}
                onValueChange={togglePracticeWordTracking}
                disabled={savingPreference}
                trackColor={{
                  false: Sketch.inkFaint,
                  true: MUTED_APP_ACCENTS.clay,
                }}
                thumbColor="white"
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Deck State</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>New</Text>
              <Text style={styles.rowValue}>{stats.new_words || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Learning</Text>
              <Text style={styles.rowValue}>{stats.learning_words || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>In review</Text>
              <Text style={styles.rowValue}>{stats.reviewing_words || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Average ease</Text>
              <Text style={styles.rowValue}>{stats.avg_ease ?? "-"}</Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>Total lapses</Text>
              <Text style={styles.rowValue}>{stats.total_lapses || 0}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      <VocabSrsInfoSheet
        visible={showSrsInfo}
        onClose={() => setShowSrsInfo(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroValue: {
    fontSize: 42,
    fontWeight: "700",
    color: Sketch.ink,
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 4,
  },
  infoButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Sketch.paperDark,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoButtonMark: {
    width: 18,
    height: 18,
    textAlign: "center",
    lineHeight: 18,
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.orangeDark,
    backgroundColor: withAlpha(MUTED_APP_ACCENTS.clay, "16"),
    borderRadius: 9,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkLight,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 4,
  },
  preferenceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
  },
  preferenceCopy: {
    flex: 1,
    gap: 6,
  },
  preferenceText: {
    fontSize: 14,
    lineHeight: 20,
    color: Sketch.inkLight,
  },
  preferenceStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: MUTED_APP_ACCENTS.clay,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  preferenceControl: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sectionCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  rowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
  },
});
