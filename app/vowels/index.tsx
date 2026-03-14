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
import VowelText from "../../src/components/VowelText";
import { vowels } from "../../src/data/vowels";

const LESSONS = [
  {
    group: 1,
    title: "Before Consonant",
    subtitle: "หน้า พยัญชนะ",
    accent: Sketch.green,
  },
  {
    group: 2,
    title: "After Consonant",
    subtitle: "หลัง พยัญชนะ",
    accent: Sketch.blue,
  },
  {
    group: 3,
    title: "Above Consonant",
    subtitle: "บน พยัญชนะ",
    accent: Sketch.orange,
  },
  {
    group: 4,
    title: "Below Consonant",
    subtitle: "ล่าง พยัญชนะ",
    accent: Sketch.purple,
  },
  {
    group: 5,
    title: "Around Consonant I",
    subtitle: "รอบ พยัญชนะ ๑",
    accent: Sketch.pink,
  },
  {
    group: 6,
    title: "Around Consonant II",
    subtitle: "รอบ พยัญชนะ ๒",
    accent: Sketch.red,
  },
];

function VowelGroupCard({
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
  const groupVowels = vowels.filter((item) => item.group === group);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View>
          <View style={[styles.badge, { backgroundColor: `${accent}12` }]}>
            <Text style={[styles.badgeText, { color: accent }]}>
              Group {group}
            </Text>
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}14` }]}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color={accent}
          />
        </View>
      </View>

      <View style={styles.previewRow}>
        {groupVowels.slice(0, 5).map((item, index) => (
          <View key={`${item.symbol}-${index}`} style={styles.previewChip}>
            <VowelText example={item.example} style={styles.previewText} />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{groupVowels.length} vowels</Text>
        <Ionicons name="chevron-forward" size={16} color={Sketch.inkMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function VowelHome() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Thai Vowels" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.introEyebrow}>Vowel Placement</Text>
          <Text style={styles.introTitle}>See how vowels wrap the consonant.</Text>
          <Text style={styles.introSubtitle}>
            Grouped by position so it is easier to notice patterns in spelling
            and pronunciation.
          </Text>
        </View>

        {LESSONS.map((item) => (
          <VowelGroupCard
            key={item.group}
            group={item.group}
            title={item.title}
            subtitle={item.subtitle}
            accent={item.accent}
            onPress={() => router.push(`/vowels/${item.group}` as any)}
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
    lineHeight: 30,
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
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previewChip: {
    minWidth: 52,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
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
