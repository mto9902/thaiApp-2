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
import { Sketch, sketchShadow } from "@/constants/theme";

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.75 });
}

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

function ToneCard({ tone }: { tone: ToneData }) {
  return (
    <View style={[styles.toneCard, { borderLeftColor: tone.color }]}>
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

      <Text style={styles.toneDesc}>{tone.description}</Text>

      <View style={styles.examplesRow}>
        {tone.examples.map((ex, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.examplePill, { backgroundColor: tone.color + "15", borderColor: tone.color + "40" }]}
            onPress={() => speak(ex.thai)}
            activeOpacity={0.7}
          >
            <Text style={[styles.exampleThai, { color: tone.color }]}>{ex.thai}</Text>
            <Text style={styles.exampleRom}>{ex.rom}</Text>
            <Text style={styles.exampleEng}>{ex.english}</Text>
            <Ionicons name="volume-medium-outline" size={14} color={tone.color} style={{ marginTop: 2 }} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function TonesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Header title="Thai Tones" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <View style={styles.introIconRow}>
            <Ionicons name="musical-notes" size={20} color={Sketch.orange} />
            <Text style={styles.introLabel}>WHY TONES MATTER</Text>
          </View>
          <Text style={styles.introText}>
            Thai has 5 tones. The same syllable spoken with a different tone
            becomes a completely different word. Mastering tones is essential
            for being understood.
          </Text>
        </View>

        <View style={styles.legendStrip}>
          {TONES.map((t) => (
            <View key={t.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: t.color }]} />
              <Text style={styles.legendLabel}>{t.name}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>THE 5 TONES</Text>

        {TONES.map((tone) => (
          <ToneCard key={tone.name} tone={tone} />
        ))}

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
                <Text style={[styles.toneMarkThaiName, { color: tm.color }]}>{tm.thaiName}</Text>
                <Text style={styles.toneMarkRomanName}>{tm.romanName}</Text>
              </View>
            ))}
          </View>

          {TONE_MARKS.map((tm, i) => (
            <View key={i} style={[styles.toneMarkDetail, { borderLeftColor: tm.color }]}>
              <View style={styles.toneMarkDetailHeader}>
                <Text style={[styles.toneMarkDetailSymbol, { color: tm.color }]}>{tm.symbol}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toneMarkDetailName}>{tm.thaiName}</Text>
                  <Text style={styles.toneMarkDetailRoman}>{tm.romanName}</Text>
                </View>
              </View>
              <Text style={styles.toneMarkDetailDesc}>{tm.description}</Text>
            </View>
          ))}
        </View>

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
                  <Text style={[styles.pairThai, { color: pair.color }]}>{pair.thai}</Text>
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

        <Text style={styles.footerTip}>
          Listen carefully to the pitch of each word. With practice, your ear
          will learn to distinguish all five tones naturally.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  introCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    ...sketchShadow(5),
  },
  introIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  introLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: Sketch.orange,
  },
  introText: {
    fontSize: 15,
    fontWeight: "600",
    color: Sketch.inkLight,
    lineHeight: 22,
  },

  legendStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Sketch.cardBg,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    ...sketchShadow(3),
  },
  legendItem: { alignItems: "center", gap: 4 },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Sketch.ink,
  },
  legendLabel: { fontSize: 10, fontWeight: "800", color: Sketch.inkLight },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: Sketch.ink,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkMuted,
    marginBottom: 16,
    marginTop: -6,
  },

  toneCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderLeftWidth: 7,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    gap: 12,
    ...sketchShadow(4),
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
    borderWidth: 2,
    borderColor: Sketch.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  toneSymbol: { fontSize: 20, color: "white", fontWeight: "900" },
  toneName: { fontSize: 18, fontWeight: "900", color: Sketch.ink },
  toneThai: { fontSize: 13, fontWeight: "700", color: Sketch.inkMuted, marginTop: 1 },
  toneDesc: { fontSize: 14, fontWeight: "600", color: Sketch.inkLight, lineHeight: 20 },
  examplesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  examplePill: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 80,
  },
  exampleThai: { fontSize: 22, fontWeight: "900" },
  exampleRom: { fontSize: 11, fontWeight: "600", color: Sketch.inkLight, marginTop: 2 },
  exampleEng: { fontSize: 11, fontWeight: "700", color: Sketch.inkMuted, marginTop: 1 },

  toneMarksCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    gap: 14,
    ...sketchShadow(4),
  },
  toneMarksRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  toneMarkItem: { alignItems: "center", flex: 1, gap: 4 },
  toneMarkBox: {
    width: 48,
    height: 48,
    borderWidth: 2.5,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Sketch.paperDark,
  },
  toneMarkSymbol: { fontSize: 24, fontWeight: "900" },
  toneMarkThaiName: { fontSize: 11, fontWeight: "800" },
  toneMarkRomanName: { fontSize: 9, fontWeight: "600", color: Sketch.inkMuted },
  toneMarkDetail: {
    borderLeftWidth: 5,
    backgroundColor: Sketch.paperDark,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  toneMarkDetailHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  toneMarkDetailSymbol: { fontSize: 32, fontWeight: "900" },
  toneMarkDetailName: { fontSize: 15, fontWeight: "900", color: Sketch.ink },
  toneMarkDetailRoman: { fontSize: 12, fontWeight: "600", color: Sketch.inkMuted },
  toneMarkDetailDesc: { fontSize: 13, fontWeight: "600", color: Sketch.inkLight, lineHeight: 19 },

  pairCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    ...sketchShadow(4),
  },
  pairLabel: { fontSize: 16, fontWeight: "900", color: Sketch.ink, marginBottom: 4 },
  pairDesc: { fontSize: 12, fontWeight: "600", color: Sketch.inkMuted, marginBottom: 14 },
  pairGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pairPill: {
    alignItems: "center",
    borderWidth: 2.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 85,
  },
  pairThai: { fontSize: 26, fontWeight: "900" },
  pairRom: { fontSize: 11, fontWeight: "600", color: Sketch.inkLight, marginTop: 3 },
  pairEng: { fontSize: 11, fontWeight: "700", color: Sketch.inkMuted, marginTop: 1 },
  toneBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  toneBadgeText: { fontSize: 9, fontWeight: "900", color: "white", letterSpacing: 0.5 },

  footerTip: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 16,
    lineHeight: 19,
  },
});
