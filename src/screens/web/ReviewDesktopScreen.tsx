import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Sketch } from "@/constants/theme";
import { submitVocabAnswer } from "@/src/api/submitVocabAnswer";
import VocabSrsInfoSheet from "@/src/components/VocabSrsInfoSheet";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
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
        toolbar={
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => router.back()}
              activeOpacity={0.82}
            >
              <Ionicons name="arrow-back" size={18} color={Sketch.ink} />
              <Text style={styles.toolbarButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => router.push("/settings" as any)}
              activeOpacity={0.82}
            >
              <Ionicons name="settings-outline" size={18} color={Sketch.ink} />
              <Text style={styles.toolbarButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        }
      >
        {loading ? (
          <DesktopPanel style={styles.statePanel}>
            <ActivityIndicator size="large" color={Sketch.inkMuted} />
          </DesktopPanel>
        ) : isGuest ? (
          <DesktopPanel style={styles.statePanel}>
            <Text style={styles.stateTitle}>Log in to review</Text>
            <Text style={styles.stateBody}>
              Vocabulary review uses spaced repetition, so it needs an account to
              remember your learning state.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/login" as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Log in</Text>
            </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  router.push(
                    (nextGrammarPoint
                      ? `/practice/${nextGrammarPoint.id}`
                      : "/progress") as any,
                  )
                }
                activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Continue learning grammar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
                onPress={() => router.replace("/(tabs)" as any)}
                activeOpacity={0.82}
              >
                <Text style={styles.secondaryButtonText}>Back home</Text>
              </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push(
                  (nextGrammarPoint
                    ? `/practice/${nextGrammarPoint.id}`
                    : "/progress") as any,
                )
              }
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Continue learning grammar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace("/(tabs)" as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.secondaryButtonText}>Back home</Text>
            </TouchableOpacity>
          </DesktopPanel>
        ) : (
          <View style={styles.mainGrid}>
            <View style={styles.mainColumn}>
              <DesktopPanel>
                <DesktopSectionTitle
                  title="Review card"
                  caption="Reveal the meaning, hear the Thai, and rate how well you knew it."
                />
                <View style={styles.cardShell}>
                  <View style={styles.cardTop}>
                    <View style={styles.stateBadge}>
                      <Text style={styles.stateBadgeText}>
                        {formatStateLabel(currentState)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.speakerButton}
                      onPress={() => speak(card.thai)}
                      activeOpacity={0.82}
                    >
                      <Ionicons
                        name="volume-medium-outline"
                        size={18}
                        color={Sketch.ink}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.flashcard}
                    onPress={!revealed ? handleReveal : undefined}
                    activeOpacity={revealed ? 1 : 0.9}
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
                  </TouchableOpacity>

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
                          <TouchableOpacity
                            key={item.grade}
                            style={[styles.rateButton, { backgroundColor: item.color }]}
                            onPress={() => void handleRate(item.grade)}
                            activeOpacity={0.82}
                            disabled={isSubmitting}
                          >
                            <Text style={styles.rateLabel}>{item.label}</Text>
                            <Text style={styles.rateInterval}>{item.interval}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              </DesktopPanel>
            </View>

            <View style={styles.sideColumn}>
              <DesktopPanel>
                <DesktopSectionTitle
                  title="Queue"
                  caption="See how many new, learning, and review cards are waiting."
                />
                <View style={styles.queueStack}>
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
              </DesktopPanel>

              <DesktopPanel>
                <DesktopSectionTitle
                  title="Display"
                  caption="See the review settings that affect how cards are shown."
                />
                <View style={styles.preferenceList}>
                  <Text style={styles.preferenceItem}>Romanization: {showRoman ? "On" : "Off"}</Text>
                  <Text style={styles.preferenceItem}>English: {showEnglish ? "On" : "Off"}</Text>
                  <Text style={styles.preferenceItem}>Autoplay audio: {autoplayTTS ? "On" : "Off"}</Text>
                  <Text style={styles.preferenceItem}>Speech speed: {ttsSpeed}</Text>
                </View>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push("/settings" as any)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.secondaryButtonText}>Open settings</Text>
                </TouchableOpacity>
              </DesktopPanel>

              <DesktopPanel>
                <DesktopSectionTitle
                  title="SRS"
                  caption="See how spaced repetition schedules your next review."
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowSrsInfo(true)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.secondaryButtonText}>How SRS works</Text>
                </TouchableOpacity>
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
  toolbar: {
    flexDirection: "row",
    gap: 10,
  },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  statePanel: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  stateBody: {
    maxWidth: 520,
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  mainGrid: {
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },
  mainColumn: {
    flex: 1.2,
    gap: 20,
  },
  sideColumn: {
    width: 320,
    gap: 20,
  },
  cardShell: {
    gap: 18,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  stateBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: Sketch.inkMuted,
  },
  speakerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  flashcard: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  thaiText: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  romanText: {
    fontSize: 16,
    lineHeight: 24,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  revealHint: {
    fontSize: 13,
    color: Sketch.inkMuted,
    textAlign: "center",
  },
  answerArea: {
    width: "100%",
    alignItems: "center",
    gap: 18,
  },
  answerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: Sketch.inkFaint,
  },
  englishText: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "600",
    color: Sketch.ink,
    textAlign: "center",
  },
  feedbackChip: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  feedbackChipPromoted: {
    borderColor: MUTED_FEEDBACK_ACCENTS.successBorder,
    backgroundColor: MUTED_FEEDBACK_ACCENTS.successTint,
  },
  feedbackChipLapsed: {
    borderColor: MUTED_FEEDBACK_ACCENTS.errorBorder,
    backgroundColor: MUTED_FEEDBACK_ACCENTS.errorTint,
  },
  feedbackChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  inlineRatingSection: {
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  inlineRatingHeader: {
    gap: 4,
  },
  inlineRatingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Sketch.ink,
  },
  inlineRatingBody: {
    fontSize: 13,
    lineHeight: 20,
    color: Sketch.inkMuted,
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rateButton: {
    width: "48.9%",
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rateLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  rateInterval: {
    fontSize: 12,
    color: "rgba(255,255,255,0.86)",
  },
  queueStack: {
    gap: 12,
  },
  queueCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 16,
    gap: 4,
  },
  queueValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
  },
  queueLabel: {
    fontSize: 13,
    color: Sketch.inkMuted,
  },
  preferenceList: {
    gap: 8,
  },
  preferenceItem: {
    fontSize: 14,
    lineHeight: 22,
    color: Sketch.ink,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 6,
  },
  summaryValue: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
    color: Sketch.ink,
  },
  summaryLabel: {
    fontSize: 13,
    color: Sketch.inkMuted,
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
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
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
