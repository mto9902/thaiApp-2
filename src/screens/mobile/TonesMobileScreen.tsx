import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import {
  MINIMAL_PAIRS,
  TONE_MARKS,
  TONES,
  type ToneData,
} from "@/src/data/tones";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import {
  getToneAccent,
  getToneMarkAccent,
} from "@/src/utils/toneAccent";
import {
  BRAND,
  SURFACE_PRESSED,
  SettledPressable,
} from "@/src/screens/mobile/readingSurface";
import {
  ReadingHero,
  ReadingScreenShell,
  ReadingSectionHeading,
  ReadingSurfaceCard,
} from "@/src/screens/mobile/readingLayout";

function getToneMarkDisplay(mark: string) {
  return mark ? `ก${mark}` : "ก";
}

function PitchCurve({ points, color }: { points: number[]; color: string }) {
  return (
    <View style={styles.pitchCurve}>
      {points.map((point, index) => (
        <View
          key={index}
          style={[
            styles.pitchBar,
            {
              backgroundColor: color,
              height: Math.max(6, point * 26),
              opacity: 0.78 + index * 0.04,
            },
          ]}
        />
      ))}
    </View>
  );
}

function ToneExampleCard({
  thai,
  rom,
  english,
  accent,
  onPress,
}: {
  thai: string;
  rom: string;
  english: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <SettledPressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.exampleCard,
        pressed ? SURFACE_PRESSED : null,
      ]}
    >
      <Text style={[styles.exampleThai, { color: accent }]}>{thai}</Text>
      <Text style={styles.exampleRoman}>{rom}</Text>
      <Text style={styles.exampleEnglish}>{english}</Text>
    </SettledPressable>
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
      <View style={styles.toneHeader}>
        <View style={styles.toneIdentity}>
          <View style={[styles.toneDot, { backgroundColor: accent }]} />
          <View style={styles.toneCopy}>
            <Text style={styles.toneName}>{tone.name} tone</Text>
            <Text style={[styles.toneThai, { color: accent }]}>{tone.thai}</Text>
          </View>
        </View>
        <PitchCurve points={tone.pitchPoints} color={accent} />
      </View>

      <Text style={styles.toneDescription}>{tone.description}</Text>

      <View style={styles.exampleList}>
        {tone.examples.map((example, index) => (
          <ToneExampleCard
            key={`${tone.name}-${index}`}
            thai={example.thai}
            rom={example.rom}
            english={example.english}
            accent={accent}
            onPress={() => onSpeak(example.thai)}
          />
        ))}
      </View>
    </View>
  );
}

export default function TonesMobileScreen() {
  const router = useRouter();
  const { playSentence } = useSentenceAudio();

  return (
    <ReadingScreenShell title="Thai Tones" onBack={() => router.back()}>
      <ReadingHero
        eyebrow="Tones"
        title="Thai tones"
        subtitle="Study the five tones, hear written tone marks, and compare minimal pairs while you learn."
      />

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="The five tones"
          subtitle="Tap any example to hear it. The pitch bars give you a quick visual cue for the movement."
        />

        <View style={styles.toneList}>
          {TONES.map((tone) => (
            <ToneCard
              key={tone.name}
              tone={tone}
              onSpeak={(text) => void playSentence(text, { speed: "slow" })}
            />
          ))}
        </View>
      </ReadingSurfaceCard>

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Tone marks"
          subtitle="Thai has four written tone marks. Mid tone has no written mark."
        />

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
      </ReadingSurfaceCard>

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Minimal pairs"
          subtitle="Same base sound, different tone, different meaning."
        />

        <View style={styles.pairGroupList}>
          {MINIMAL_PAIRS.map((group) => (
            <View key={group.label} style={styles.pairGroup}>
              <Text style={styles.pairLabel}>{group.label}</Text>
              <Text style={styles.pairDescription}>{group.description}</Text>
              <View style={styles.exampleList}>
                {group.pairs.map((pair) => {
                  const accent = getToneAccent(pair.tone);

                  return (
                    <ToneExampleCard
                      key={`${group.label}-${pair.thai}-${pair.tone}`}
                      thai={pair.thai}
                      rom={pair.rom}
                      english={`${pair.english} · ${pair.tone}`}
                      accent={accent}
                      onPress={() => void playSentence(pair.thai, { speed: "slow" })}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ReadingSurfaceCard>
    </ReadingScreenShell>
  );
}

const styles = StyleSheet.create({
  toneList: {
    gap: 12,
  },
  toneCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 12,
  },
  toneHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  toneIdentity: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  toneDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 7,
  },
  toneCopy: {
    flex: 1,
    gap: 2,
  },
  toneName: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  toneThai: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  pitchCurve: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    height: 28,
  },
  pitchBar: {
    width: 8,
    borderRadius: 999,
  },
  toneDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  exampleList: {
    gap: 10,
  },
  exampleCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 4,
  },
  exampleThai: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  exampleRoman: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  exampleEnglish: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.body,
  },
  markList: {
    gap: 10,
  },
  markRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
  },
  markBadge: {
    width: 58,
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  markSymbol: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  markCopy: {
    flex: 1,
    gap: 4,
  },
  markName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: BRAND.ink,
  },
  markRoman: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  markDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
  pairGroupList: {
    gap: 14,
  },
  pairGroup: {
    gap: 8,
  },
  pairLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  pairDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.inkSoft,
  },
});
