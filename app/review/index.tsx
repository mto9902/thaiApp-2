import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";
import { submitVocabAnswer } from "../../src/api/submitVocabAnswer";
import Header, { SettingsState } from "../../src/components/Header";
import { API_BASE } from "../../src/config";
import { isGuestUser } from "../../src/utils/auth";

const PREF_ROMANIZATION = "pref_show_romanization";

type ReviewCard = {
  thai: string;
  correct: string;
  choices: string[];
  state: string;
  counts: {
    newCount: number;
    learningCount: number;
    reviewCount: number;
  };
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
  accuracy: number;
  cardsPromoted: number;
  cardsMissed: number;
  avgResponseMs: number;
};

type AnswerResult = {
  promoted?: boolean;
  lapsed?: boolean;
  mastery: number;
  nextReviewDays: number;
  easeFactor: number;
  lapseCount?: number;
};

function formatInterval(days: number): string {
  if (days <= 0) return "< 1m";
  const totalMins = Math.round(days * 1440);
  if (totalMins < 1) return "< 1m";
  if (totalMins < 60) return `${totalMins}m`;
  if (totalMins < 1440) {
    const hrs = Math.round(totalMins / 60);
    return `${hrs}h`;
  }
  if (days < 30) {
    const d = Math.round(days);
    return d === 1 ? "1d" : `${d}d`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "1mo" : `${months}mo`;
  }
  const years = Math.round((days / 365) * 10) / 10;
  return years === 1 ? "1y" : `${years}y`;
}

function formatStateLabel(state: string): string {
  if (state === "relearning") return "Relearning";
  if (state === "review") return "Review";
  if (state === "learning") return "Learning";
  return "New";
}

const TTS_RATE: Record<string, number> = { slow: 0.7, normal: 1.0, fast: 1.3 };

function QueuePill({
  label,
  count,
  active,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
}) {
  return (
    <View
      style={[
        styles.queuePill,
        active && styles.queuePillActive,
        { borderColor: active ? color : Sketch.inkFaint },
      ]}
    >
      <Text style={[styles.queueCount, { color }]}>{count}</Text>
      <Text style={styles.queueLabel}>{label}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<ReviewCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [feedbackType, setFeedbackType] = useState<
    "promoted" | "lapsed" | null
  >(null);
  const [streak, setStreak] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [waitingMs, setWaitingMs] = useState(0);

  const revealAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionAnsweredRef = useRef(false);

  const [showRoman, setShowRoman] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [autoplayTTS, setAutoplayTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");

  function speak(text: string) {
    Speech.stop();
    Speech.speak(text, { language: "th-TH", rate: TTS_RATE[ttsSpeed] || 0.7 });
  }

  function handleSettingsChange(s: SettingsState) {
    setShowRoman(s.showRoman);
    setShowEnglish(s.showEnglish);
    setAutoplayTTS(s.autoplayTTS);
    setTtsSpeed(s.ttsSpeed);
  }

  const loadCard = useCallback(async () => {
    try {
      if (waitTimerRef.current) {
        clearTimeout(waitTimerRef.current);
        waitTimerRef.current = null;
      }

      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE}/vocab/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.done) {
        setWaitingMs(0);
        setSummary(sessionAnsweredRef.current ? data.summary : null);
        setCard(null);
        return;
      }

      if (data.waiting) {
        const nextDue = new Date(data.nextDueAt).getTime();
        const waitMs = Math.max(nextDue - Date.now(), 1000);
        setCard(null);
        setWaitingMs(waitMs);
        waitTimerRef.current = setTimeout(() => {
          setWaitingMs(0);
          loadCard();
        }, Math.min(waitMs, 60000));
        return;
      }

      setWaitingMs(0);
      const normalized: ReviewCard = {
        ...data,
        romanization: data.romanization ?? data.roman ?? "",
      };

      setCard(normalized);
      setRevealed(false);
      setFeedbackType(null);
      revealAnim.setValue(0);
    } catch (err) {
      console.error("[Review] loadCard failed:", err);
    }
  }, [revealAnim]);

  const init = useCallback(async () => {
    const guest = await isGuestUser();
    setIsGuest(guest);
    if (!guest) await loadCard();
    setLoading(false);
  }, [loadCard]);

  useEffect(() => {
    init();
    return () => {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    };
  }, [init]);

  async function toggleRomanization() {
    const next = !showRoman;
    setShowRoman(next);
    await AsyncStorage.setItem(PREF_ROMANIZATION, String(next));
  }

  function handleReveal() {
    setRevealed(true);
    if (card && autoplayTTS) {
      speak(card.thai);
    }
    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }

  async function handleRate(grade: "again" | "hard" | "good" | "easy") {
    if (!card) return;

    const correct = grade !== "again";
    sessionAnsweredRef.current = true;

    const result: AnswerResult = await submitVocabAnswer(card.thai, grade);
    setFeedbackType(
      result.promoted ? "promoted" : result.lapsed ? "lapsed" : null,
    );

    if (correct) {
      setStreak((value) => value + 1);
    } else {
      setStreak(0);
    }

    feedbackAnim.setValue(1);
    Animated.timing(feedbackAnim, {
      toValue: 0,
      duration: 600,
      delay: 400,
      useNativeDriver: true,
    }).start(() => loadCard());
  }

  if (isGuest) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={styles.stateWrap}>
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={28}
                color={Sketch.inkMuted}
              />
            </View>
            <Text style={styles.stateTitle}>Log in to review</Text>
            <Text style={styles.stateSubtitle}>
              Vocabulary review uses spaced repetition, so it needs an account
              to remember your deck state.
            </Text>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.primaryCtaText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color={Sketch.inkMuted} />
        </View>
      </SafeAreaView>
    );
  }

  if (summary) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={styles.stateWrap}>
          <View style={styles.summaryCard}>
            <Text style={styles.sectionEyebrow}>Session Complete</Text>
            <Text style={styles.summaryTitle}>You cleared today&apos;s queue.</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNum}>{summary.cardsReviewed}</Text>
                <Text style={styles.summaryLabel}>Cards</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNum}>{summary.accuracy}%</Text>
                <Text style={styles.summaryLabel}>Accuracy</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: Sketch.green }]}>
                  {summary.cardsPromoted}
                </Text>
                <Text style={styles.summaryLabel}>Promoted</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: Sketch.red }]}>
                  {summary.cardsMissed}
                </Text>
                <Text style={styles.summaryLabel}>Missed</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryCtaText}>Back to home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!card && waitingMs > 0) {
    const waitSecs = Math.ceil(waitingMs / 1000);
    const waitDisplay =
      waitSecs >= 60 ? `${Math.ceil(waitSecs / 60)} min` : `${waitSecs}s`;

    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={styles.stateWrap}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Next card on deck</Text>
            <Text style={styles.stateSubtitle}>
              A learning card will be ready in about {waitDisplay}.
            </Text>
            <ActivityIndicator
              size="small"
              color={Sketch.inkMuted}
              style={{ marginTop: 6 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={styles.stateWrap}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No cards to review right now</Text>
            <Text style={styles.stateSubtitle}>
              You&apos;re caught up for the moment.
            </Text>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryCtaText}>Back to home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { newCount = 0, learningCount = 0, reviewCount = 0 } = card.counts ?? {};
  const currentState = card.state ?? "new";

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header
        title="Review"
        onBack={() => router.back()}
        showClose
        onSettingsChange={handleSettingsChange}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.queueRow}>
          <QueuePill
            label="New"
            count={newCount}
            active={currentState === "new"}
            color={Sketch.blue}
          />
          <QueuePill
            label="Learning"
            count={learningCount}
            active={
              currentState === "learning" || currentState === "relearning"
            }
            color={Sketch.orange}
          />
          <QueuePill
            label="Review"
            count={reviewCount}
            active={currentState === "review"}
            color={Sketch.green}
          />
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlPill} onPress={toggleRomanization}>
            <Ionicons
              name={showRoman ? "eye-outline" : "eye-off-outline"}
              size={16}
              color={Sketch.inkLight}
            />
            <Text style={styles.controlPillText}>
              {showRoman ? "Hide romanization" : "Show romanization"}
            </Text>
          </TouchableOpacity>
          {streak > 2 ? (
            <View style={[styles.controlPill, styles.streakPill]}>
              <Ionicons name="flame-outline" size={16} color={Sketch.orange} />
              <Text style={styles.controlPillText}>{streak} streak</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.flashcard}
          onPress={!revealed ? handleReveal : undefined}
          activeOpacity={revealed ? 1 : 0.9}
        >
          <View style={styles.flashcardTop}>
            <View style={styles.stateBadge}>
              <Text style={styles.stateBadgeText}>
                {formatStateLabel(currentState)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.speakerBtn}
              onPress={() => speak(card.thai)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="volume-medium-outline"
                size={18}
                color={Sketch.ink}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.thaiText}>{card.thai}</Text>

          {showRoman && card.romanization ? (
            <Text style={styles.romanText}>{card.romanization}</Text>
          ) : null}

          {!revealed ? (
            <Text style={styles.tapHint}>
              {autoplayTTS ? "Tap to reveal and play audio" : "Tap to reveal"}
            </Text>
          ) : (
            <Animated.View style={[styles.answerArea, { opacity: revealAnim }]}>
              <View style={styles.divider} />
              {showEnglish ? (
                <Text style={styles.englishText}>{card.correct}</Text>
              ) : (
                <Text style={styles.hiddenAnswerText}>English hidden</Text>
              )}
            </Animated.View>
          )}

          {feedbackType ? (
            <Animated.View
              style={[styles.feedbackOverlay, { opacity: feedbackAnim }]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color:
                      feedbackType === "promoted" ? Sketch.green : Sketch.red,
                  },
                ]}
              >
                {feedbackType === "promoted" ? "Promoted" : "Lapsed"}
              </Text>
            </Animated.View>
          ) : null}
        </TouchableOpacity>

        {revealed ? (
          <View style={styles.ratingGrid}>
            {[
              {
                grade: "again" as const,
                label: "Again",
                color: Sketch.red,
                interval: formatInterval(card.intervalPreviews?.again ?? 0),
              },
              {
                grade: "hard" as const,
                label: "Hard",
                color: Sketch.orange,
                interval: formatInterval(card.intervalPreviews?.hard ?? 0),
              },
              {
                grade: "good" as const,
                label: "Good",
                color: Sketch.green,
                interval: formatInterval(card.intervalPreviews?.good ?? 0),
              },
              {
                grade: "easy" as const,
                label: "Easy",
                color: Sketch.blue,
                interval: formatInterval(card.intervalPreviews?.easy ?? 0),
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.grade}
                style={[styles.rateBtn, { backgroundColor: item.color }]}
                onPress={() => handleRate(item.grade)}
                activeOpacity={0.85}
              >
                <Text style={styles.rateBtnLabel}>{item.label}</Text>
                <Text style={styles.rateBtnInterval}>{item.interval}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  stateCard: {
    width: "100%",
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
  },
  stateSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Sketch.inkMuted,
    lineHeight: 20,
    textAlign: "center",
  },
  primaryCta: {
    marginTop: 6,
    backgroundColor: Sketch.orange,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryCtaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryCard: {
    width: "100%",
    backgroundColor: Sketch.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 24,
    gap: 14,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Sketch.ink,
    lineHeight: 28,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryItem: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 14,
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 4,
  },
  queueRow: {
    flexDirection: "row",
    gap: 10,
  },
  queuePill: {
    flex: 1,
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  queuePillActive: {
    backgroundColor: Sketch.cardBg,
  },
  queueCount: {
    fontSize: 22,
    fontWeight: "700",
  },
  queueLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 2,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  controlPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Sketch.paperDark,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  streakPill: {
    backgroundColor: Sketch.orange + "12",
    borderColor: Sketch.orange + "33",
  },
  controlPillText: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkLight,
  },
  flashcard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 22,
    minHeight: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  flashcardTop: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stateBadge: {
    backgroundColor: Sketch.paperDark,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  stateBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Sketch.inkMuted,
    letterSpacing: 0.5,
  },
  speakerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.paperDark,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
  },
  thaiText: {
    fontSize: 44,
    fontWeight: "700",
    color: Sketch.ink,
    textAlign: "center",
    lineHeight: 54,
  },
  romanText: {
    fontSize: 15,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.3,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: "600",
    color: Sketch.inkMuted,
    textAlign: "center",
    marginTop: 18,
  },
  answerArea: {
    width: "100%",
    alignItems: "center",
    marginTop: 18,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: Sketch.inkFaint,
    marginBottom: 18,
  },
  englishText: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    color: Sketch.ink,
    lineHeight: 32,
  },
  hiddenAnswerText: {
    fontSize: 13,
    fontWeight: "500",
    color: Sketch.inkMuted,
  },
  feedbackOverlay: {
    position: "absolute",
    bottom: 18,
    right: 18,
    backgroundColor: Sketch.paperDark,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: "700",
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  rateBtn: {
    width: "48%",
    flexGrow: 1,
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  rateBtnLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  rateBtnInterval: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
});
