import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import VowelText from "@/src/components/VowelText";
import { vowels } from "@/src/data/vowels";

type VowelEntry = {
  symbol: string;
  example: string;
  name: string;
  sound: string;
  group: number;
};

const GROUP_META: Record<number, { badge: string; title: string; description: string }> = {
  1: { badge: "Group 1", title: "Before Consonant", description: "These vowels are written before the consonant and help train Thai reading order." },
  2: { badge: "Group 2", title: "After Consonant", description: "These vowels sit after the consonant and are some of the most direct spelling patterns." },
  3: { badge: "Group 3", title: "Above Consonant", description: "These vowels sit above the consonant and reward slower visual scanning at first." },
  4: { badge: "Group 4", title: "Below Consonant", description: "These vowels sit below the consonant and are useful to learn as consistent shapes." },
  5: { badge: "Group 5", title: "Around Consonant I", description: "These patterns wrap the consonant from more than one side and are best read as full shapes." },
  6: { badge: "Group 6", title: "Around Consonant II", description: "This continues the surrounding patterns and helps longer spellings feel more natural." },
};

export default function VowelGroupWeb() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();
  const columns = width >= 1400 ? 4 : width >= 1080 ? 3 : width >= 820 ? 2 : 1;
  const cardWidth =
    columns === 4 ? "23.7%" : columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

  const groupNum = Number(group);
  const groupInfo = GROUP_META[groupNum] ?? GROUP_META[1];
  const lessonVowels = (vowels as VowelEntry[]).filter((item) => item.group === groupNum);
  const practiceReady = lessonVowels.some(
    (item) => item.sound !== "..." && item.name !== "...",
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow={groupInfo.badge}
        title={groupInfo.title}
        subtitle={groupInfo.description}
        toolbar={
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} activeOpacity={0.82}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <DesktopPanel>
          <DesktopSectionTitle
            title="Patterns"
            caption="Tap any card to hear the vowel example and inspect the written shape."
            action={
              practiceReady ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() =>
                    router.push({
                      pathname: "/vowels/practice/[group]",
                      params: { group },
                    } as any)
                  }
                  activeOpacity={0.82}
                >
                  <Text style={styles.primaryButtonText}>Start practice</Text>
                </TouchableOpacity>
              ) : null
            }
          />
          <View style={styles.grid}>
            {lessonVowels.map((vowel, index) => (
              <TouchableOpacity
                key={`${vowel.symbol}-${index}`}
                style={[styles.card, { width: cardWidth }]}
                onPress={() => void playSentence(vowel.example, { speed: "slow" })}
                activeOpacity={0.82}
              >
                <View style={styles.cardTop}>
                  <View style={styles.soundBadge}>
                    <Text style={styles.soundBadgeText}>{vowel.sound.toUpperCase()}</Text>
                  </View>
                  <Ionicons
                    name="volume-medium-outline"
                    size={16}
                    color={AppSketch.inkMuted}
                  />
                </View>
                <VowelText
                  example={vowel.example}
                  style={styles.vowelExample}
                  vowelColor={AppSketch.primary}
                  consonantColor={AppSketch.inkSecondary}
                />
                <Text style={styles.vowelName}>
                  {vowel.name !== "..." ? vowel.name : vowel.symbol}
                </Text>
                <Text style={styles.vowelSymbol}>{vowel.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </DesktopPanel>
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.primary,
    borderRadius: AppRadius.md,
    ...appShadow("sm"),
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 16,
    gap: 10,
    borderRadius: AppRadius.lg,
    ...appShadow("sm"),
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  soundBadge: {
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: AppRadius.md,
  },
  soundBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: 0.8,
  },
  vowelExample: {
    fontSize: 32,
    fontWeight: "700",
    color: AppSketch.ink,
    lineHeight: 40,
  },
  vowelName: {
    fontSize: 18,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  vowelSymbol: {
    fontSize: 14,
    color: AppSketch.inkMuted,
  },
});
