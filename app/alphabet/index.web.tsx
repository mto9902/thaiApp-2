import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Sketch } from "@/constants/theme";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";

function EntryCard({
  eyebrow,
  title,
  subtitle,
  footer,
  onPlay,
  onPress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: string;
  onPlay: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.entryCard} onPress={onPress} activeOpacity={0.82}>
      <TouchableOpacity
        style={styles.speakerButton}
        onPress={(event) => {
          event.stopPropagation();
          onPlay();
        }}
        activeOpacity={0.82}
      >
        <Text style={styles.speakerButtonText}>Play</Text>
      </TouchableOpacity>
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
  const { playSentence } = useSentenceAudio();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Alphabet"
        title="Thai sound system"
        subtitle="Start with consonants and vowels, then move into reading practice."
        toolbar={
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.82}>
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
              onPlay={() => void playSentence("พยัญชนะ", { speed: "slow" })}
              onPress={() => router.push("/alphabet/consonants" as any)}
            />
            <EntryCard
              eyebrow="Groups 1-6"
              title="Vowels"
              subtitle="Study vowel placement around the consonant and how each pattern sounds."
              footer="Six groups"
              onPlay={() => void playSentence("สระ", { speed: "slow" })}
              onPress={() => router.push("/vowels/" as any)}
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
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  grid: {
    flexDirection: "row",
    gap: 20,
  },
  entryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 20,
    gap: 12,
    minHeight: 260,
  },
  speakerButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  speakerButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
  },
  entryEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  entryTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.8,
  },
  entrySubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkLight,
  },
  entryFooter: {
    marginTop: "auto",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryFooterText: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  entryFooterAction: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
});
