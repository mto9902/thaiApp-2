import * as Speech from "expo-speech";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Sketch, sketchShadow } from "@/constants/theme";
import { TONES as TONE_DATA, toLegacyTone } from "../data/tones";
import { getToneAccent, withAlpha } from "../utils/toneAccent";

const TONES = TONE_DATA.map(toLegacyTone);

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.75 });
}

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

function ToneRow({ tone }: { tone: (typeof TONES)[0] }) {
  const accent = getToneAccent(tone.name);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() => speak(tone.example.thai)}
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
            backgroundColor: withAlpha(accent, "10"),
            borderColor: withAlpha(accent, "22"),
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
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Reference</Text>
              <Text style={styles.title}>Thai tones</Text>
              <Text style={styles.subtitle}>
                A quick ear-training sheet. Tap any row to hear the example.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.72}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {TONES.map((tone) => (
              <ToneRow key={tone.name} tone={tone} />
            ))}

            <Text style={styles.footer}>
              Tone marks help, but what your ear needs most is the pitch shape.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function ToneGuideButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.72}
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
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 13, 11, 0.32)",
  },
  sheet: {
    backgroundColor: Sketch.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Sketch.inkFaint,
    minHeight: "60%",
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingTop: 12,
    ...sketchShadow(10),
  },
  handle: {
    alignSelf: "center",
    backgroundColor: Sketch.inkFaint,
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 38,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: Sketch.orange,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    color: Sketch.ink,
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: Sketch.inkLight,
    fontSize: 13,
    lineHeight: 19,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: Sketch.paperDark,
    borderColor: Sketch.inkFaint,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 70,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: Sketch.inkLight,
    fontSize: 12,
    fontWeight: "600",
  },
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 30,
  },
  toneRow: {
    backgroundColor: Sketch.cardBg,
    borderColor: Sketch.inkFaint,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    ...sketchShadow(4),
  },
  toneRowTop: {
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
  toneText: {
    flex: 1,
  },
  toneName: {
    color: Sketch.ink,
    fontSize: 15,
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
    gap: 3,
    height: 22,
    width: 70,
  },
  pitchBar: {
    borderRadius: 999,
    flex: 1,
  },
  toneDescription: {
    color: Sketch.inkLight,
    fontSize: 13,
    lineHeight: 19,
  },
  exampleBand: {
    alignItems: "flex-end",
    backgroundColor: Sketch.paperDark,
    borderColor: Sketch.inkFaint,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exampleThai: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  exampleMeta: {
    color: Sketch.inkLight,
    fontSize: 12,
  },
  listenHint: {
    color: Sketch.orange,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  footer: {
    color: Sketch.inkMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  triggerButton: {
    backgroundColor: Sketch.paperDark,
    borderColor: Sketch.inkFaint,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  triggerLabel: {
    color: Sketch.inkLight,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
