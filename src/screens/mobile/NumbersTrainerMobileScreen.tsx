import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Header, { type SettingsState } from "@/src/components/Header";
import {
  createNumbersTrainerQuestion,
  type NumbersTrainerOption,
  type NumbersTrainerQuestion,
} from "@/src/data/numbers";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import {
  BRAND,
  SURFACE_SHADOW,
  SurfaceButton,
  SurfaceIconButton,
  SettledPressable,
  SURFACE_PRESSED,
} from "@/src/screens/mobile/readingSurface";
import { ReadingSurfaceCard } from "@/src/screens/mobile/readingLayout";

function NumbersOptionCard({
  option,
  showRoman,
  state,
  onPress,
  singleColumn,
}: {
  option: NumbersTrainerOption;
  showRoman: boolean;
  state: "idle" | "correct" | "incorrect" | "revealed";
  onPress: () => void;
  singleColumn: boolean;
}) {
  const isCorrect = state === "correct";
  const isRevealed = state === "revealed";
  const isIncorrect = state === "incorrect";

  return (
    <SettledPressable
      onPress={state === "idle" ? onPress : undefined}
      disabled={state !== "idle"}
      style={({ pressed }: { pressed: boolean }) => [
        styles.optionCard,
        singleColumn ? styles.optionCardFull : null,
        isCorrect ? styles.optionCardCorrect : null,
        isRevealed ? styles.optionCardRevealed : null,
        isIncorrect ? styles.optionCardIncorrect : null,
        state === "idle" && pressed ? SURFACE_PRESSED : null,
      ]}
    >
      <Text style={styles.optionPrimary}>{option.primary}</Text>
      {showRoman && option.secondary ? (
        <Text style={styles.optionSecondary}>{option.secondary}</Text>
      ) : null}
    </SettledPressable>
  );
}

export default function NumbersTrainerMobileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();
  const [question, setQuestion] = useState<NumbersTrainerQuestion>(() =>
    createNumbersTrainerQuestion("read"),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const [showRoman, setShowRoman] = useState(true);
  const singleColumn = width < 340;

  const loadQuestion = useCallback(() => {
    setQuestion(createNumbersTrainerQuestion("read"));
    setSelectedId(null);
    setResult(null);
  }, []);

  function handleSettingsChange(settings: SettingsState) {
    setShowRoman(settings.showRoman);
    setAutoplayTTS(settings.autoplayTTS);
    setTtsSpeed(settings.ttsSpeed);
  }

  function handleOptionPress(optionId: string) {
    if (selectedId) return;
    const selectedOption = question.options.find((option) => option.id === optionId);
    const isCorrect = optionId === question.correctOptionId;

    if (autoplayTTS && selectedOption) {
      void playSentence(selectedOption.primary, { speed: ttsSpeed });
    }

    setSelectedId(optionId);
    setResult(isCorrect ? "correct" : "incorrect");
  }

  function optionState(optionId: string) {
    if (!selectedId) return "idle" as const;
    if (optionId === question.correctOptionId) {
      return selectedId === question.correctOptionId
        ? ("correct" as const)
        : ("revealed" as const);
    }
    if (optionId === selectedId) return "incorrect" as const;
    return "idle" as const;
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Numbers Trainer"
        onBack={() => router.back()}
        showBrandMark={false}
        onSettingsChange={handleSettingsChange}
      />

      <ScrollView
        testID="keystone-mobile-page-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReadingSurfaceCard>
          <Text style={styles.sectionLabel}>{question.eyebrow}</Text>
          <View style={styles.promptHeader}>
            <View style={styles.promptHeaderCopy}>
              <Text style={styles.promptTitle}>{question.promptTitle}</Text>
              <Text style={styles.promptHint}>{question.promptHint}</Text>
            </View>
            <SurfaceIconButton
              icon="volume-medium-outline"
              onPress={() => void playSentence(question.audioText, { speed: ttsSpeed })}
            />
          </View>

          <View style={styles.promptCard}>
            <Text style={styles.promptPrimary}>{question.promptPrimary}</Text>
            {question.promptSecondary ? (
              <Text style={styles.promptSecondary}>{question.promptSecondary}</Text>
            ) : null}
            {question.promptTertiary ? (
              <Text style={styles.promptTertiary}>{question.promptTertiary}</Text>
            ) : null}
          </View>

          <View style={styles.optionsGrid}>
            {question.options.map((option) => (
              <NumbersOptionCard
                key={option.id}
                option={option}
                showRoman={showRoman}
                state={optionState(option.id)}
                onPress={() => handleOptionPress(option.id)}
                singleColumn={singleColumn}
              />
            ))}
          </View>

          {!selectedId ? (
            <SurfaceButton label="Skip" onPress={loadQuestion} />
          ) : null}

          {result ? (
            <View
              style={[
                styles.feedbackCard,
                result === "correct"
                  ? styles.feedbackCardCorrect
                  : styles.feedbackCardIncorrect,
              ]}
            >
              <Text style={styles.feedbackTitle}>
                {result === "correct" ? "Correct" : "Not quite"}
              </Text>
              <Text style={styles.feedbackBody}>{question.feedback}</Text>
            </View>
          ) : null}

          <SurfaceButton
            label="Next"
            variant="primary"
            onPress={loadQuestion}
            disabled={!result}
          />
        </ReadingSurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  promptHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  promptTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  promptHint: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.inkSoft,
  },
  promptCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  promptPrimary: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: BRAND.ink,
    textAlign: "center",
  },
  promptSecondary: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
    color: BRAND.navy,
    textAlign: "center",
  },
  promptTertiary: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  optionCard: {
    width: "47.3%",
    minHeight: 90,
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    ...SURFACE_SHADOW,
  },
  optionCardFull: {
    width: "100%",
  },
  optionCardCorrect: {
    borderColor: BRAND.navy,
    borderWidth: 2,
    backgroundColor: BRAND.paper,
  },
  optionCardRevealed: {
    borderColor: "#CBD2D9",
    borderWidth: 1.5,
    backgroundColor: "#F8FAFC",
  },
  optionCardIncorrect: {
    borderColor: "#CBD2D9",
    borderWidth: 1.5,
    backgroundColor: "#F3F4F6",
  },
  optionPrimary: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: BRAND.ink,
    textAlign: "center",
  },
  optionSecondary: {
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.inkSoft,
    textAlign: "center",
  },
  feedbackCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  feedbackCardCorrect: {
    borderColor: BRAND.navy,
    backgroundColor: BRAND.paper,
  },
  feedbackCardIncorrect: {
    borderColor: "#CBD2D9",
    backgroundColor: "#F8FAFC",
  },
  feedbackTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    color: BRAND.ink,
  },
  feedbackBody: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.inkSoft,
  },
});
