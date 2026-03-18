import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchCard } from "@/constants/theme";
import Header, { SettingsState } from "@/src/components/Header";
import {
  createNumbersTrainerQuestion,
  NumbersTrainerOption,
  NumbersTrainerQuestion,
} from "@/src/data/numbers";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";

function OptionCard({
  option,
  showRoman,
  state,
  onPress,
}: {
  option: NumbersTrainerOption;
  showRoman: boolean;
  state: "idle" | "correct" | "incorrect" | "revealed";
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.optionCard,
        state === "correct" && styles.optionCardCorrect,
        state === "incorrect" && styles.optionCardIncorrect,
        state === "revealed" && styles.optionCardRevealed,
      ]}
      onPress={onPress}
      disabled={state !== "idle"}
    >
      <Text style={styles.optionPrimary}>{option.primary}</Text>
      {showRoman && option.secondary ? (
        <Text style={styles.optionSecondary}>{option.secondary}</Text>
      ) : null}
    </Pressable>
  );
}

export default function NumbersTrainerScreen() {
  const router = useRouter();
  const { playSentence } = useSentenceAudio();
  const [question, setQuestion] = useState<NumbersTrainerQuestion>(() =>
    createNumbersTrainerQuestion("read"),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const [showRoman, setShowRoman] = useState(true);

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
    if (optionId === question.correctOptionId) return "revealed" as const;
    if (optionId === selectedId && selectedId !== question.correctOptionId) {
      return "incorrect" as const;
    }
    if (optionId === selectedId && selectedId === question.correctOptionId) {
      return "correct" as const;
    }
    return "idle" as const;
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Numbers Trainer"
        onBack={() => router.back()}
        showBrandMark={false}
        onSettingsChange={handleSettingsChange}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <View style={styles.promptHeaderCopy}>
              <Text style={styles.promptEyebrow}>{question.eyebrow}</Text>
              <Text style={styles.promptTitle}>{question.promptTitle}</Text>
              <Text style={styles.promptHint}>{question.promptHint}</Text>
            </View>
            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => void playSentence(question.audioText, { speed: ttsSpeed })}
              activeOpacity={0.82}
            >
              <Ionicons name="volume-medium-outline" size={20} color={Sketch.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.promptDisplay}>
            <Text style={styles.promptPrimary}>{question.promptPrimary}</Text>
            {question.promptSecondary ? (
              <Text style={styles.promptSecondary}>{question.promptSecondary}</Text>
            ) : null}
            {question.promptTertiary ? (
              <Text style={styles.promptTertiary}>{question.promptTertiary}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.optionsGrid}>
          {question.options.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              showRoman={showRoman}
              state={optionState(option.id)}
              onPress={() => handleOptionPress(option.id)}
            />
          ))}
        </View>

        {!selectedId ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={loadQuestion}
            activeOpacity={0.84}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        ) : null}

        {result ? (
          <View
            style={[
              styles.feedbackCard,
              result === "correct" ? styles.feedbackCardCorrect : styles.feedbackCardIncorrect,
            ]}
          >
            <Text style={styles.feedbackTitle}>
              {result === "correct" ? "Correct" : "Not quite"}
            </Text>
            <Text style={styles.feedbackBody}>{question.feedback}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.nextButton, !result && styles.nextButtonDisabled]}
          onPress={loadQuestion}
          activeOpacity={0.84}
          disabled={!result}
        >
          <Text
            style={[styles.nextButtonText, !result && styles.nextButtonTextDisabled]}
          >
            Next
          </Text>
        </TouchableOpacity>
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
    gap: 16,
  },
  promptCard: {
    ...sketchCard,
    padding: 18,
    gap: 14,
  },
  promptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  promptHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  promptEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  promptTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  promptHint: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
  audioButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  promptDisplay: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paperDark,
  },
  promptPrimary: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -1,
  },
  promptSecondary: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: Sketch.accent,
  },
  promptTertiary: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    ...sketchCard,
    width: "47.8%",
    padding: 16,
    gap: 6,
    minHeight: 110,
    justifyContent: "center",
  },
  optionCardCorrect: {
    borderColor: Sketch.green,
  },
  optionCardIncorrect: {
    borderColor: Sketch.red,
  },
  optionCardRevealed: {
    borderColor: Sketch.green,
    backgroundColor: "#F7FBF7",
  },
  optionPrimary: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  optionSecondary: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkLight,
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.inkMuted,
  },
  feedbackCard: {
    ...sketchCard,
    padding: 16,
    gap: 4,
  },
  feedbackCardCorrect: {
    borderColor: Sketch.green,
  },
  feedbackCardIncorrect: {
    borderColor: Sketch.red,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.ink,
  },
  feedbackBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.inkLight,
  },
  nextButton: {
    backgroundColor: Sketch.accent,
    borderWidth: 1,
    borderColor: Sketch.accent,
    paddingVertical: 15,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: Sketch.paper,
    borderColor: Sketch.inkFaint,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nextButtonTextDisabled: {
    color: Sketch.inkMuted,
  },
});
