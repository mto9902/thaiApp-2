import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, SketchRadius, sketchShadow } from "@/constants/theme";
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
      <Text style={styles.entryEyebrow}>{eyebrow}</Text>
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
      <Header title="Alphabet" onBack={() => router.back()} showBrandMark={false} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        <EntryCard
          eyebrow="Custom batch"
          title="Alphabet Trainer"
          subtitle="Mix consonants and vowels into a focused reading batch and practice real word shapes."
          footer="Reading practice"
          onPress={() => router.push("/trainer" as any)}
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
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },
  entryCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: SketchRadius.card,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 18,
    marginBottom: 14,
    ...sketchShadow(2),
  },
  entryEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Sketch.inkMuted,
    marginBottom: 10,
  },
  entryTitle: {
    fontSize: 30,
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
