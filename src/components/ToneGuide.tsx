import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ── Tone data ─────────────────────────────────────────────────────────────────

const TONES = [
  {
    name: "Mid",
    thai: "กลาง",
    color: "#42A5F5",
    symbol: "—",
    description: "Flat, steady pitch. No rise or fall.",
    example: { thai: "มา", rom: "maa", english: "come" },
    pitchPoints: [0.5, 0.5, 0.5, 0.5, 0.5],
  },
  {
    name: "Low",
    thai: "เอก",
    color: "#AB47BC",
    symbol: "↓",
    description: "Starts low, stays flat below mid level.",
    example: { thai: "ไม่", rom: "mâi", english: "not" },
    pitchPoints: [0.2, 0.2, 0.2, 0.2, 0.2],
  },
  {
    name: "Falling",
    thai: "โท",
    color: "#FF4081",
    symbol: "↘",
    description: "Starts high, falls sharply to low.",
    example: { thai: "ไม้", rom: "mâi", english: "wood" },
    pitchPoints: [0.9, 0.8, 0.6, 0.35, 0.15],
  },
  {
    name: "High",
    thai: "ตรี",
    color: "#FF9800",
    symbol: "↑",
    description: "Starts mid-high, rises slightly then levels off high.",
    example: { thai: "น้ำ", rom: "náam", english: "water" },
    pitchPoints: [0.65, 0.7, 0.78, 0.85, 0.9],
  },
  {
    name: "Rising",
    thai: "จัตวา",
    color: "#66BB6A",
    symbol: "↗",
    description: "Starts low, dips, then rises to high.",
    example: { thai: "ฉัน", rom: "chǎn", english: "I (female)" },
    pitchPoints: [0.4, 0.25, 0.2, 0.55, 0.88],
  },
];

// ── Pitch curve SVG ───────────────────────────────────────────────────────────

function PitchCurve({ points, color }: { points: number[]; color: string }) {
  const W = 80;
  const H = 40;
  const pad = 6;

  const coords = points.map((p, i) => ({
    x: pad + (i / (points.length - 1)) * (W - pad * 2),
    y: pad + (1 - p) * (H - pad * 2),
  }));

  // smooth bezier path
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // React Native doesn't have SVG natively — we approximate with dots + line
  // Use a simple visual bar chart instead
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

// ── Tone card ─────────────────────────────────────────────────────────────────

function ToneCard({ tone }: { tone: (typeof TONES)[0] }) {
  return (
    <View style={[styles.card, { borderLeftColor: tone.color }]}>
      {/* Header row */}
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

      {/* Description */}
      <Text style={styles.cardDesc}>{tone.description}</Text>

      {/* Example word */}
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

// ── Main component ─────────────────────────────────────────────────────────────

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
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Thai Tones</Text>
            <Text style={styles.subtitle}>5 tones · colour coded</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Color legend strip */}
        <View style={styles.legendStrip}>
          {TONES.map((t) => (
            <View key={t.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: t.color }]} />
              <Text style={styles.legendLabel}>{t.name}</Text>
            </View>
          ))}
        </View>

        {/* Cards */}
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

// ── Trigger button (drop-in for practicecsv.tsx) ──────────────────────────────

export function ToneGuideButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.triggerBtn} onPress={onPress}>
      <Text style={styles.triggerIcon}>🎵</Text>
      <Text style={styles.triggerLabel}>TONE GUIDE</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 16,
  },

  // title
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "700",
  },

  // legend strip
  legendStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  legendItem: {
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#555",
  },

  // scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40, gap: 12 },

  // tone card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
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
    color: "#111",
  },
  toneThai: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginTop: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: "#555",
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
  },
  exampleThai: {
    fontSize: 20,
    fontWeight: "900",
  },
  exampleRom: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  exampleEng: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },

  // footer
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#AAA",
    marginTop: 8,
    fontWeight: "500",
  },

  // trigger button
  triggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-end",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  triggerIcon: {
    fontSize: 15,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#444",
    letterSpacing: 0.8,
  },
});
