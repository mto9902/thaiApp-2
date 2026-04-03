import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import VowelText from "@/src/components/VowelText";
import { vowels } from "@/src/data/vowels";

const LESSONS = [
  { group: 1, title: "Before Consonant" },
  { group: 2, title: "After Consonant" },
  { group: 3, title: "Above Consonant" },
  { group: 4, title: "Below Consonant" },
  { group: 5, title: "Around Consonant I" },
  { group: 6, title: "Around Consonant II" },
];

export default function VowelsWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 1400 ? 3 : width >= 980 ? 2 : 1;
  const cardWidth = columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Vowels"
        title="Vowel placement"
        subtitle="Learn vowel groups by where they sit around the consonant."
        toolbar={
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.82}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <DesktopPanel>
          <DesktopSectionTitle
            title="Browse groups"
            caption="Study each placement pattern and open a group for examples and practice."
          />
          <View style={styles.grid}>
            {LESSONS.map((item) => {
              const groupVowels = vowels.filter((entry) => entry.group === item.group);
              return (
                <TouchableOpacity
                  key={item.group}
                  style={[styles.card, { width: cardWidth }]}
                  onPress={() => router.push(`/vowels/${item.group}` as any)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.eyebrow}>Group {item.group}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.previewRow}>
                    {groupVowels.slice(0, 5).map((entry, index) => (
                      <View key={`${entry.symbol}-${index}`} style={styles.previewChip}>
                        <VowelText
                          example={entry.example}
                          style={styles.previewText}
                          vowelColor={AppSketch.primary}
                          consonantColor={AppSketch.ink}
                        />
                      </View>
                    ))}
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>{groupVowels.length} vowels</Text>
                    <Text style={styles.footerAction}>Open lesson</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 18,
    gap: 12,
    ...appShadow("sm"),
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.6,
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previewChip: {
    minWidth: 52,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    fontSize: 20,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppSketch.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: AppSketch.inkMuted,
  },
  footerAction: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.primary,
  },
});
