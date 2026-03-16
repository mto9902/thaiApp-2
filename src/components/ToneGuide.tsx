import { useCallback, useEffect, useMemo, useRef } from "react";
import * as Speech from "expo-speech";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Sketch, SketchRadius } from "@/constants/theme";
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.max(
    420,
    Math.min(windowHeight - insets.top - 24, Math.round(windowHeight * 0.84)),
  );
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const closingRef = useRef(false);

  const animateOpen = useCallback(() => {
    translateY.setValue(sheetHeight);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 90,
      friction: 13,
    }).start();
  }, [sheetHeight, translateY]);

  const closeSheet = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(translateY, {
      toValue: sheetHeight,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      closingRef.current = false;
      if (finished) {
        onClose();
      }
    });
  }, [onClose, sheetHeight, translateY]);

  useEffect(() => {
    if (visible) {
      animateOpen();
    }
  }, [animateOpen, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy >= 0) {
            translateY.setValue(gesture.dy);
          } else {
            translateY.setValue(gesture.dy * 0.18);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 90 || gesture.vy > 0.9) {
            closeSheet();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 110,
            friction: 14,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 110,
            friction: 14,
          }).start();
        },
      }),
    [closeSheet, translateY],
  );

  return (
    <Modal
      animationType="fade"
      onRequestClose={closeSheet}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable onPress={closeSheet} style={styles.backdrop} />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleZone} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

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
              onPress={closeSheet}
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
        </Animated.View>
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handleZone: {
    alignItems: "center",
    paddingBottom: 14,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: Sketch.inkFaint,
    borderRadius: 0,
    height: 4,
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
    borderRadius: SketchRadius.control,
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
    borderRadius: 0,
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
    borderRadius: 0,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
