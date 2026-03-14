import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import Header from "../../src/components/Header";

function EntryCard({
  eyebrow,
  title,
  subtitle,
  accent,
  icon,
  onPress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.entryTop}>
        <View style={[styles.entryIcon, { backgroundColor: `${accent}14` }]}>
          <Ionicons name={icon} size={24} color={accent} />
        </View>
        <View style={[styles.entryBadge, { backgroundColor: `${accent}12` }]}>
          <Text style={[styles.entryBadgeText, { color: accent }]}>
            {eyebrow}
          </Text>
        </View>
      </View>

      <Text style={styles.entryTitle}>{title}</Text>
      <Text style={styles.entrySubtitle}>{subtitle}</Text>

      <View style={styles.entryFooter}>
        <Text style={styles.entryFooterText}>Open lesson</Text>
        <Ionicons name="arrow-forward" size={16} color={Sketch.inkMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function AlphabetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Alphabet" onBack={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.introCard}>
          <Text style={styles.introEyebrow}>Foundations</Text>
          <Text style={styles.introTitle}>Build your Thai sound system.</Text>
          <Text style={styles.introSubtitle}>
            Start with consonant classes, then layer in vowel groups and sound
            patterns.
          </Text>
        </View>

        <EntryCard
          eyebrow="44 letters"
          title="Consonants"
          subtitle="Learn the four consonant classes and recognize their core sounds."
          accent={Sketch.orange}
          icon="language-outline"
          onPress={() => router.push("/alphabet/consonants" as any)}
        />

        <EntryCard
          eyebrow="Groups 1-6"
          title="Vowels"
          subtitle="Study vowel placement around the consonant and how each pattern sounds."
          accent={Sketch.blue}
          icon="chatbubble-ellipses-outline"
          onPress={() => router.push("/vowels/" as any)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 14,
  },
  introCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
  },
  introEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  introTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Sketch.ink,
    marginTop: 8,
    lineHeight: 32,
  },
  introSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    marginTop: 8,
    lineHeight: 20,
  },
  entryCard: {
    flex: 1,
    minHeight: 180,
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
    justifyContent: "space-between",
  },
  entryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  entryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  entryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  entryTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
    marginTop: 18,
  },
  entrySubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkLight,
    lineHeight: 20,
    marginTop: 8,
  },
  entryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  entryFooterText: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.ink,
  },
});
