import { useCallback, useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { TONES as TONE_DATA, toLegacyTone } from "@/src/data/tones";
import { getToneAccent } from "@/src/utils/toneAccent";

const TONES = TONE_DATA.map(toLegacyTone);

function PitchCurve({ points, color }: { points: number[]; color: string }) {
  const height = 22;

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

function ToneRow({
  tone,
  onSpeak,
}: {
  tone: (typeof TONES)[0];
  onSpeak: (text: string) => void;
}) {
  const accent = getToneAccent(tone.name);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onSpeak(tone.example.thai)}
      style={styles.toneRow}
    >
      <View style={styles.toneRowTop}>
        <View style={styles.toneIdentity}>
          <View style={[styles.toneDot, { backgroundColor: accent }]} />
          <View style={styles.toneText}>
            <Text style={styles.toneName}>{tone.name} tone</Text>
            <Text style={[styles.toneThai, { color: accent }]}>{tone.thai}</Text>
          </View>
        </View>
        <PitchCurve color={accent} points={tone.pitchPoints} />
      </View>

      <Text style={styles.toneDescription}>{tone.description}</Text>

      <View
        style={[
          styles.exampleBand,
          {
            backgroundColor: AppSketch.surface,
            borderColor: accent,
          },
        ]}
      >
        <View>
          <Text style={[styles.exampleThai, { color: accent }]}>
            {tone.example.thai}
          </Text>
          <Text style={styles.exampleMeta}>
            {tone.example.rom} - {tone.example.english}
          </Text>
        </View>
        <Text style={[styles.listenHint, { color: accent }]}>Tap to hear</Text>
      </View>
    </TouchableOpacity>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ToneGuide({ visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();
  const panelWidth = Math.min(960, width - 64);
  const maxHeight = Math.min(height - 64, 760);
  const columns = width >= 1180 ? 2 : 1;
  const speak = useCallback(
    (text: string) => {
      void playSentence(text, { speed: "slow" });
    },
    [playSentence],
  );

  const toneRows = useMemo(
    () =>
      TONES.map((tone) => (
        <View
          key={tone.name}
          style={[styles.rowColumn, columns > 1 && styles.rowColumnHalf]}
        >
          <ToneRow tone={tone} onSpeak={speak} />
        </View>
      )),
    [columns, speak],
  );

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View
          style={[
            styles.panel,
            {
              width: panelWidth,
              maxHeight,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Reference</Text>
              <Text style={styles.title}>Thai tones</Text>
              <Text style={styles.subtitle}>
                Hear each tone, compare the pitch shape, and tap any row to
                listen to the example.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legendRow}>
            {TONES.map((tone) => {
              const accent = getToneAccent(tone.name);
              return (
                <View
                  key={tone.name}
                  style={[
                    styles.legendChip,
                    { borderColor: accent },
                  ]}
                >
                  <View
                    style={[styles.legendDot, { backgroundColor: accent }]}
                  />
                  <Text style={[styles.legendLabel, { color: accent }]}>
                    {tone.name}
                  </Text>
                </View>
              );
            })}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.rowsWrap}>{toneRows}</View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function ToneGuideButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={styles.triggerButton}
    >
      <Text style={styles.triggerLabel}>Tone guide</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  panel: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 28,
    gap: 20,
    borderRadius: AppRadius.lg,
    ...appShadow("sm"),
  },
  headerRow: {
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
    fontSize: 12,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: AppSketch.inkMuted,
    maxWidth: 620,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: AppRadius.md,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: AppRadius.md,
  },
  legendDot: {
    width: 10,
    height: 10,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 8,
  },
  rowsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  rowColumn: {
    width: "100%",
  },
  rowColumnHalf: {
    width: "48.9%",
  },
  toneRow: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 18,
    gap: 12,
    borderRadius: AppRadius.lg,
  },
  toneRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  toneIdentity: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  toneDot: {
    width: 12,
    height: 12,
    marginTop: 7,
  },
  toneText: {
    flex: 1,
    gap: 2,
  },
  toneName: {
    fontSize: 22,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.4,
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
  exampleBand: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  exampleThai: {
    fontSize: 24,
    fontWeight: "700",
  },
  exampleMeta: {
    marginTop: 4,
    fontSize: 13,
    color: AppSketch.inkSecondary,
  },
  listenHint: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  triggerButton: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AppRadius.md,
  },
  triggerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
  },
});
