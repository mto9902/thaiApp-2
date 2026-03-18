import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchCard, sketchShadow } from "@/constants/theme";
import Header from "@/src/components/Header";
import {
  NumberReferenceItem,
  numbersIntro,
  numbersSections,
} from "@/src/data/numbers";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";

function NumberCard({
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
    <TouchableOpacity style={styles.numberCard} onPress={onPlay} activeOpacity={0.84}>
      <View style={styles.numberCardTop}>
        <View style={styles.numberDisplayRow}>
          <Text style={styles.numberDigits}>{item.digits}</Text>
          <Text style={styles.numberThaiNumeral}>{item.thaiNumeral}</Text>
        </View>
        <TouchableOpacity
          style={styles.audioButton}
          onPress={handleSpeakerPress}
          activeOpacity={0.82}
        >
          <Ionicons name="volume-medium-outline" size={18} color={Sketch.accent} />
        </TouchableOpacity>
      </View>
      <Text style={styles.numberThai}>{item.thai}</Text>
      <Text style={styles.numberRomanization}>{item.romanization}</Text>
      <Text style={styles.numberEnglish}>{item.english}</Text>
      {item.contextLabel ? (
        <View style={styles.contextBadge}>
          <Text style={styles.contextBadgeText}>{item.contextLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function NumbersIndexScreen() {
  const router = useRouter();
  const { playSentence } = useSentenceAudio();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Thai Numbers"
        onBack={() => router.back()}
        showSettings={false}
        showBrandMark={false}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.introEyebrow}>{numbersIntro.eyebrow}</Text>
          <Text style={styles.introTitle}>{numbersIntro.title}</Text>
          <Text style={styles.introBody}>{numbersIntro.body}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/numbers/trainer" as any)}
            activeOpacity={0.84}
          >
            <Text style={styles.primaryButtonText}>Open Numbers Trainer</Text>
          </TouchableOpacity>
        </View>

        {numbersSections
          .filter((section) => section.id !== "contexts")
          .map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionEyebrow}>{section.eyebrow}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCaption}>{section.caption}</Text>
            </View>

            <View style={styles.grid}>
              {section.items.map((item) => (
                <NumberCard
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
          </View>
        ))}

        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>Ready to test yourself?</Text>
          <Text style={styles.bottomBody}>
            Practice reading digits, Thai numerals, and bigger number patterns.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/numbers/trainer" as any)}
            activeOpacity={0.84}
          >
            <Text style={styles.secondaryButtonText}>Start Trainer</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 8,
    paddingBottom: 28,
    gap: 20,
  },
  introCard: {
    ...sketchCard,
    padding: 20,
    gap: 10,
  },
  introEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  introTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.8,
  },
  introBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkLight,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: Sketch.accent,
    borderWidth: 1,
    borderColor: Sketch.accent,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  section: {
    gap: 14,
  },
  sectionHeading: {
    gap: 4,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  sectionCaption: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  numberCard: {
    ...sketchCard,
    width: "47.8%",
    padding: 14,
    gap: 6,
    minHeight: 198,
  },
  numberCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  numberDisplayRow: {
    gap: 2,
  },
  numberDigits: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: Sketch.ink,
  },
  numberThaiNumeral: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
    color: Sketch.accent,
  },
  audioButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  numberThai: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  numberRomanization: {
    fontSize: 14,
    color: Sketch.inkLight,
  },
  numberEnglish: {
    fontSize: 13,
    fontWeight: "600",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
  },
  contextBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: Sketch.paper,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  contextBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.accent,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  bottomCard: {
    ...sketchCard,
    padding: 20,
    gap: 8,
  },
  bottomTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.4,
  },
  bottomBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
  secondaryButton: {
    marginTop: 4,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    ...sketchShadow(1),
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.ink,
  },
});
