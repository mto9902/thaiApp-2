import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import Header from "../../src/components/Header";

function EntryCard({
  eyebrow,
  title,
  subtitle,
  footer,
  onPress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.entryAccent} />
      <View style={styles.entryBadge}>
        <Text style={styles.entryBadgeText}>{eyebrow}</Text>
      </View>
      <Text style={styles.entryTitle}>{title}</Text>
      <Text style={styles.entrySubtitle}>{subtitle}</Text>

      <View style={styles.entryFooter}>
        <Text style={styles.entryFooterText}>{footer}</Text>
        <Text style={styles.entryFooterAction}>Open lesson</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AlphabetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Alphabet" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
          footer="Four groups"
          onPress={() => router.push("/alphabet/consonants" as any)}
        />

        <EntryCard
          eyebrow="Groups 1-6"
          title="Vowels"
          subtitle="Study vowel placement around the consonant and how each pattern sounds."
          footer="Six groups"
          onPress={() => router.push("/vowels/" as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  introCard: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 20,
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
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
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
  entryAccent: {
    width: 40,
    height: 3,
    borderRadius: 999,
    backgroundColor: Sketch.orange,
    marginBottom: 14,
  },
  entryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Sketch.orange + "12",
    marginBottom: 12,
  },
  entryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Sketch.orange,
  },
  entryTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Sketch.ink,
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
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  entryFooterText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  entryFooterAction: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
});
