import { Stack, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
import Header from "../../src/components/Header";
import {
  MINIMAL_PAIRS,
  TONE_MARKS,
  TONES,
  type ToneData,
} from "../../src/data/tones";
import {
  getToneAccent,
  getToneMarkAccent,
  withAlpha,
} from "../../src/utils/toneAccent";

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.75 });
}

function PitchCurve({ points, color }: { points: number[]; color: string }) {
  const height = 28;

  return (
    <View style={styles.pitchCurve}>
      {points.map((point, index) => (
        <View
          key={index}
          style={[
            styles.pitchBar,
            {
              backgroundColor: color,
              height: Math.max(4, point * height),
              opacity: 0.78 + index * 0.04,
            },
          ]}
        />
      ))}
    </View>
  );
}

function getToneMarkDisplay(mark: string) {
  return mark ? `\u0E01${mark}` : "\u0E01";
}

function ToneRow({ tone }: { tone: ToneData }) {
  const accent = getToneAccent(tone.name);

  return (
    <View style={styles.toneRow}>
      <View style={styles.toneHeader}>
        <View style={styles.toneIdentity}>
          <View style={[styles.toneDot, { backgroundColor: accent }]} />
          <View style={styles.toneTitles}>
            <Text style={styles.toneName}>{tone.name} tone</Text>
            <Text style={[styles.toneThai, { color: accent }]}>{tone.thai}</Text>
          </View>
        </View>

        <PitchCurve color={accent} points={tone.pitchPoints} />
      </View>

      <Text style={styles.toneDescription}>{tone.description}</Text>

      <View style={styles.examplesWrap}>
        {tone.examples.map((example, index) => (
          <TouchableOpacity
            activeOpacity={0.75}
            key={`${tone.name}-${index}`}
            onPress={() => speak(example.thai)}
            style={[
              styles.exampleChip,
              {
                backgroundColor: withAlpha(accent, "10"),
                borderColor: withAlpha(accent, "22"),
              },
            ]}
          >
            <Text style={[styles.exampleThai, { color: accent }]}>
              {example.thai}
            </Text>
            <Text style={styles.exampleRom}>{example.rom}</Text>
            <Text style={styles.exampleEnglish}>{example.english}</Text>
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
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Thai Tones" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBlock}>
          <Text style={styles.eyebrow}>Speaking</Text>
          <Text style={styles.pageTitle}>Thai tones change meaning.</Text>
          <Text style={styles.pageBody}>
            The same syllable can become a different word depending on pitch.
            Start by listening to the five tone shapes, then compare the written
            marks and minimal pairs below.
          </Text>
        </View>

        <View style={styles.legendWrap}>
          {TONES.map((tone) => (
            <View key={tone.name} style={styles.legendChip}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: getToneAccent(tone.name) },
                ]}
              />
              <Text
                style={[
                  styles.legendLabel,
                  { color: getToneAccent(tone.name) },
                ]}
              >
                {tone.name}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listen to the 5 tones</Text>
          <Text style={styles.sectionSubtitle}>
            Each row shows the pitch shape. Tap a word to hear it.
          </Text>

          <View style={styles.sectionList}>
            {TONES.map((tone) => (
              <ToneRow key={tone.name} tone={tone} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tone marks</Text>
          <Text style={styles.sectionSubtitle}>
            Thai has four written tone marks. Mid tone has no written mark.
          </Text>

          <View style={styles.toneMarkList}>
            {TONE_MARKS.map((toneMark) => {
              const accent = getToneMarkAccent(toneMark.mark);

              return (
                <View key={toneMark.romanName} style={styles.toneMarkRow}>
                  <View
                    style={[
                      styles.toneMarkBadge,
                      { backgroundColor: withAlpha(accent, "12") },
                    ]}
                  >
                    <Text style={[styles.toneMarkSymbol, { color: accent }]}>
                      {getToneMarkDisplay(toneMark.mark)}
                    </Text>
                  </View>

                  <View style={styles.toneMarkCopy}>
                    <Text style={styles.toneMarkName}>{toneMark.thaiName}</Text>
                    <Text style={[styles.toneMarkRoman, { color: accent }]}>
                      {toneMark.romanName}
                    </Text>
                    <Text style={styles.toneMarkDescription}>
                      {toneMark.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compare similar sounds</Text>
          <Text style={styles.sectionSubtitle}>
            Same sound, different tone, different meaning.
          </Text>

          <View style={styles.sectionList}>
            {MINIMAL_PAIRS.map((group) => (
              <View key={group.label} style={styles.pairGroup}>
                <Text style={styles.pairLabel}>{group.label}</Text>
                <Text style={styles.pairDescription}>{group.description}</Text>

                <View style={styles.pairGrid}>
                  {group.pairs.map((pair) => {
                    const accent = getToneAccent(pair.tone);

                    return (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        key={`${group.label}-${pair.thai}-${pair.tone}`}
                        onPress={() => speak(pair.thai)}
                        style={[
                          styles.pairChip,
                          {
                            backgroundColor: withAlpha(accent, "10"),
                            borderColor: withAlpha(accent, "22"),
                          },
                        ]}
                      >
                        <Text style={[styles.pairThai, { color: accent }]}>
                          {pair.thai}
                        </Text>
                        <Text style={styles.pairRom}>{pair.rom}</Text>
                        <Text style={styles.pairEnglish}>{pair.english}</Text>
                        <Text style={[styles.pairTone, { color: accent }]}>
                          {pair.tone}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footerTip}>
          Try listening to words in the same family back to back until the pitch
          movement feels obvious.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Sketch.paper,
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  introBlock: {
    gap: 6,
    marginBottom: 18,
  },
  eyebrow: {
    color: Sketch.orange,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  pageTitle: {
    color: Sketch.ink,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  pageBody: {
    color: Sketch.inkLight,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 640,
  },
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 26,
  },
  legendChip: {
    alignItems: "center",
    backgroundColor: Sketch.paperDark,
    borderColor: Sketch.inkFaint,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  legendLabel: {
    color: Sketch.inkMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: Sketch.ink,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Sketch.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  sectionList: {
    gap: 12,
  },
  toneRow: {
    backgroundColor: Sketch.cardBg,
    borderColor: Sketch.inkFaint,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    ...sketchShadow(4),
  },
  toneHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  toneIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  toneDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  toneTitles: {
    flex: 1,
  },
  toneName: {
    color: Sketch.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  toneThai: {
    color: Sketch.inkMuted,
    fontSize: 12,
    marginTop: 1,
  },
  pitchCurve: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 4,
    height: 28,
    width: 78,
  },
  pitchBar: {
    borderRadius: 999,
    flex: 1,
  },
  toneDescription: {
    color: Sketch.inkLight,
    fontSize: 14,
    lineHeight: 20,
  },
  examplesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  exampleChip: {
    backgroundColor: Sketch.paperDark,
    borderColor: Sketch.inkFaint,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exampleThai: {
    fontSize: 21,
    fontWeight: "700",
  },
  exampleRom: {
    color: Sketch.inkLight,
    fontSize: 11,
    marginTop: 2,
  },
  exampleEnglish: {
    color: Sketch.inkMuted,
    fontSize: 11,
    marginTop: 1,
  },
  toneMarkList: {
    gap: 10,
  },
  toneMarkRow: {
    alignItems: "flex-start",
    backgroundColor: Sketch.cardBg,
    borderColor: Sketch.inkFaint,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    ...sketchShadow(3),
  },
  toneMarkBadge: {
    alignItems: "center",
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  toneMarkSymbol: {
    fontSize: 28,
    fontWeight: "700",
  },
  toneMarkCopy: {
    flex: 1,
  },
  toneMarkName: {
    color: Sketch.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  toneMarkRoman: {
    color: Sketch.orange,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  toneMarkDescription: {
    color: Sketch.inkLight,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  pairGroup: {
    backgroundColor: Sketch.cardBg,
    borderColor: Sketch.inkFaint,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    ...sketchShadow(4),
  },
  pairLabel: {
    color: Sketch.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  pairDescription: {
    color: Sketch.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    marginTop: 4,
  },
  pairGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pairChip: {
    backgroundColor: Sketch.paperDark,
    borderColor: Sketch.inkFaint,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pairThai: {
    fontSize: 24,
    fontWeight: "700",
  },
  pairRom: {
    color: Sketch.inkLight,
    fontSize: 11,
    marginTop: 2,
  },
  pairEnglish: {
    color: Sketch.inkMuted,
    fontSize: 11,
    marginTop: 1,
  },
  pairTone: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },
  footerTip: {
    color: Sketch.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
    textAlign: "center",
  },
});
