import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";

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
        <Text style={styles.entryFooterAction}>Open</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AlphabetWeb() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Alphabet"
        title="Thai sound system"
        subtitle="Start with consonants and vowels, then move into reading practice."
        toolbar={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <DesktopPanel>
          <DesktopSectionTitle
            title="Choose an area"
            caption="Choose a section to learn the building blocks of Thai reading."
          />
          <View style={styles.grid}>
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
          </View>
        </DesktopPanel>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  grid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 18,
  },
  entryCard: {
    flex: 1,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 10,
    minHeight: 220,
    ...appShadow("sm"),
  },
  entryEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  entryTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.5,
  },
  entrySubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: AppSketch.inkSecondary,
  },
  entryFooter: {
    marginTop: "auto",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: AppSketch.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryFooterText: {
    fontSize: 13,
    color: AppSketch.inkMuted,
  },
  entryFooterAction: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.primary,
  },
});
