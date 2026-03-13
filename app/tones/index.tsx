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
import { Sketch } from "@/constants/theme";

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.75 });
}

function PitchCurve({ points, color }: { points: number[]; color: string }) {
  const H = 40;
  const pad = 4;
  return (
    <View style={{ height: H, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
      {points.map((p, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: Math.max(4, p * (H - pad)),
            backgroundColor: color,
            borderRadius: 5,
            opacity: 0.7 + i * 0.06,
          }}
        />
      ))}
    </View>
  );
}

function ToneCard({ tone }: { tone: ToneData }) {
  return (
    <View style={styles.toneCard}>
      <View style={styles.toneHeader}>
        <View style={[styles.toneIcon, { backgroundColor: tone.color + "18" }]}>
          <Text style={[styles.toneSymbol, { color: tone.color }]}>{tone.symbol}</Text>
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
            style={[styles.examplePill, { backgroundColor: tone.color + "0C" }]}
            onPress={() => speak(ex.thai)}
            activeOpacity={0.7}
          >
            <Text style={[styles.exampleThai, { color: tone.color }]}>{ex.thai}</Text>
            <Text style={styles.exampleRom}>{ex.rom}</Text>
            <Text style={styles.exampleEng}>{ex.english}</Text>
            <Ionicons name="volume-medium-outline" size={12} color={tone.color} style={{ marginTop: 2 }} />
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
        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="musical-notes-outline" size={22} color={Sketch.orange} />
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Why tones matter</Text>
            <Text style={styles.introBody}>
              Thai has 5 tones. The same syllable spoken with a different tone
              becomes a completely different word.
            </Text>
          </View>
        </View>

        <View style={styles.spacing} />

        {/* Legend */}
        <View style={styles.legendStrip}>
          {TONES.map((t) => (
            <View key={t.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: t.color }]} />
              <Text style={styles.legendLabel}>{t.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.spacing} />

        {/* The 5 Tones */}
        <View style={styles.sectionHeader}>
          <Ionicons name="mic-outline" size={18} color={Sketch.ink} />
          <Text style={styles.sectionTitle}>The 5 Tones</Text>
        </View>

        {TONES.map((tone) => (
          <ToneCard key={tone.name} tone={tone} />
        ))}

        <View style={styles.spacingLg} />

        {/* Tone Marks */}
        <View style={styles.sectionHeader}>
          <Ionicons name="create-outline" size={18} color={Sketch.ink} />
          <Text style={styles.sectionTitle}>Tone Marks</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          4 written marks placed above consonants. The mid tone has no mark.
        </Text>

        <View style={styles.toneMarksGrid}>
          {TONE_MARKS.map((tm, i) => (
            <View key={i} style={styles.toneMarkCard}>
              <View style={[styles.toneMarkSymbolWrap, { backgroundColor: tm.color + "15" }]}>
                <Text style={[styles.toneMarkSymbol, { color: tm.color }]}>
                  {tm.mark || "—"}
                </Text>
              </View>
              <Text style={[styles.toneMarkThaiName, { color: tm.color }]}>{tm.thaiName}</Text>
              <Text style={styles.toneMarkRomanName}>{tm.romanName}</Text>
              <Text style={styles.toneMarkDesc}>{tm.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.spacingLg} />

        {/* Minimal Pairs */}
        <View style={styles.sectionHeader}>
          <Ionicons name="swap-horizontal-outline" size={18} color={Sketch.ink} />
          <Text style={styles.sectionTitle}>Minimal Pairs</Text>
        </View>
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
                  style={styles.pairPill}
                  onPress={() => speak(pair.thai)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pairThai, { color: pair.color }]}>{pair.thai}</Text>
                  <Text style={styles.pairRom}>{pair.rom}</Text>
                  <Text style={styles.pairEng}>{pair.english}</Text>
                  <View style={[styles.toneBadge, { backgroundColor: pair.color + "18" }]}>
                    <Text style={[styles.toneBadgeText, { color: pair.color }]}>{pair.tone}</Text>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  spacing: {
    height: 20,
  },
  spacingLg: {
    height: 28,
  },

  // Intro
  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  introText: {
    flex: 1,
    gap: 6,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
  },
  introBody: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkLight,
    lineHeight: 20,
  },

  // Legend
  legendStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  legendItem: {
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 28,
  },

  // Tone Cards
  toneCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  toneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toneIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toneSymbol: {
    fontSize: 20,
    fontWeight: "700",
  },
  toneName: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  toneThai: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 1,
  },
  toneDesc: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkLight,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 75,
  },
  exampleThai: {
    fontSize: 20,
    fontWeight: "700",
  },
  exampleRom: {
    fontSize: 10,
    fontWeight: "500",
    color: Sketch.inkLight,
    marginTop: 2,
  },
  exampleEng: {
    fontSize: 10,
    fontWeight: "600",
    color: Sketch.inkMuted,
    marginTop: 1,
  },

  // Tone Marks
  toneMarksGrid: {
    gap: 12,
  },
  toneMarkCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 6,
  },
  toneMarkSymbolWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  toneMarkSymbol: {
    fontSize: 22,
    fontWeight: "700",
  },
  toneMarkThaiName: {
    fontSize: 13,
    fontWeight: "700",
  },
  toneMarkRomanName: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
  },
  toneMarkDesc: {
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkLight,
    lineHeight: 18,
    marginTop: 2,
  },

  // Minimal Pairs
  pairCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  pairLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.ink,
    marginBottom: 4,
  },
  pairDesc: {
    fontSize: 12,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginBottom: 14,
  },
  pairGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pairPill: {
    alignItems: "center",
    backgroundColor: Sketch.paperDark,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 80,
  },
  pairThai: {
    fontSize: 24,
    fontWeight: "700",
  },
  pairRom: {
    fontSize: 10,
    fontWeight: "500",
    color: Sketch.inkLight,
    marginTop: 3,
  },
  pairEng: {
    fontSize: 10,
    fontWeight: "600",
    color: Sketch.inkMuted,
    marginTop: 1,
  },
  toneBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  toneBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  footerTip: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 20,
    lineHeight: 19,
  },
});
