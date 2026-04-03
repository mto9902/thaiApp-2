import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import {
  MINIMAL_PAIRS,
  TONE_MARKS,
  TONES,
  type ToneData,
} from "@/src/data/tones";
import {
  getToneAccent,
  getToneMarkAccent,
} from "@/src/utils/toneAccent";

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

function ToneCard({
  tone,
  onSpeak,
}: {
  tone: ToneData;
  onSpeak: (text: string) => void;
}) {
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
              styles.neutralChip,
            ]}
            onPress={() => onSpeak(example.thai)}
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
  const { playSentence } = useSentenceAudio();

  function speak(text: string) {
    void playSentence(text, { speed: "slow" });
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Tones"
        title="Thai tones"
        subtitle="Study the five tones, hear written tone marks, and compare minimal pairs while you learn."
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
                  <ToneCard tone={tone} onSpeak={speak} />
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
                          styles.neutralBadge,
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
                              styles.neutralChip,
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
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
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
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 18,
    gap: 14,
    height: "100%",
    ...appShadow("sm"),
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
    color: AppSketch.ink,
    letterSpacing: -0.5,
  },
  toneThai: {
    fontSize: 16,
    fontWeight: "600",
  },
  toneDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: AppSketch.inkSecondary,
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
    borderRadius: AppRadius.md,
  },
  neutralChip: {
    backgroundColor: AppSketch.background,
    borderColor: AppSketch.border,
  },
  exampleThai: {
    fontSize: 24,
    fontWeight: "700",
  },
  exampleRoman: {
    fontSize: 13,
    color: AppSketch.inkMuted,
  },
  exampleEnglish: {
    fontSize: 13,
    color: AppSketch.inkSecondary,
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
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 16,
  },
  markBadge: {
    width: 72,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  neutralBadge: {
    backgroundColor: AppSketch.background,
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
    color: AppSketch.ink,
  },
  markRoman: {
    fontSize: 13,
    fontWeight: "700",
  },
  markDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: AppSketch.inkSecondary,
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
    color: AppSketch.ink,
  },
  pairDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: AppSketch.inkMuted,
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
    borderRadius: AppRadius.md,
  },
  pairThai: {
    fontSize: 24,
    fontWeight: "700",
  },
  pairRoman: {
    fontSize: 13,
    color: AppSketch.inkMuted,
  },
  pairEnglish: {
    fontSize: 13,
    color: AppSketch.inkSecondary,
  },
  pairTone: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
