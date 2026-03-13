import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch, sketchShadow } from "@/constants/theme";
import { submitVocabAnswer } from "../../src/api/submitVocabAnswer";
import Header, { SettingsState } from "../../src/components/Header";
import { API_BASE } from "../../src/config";
import { isGuestUser } from "../../src/utils/auth";

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
  const years = Math.round(days / 365 * 10) / 10;
  return years === 1 ? "1y" : `${years}y`;
}

const TTS_RATE: Record<string, number> = { slow: 0.7, normal: 1.0, fast: 1.3 };

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
  const [ttsSpeed, setTtsSpeed] = useState<"slow" | "normal" | "fast">("slow");

  function speak(text: string) {
    Speech.stop();
    Speech.speak(text, { language: "th-TH", rate: TTS_RATE[ttsSpeed] || 0.7 });
  }

  function handleSettingsChange(s: SettingsState) {
    setShowRoman(s.showRoman);
    setShowEnglish(s.showEnglish);
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
        // Learning cards pending — poll until next is due
        const nextDue = new Date(data.nextDueAt).getTime();
        const waitMs = Math.max(nextDue - Date.now(), 1000);
        setCard(null);
        setWaitingMs(waitMs);
        waitTimerRef.current = setTimeout(() => {
          setWaitingMs(0);
          loadCard();
        }, Math.min(waitMs, 60000)); // poll at most every 60s
        return;
      }

      setWaitingMs(0);
      const normalized: ReviewCard = {
        ...data,
        romanization: data.romanization ?? (data as any).roman ?? "",
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

  function handleReveal() {
    setRevealed(true);
    if (card) speak(card.thai);
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
      setStreak((s) => s + 1);
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
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={st.guestWrap}>
          <View style={st.guestIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={44}
              color={Sketch.inkFaint}
            />
          </View>
          <Text style={st.guestTitle}>LOG IN TO REVIEW</Text>
          <Text style={st.guestSub}>
            Vocabulary review uses spaced repetition which requires an account
            to track your progress.
          </Text>
          <TouchableOpacity
            style={st.guestBtn}
            onPress={() => router.push("/login")}
          >
            <Text style={st.guestBtnText}>LOG IN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={st.center}>
          <ActivityIndicator size="large" color={Sketch.ink} />
        </View>
      </SafeAreaView>
    );
  }

  if (summary) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={st.center}>
          <View style={st.summaryCard}>
            <Text style={st.summaryEmoji}>🎉</Text>
            <Text style={st.summaryTitle}>SESSION COMPLETE</Text>
            <View style={st.summaryGrid}>
              <View style={st.summaryItem}>
                <Text style={st.summaryNum}>{summary.cardsReviewed}</Text>
                <Text style={st.summaryLabel}>CARDS</Text>
              </View>
              <View style={st.summaryItem}>
                <Text style={st.summaryNum}>{summary.accuracy}%</Text>
                <Text style={st.summaryLabel}>ACCURACY</Text>
              </View>
              <View style={st.summaryItem}>
                <Text style={[st.summaryNum, { color: Sketch.green }]}>
                  {summary.cardsPromoted}
                </Text>
                <Text style={st.summaryLabel}>PROMOTED</Text>
              </View>
              <View style={st.summaryItem}>
                <Text style={[st.summaryNum, { color: Sketch.red }]}>
                  {summary.cardsMissed}
                </Text>
                <Text style={st.summaryLabel}>MISSED</Text>
              </View>
            </View>
            <TouchableOpacity style={st.homeBtn} onPress={() => router.back()}>
              <Text style={st.homeBtnText}>BACK TO HOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!card && waitingMs > 0) {
    const waitSecs = Math.ceil(waitingMs / 1000);
    const waitDisplay =
      waitSecs >= 60
        ? `${Math.ceil(waitSecs / 60)} min`
        : `${waitSecs}s`;
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={st.center}>
          <Text style={st.emptyText}>
            Next card ready in ~{waitDisplay}
          </Text>
          <ActivityIndicator
            size="small"
            color={Sketch.inkMuted}
            style={{ marginBottom: 16 }}
          />
          <TouchableOpacity style={st.homeBtn} onPress={() => router.back()}>
            <Text style={st.homeBtnText}>BACK TO HOME</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header
          title="Review"
          onBack={() => router.back()}
          onSettingsChange={handleSettingsChange}
        />
        <View style={st.center}>
          <Text style={st.emptyText}>No cards to review right now!</Text>
          <TouchableOpacity style={st.homeBtn} onPress={() => router.back()}>
            <Text style={st.homeBtnText}>BACK TO HOME</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { newCount = 0, learningCount = 0, reviewCount = 0 } = card.counts ?? {};
  const currentState = card.state ?? "new";

  return (
    <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
      <Header
        title="Review"
        onBack={() => router.back()}
        showClose
        onSettingsChange={handleSettingsChange}
      />

      <View style={st.countsWrap}>
        <View style={st.countsRow}>
          <Text
            style={[
              st.countNum,
              { color: Sketch.blue },
              currentState === "new" && st.countActive,
            ]}
          >
            {newCount}
          </Text>
          <Text style={st.countPlus}>+</Text>
          <Text
            style={[
              st.countNum,
              { color: Sketch.orange },
              (currentState === "learning" || currentState === "relearning") &&
                st.countActive,
            ]}
          >
            {learningCount}
          </Text>
          <Text style={st.countPlus}>+</Text>
          <Text
            style={[
              st.countNum,
              { color: Sketch.green },
              currentState === "review" && st.countActive,
            ]}
          >
            {reviewCount}
          </Text>
        </View>
        {streak > 2 && <Text style={st.streakText}>🔥 {streak}</Text>}
      </View>

      <View style={st.cardArea}>
        <TouchableOpacity
          style={st.flashcard}
          onPress={!revealed ? handleReveal : undefined}
          activeOpacity={revealed ? 1 : 0.8}
        >
          <Text style={st.thaiText}>{card.thai}</Text>

          {showRoman && card.romanization ? (
            <Text style={st.romanText}>{card.romanization}</Text>
          ) : null}

          <TouchableOpacity
            style={st.speakerBtn}
            onPress={() => speak(card.thai)}
          >
            <Ionicons name="volume-high" size={24} color={Sketch.ink} />
          </TouchableOpacity>

          {!revealed ? (
            <Text style={st.tapHint}>TAP TO REVEAL</Text>
          ) : (
            <Animated.View style={[st.answerArea, { opacity: revealAnim }]}>
              <View style={st.divider} />
              {showEnglish ? (
                <Text style={st.englishText}>{card.correct}</Text>
              ) : (
                <Text style={st.hiddenAnswerText}>ENGLISH HIDDEN</Text>
              )}
            </Animated.View>
          )}

          {feedbackType && (
            <Animated.View
              style={[st.feedbackOverlay, { opacity: feedbackAnim }]}
            >
              <Text
                style={[
                  st.feedbackText,
                  {
                    color:
                      feedbackType === "promoted" ? Sketch.green : Sketch.red,
                  },
                ]}
              >
                {feedbackType === "promoted" ? "PROMOTED ↑" : "LAPSED ↓"}
              </Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      <View style={st.toggleRow}>
        <TouchableOpacity
          onPress={() => setShowRoman((v) => !v)}
          style={st.toggleBtn}
        >
          <Text style={st.toggleBtnText}>
            {showRoman ? "Hide Romanization" : "Show Romanization"}
          </Text>
        </TouchableOpacity>
      </View>

      {revealed && (
        <View style={st.ratingArea}>
          {[
            {
              grade: "again" as const,
              label: "AGAIN",
              color: Sketch.red,
              interval: formatInterval(card.intervalPreviews?.again ?? 0),
            },
            {
              grade: "hard" as const,
              label: "HARD",
              color: Sketch.orange,
              interval: formatInterval(card.intervalPreviews?.hard ?? 0),
            },
            {
              grade: "good" as const,
              label: "GOOD",
              color: Sketch.green,
              interval: formatInterval(card.intervalPreviews?.good ?? 0),
            },
            {
              grade: "easy" as const,
              label: "EASY",
              color: Sketch.blue,
              interval: formatInterval(card.intervalPreviews?.easy ?? 0),
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.grade}
              style={[st.rateBtn, { backgroundColor: item.color }]}
              onPress={() => handleRate(item.grade)}
            >
              <Text style={st.rateBtnLabel}>{item.label}</Text>
              <Text style={st.rateBtnInterval}>{item.interval}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  countsWrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  countNum: {
    fontSize: 16,
    fontWeight: "900",
    opacity: 0.5,
  },
  countActive: {
    opacity: 1,
    fontSize: 20,
    textDecorationLine: "underline",
  },
  countPlus: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.inkFaint,
  },
  streakText: { fontSize: 12, fontWeight: "900", color: Sketch.orange },

  cardArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  flashcard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 18,
    padding: 40,
    width: "100%",
    alignItems: "center",
    ...sketchShadow(6),
  },
  thaiText: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    color: Sketch.ink,
  },
  romanText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: Sketch.inkMuted,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  speakerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Sketch.ink,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: Sketch.cardBg,
    ...sketchShadow(2),
  },
  tapHint: {
    fontSize: 13,
    fontWeight: "900",
    color: Sketch.inkFaint,
    letterSpacing: 2,
    marginTop: 10,
  },
  answerArea: { alignItems: "center", width: "100%" },
  divider: {
    height: 2,
    backgroundColor: Sketch.inkFaint,
    width: "100%",
    marginVertical: 15,
  },
  englishText: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    color: Sketch.ink,
  },
  hiddenAnswerText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: Sketch.inkMuted,
  },

  feedbackOverlay: { position: "absolute", top: 10, right: 15 },
  feedbackText: { fontSize: 14, fontWeight: "900", letterSpacing: 1 },

  toggleRow: {
    paddingHorizontal: 20,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 10,
    backgroundColor: Sketch.cardBg,
    ...sketchShadow(2),
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: Sketch.ink,
  },

  ratingArea: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  rateBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    ...sketchShadow(3),
  },
  rateBtnLabel: { fontSize: 12, fontWeight: "900", color: "white" },
  rateBtnInterval: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  summaryCard: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 18,
    padding: 30,
    width: "100%",
    alignItems: "center",
    ...sketchShadow(6),
  },
  summaryEmoji: { fontSize: 48, marginBottom: 10 },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 20,
    color: Sketch.ink,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 25,
  },
  summaryItem: {
    alignItems: "center",
    minWidth: 75,
    backgroundColor: Sketch.paperDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Sketch.ink,
  },
  summaryNum: { fontSize: 22, fontWeight: "900", color: Sketch.ink },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    marginTop: 2,
  },

  homeBtn: {
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    ...sketchShadow(4),
  },
  homeBtnText: { fontSize: 15, fontWeight: "900", color: Sketch.cardBg },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: Sketch.inkMuted,
    marginBottom: 20,
  },

  guestWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 12,
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Sketch.paperDark,
    borderWidth: 2,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  guestTitle: { fontSize: 18, fontWeight: "900", color: Sketch.ink },
  guestSub: {
    fontSize: 14,
    fontWeight: "500",
    color: Sketch.inkMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  guestBtn: {
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    ...sketchShadow(3),
  },
  guestBtnText: { fontSize: 14, fontWeight: "900", color: Sketch.cardBg },
});
