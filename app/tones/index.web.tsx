import { Stack } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import TonesMobileScreen from "@/src/screens/mobile/TonesMobileScreen";
import {
  DESKTOP_PAGE_WIDTH,
  MOBILE_WEB_BREAKPOINT,
} from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT,
  WEB_BRAND,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
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

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

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
          <Pressable
            key={`${tone.name}-${index}`}
            onPress={() => onSpeak(example.thai)}
            style={({ hovered, pressed }) => [
              styles.exampleCard,
              (hovered || pressed) && styles.depressedCard,
            ]}
          >
            <Text style={[styles.exampleThai, { color: accent }]}>{example.thai}</Text>
            <Text style={styles.exampleRoman}>{example.rom}</Text>
            <Text style={styles.exampleEnglish}>{example.english}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function TonesWeb() {
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <TonesMobileScreen />;
  }

  function speak(text: string) {
    void playSentence(text, { speed: "slow" });
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopAppShell>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Tones</Text>
                <Text style={styles.title}>Thai tones</Text>
                <Text style={styles.subtitle}>
                  Study the five tones, hear written tone marks, and compare minimal
                  pairs while you learn.
                </Text>
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeading}>The five tones</Text>
                <Text style={styles.sectionSubheading}>
                  Tap any example to hear it. The pitch bars give you a quick visual cue
                  for the movement.
                </Text>
              </View>
              <View style={styles.toneGrid}>
                {TONES.map((tone) => (
                  <View key={tone.name} style={styles.toneColumn}>
                    <ToneCard tone={tone} onSpeak={speak} />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.splitRow}>
              <View style={[styles.surfaceCard, styles.leftPanel]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeading}>Tone marks</Text>
                  <Text style={styles.sectionSubheading}>
                    Thai has four written tone marks. Mid tone has no written mark.
                  </Text>
                </View>
                <View style={styles.markList}>
                  {TONE_MARKS.map((toneMark) => {
                    const accent = getToneMarkAccent(toneMark.mark);
                    return (
                      <View key={toneMark.romanName} style={styles.markRow}>
                        <View style={styles.markBadge}>
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
              </View>

              <View style={[styles.surfaceCard, styles.rightPanel]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeading}>Minimal pairs</Text>
                  <Text style={styles.sectionSubheading}>
                    Same base sound, different tone, different meaning.
                  </Text>
                </View>
                <View style={styles.pairGroupList}>
                  {MINIMAL_PAIRS.map((group) => (
                    <View key={group.label} style={styles.pairGroup}>
                      <Text style={styles.pairLabel}>{group.label}</Text>
                      <Text style={styles.pairDescription}>{group.description}</Text>
                      <View style={styles.pairGrid}>
                        {group.pairs.map((pair) => {
                          const accent = getToneAccent(pair.tone);
                          return (
                            <Pressable
                              key={`${group.label}-${pair.thai}-${pair.tone}`}
                              onPress={() => speak(pair.thai)}
                              style={({ hovered, pressed }) => [
                                styles.pairCard,
                                (hovered || pressed) && styles.depressedCard,
                              ]}
                            >
                              <Text style={[styles.pairThai, { color: accent }]}>
                                {pair.thai}
                              </Text>
                              <Text style={styles.pairRoman}>{pair.rom}</Text>
                              <Text style={styles.pairEnglish}>{pair.english}</Text>
                              <Text style={[styles.pairTone, { color: accent }]}>
                                {pair.tone}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </DesktopAppShell>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  pageContent: {
    paddingHorizontal: 28,
    paddingVertical: 28,
  },
  shell: {
    width: "100%",
    maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  title: {
    color: BRAND.ink,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1,
    fontFamily: DISPLAY_FONT,
  },
  subtitle: {
    maxWidth: 760,
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 26,
    fontFamily: BODY_FONT,
  },
  surfaceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 24,
    gap: 18,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionHeading: {
    color: BRAND.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sectionSubheading: {
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: BODY_FONT,
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
    borderRadius: WEB_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 18,
    gap: 14,
    height: "100%",
    boxShadow: WEB_CARD_SHADOW as any,
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
    height: 10,
    borderRadius: 999,
    marginTop: 8,
  },
  toneTitleText: {
    flex: 1,
    gap: 2,
  },
  toneName: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
    fontFamily: DISPLAY_FONT,
  },
  toneThai: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  toneDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  pitchCurve: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    paddingTop: 4,
  },
  pitchBar: {
    width: 11,
    borderRadius: 999,
  },
  exampleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  exampleCard: {
    minWidth: 170,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    padding: 14,
    gap: 4,
    flexGrow: 1,
    borderRadius: WEB_RADIUS.md,
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  depressedCard: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  exampleThai: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  exampleRoman: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  exampleEnglish: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
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
    borderRadius: WEB_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 16,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  markBadge: {
    width: 72,
    borderRadius: WEB_RADIUS.md,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  markSymbol: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  markCopy: {
    flex: 1,
    gap: 4,
  },
  markName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  markRoman: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  markDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  pairGroupList: {
    gap: 22,
  },
  pairGroup: {
    gap: 10,
  },
  pairLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  pairDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  pairGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  pairCard: {
    minWidth: 170,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    padding: 14,
    gap: 4,
    flexGrow: 1,
    borderRadius: WEB_RADIUS.md,
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  pairThai: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  pairRoman: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  pairEnglish: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  pairTone: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: BODY_FONT,
  },
});
