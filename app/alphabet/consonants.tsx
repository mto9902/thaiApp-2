import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import Header from "../../src/components/Header";
import { alphabet } from "../../src/data/alphabet";

const GROUPS = [
  { group: 1, title: "Mid Class", subtitle: "กลาง", accent: Sketch.orange },
  { group: 2, title: "High Class", subtitle: "สูง", accent: Sketch.blue },
  { group: 3, title: "Low Class I", subtitle: "ต่ำ ๑", accent: Sketch.green },
  { group: 4, title: "Low Class II", subtitle: "ต่ำ ๒", accent: Sketch.red },
];

function ConsonantCard({
  group,
  title,
  subtitle,
  accent,
  onPress,
}: {
  group: number;
  title: string;
  subtitle: string;
  accent: string;
  onPress: () => void;
}) {
  const letters = alphabet.filter((item) => item.group === group);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View>
          <View
            style={[styles.badge, { backgroundColor: `${accent}12` }]}
          >
            <Text style={[styles.badgeText, { color: accent }]}>
              Group {group}
            </Text>
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}14` }]}>
          <Ionicons name="book-outline" size={20} color={accent} />
        </View>
      </View>

      <View style={styles.letterRow}>
        {letters.slice(0, 6).map((item) => (
          <View key={item.letter} style={styles.letterChip}>
            <Text style={styles.letterChipText}>{item.letter}</Text>
          </View>
        ))}
        {letters.length > 6 ? (
          <View style={styles.moreChip}>
            <Text style={styles.moreChipText}>+{letters.length - 6}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{letters.length} letters</Text>
        <Ionicons name="chevron-forward" size={16} color={Sketch.inkMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function ConsonantsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Consonants" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.introEyebrow}>Consonant Classes</Text>
          <Text style={styles.introTitle}>Learn the four tone classes.</Text>
          <Text style={styles.introSubtitle}>
            Each group shapes tone rules and pronunciation patterns across the
            alphabet.
          </Text>
        </View>

        {GROUPS.map((item) => (
          <ConsonantCard
            key={item.group}
            group={item.group}
            title={item.title}
            subtitle={item.subtitle}
            accent={item.accent}
            onPress={() => router.push(`/alphabet/${item.group}` as any)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 14,
  },
  introCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
  },
  introEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    marginTop: 8,
  },
  introSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    lineHeight: 20,
    marginTop: 6,
  },
  card: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    gap: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  letterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  letterChip: {
    minWidth: 42,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    alignItems: "center",
  },
  letterChipText: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  moreChip: {
    minWidth: 42,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Sketch.paperDark,
    alignItems: "center",
    justifyContent: "center",
  },
  moreChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.inkMuted,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
});
