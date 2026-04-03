import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppRadius, AppSketch, appShadow } from "@/constants/theme-app";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import {
  NumberReferenceItem,
  numbersIntro,
  numbersSections,
} from "@/src/data/numbers";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";

function ReferenceCard({
  item,
  onPlay,
}: {
  item: NumberReferenceItem;
  onPlay: () => void;
}) {
  function handleSpeakerPress(event: GestureResponderEvent) {
    event.stopPropagation();
    onPlay();
  }

  return (
    <TouchableOpacity style={styles.referenceCard} onPress={onPlay} activeOpacity={0.84}>
      <View style={styles.referenceTop}>
        <View style={styles.referenceDisplay}>
          <Text style={styles.referenceDigits}>{item.digits}</Text>
          <Text style={styles.referenceThaiNumeral}>{item.thaiNumeral}</Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={handleSpeakerPress}
          activeOpacity={0.82}
        >
          <Ionicons name="volume-medium-outline" size={18} color={AppSketch.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.referenceThai}>{item.thai}</Text>
      <Text style={styles.referenceRomanization}>{item.romanization}</Text>
      <Text style={styles.referenceEnglish}>{item.english}</Text>
      {item.contextLabel ? (
        <Text style={styles.referenceContext}>{item.contextLabel}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function NumbersWeb() {
  const router = useRouter();
  const { playSentence } = useSentenceAudio();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow="Numbers"
        title="Thai Numbers"
        subtitle="Learn the spoken forms, Thai numeral glyphs, and the number patterns you actually meet in prices, times, dates, and quantities."
        toolbar={
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.82}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <DesktopPanel style={styles.introPanel}>
          <View style={styles.introCopy}>
            <Text style={styles.introEyebrow}>{numbersIntro.eyebrow}</Text>
            <Text style={styles.introTitle}>{numbersIntro.title}</Text>
            <Text style={styles.introBody}>{numbersIntro.body}</Text>
          </View>
          <TouchableOpacity
            style={styles.launchButton}
            onPress={() => router.push("/numbers/trainer" as any)}
            activeOpacity={0.82}
          >
            <Text style={styles.launchButtonText}>Open Numbers Trainer</Text>
          </TouchableOpacity>
        </DesktopPanel>

        {numbersSections
          .filter((section) => section.id !== "contexts")
          .map((section) => (
          <DesktopPanel key={section.id}>
            <DesktopSectionTitle title={section.title} caption={section.caption} />
            <View style={styles.grid}>
              {section.items.map((item) => (
                <ReferenceCard
                  key={item.id}
                  item={item}
                  onPlay={() =>
                    void playSentence(
                      item.audioText ?? item.exampleThai ?? item.thai,
                      { speed: "slow" },
                    )
                  }
                />
              ))}
            </View>
          </DesktopPanel>
        ))}

        <DesktopPanel style={styles.ctaPanel}>
          <View style={styles.ctaCopy}>
            <Text style={styles.ctaTitle}>Ready to switch from reference to practice?</Text>
            <Text style={styles.ctaBody}>
              Use the trainer to practice reading digits, Thai numerals, and bigger number patterns.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/numbers/trainer" as any)}
            activeOpacity={0.82}
          >
            <Text style={styles.secondaryButtonText}>Start Trainer</Text>
          </TouchableOpacity>
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
  introPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
  },
  introCopy: {
    flex: 1,
    gap: 8,
  },
  introEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  introTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.8,
  },
  introBody: {
    maxWidth: 820,
    fontSize: 16,
    lineHeight: 26,
    color: AppSketch.inkSecondary,
  },
  launchButton: {
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.primary,
    ...appShadow("sm"),
  },
  launchButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  referenceCard: {
    width: "31.8%",
    minHeight: 236,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    padding: 18,
    gap: 8,
    ...appShadow("sm"),
  },
  referenceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  referenceDisplay: {
    gap: 4,
  },
  referenceDigits: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  referenceThaiNumeral: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: AppSketch.primary,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.background,
    alignItems: "center",
    justifyContent: "center",
  },
  referenceThai: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  referenceRomanization: {
    fontSize: 14,
    color: AppSketch.inkSecondary,
  },
  referenceEnglish: {
    fontSize: 13,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
  },
  referenceContext: {
    fontSize: 12,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  ctaPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  ctaCopy: {
    flex: 1,
    gap: 6,
  },
  ctaTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.6,
  },
  ctaBody: {
    fontSize: 15,
    lineHeight: 24,
    color: AppSketch.inkSecondary,
  },
  secondaryButton: {
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppSketch.ink,
  },
});
