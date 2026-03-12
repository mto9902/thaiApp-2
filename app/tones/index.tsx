import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import { MINIMAL_PAIRS, TONE_MARKS, TONES, type ToneData } from "../../src/data/tones";

// ── TTS helper ───────────────────────────────────────────────────────────────

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.75 });
}

// ── Pitch curve (bar chart) ──────────────────────────────────────────────────

function PitchCurve({ points, color }: { points: number[]; color: string }) {
  const H = 48;
  const pad = 6;
  return (
    <View style={{ height: H, flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
      {points.map((p, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: Math.max(4, p * (H - pad)),
            backgroundColor: color,
            borderRadius: 4,
            opacity: 0.85 + i * 0.03,
          }}
        />
      ))}
    </View>
  );
}

// ── Tone card ────────────────────────────────────────────────────────────────

function ToneCard({ tone }: { tone: ToneData }) {
  return (
    <View style={[styles.toneCard, { borderLeftColor: tone.color }]}>
      {/* Header */}
      <View style={styles.toneHeader}>
        <View style={[styles.toneIcon, { backgroundColor: tone.color }]}>
          <Text style={styles.toneSymbol}>{tone.symbol}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.toneName}>{tone.name} Tone</Text>
          <Text style={styles.toneThai}>{tone.thai}</Text>
        </View>
        <PitchCurve points={tone.pitchPoints} color={tone.color} />
      </View>

      {/* Description */}
      <Text style={styles.toneDesc}>{tone.description}</Text>

      {/* Examples */}
      <View style={styles.examplesRow}>
        {tone.examples.map((ex, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.examplePill, { backgroundColor: tone.color + "15", borderColor: tone.color + "40" }]}
            onPress={() => speak(ex.thai)}
            activeOpacity={0.7}
          >
            <Text style={[styles.exampleThai, { color: tone.color }]}>
              {ex.thai}
            </Text>
            <Text style={styles.exampleRom}>{ex.rom}</Text>
            <Text style={styles.exampleEng}>{ex.english}</Text>
            <Ionicons name="volume-medium-outline" size={14} color={tone.color} style={{ marginTop: 2 }} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function TonesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Header title="Thai Tones" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introCard}>
          <View style={styles.introIconRow}>
            <Ionicons name="musical-notes" size={20} color="#FF8A65" />
            <Text style={styles.introLabel}>WHY TONES MATTER</Text>
          </View>
          <Text style={styles.introText}>
            Thai has 5 tones. The same syllable spoken with a different tone
            becomes a completely different word. Mastering tones is essential
            for being understood.
          </Text>
        </View>

        {/* Color legend */}
        <View style={styles.legendStrip}>
          {TONES.map((t) => (
            <View key={t.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: t.color }]} />
              <Text style={styles.legendLabel}>{t.name}</Text>
            </View>
          ))}
        </View>

        {/* Section: 5 tones */}
        <Text style={styles.sectionTitle}>THE 5 TONES</Text>

        {TONES.map((tone) => (
          <ToneCard key={tone.name} tone={tone} />
        ))}

        {/* Section: Tone marks */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>TONE MARKS</Text>
        <Text style={styles.sectionSubtitle}>
          4 written marks placed above consonants. The mid tone has no mark.
        </Text>

        <View style={styles.toneMarksCard}>
          <View style={styles.toneMarksRow}>
            {TONE_MARKS.map((tm, i) => (
              <View key={i} style={styles.toneMarkItem}>
                <View style={[styles.toneMarkBox, { borderColor: tm.color }]}>
                  <Text style={[styles.toneMarkSymbol, { color: tm.color }]}>
                    {tm.mark || "\u2715"}
                  </Text>
                </View>
                <Text style={[styles.toneMarkThaiName, { color: tm.color }]}>
                  {tm.thaiName}
                </Text>
                <Text style={styles.toneMarkRomanName}>{tm.romanName}</Text>
              </View>
            ))}
          </View>

          {/* Detailed cards for each mark */}
          {TONE_MARKS.map((tm, i) => (
            <View key={i} style={[styles.toneMarkDetail, { borderLeftColor: tm.color }]}>
              <View style={styles.toneMarkDetailHeader}>
                <Text style={[styles.toneMarkDetailSymbol, { color: tm.color }]}>
                  {tm.symbol}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toneMarkDetailName}>{tm.thaiName}</Text>
                  <Text style={styles.toneMarkDetailRoman}>{tm.romanName}</Text>
                </View>
              </View>
              <Text style={styles.toneMarkDetailDesc}>{tm.description}</Text>
            </View>
          ))}
        </View>

        {/* Section: Minimal pairs */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>MINIMAL PAIRS</Text>
        <Text style={styles.sectionSubtitle}>
          Same sound, different tone = different word. Tap to hear.
        </Text>

        {MINIMAL_PAIRS.map((group, i) => (
          <View key={i} style={styles.pairCard}>
            <Text style={styles.pairLabel}>{group.label}</Text>
            <Text style={styles.pairDesc}>{group.description}</Text>

            <View style={styles.pairGrid}>
              {group.pairs.map((pair, j) => (
                <TouchableOpacity
                  key={j}
                  style={[styles.pairPill, { borderColor: pair.color }]}
                  onPress={() => speak(pair.thai)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pairThai, { color: pair.color }]}>
                    {pair.thai}
                  </Text>
                  <Text style={styles.pairRom}>{pair.rom}</Text>
                  <Text style={styles.pairEng}>{pair.english}</Text>
                  <View style={[styles.toneBadge, { backgroundColor: pair.color }]}>
                    <Text style={styles.toneBadgeText}>{pair.tone}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Footer tip */}
        <Text style={styles.footerTip}>
          Listen carefully to the pitch of each word. With practice, your ear
          will learn to distinguish all five tones naturally.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // Intro card
  introCard: {
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  introIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  introLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#FF8A65",
  },
  introText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    lineHeight: 22,
  },

  // Legend
  legendStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  legendItem: {
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#555",
  },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "black",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 16,
    marginTop: -6,
  },

  // Tone card
  toneCard: {
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
    borderLeftWidth: 7,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    gap: 12,
  },
  toneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  toneSymbol: {
    fontSize: 20,
    color: "white",
    fontWeight: "900",
  },
  toneName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },
  toneThai: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    marginTop: 1,
  },
  toneDesc: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    lineHeight: 20,
  },
  examplesRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  examplePill: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 80,
  },
  exampleThai: {
    fontSize: 22,
    fontWeight: "900",
  },
  exampleRom: {
    fontSize: 11,
    fontWeight: "600",
    color: "#777",
    marginTop: 2,
  },
  exampleEng: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    marginTop: 1,
  },

  // Tone marks
  toneMarksCard: {
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    gap: 14,
  },
  toneMarksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  toneMarkItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  toneMarkBox: {
    width: 48,
    height: 48,
    borderWidth: 2.5,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  toneMarkSymbol: {
    fontSize: 24,
    fontWeight: "900",
  },
  toneMarkThaiName: {
    fontSize: 11,
    fontWeight: "800",
  },
  toneMarkRomanName: {
    fontSize: 9,
    fontWeight: "600",
    color: "#999",
  },
  toneMarkDetail: {
    borderLeftWidth: 5,
    borderLeftColor: "#DDD",
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  toneMarkDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toneMarkDetailSymbol: {
    fontSize: 32,
    fontWeight: "900",
  },
  toneMarkDetailName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
  },
  toneMarkDetailRoman: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
  },
  toneMarkDetailDesc: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    lineHeight: 19,
  },

  // Minimal pairs
  pairCard: {
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  pairLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    marginBottom: 4,
  },
  pairDesc: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 14,
  },
  pairGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pairPill: {
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 85,
  },
  pairThai: {
    fontSize: 26,
    fontWeight: "900",
  },
  pairRom: {
    fontSize: 11,
    fontWeight: "600",
    color: "#777",
    marginTop: 3,
  },
  pairEng: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    marginTop: 1,
  },
  toneBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  toneBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.5,
  },

  // Footer
  footerTip: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    color: "#AAA",
    marginTop: 16,
    lineHeight: 19,
  },
});
