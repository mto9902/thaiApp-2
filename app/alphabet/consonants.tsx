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
import { alphabet } from "../../src/data/alphabet";

const GROUPS = [
  { group: 1, title: "Mid Class", subtitle: "กลาง" },
  { group: 2, title: "High Class", subtitle: "สูง" },
  { group: 3, title: "Low Class I", subtitle: "ต่ำ ๑" },
  { group: 4, title: "Low Class II", subtitle: "ต่ำ ๒" },
];

function ConsonantCard({
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
  const letters = alphabet.filter((item) => item.group === group);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <Text style={styles.eyebrow}>Group {group}</Text>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      <View style={styles.letterRow}>
        {letters.slice(0, 6).map((item) => (
          <View key={item.letter} style={styles.letterChip}>
            <Text style={styles.letterChipText}>{item.letter}</Text>
          </View>
        ))}
        {letters.length > 6 ? (
          <View style={[styles.letterChip, styles.moreChip]}>
            <Text style={styles.moreChipText}>+{letters.length - 6}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{letters.length} letters</Text>
        <Text style={styles.footerAction}>Open group</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ConsonantsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
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
  letterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "flex-start",
    marginTop: 14,
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
    alignSelf: "flex-start",
    marginRight: 8,
    marginBottom: 8,
  },
  letterChipText: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  moreChip: {
    backgroundColor: Sketch.cardBg,
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
