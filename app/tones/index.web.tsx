import { Stack, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import {
  MINIMAL_PAIRS,
  TONE_MARKS,
  TONES,
  type ToneData,
} from "@/src/data/tones";
import {
  getToneAccent,
  getToneMarkAccent,
  withAlpha,
} from "@/src/utils/toneAccent";

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.75 });
}

function getToneMarkDisplay(mark: string) {
  return mark ? `ก${mark}` : "ก";
}

function PitchCurve({ points, color }: { points: number[]; color: string }) {
  const height = 24;

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

function ToneCard({ tone }: { tone: ToneData }) {
  const accent = getToneAccent(tone.name);

  return (
    <View style={styles.toneCard}>
      <View style={styles.toneCardTop}>
        <View style={styles.toneTitleBlock}>
          <View style={[styles.toneDot, { backgroundColor: accent }]} />
          <View style={styles.toneTitleText}>
            <Text style={styles.toneName}>{tone.name} tone</Text>
            <Text style={[styles.toneThai, { color: accent }]}>{tone.thai}</Text>
          </View>
        </View>
        <PitchCurve color={accent} points={tone.pitchPoints} />
      </View>

      <Text style={styles.toneDescription}>{tone.description}</Text>

      <View style={styles.exampleGrid}>
        {tone.examples.map((example, index) => (
          <TouchableOpacity
            key={`${tone.name}-${index}`}
            style={[
              styles.exampleChip,
              {
                backgroundColor: withAlpha(accent, "10"),
                borderColor: withAlpha(accent, "22"),
              },
            ]}
            onPress={() => speak(example.thai)}
            activeOpacity={0.82}
          >
            <Text style={[styles.exampleThai, { color: accent }]}>
              {example.thai}
            </Text>
            <Text style={styles.exampleRoman}>{example.rom}</Text>
            <Text style={styles.exampleEnglish}>{example.english}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function TonesWeb() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Tones"
        title="Thai tones"
        subtitle="A desktop reference for the five tones, the written tone marks, and minimal pairs you can play back while studying."
        toolbar={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.pageStack}>
          <DesktopPanel>
            <DesktopSectionTitle
              title="The five tones"
              caption="Tap any example to hear it. The pitch bars give you a quick visual cue for the movement."
            />
            <View style={styles.toneGrid}>
              {TONES.map((tone) => (
                <View key={tone.name} style={styles.toneColumn}>
                  <ToneCard tone={tone} />
                </View>
              ))}
            </View>
          </DesktopPanel>

          <View style={styles.splitRow}>
            <DesktopPanel style={styles.leftPanel}>
              <DesktopSectionTitle
                title="Tone marks"
                caption="Thai has four written tone marks. Mid tone has no written mark."
              />
              <View style={styles.markList}>
                {TONE_MARKS.map((toneMark) => {
                  const accent = getToneMarkAccent(toneMark.mark);
                  return (
                    <View key={toneMark.romanName} style={styles.markRow}>
                      <View
                        style={[
                          styles.markBadge,
                          { backgroundColor: withAlpha(accent, "12") },
                        ]}
                      >
                        <Text style={[styles.markSymbol, { color: accent }]}>
                          {getToneMarkDisplay(toneMark.mark)}
                        </Text>
                      </View>
                      <View style={styles.markCopy}>
                        <Text style={styles.markName}>{toneMark.thaiName}</Text>
                        <Text style={[styles.markRoman, { color: accent }]}>
                          {toneMark.romanName}
                        </Text>
                        <Text style={styles.markDescription}>
                          {toneMark.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </DesktopPanel>

            <DesktopPanel style={styles.rightPanel}>
              <DesktopSectionTitle
                title="Minimal pairs"
                caption="Same base sound, different tone, different meaning."
              />
              <View style={styles.pairGroupList}>
                {MINIMAL_PAIRS.map((group) => (
                  <View key={group.label} style={styles.pairGroup}>
                    <Text style={styles.pairLabel}>{group.label}</Text>
                    <Text style={styles.pairDescription}>{group.description}</Text>
                    <View style={styles.pairGrid}>
                      {group.pairs.map((pair) => {
                        const accent = getToneAccent(pair.tone);
                        return (
                          <TouchableOpacity
                            key={`${group.label}-${pair.thai}-${pair.tone}`}
                            style={[
                              styles.pairChip,
                              {
                                backgroundColor: withAlpha(accent, "10"),
                                borderColor: withAlpha(accent, "22"),
                              },
                            ]}
                            onPress={() => speak(pair.thai)}
                            activeOpacity={0.82}
                          >
                            <Text style={[styles.pairThai, { color: accent }]}>
                              {pair.thai}
                            </Text>
                            <Text style={styles.pairRoman}>{pair.rom}</Text>
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
            </DesktopPanel>
          </View>
        </View>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageStack: {
    gap: 30,
  },
  backButton: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  toneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  toneColumn: {
    width: "48.9%",
  },
  toneCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 14,
    height: "100%",
  },
  toneCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  toneTitleBlock: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  toneDot: {
    width: 12,
    height: 12,
    marginTop: 8,
  },
  toneTitleText: {
    flex: 1,
    gap: 2,
  },
  toneName: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  toneThai: {
    fontSize: 16,
    fontWeight: "600",
  },
  toneDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkLight,
  },
  pitchCurve: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    paddingTop: 4,
  },
  pitchBar: {
    width: 11,
  },
  exampleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  exampleChip: {
    minWidth: 170,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    flexGrow: 1,
  },
  exampleThai: {
    fontSize: 24,
    fontWeight: "700",
  },
  exampleRoman: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  exampleEnglish: {
    fontSize: 13,
    color: Sketch.inkLight,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  leftPanel: {
    flex: 0.9,
  },
  rightPanel: {
    flex: 1.1,
  },
  markList: {
    gap: 16,
  },
  markRow: {
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
  },
  markBadge: {
    width: 72,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  markSymbol: {
    fontSize: 26,
    fontWeight: "700",
  },
  markCopy: {
    flex: 1,
    gap: 4,
  },
  markName: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  markRoman: {
    fontSize: 13,
    fontWeight: "700",
  },
  markDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
  pairGroupList: {
    gap: 22,
  },
  pairGroup: {
    gap: 10,
  },
  pairLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  pairDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkMuted,
  },
  pairGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  pairChip: {
    minWidth: 170,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    flexGrow: 1,
  },
  pairThai: {
    fontSize: 24,
    fontWeight: "700",
  },
  pairRoman: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  pairEnglish: {
    fontSize: 13,
    color: Sketch.inkLight,
  },
  pairTone: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
