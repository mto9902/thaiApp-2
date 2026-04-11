import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { submitVocabAnswer } from "@/src/api/submitVocabAnswer";
import AccentSwitch from "@/src/components/AccentSwitch";
import VocabSrsInfoSheet from "@/src/components/VocabSrsInfoSheet";
import {
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED as WEB_LIGHT_BUTTON_PRESSED_SHADOW,
  WEB_LIGHT_BUTTON_SHADOW as WEB_LIGHT_BUTTON_SHADOW,
} from "@/src/components/web/designSystem";
import { API_BASE } from "@/src/config";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import {
  BRAND,
  CARD_SHADOW,
  LIGHT_BUTTON_PRESSED,
  SettledPressable,
  SurfaceButton,
  SURFACE_PRESSED,
  SURFACE_SHADOW,
} from "@/src/screens/mobile/dashboardSurface";
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

function ReviewIconButton({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <SettledPressable
      onPress={onPress}
      style={({ pressed }: any) => [
        styles.iconButton,
        pressed ? styles.iconButtonPressed : null,
        pressed && Platform.OS === "web" ? styles.iconButtonPressedWeb : null,
      ]}
    >
      <Ionicons name={icon} size={20} color={BRAND.ink} />
    </SettledPressable>
  );
}

export default function ReviewMobileScreen() {
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

  const speak = useCallback(
    (text: string) => {
      void playSentence(text, { speed: ttsSpeed });
    },
    [playSentence, ttsSpeed],
  );

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
      console.error("[ReviewMobile] loadCard failed:", err);
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
        if (active) setNextGrammarPoint(null);
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

  const handleRate = useCallback(
    async (grade: "again" | "hard" | "good" | "easy") => {
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
        console.error("[ReviewMobile] submit failed:", err);
        await loadCard();
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyReviewPayload, card, isSubmitting, loadCard, stopSentenceAudio],
  );

  const handleReveal = useCallback(() => {
    setRevealed(true);
    if (card && autoplayTTS) {
      speak(card.thai);
    }
    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [autoplayTTS, card, revealAnim, speak]);

  const counts = card?.counts ?? waitingPayload?.counts ?? {
    newCount: 0,
    learningCount: 0,
    reviewCount: 0,
  };
  const currentState = card?.state ?? "new";
  const nextGrammarRoute = nextGrammarPoint
    ? `/grammar-lesson/${nextGrammarPoint.id}`
    : "/progress";

  const ratingOptions = useMemo(
    () => [
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
    ],
    [card?.intervalPreviews],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <ReviewIconButton icon="close" onPress={() => router.back()} />
            <View style={styles.topBarSpacer} />
            <ReviewIconButton
              icon="settings-outline"
              onPress={() => router.push("/settings" as any)}
            />
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Review</Text>
            <Text style={styles.heroSubtitle}>
              Review vocabulary and keep your memory strong with spaced repetition.
            </Text>
          </View>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator size="large" color={BRAND.inkSoft} />
              <Text style={styles.stateBody}>Loading your review deck...</Text>
            </View>
          ) : isGuest ? (
            <View style={styles.card}>
              <View style={styles.stateIconWrap}>
                <Ionicons name="lock-closed-outline" size={26} color={BRAND.inkSoft} />
              </View>
              <Text style={styles.sectionHeading}>Log in to review</Text>
              <Text style={styles.stateBody}>
                Vocabulary review uses spaced repetition, so it needs an account to remember your learning state.
              </Text>
              <SurfaceButton
                label="Log in"
                variant="primary"
                onPress={() => router.push("/login" as any)}
              />
            </View>
          ) : summary ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Session complete</Text>
              <Text style={styles.sectionHeading}>You cleared the current vocabulary queue.</Text>
              <View style={styles.summaryGrid}>
                {[
                  { label: "Cards reviewed", value: summary.cardsReviewed },
                  { label: "Accuracy", value: `${summary.accuracy}%` },
                  { label: "Promoted", value: summary.cardsPromoted },
                ].map((item) => (
                  <View key={item.label} style={styles.summaryStatCard}>
                    <Text style={styles.summaryStatValue}>{item.value}</Text>
                    <Text style={styles.summaryStatLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <SurfaceButton
                label="Continue learning grammar"
                variant="primary"
                onPress={() => router.push(nextGrammarRoute as any)}
              />
              <SurfaceButton
                label="Back home"
                onPress={() => router.replace("/(tabs)" as any)}
              />
            </View>
          ) : !card && waitingPayload ? (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Next card on deck</Text>
              <Text style={styles.stateBody}>
                A learning card will be ready in about {timeUntil(waitingPayload.nextDueAt)}.
              </Text>
              <SurfaceButton
                label="Continue learning grammar"
                variant="primary"
                onPress={() => router.push(nextGrammarRoute as any)}
              />
            </View>
          ) : !card ? (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>You&apos;re caught up</Text>
              <Text style={styles.stateBody}>
                There are no review cards waiting for you right now.
              </Text>
              <SurfaceButton
                label="Continue learning grammar"
                variant="primary"
                onPress={() => router.push(nextGrammarRoute as any)}
              />
              <SurfaceButton
                label="Back home"
                onPress={() => router.replace("/(tabs)" as any)}
              />
            </View>
          ) : (
            <>
              <View style={styles.queueGrid}>
                {[
                  { label: "New", count: counts.newCount, color: MUTED_APP_ACCENTS.slate },
                  { label: "Learning", count: counts.learningCount, color: MUTED_APP_ACCENTS.clay },
                  { label: "Review", count: counts.reviewCount, color: MUTED_APP_ACCENTS.sage },
                ].map((item) => (
                  <View key={item.label} style={styles.queueCard}>
                    <Text style={[styles.queueValue, { color: item.color }]}>
                      {item.count}
                    </Text>
                    <Text style={styles.queueLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.stateText}>{formatStateLabel(currentState)}</Text>
                  <ReviewIconButton
                    icon="volume-medium-outline"
                    onPress={() => speak(card.thai)}
                  />
                </View>

                <SettledPressable
                  onPress={!revealed ? handleReveal : undefined}
                  style={({ pressed }: any) => [
                    styles.flashcard,
                    !revealed && pressed ? styles.flashcardPressed : null,
                  ]}
                >
                  <Text style={styles.thaiText}>{card.thai}</Text>
                  {showRoman && card.romanization ? (
                    <Text style={styles.romanText}>{card.romanization}</Text>
                  ) : null}
                  {!revealed ? (
                    <Text style={styles.revealHint}>
                      {autoplayTTS ? "Tap to reveal and play audio" : "Tap to reveal"}
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
                </SettledPressable>

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
                  <View style={styles.ratingSection}>
                    <Text style={styles.ratingHeading}>Choose how well you knew it</Text>
                    <View style={styles.ratingGrid}>
                      {ratingOptions.map((item) => (
                        <SettledPressable
                          key={item.grade}
                          disabled={isSubmitting}
                          onPress={() => void handleRate(item.grade)}
                          style={({ pressed }: any) => [
                            styles.ratingButton,
                            pressed ? styles.ratingButtonPressed : null,
                            pressed && Platform.OS === "web"
                              ? styles.ratingButtonPressedWeb
                              : null,
                            isSubmitting ? styles.buttonDisabled : null,
                          ]}
                        >
                          <Text style={[styles.ratingLabel, { color: item.color }]}>
                            {item.label}
                          </Text>
                          <Text style={[styles.ratingInterval, { color: item.color }]}>
                            {item.interval}
                          </Text>
                        </SettledPressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Display</Text>
                <Text style={styles.bodyText}>
                  Change how review cards are shown.
                </Text>
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
                        <SurfaceButton
                          key={speed}
                          label={speed.charAt(0).toUpperCase() + speed.slice(1)}
                          onPress={() => void updateSpeed(speed)}
                          style={styles.speedButton}
                          variant={ttsSpeed === speed ? "primary" : "secondary"}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <SurfaceButton
                  label="How SRS works"
                  onPress={() => setShowSrsInfo(true)}
                />
              </View>
            </>
          )}
        </ScrollView>

        <VocabSrsInfoSheet
          visible={showSrsInfo}
          onClose={() => setShowSrsInfo(false)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  topBarSpacer: {
    flex: 1,
  },
  hero: {
    gap: 4,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    ...CARD_SHADOW,
  },
  cardLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1,
    color: BRAND.muted,
    textTransform: "uppercase",
  },
  sectionHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.3,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.inkSoft,
  },
  stateBody: {
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.inkSoft,
    textAlign: "center",
  },
  stateIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    ...SURFACE_SHADOW,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stateText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: BRAND.muted,
    textTransform: "uppercase",
  },
  flashcard: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 22,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...SURFACE_SHADOW,
  },
  flashcardPressed: {
    ...SURFACE_PRESSED,
  },
  thaiText: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "800",
    color: BRAND.ink,
    textAlign: "center",
    letterSpacing: -0.8,
  },
  romanText: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
    textAlign: "center",
  },
  revealHint: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.muted,
    textAlign: "center",
  },
  answerArea: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  answerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: BRAND.line,
  },
  englishText: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700",
    color: BRAND.ink,
    textAlign: "center",
  },
  feedbackChip: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: BRAND.paper,
    ...SURFACE_SHADOW,
  },
  feedbackChipPromoted: {
    borderColor: MUTED_FEEDBACK_ACCENTS.successBorder,
  },
  feedbackChipLapsed: {
    borderColor: MUTED_FEEDBACK_ACCENTS.errorBorder,
  },
  feedbackChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  ratingSection: {
    gap: 10,
  },
  ratingHeading: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  ratingButton: {
    flexBasis: "48.2%",
    maxWidth: "48.2%",
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    ...SURFACE_SHADOW,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
          userSelect: "none",
          ...WEB_INTERACTIVE_TRANSITION,
        } as any)
      : null),
  },
  ratingButtonPressed: {
    ...LIGHT_BUTTON_PRESSED,
  },
  ratingButtonPressedWeb:
    Platform.OS === "web"
      ? ({
          transform: WEB_DEPRESSED_TRANSFORM as any,
          boxShadow: WEB_LIGHT_BUTTON_PRESSED_SHADOW as any,
        } as any)
      : null,
  ratingLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  ratingInterval: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  queueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  queueCard: {
    flex: 1,
    minWidth: 92,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    ...SURFACE_SHADOW,
  },
  queueValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  queueLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.muted,
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
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...SURFACE_SHADOW,
  },
  preferenceRowPressed: {
    ...SURFACE_PRESSED,
  },
  preferenceCopy: {
    flex: 1,
    gap: 2,
  },
  preferenceLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
  },
  preferenceHint: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
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
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryStatCard: {
    flex: 1,
    minWidth: 96,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  summaryStatValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.6,
  },
  summaryStatLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.muted,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    ...SURFACE_SHADOW,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
          userSelect: "none",
          ...WEB_INTERACTIVE_TRANSITION,
        } as any)
      : null),
  },
  iconButtonPressed: {
    ...LIGHT_BUTTON_PRESSED,
  },
  iconButtonPressedWeb:
    Platform.OS === "web"
      ? ({
          transform: WEB_DEPRESSED_TRANSFORM as any,
          boxShadow: WEB_LIGHT_BUTTON_PRESSED_SHADOW as any,
        } as any)
      : null,
  buttonDisabled: {
    opacity: 0.48,
  },
});
