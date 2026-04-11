import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppRadius, AppSketch } from "@/constants/theme-app";
import { submitVocabAnswer } from "@/src/api/submitVocabAnswer";
import AccentSwitch from "@/src/components/AccentSwitch";
import VocabSrsInfoSheet from "@/src/components/VocabSrsInfoSheet";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import {
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
} from "@/src/components/web/designSystem";
import { API_BASE } from "@/src/config";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getAllProgress, isGrammarPracticed } from "@/src/utils/grammarProgress";
import {
  MUTED_APP_ACCENTS,
  MUTED_FEEDBACK_ACCENTS,
} from "@/src/utils/toneAccent";

const PREF_ROMANIZATION = "pref_show_romanization";
const PREF_ENGLISH = "pref_show_english";
const PREF_AUTOPLAY_TTS = "pref_autoplay_tts";
const PREF_TTS_SPEED = "pref_tts_speed";

type ReviewCounts = {
  newCount: number;
  learningCount: number;
  reviewCount: number;
};

type ReviewCard = {
  thai: string;
  correct: string;
  choices: string[];
  state: string;
  counts: ReviewCounts;
  romanization?: string;
  intervalPreviews?: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
};

type SessionSummary = {
  cardsReviewed: number;
  totalSeen: number;
  accuracy: number;
  cardsPromoted: number;
  avgResponseMs: number;
};

type AnswerResult = {
  promoted?: boolean;
  lapsed?: boolean;
  next?: ReviewPayload;
};

type ReviewPayload =
  | ReviewCard
  | { done: true; summary?: SessionSummary; counts?: ReviewCounts }
  | { waiting: true; nextDueAt: string; counts?: ReviewCounts };

function formatInterval(days: number): string {
  if (days <= 0) return "< 1m";
  const totalMins = Math.round(days * 1440);
  if (totalMins < 1) return "< 1m";
  if (totalMins < 60) return `${totalMins}m`;
  if (totalMins < 1440) return `${Math.round(totalMins / 60)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round((days / 365) * 10) / 10}y`;
}

function formatStateLabel(state: string) {
  if (state === "relearning") return "Learning";
  if (state === "review") return "Review";
  if (state === "learning") return "Learning";
  return "New";
}

function timeUntil(nextDueAt: string) {
  const waitSecs = Math.ceil(
    Math.max(new Date(nextDueAt).getTime() - Date.now(), 1000) / 1000,
  );
  return waitSecs >= 60 ? `${Math.ceil(waitSecs / 60)} min` : `${waitSecs}s`;
}

function getInteractiveStateStyle(
  variant: "light" | "navy",
  hovered: boolean,
  pressed: boolean,
  disabled?: boolean,
) {
  if (disabled || (!hovered && !pressed)) return null;
  return [
    styles.webInteractivePressed,
    variant === "navy"
      ? styles.webNavyInteractivePressed
      : styles.webLightInteractivePressed,
  ];
}

export default function ReviewWebScreen() {
  const router = useRouter();
  const { grammarPoints } = useGrammarCatalog();
  const { playSentence, stopSentenceAudio } = useSentenceAudio();
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<ReviewCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [feedbackType, setFeedbackType] = useState<"promoted" | "lapsed" | null>(
    null,
  );
  const [isGuest, setIsGuest] = useState(false);
  const [waitingPayload, setWaitingPayload] = useState<{
    nextDueAt: string;
    counts?: ReviewCounts;
  } | null>(null);
  const [showRoman, setShowRoman] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSrsInfo, setShowSrsInfo] = useState(false);
  const [nextGrammarPoint, setNextGrammarPoint] = useState<{
    id: string;
    title: string;
    stage: string;
  } | null>(null);

  const revealAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadCardRef = useRef<(() => Promise<void>) | null>(null);
  const sessionAnsweredRef = useRef(false);

  const clearWaitTimer = useCallback(() => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  const loadPrefs = useCallback(async () => {
    const [roman, english, autoplay, speed] = await Promise.all([
      AsyncStorage.getItem(PREF_ROMANIZATION),
      AsyncStorage.getItem(PREF_ENGLISH),
      AsyncStorage.getItem(PREF_AUTOPLAY_TTS),
      AsyncStorage.getItem(PREF_TTS_SPEED),
    ]);
    setShowRoman(roman !== null ? roman === "true" : true);
    setShowEnglish(english !== null ? english === "true" : true);
    setAutoplayTTS(autoplay !== null ? autoplay === "true" : false);
    setTtsSpeed((speed as "slow" | "normal" | "fast") || "slow");
  }, []);

  function speak(text: string) {
    void playSentence(text, { speed: ttsSpeed });
  }

  const applyReviewPayload = useCallback(
    (data: ReviewPayload) => {
      clearWaitTimer();
      stopSentenceAudio();
      setFeedbackType(null);

      if ("done" in data && data.done) {
        setSummary(sessionAnsweredRef.current ? data.summary ?? null : null);
        setCard(null);
        setWaitingPayload(null);
        setRevealed(false);
        return;
      }

      if ("waiting" in data && data.waiting) {
        setSummary(null);
        setCard(null);
        setWaitingPayload({ nextDueAt: data.nextDueAt, counts: data.counts });
        setRevealed(false);
        const waitMs = Math.max(
          new Date(data.nextDueAt).getTime() - Date.now(),
          1000,
        );
        waitTimerRef.current = setTimeout(() => {
          void loadCardRef.current?.();
        }, Math.min(waitMs, 60000));
        return;
      }

      setSummary(null);
      setWaitingPayload(null);
      setCard({
        ...data,
        romanization: data.romanization ?? "",
      });
      setRevealed(false);
      revealAnim.setValue(0);
    },
    [clearWaitTimer, revealAnim, stopSentenceAudio],
  );

  const loadCard = useCallback(async () => {
    try {
      clearWaitTimer();
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/vocab/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ReviewPayload = await res.json();
      applyReviewPayload(data);
    } catch (err) {
      console.error("[ReviewWeb] loadCard failed:", err);
    } finally {
      setLoading(false);
    }
  }, [applyReviewPayload, clearWaitTimer]);

  useEffect(() => {
    loadCardRef.current = loadCard;
  }, [loadCard]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const allProgress = await getAllProgress();
        const nextPoint =
          grammarPoints.find((point) => !isGrammarPracticed(allProgress[point.id])) ??
          null;

        if (!active) return;

        setNextGrammarPoint(
          nextPoint
            ? {
                id: nextPoint.id,
                title: nextPoint.title,
                stage: nextPoint.stage,
              }
            : null,
        );
      } catch {
        if (active) {
          setNextGrammarPoint(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [grammarPoints]);

  useEffect(() => {
    void loadPrefs();
    (async () => {
      const guest = await isGuestUser();
      setIsGuest(guest);
      if (!guest) {
        await loadCard();
      } else {
        setLoading(false);
      }
    })();

    return () => {
      clearWaitTimer();
    };
  }, [clearWaitTimer, loadCard, loadPrefs]);

  useFocusEffect(
    useCallback(() => {
      void loadPrefs();
    }, [loadPrefs]),
  );

  const toggleRomanization = useCallback(async () => {
    const next = !showRoman;
    setShowRoman(next);
    await AsyncStorage.setItem(PREF_ROMANIZATION, String(next));
  }, [showRoman]);

  const toggleEnglish = useCallback(async () => {
    const next = !showEnglish;
    setShowEnglish(next);
    await AsyncStorage.setItem(PREF_ENGLISH, String(next));
  }, [showEnglish]);

  const toggleAutoplay = useCallback(async () => {
    const next = !autoplayTTS;
    setAutoplayTTS(next);
    await AsyncStorage.setItem(PREF_AUTOPLAY_TTS, String(next));
  }, [autoplayTTS]);

  const updateSpeed = useCallback(async (next: "slow" | "normal" | "fast") => {
    setTtsSpeed(next);
    await AsyncStorage.setItem(PREF_TTS_SPEED, next);
  }, []);

  async function handleRate(grade: "again" | "hard" | "good" | "easy") {
    if (!card || isSubmitting) return;
    sessionAnsweredRef.current = true;
    setIsSubmitting(true);
    stopSentenceAudio();

    try {
      const result: AnswerResult = await submitVocabAnswer(card.thai, grade);
      setFeedbackType(result.promoted ? "promoted" : result.lapsed ? "lapsed" : null);

      if (result.next) {
        applyReviewPayload(result.next);
      } else {
        await loadCard();
      }
    } catch (err) {
      console.error("[ReviewWeb] submit failed:", err);
      await loadCard();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReveal() {
    setRevealed(true);
    if (card && autoplayTTS) {
      speak(card.thai);
    }
    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }

  const counts = card?.counts ?? waitingPayload?.counts ?? {
    newCount: 0,
    learningCount: 0,
    reviewCount: 0,
  };
  const currentState = card?.state ?? "new";
  const ratingOptions = [
    {
      grade: "again" as const,
      label: "Again",
      color: MUTED_FEEDBACK_ACCENTS.error,
      interval: formatInterval(card?.intervalPreviews?.again ?? 0),
    },
    {
      grade: "hard" as const,
      label: "Hard",
      color: MUTED_APP_ACCENTS.clay,
      interval: formatInterval(card?.intervalPreviews?.hard ?? 0),
    },
    {
      grade: "good" as const,
      label: "Good",
      color: MUTED_FEEDBACK_ACCENTS.success,
      interval: formatInterval(card?.intervalPreviews?.good ?? 0),
    },
    {
      grade: "easy" as const,
      label: "Easy",
      color: MUTED_APP_ACCENTS.slate,
      interval: formatInterval(card?.intervalPreviews?.easy ?? 0),
    },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        scrollRef={scrollRef}
        eyebrow="Vocabulary"
        title="Review"
        subtitle="Review vocabulary, hear Thai audio, and keep your memory strong with spaced repetition."
      >
        {loading ? (
          <DesktopPanel style={styles.statePanel}>
            <ActivityIndicator size="large" color={AppSketch.inkMuted} />
          </DesktopPanel>
        ) : isGuest ? (
          <DesktopPanel style={styles.statePanel}>
            <Text style={styles.stateTitle}>Log in to review</Text>
            <Text style={styles.stateBody}>
              Vocabulary review uses spaced repetition, so it needs an account to
              remember your learning state.
            </Text>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.primaryButton,
                getInteractiveStateStyle("navy", hovered, pressed),
              ]}
              onPress={() => router.push("/login" as any)}
            >
              <Text style={styles.primaryButtonText}>Log in</Text>
            </Pressable>
          </DesktopPanel>
        ) : summary ? (
          <DesktopPanel>
            <DesktopSectionTitle
              title="Session complete"
              caption="You cleared the current vocabulary queue."
            />
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.cardsReviewed}</Text>
                <Text style={styles.summaryLabel}>Cards reviewed</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.accuracy}%</Text>
                <Text style={styles.summaryLabel}>Accuracy</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.cardsPromoted}</Text>
                <Text style={styles.summaryLabel}>Promoted</Text>
              </View>
            </View>
            <View style={styles.summaryActionRow}>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.primaryButton,
                  getInteractiveStateStyle("navy", hovered, pressed),
                ]}
                onPress={() =>
                  router.push(
                    (nextGrammarPoint
                      ? `/practice/${nextGrammarPoint.id}`
                      : "/progress") as any,
                  )
                }
              >
              <Text style={styles.primaryButtonText}>Continue learning grammar</Text>
            </Pressable>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.secondaryButton,
                getInteractiveStateStyle("light", hovered, pressed),
              ]}
              onPress={() => router.replace("/(tabs)" as any)}
            >
              <Text style={styles.secondaryButtonText}>Back home</Text>
            </Pressable>
            </View>
          </DesktopPanel>
        ) : !card && waitingPayload ? (
          <DesktopPanel style={styles.statePanel}>
            <Text style={styles.stateTitle}>Next card on deck</Text>
            <Text style={styles.stateBody}>
              A learning card will be ready in about {timeUntil(waitingPayload.nextDueAt)}.
            </Text>
          </DesktopPanel>
        ) : !card ? (
          <DesktopPanel style={styles.statePanel}>
            <Text style={styles.stateTitle}>You&apos;re caught up</Text>
            <Text style={styles.stateBody}>
              There are no review cards waiting for you right now.
            </Text>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.primaryButton,
                getInteractiveStateStyle("navy", hovered, pressed),
              ]}
              onPress={() =>
                router.push(
                  (nextGrammarPoint
                    ? `/practice/${nextGrammarPoint.id}`
                    : "/progress") as any,
                )
              }
            >
              <Text style={styles.primaryButtonText}>Continue learning grammar</Text>
            </Pressable>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.secondaryButton,
                getInteractiveStateStyle("light", hovered, pressed),
              ]}
              onPress={() => router.replace("/(tabs)" as any)}
            >
              <Text style={styles.secondaryButtonText}>Back home</Text>
            </Pressable>
          </DesktopPanel>
        ) : (
          <View style={styles.reviewStack}>
            <View style={styles.queueGrid}>
              {[
                { label: "New", count: counts.newCount, color: MUTED_APP_ACCENTS.slate },
                { label: "Learning", count: counts.learningCount, color: MUTED_APP_ACCENTS.clay },
                { label: "Review", count: counts.reviewCount, color: MUTED_APP_ACCENTS.sage },
              ].map((item) => (
                <View key={item.label} style={styles.queueCard}>
                  <Text style={[styles.queueValue, { color: item.color }]}>{item.count}</Text>
                  <Text style={styles.queueLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reviewGrid}>
              <DesktopPanel style={styles.reviewPanel}>
                <View style={styles.reviewPanelHeader}>
                  <DesktopSectionTitle
                    title="Review card"
                    caption="Reveal the meaning, hear the Thai, and rate how well you knew it."
                  />
                  <View style={styles.cardToolbar}>
                    <View style={styles.stateBadge}>
                      <Text style={styles.stateBadgeText}>
                        {formatStateLabel(currentState)}
                      </Text>
                    </View>
                    <Pressable
                      style={({ hovered, pressed }) => [
                        styles.speakerButton,
                        getInteractiveStateStyle("light", hovered, pressed),
                      ]}
                      onPress={() => speak(card.thai)}
                    >
                      <Ionicons
                        name="volume-medium-outline"
                        size={18}
                        color={AppSketch.ink}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.cardShell}>

                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.flashcard,
                      !revealed && getInteractiveStateStyle("light", hovered, pressed),
                    ]}
                    onPress={!revealed ? handleReveal : undefined}
                  >
                    <Text style={styles.thaiText}>{card.thai}</Text>
                    {showRoman && card.romanization ? (
                      <Text style={styles.romanText}>{card.romanization}</Text>
                    ) : null}
                    {!revealed ? (
                      <Text style={styles.revealHint}>
                        {autoplayTTS ? "Click to reveal and play audio" : "Click to reveal"}
                      </Text>
                    ) : (
                      <Animated.View style={[styles.answerArea, { opacity: revealAnim }]}>
                        <View style={styles.answerDivider} />
                        {showEnglish ? (
                          <Text style={styles.englishText}>{card.correct}</Text>
                        ) : (
                          <Text style={styles.revealHint}>English hidden</Text>
                        )}
                      </Animated.View>
                    )}
                  </Pressable>

                  {feedbackType ? (
                    <View
                      style={[
                        styles.feedbackChip,
                        feedbackType === "promoted"
                          ? styles.feedbackChipPromoted
                          : styles.feedbackChipLapsed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.feedbackChipText,
                          {
                            color:
                              feedbackType === "promoted"
                                ? MUTED_FEEDBACK_ACCENTS.success
                                : MUTED_FEEDBACK_ACCENTS.error,
                          },
                        ]}
                      >
                        {feedbackType === "promoted" ? "Promoted" : "Lapsed"}
                      </Text>
                    </View>
                  ) : null}

                  {revealed ? (
                    <View style={styles.inlineRatingSection}>
                      <View style={styles.inlineRatingHeader}>
                        <Text style={styles.inlineRatingTitle}>
                          Choose how well you knew it
                        </Text>
                        <Text style={styles.inlineRatingBody}>
                          Your choice sets when this word comes back.
                        </Text>
                      </View>
                      <View style={styles.ratingGrid}>
                        {ratingOptions.map((item) => (
                          <Pressable
                            key={item.grade}
                            style={({ hovered, pressed }) => [
                              styles.rateButton,
                              getInteractiveStateStyle(
                                "light",
                                hovered,
                                pressed,
                                isSubmitting,
                              ),
                            ]}
                            onPress={() => void handleRate(item.grade)}
                            disabled={isSubmitting}
                          >
                            <Text style={[styles.rateLabel, { color: item.color }]}>
                              {item.label}
                            </Text>
                            <Text style={[styles.rateInterval, { color: item.color }]}>
                              {item.interval}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              </DesktopPanel>

              <DesktopPanel style={styles.displayPanel}>
                <DesktopSectionTitle
                  title="Display"
                  caption="Change how review cards are shown."
                />
                <View style={styles.preferenceList}>
                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceCopy}>
                      <Text style={styles.preferenceLabel}>Romanization</Text>
                      <Text style={styles.preferenceHint}>Show phonetic reading under Thai.</Text>
                    </View>
                    <AccentSwitch value={showRoman} onValueChange={() => void toggleRomanization()} />
                  </View>

                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceCopy}>
                      <Text style={styles.preferenceLabel}>English</Text>
                      <Text style={styles.preferenceHint}>Keep the meaning visible after reveal.</Text>
                    </View>
                    <AccentSwitch value={showEnglish} onValueChange={() => void toggleEnglish()} />
                  </View>

                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceCopy}>
                      <Text style={styles.preferenceLabel}>Autoplay audio</Text>
                      <Text style={styles.preferenceHint}>Play Thai audio after you reveal a card.</Text>
                    </View>
                    <AccentSwitch value={autoplayTTS} onValueChange={() => void toggleAutoplay()} />
                  </View>

                  <View style={styles.speedSection}>
                    <Text style={styles.preferenceLabel}>Speech speed</Text>
                    <View style={styles.speedRow}>
                      {(["slow", "normal", "fast"] as const).map((speed) => (
                        <Pressable
                          key={speed}
                          style={({ hovered, pressed }) => [
                            ttsSpeed === speed ? styles.primaryButton : styles.secondaryButton,
                            styles.speedButton,
                            getInteractiveStateStyle(
                              ttsSpeed === speed ? "navy" : "light",
                              hovered,
                              pressed,
                            ),
                          ]}
                          onPress={() => void updateSpeed(speed)}
                        >
                          <Text
                            style={
                              ttsSpeed === speed
                                ? styles.primaryButtonText
                                : styles.secondaryButtonText
                            }
                          >
                            {speed.charAt(0).toUpperCase() + speed.slice(1)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.secondaryButton,
                    getInteractiveStateStyle("light", hovered, pressed),
                  ]}
                  onPress={() => setShowSrsInfo(true)}
                >
                  <Text style={styles.secondaryButtonText}>How SRS works</Text>
                </Pressable>
              </DesktopPanel>
            </View>
          </View>
        )}
      </DesktopPage>

      <VocabSrsInfoSheet
        visible={showSrsInfo}
        onClose={() => setShowSrsInfo(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  statePanel: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: AppSketch.ink,
    textAlign: "center",
  },
  stateBody: {
    maxWidth: 520,
    fontSize: 15,
    lineHeight: 24,
    color: AppSketch.inkMuted,
    textAlign: "center",
  },
  reviewStack: {
    gap: 16,
  },
  reviewGrid: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  reviewPanel: {
    flex: 1,
  },
  displayPanel: {
    width: 380,
    gap: 16,
  },
  reviewPanelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
  },
  cardToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardShell: {
    gap: 14,
  },
  stateBadge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  stateBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: AppSketch.inkMuted,
    textTransform: "uppercase",
  },
  speakerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.md,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  flashcard: {
    minHeight: 188,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: AppRadius.lg,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  thaiText: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "700",
    color: AppSketch.ink,
    textAlign: "center",
  },
  romanText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppSketch.inkMuted,
    textAlign: "center",
  },
  revealHint: {
    fontSize: 13,
    color: AppSketch.inkMuted,
    textAlign: "center",
  },
  answerArea: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  answerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: AppSketch.border,
  },
  englishText: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "600",
    color: AppSketch.ink,
    textAlign: "center",
  },
  feedbackChip: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    backgroundColor: AppSketch.surface,
  },
  feedbackChipPromoted: {
    borderColor: MUTED_FEEDBACK_ACCENTS.successBorder,
  },
  feedbackChipLapsed: {
    borderColor: MUTED_FEEDBACK_ACCENTS.errorBorder,
  },
  feedbackChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  inlineRatingSection: {
    gap: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppSketch.border,
  },
  inlineRatingHeader: {
    gap: 4,
  },
  inlineRatingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  inlineRatingBody: {
    fontSize: 13,
    lineHeight: 20,
    color: AppSketch.inkMuted,
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rateButton: {
    width: "48.9%",
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.md,
    backgroundColor: AppSketch.surface,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  rateInterval: {
    fontSize: 12,
  },
  queueGrid: {
    flexDirection: "row",
    gap: 10,
  },
  queueCard: {
    flex: 1,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 4,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  queueValue: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
  },
  queueLabel: {
    fontSize: 13,
    color: AppSketch.inkMuted,
  },
  preferenceList: {
    gap: 10,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: AppSketch.border,
    borderRadius: AppRadius.md,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
    paddingVertical: 12,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  preferenceCopy: {
    flex: 1,
    gap: 2,
  },
  preferenceLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  preferenceHint: {
    fontSize: 12,
    lineHeight: 18,
    color: AppSketch.inkMuted,
  },
  speedSection: {
    gap: 10,
  },
  speedRow: {
    flexDirection: "row",
    gap: 10,
  },
  speedButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: "#FAFAFA",
    padding: 18,
    gap: 6,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  summaryValue: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  summaryLabel: {
    fontSize: 13,
    color: AppSketch.inkMuted,
  },
  summaryActionRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.primary,
    backgroundColor: AppSketch.primary,
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppSketch.border,
    backgroundColor: AppSketch.surface,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppSketch.ink,
  },
  webInteractivePressed: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
  },
  webLightInteractivePressed: {
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  webNavyInteractivePressed: {
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
});
