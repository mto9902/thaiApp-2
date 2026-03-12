import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { TONES as TONE_DATA, toLegacyTone } from "../data/tones";
import { Sketch, sketchShadow } from "@/constants/theme";

const TONES = TONE_DATA.map(toLegacyTone);

function PitchCurve({ points, color }: { points: number[]; color: string }) {
  const W = 80;
  const H = 40;
  const pad = 6;

  return (
    <View
      style={{
        width: W,
        height: H,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 2,
      }}
    >
      {points.map((p, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max(4, p * (H - pad)),
            backgroundColor: color,
            borderRadius: 3,
            opacity: 0.85 + i * 0.03,
          }}
        />
      ))}
    </View>
  );
}

function ToneCard({ tone }: { tone: (typeof TONES)[0] }) {
  return (
    <View style={[styles.card, { borderLeftColor: tone.color }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.colorDot, { backgroundColor: tone.color }]}>
          <Text style={styles.symbolText}>{tone.symbol}</Text>
        </View>
        <View style={styles.cardTitles}>
          <Text style={styles.toneName}>{tone.name} Tone</Text>
          <Text style={styles.toneThai}>{tone.thai}</Text>
        </View>
        <PitchCurve points={tone.pitchPoints} color={tone.color} />
      </View>

      <Text style={styles.cardDesc}>{tone.description}</Text>

      <View
        style={[styles.examplePill, { backgroundColor: tone.color + "18" }]}
      >
        <Text style={[styles.exampleThai, { color: tone.color }]}>
          {tone.example.thai}
        </Text>
        <Text style={styles.exampleRom}>{tone.example.rom}</Text>
        <Text style={styles.exampleEng}>"{tone.example.english}"</Text>
      </View>
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ToneGuide({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Thai Tones</Text>
            <Text style={styles.subtitle}>5 tones · colour coded</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legendStrip}>
          {TONES.map((t) => (
            <View key={t.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: t.color }]} />
              <Text style={styles.legendLabel}>{t.name}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {TONES.map((tone) => (
            <ToneCard key={tone.name} tone={tone} />
          ))}
          <Text style={styles.footer}>
            Tap any coloured tile in a lesson to hear it spoken.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

export function ToneGuideButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.triggerBtn} onPress={onPress}>
      <Text style={styles.triggerLabel}>TONE GUIDE</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: Sketch.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Sketch.ink,
    maxHeight: "88%",
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Sketch.inkFaint,
    alignSelf: "center",
    marginBottom: 16,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Sketch.inkMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Sketch.paperDark,
    borderWidth: 2,
    borderColor: Sketch.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 14,
    color: Sketch.ink,
    fontWeight: "700",
  },

  legendStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Sketch.cardBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Sketch.ink,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    ...sketchShadow(2),
  },
  legendItem: {
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Sketch.ink,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Sketch.inkLight,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Sketch.ink,
    padding: 16,
    borderLeftWidth: 6,
    gap: 10,
    ...sketchShadow(3),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Sketch.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  symbolText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "900",
  },
  cardTitles: {
    flex: 1,
  },
  toneName: {
    fontSize: 16,
    fontWeight: "800",
    color: Sketch.ink,
  },
  toneThai: {
    fontSize: 12,
    color: Sketch.inkMuted,
    fontWeight: "600",
    marginTop: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: Sketch.inkLight,
    lineHeight: 19,
    fontWeight: "500",
  },
  examplePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: Sketch.inkFaint,
  },
  exampleThai: {
    fontSize: 20,
    fontWeight: "900",
  },
  exampleRom: {
    fontSize: 13,
    color: Sketch.inkLight,
    fontWeight: "600",
  },
  exampleEng: {
    fontSize: 13,
    color: Sketch.inkMuted,
    fontWeight: "500",
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: Sketch.inkMuted,
    marginTop: 8,
    fontWeight: "500",
  },

  triggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Sketch.cardBg,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-end",
    ...sketchShadow(2),
  },
  triggerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Sketch.ink,
    letterSpacing: 0.8,
  },
});
