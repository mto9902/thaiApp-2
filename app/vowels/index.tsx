import { Stack, useRouter } from "expo-router";
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
  { group: 1, title: "Before Consonant", subtitle: "หน้า พยัญชนะ" },
  { group: 2, title: "After Consonant", subtitle: "หลัง พยัญชนะ" },
  { group: 3, title: "Above Consonant", subtitle: "บน พยัญชนะ" },
  { group: 4, title: "Below Consonant", subtitle: "ล่าง พยัญชนะ" },
  { group: 5, title: "Around Consonant I", subtitle: "รอบ พยัญชนะ ๑" },
  { group: 6, title: "Around Consonant II", subtitle: "รอบ พยัญชนะ ๒" },
];

function VowelGroupCard({
  group,
  title,
  subtitle,
  onPress,
}: {
  group: number;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const groupVowels = vowels.filter((item) => item.group === group);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <Text style={styles.eyebrow}>Group {group}</Text>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      <View style={styles.previewRow}>
        {groupVowels.slice(0, 5).map((item, index) => (
          <View key={`${item.symbol}-${index}`} style={styles.previewChip}>
            <VowelText
              example={item.example}
              style={styles.previewText}
              vowelColor={Sketch.orange}
              consonantColor={Sketch.ink}
            />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{groupVowels.length} vowels</Text>
        <Text style={styles.footerAction}>Open group</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VowelHome() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
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
    paddingBottom: 28,
  },
  introCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    marginBottom: 14,
  },
  introEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.orange,
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
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: Sketch.orange,
    marginBottom: 10,
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
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "flex-start",
    marginTop: 14,
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
    alignSelf: "flex-start",
    marginRight: 8,
    marginBottom: 8,
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
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
  footerAction: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
});
