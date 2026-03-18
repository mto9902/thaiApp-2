import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Sketch } from "@/constants/theme";
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
          <Ionicons name="volume-medium-outline" size={18} color={Sketch.accent} />
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
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  introTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.8,
  },
  introBody: {
    maxWidth: 820,
    fontSize: 16,
    lineHeight: 26,
    color: Sketch.inkLight,
  },
  launchButton: {
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
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
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 8,
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
    color: Sketch.ink,
  },
  referenceThaiNumeral: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.accent,
  },
  playButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  referenceThai: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: Sketch.ink,
  },
  referenceRomanization: {
    fontSize: 14,
    color: Sketch.inkLight,
  },
  referenceEnglish: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
  },
  referenceContext: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.accent,
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
    color: Sketch.ink,
    letterSpacing: -0.6,
  },
  ctaBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkLight,
  },
  secondaryButton: {
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
});
