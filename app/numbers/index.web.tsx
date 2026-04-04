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
        contentStyle={styles.pageContent}
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

      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    gap: 12,
  },
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
    alignItems: "center",
    gap: 18,
  },
  introCopy: {
    flex: 1,
    gap: 6,
  },
  introEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: AppSketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  introTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: AppSketch.ink,
    letterSpacing: -0.4,
  },
  introBody: {
    maxWidth: 760,
    fontSize: 14,
    lineHeight: 22,
    color: AppSketch.inkSecondary,
  },
  launchButton: {
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    gap: 12,
  },
  referenceCard: {
    width: "24%",
    minHeight: 156,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
    ...appShadow("sm"),
  },
  referenceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  referenceDisplay: {
    gap: 4,
  },
  referenceDigits: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  referenceThaiNumeral: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    color: AppSketch.primary,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.background,
    alignItems: "center",
    justifyContent: "center",
  },
  referenceThai: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  referenceRomanization: {
    fontSize: 12,
    color: AppSketch.inkSecondary,
  },
  referenceEnglish: {
    fontSize: 12,
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
  secondaryButton: {
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
