import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { submitVocabAnswer } from "../../src/api/submitVocabAnswer";
import Header from "../../src/components/Header";
import { API_BASE } from "../../src/config";
import { isGuestUser } from "../../src/utils/auth";
import { Sketch, sketchShadow } from "@/constants/theme";

type ReviewCard = {
  thai: string;
  correct: string;
  choices: string[];
  progress: { totalCards: number; cardsRemaining: number; correctNeeded: number };
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
  if (days < 1) return "< 1 min";
  if (days === 1) return "1 day";
  if (days < 30) return `${Math.round(days)} days`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
}

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "th-TH", rate: 0.8 });
}

export default function ReviewScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<ReviewCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [feedbackType, setFeedbackType] = useState<"promoted" | "lapsed" | null>(null);
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [intervalPreviews, setIntervalPreviews] = useState<{
    again: string; hard: string; good: string; easy: string;
  }>({ again: "< 1 min", hard: "~1 day", good: "~3 days", easy: "~7 days" });

  const revealAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { init(); }, []);

  async function init() {
    const guest = await isGuestUser();
    setIsGuest(guest);
    if (!guest) await loadCard();
    setLoading(false);
  }

  async function loadCard() {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE}/vocab/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.done) { setSummary(data.summary); setCard(null); return; }
      setCard(data);
      setRevealed(false);
      setFeedback(null);
      setFeedbackType(null);
      revealAnim.setValue(0);
    } catch (err) {
      console.error("[Review] loadCard failed:", err);
    }
  }

  function handleReveal() {
    setRevealed(true);
    if (card) speak(card.thai);
    Animated.timing(revealAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }

  async function handleRate(grade: "again" | "hard" | "good" | "easy") {
    if (!card) return;
    const gradeMap = {
      again: { correct: false, responseMs: undefined },
      hard: { correct: true, responseMs: 9000 },
      good: { correct: true, responseMs: 4000 },
      easy: { correct: true, responseMs: 1000 },
    };
    const { correct, responseMs } = gradeMap[grade];
    const result: AnswerResult = await submitVocabAnswer(card.thai, correct, responseMs);
    setFeedback(result);
    setFeedbackType(result.promoted ? "promoted" : result.lapsed ? "lapsed" : null);
    setCardsReviewed((c) => c + 1);
    if (correct) setStreak((s) => s + 1); else setStreak(0);
    if (result.nextReviewDays) {
      setIntervalPreviews({
        again: "< 1 min",
        hard: formatInterval(result.nextReviewDays * 0.5),
        good: formatInterval(result.nextReviewDays),
        easy: formatInterval(result.nextReviewDays * 1.5),
      });
    }
    feedbackAnim.setValue(1);
    Animated.timing(feedbackAnim, { toValue: 0, duration: 600, delay: 400, useNativeDriver: true }).start(() => loadCard());
  }

  if (isGuest) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header title="Review" onBack={() => router.back()} />
        <View style={st.guestWrap}>
          <View style={st.guestIcon}>
            <Ionicons name="lock-closed-outline" size={44} color={Sketch.inkFaint} />
          </View>
          <Text style={st.guestTitle}>LOG IN TO REVIEW</Text>
          <Text style={st.guestSub}>
            Vocabulary review uses spaced repetition which requires an account to track your progress.
          </Text>
          <TouchableOpacity style={st.guestBtn} onPress={() => router.push("/login")}>
            <Text style={st.guestBtnText}>LOG IN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header title="Review" onBack={() => router.back()} />
        <View style={st.center}>
          <ActivityIndicator size="large" color={Sketch.ink} />
        </View>
      </SafeAreaView>
    );
  }

  if (summary) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header title="Review" onBack={() => router.back()} />
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
                <Text style={[st.summaryNum, { color: Sketch.green }]}>{summary.cardsPromoted}</Text>
                <Text style={st.summaryLabel}>PROMOTED</Text>
              </View>
              <View style={st.summaryItem}>
                <Text style={[st.summaryNum, { color: Sketch.red }]}>{summary.cardsMissed}</Text>
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

  if (!card) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
        <Header title="Review" onBack={() => router.back()} />
        <View style={st.center}>
          <Text style={st.emptyText}>No cards to review right now!</Text>
          <TouchableOpacity style={st.homeBtn} onPress={() => router.back()}>
            <Text style={st.homeBtnText}>BACK TO HOME</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalCards = card.progress.totalCards;
  const done = totalCards - card.progress.cardsRemaining;
  const progressPct = totalCards > 0 ? (done / totalCards) * 100 : 0;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={st.safe}>
      <Header title="Review" onBack={() => router.back()} showClose />

      <View style={st.progressWrap}>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <View style={st.progressStats}>
          <Text style={st.progressText}>{done}/{totalCards}</Text>
          {streak > 2 && <Text style={st.streakText}>🔥 {streak}</Text>}
        </View>
      </View>

      <View style={st.cardArea}>
        <TouchableOpacity
          style={st.flashcard}
          onPress={!revealed ? handleReveal : undefined}
          activeOpacity={revealed ? 1 : 0.8}
        >
          <Text style={st.thaiText}>{card.thai}</Text>

          <TouchableOpacity style={st.speakerBtn} onPress={() => speak(card.thai)}>
            <Ionicons name="volume-high" size={24} color={Sketch.ink} />
          </TouchableOpacity>

          {!revealed ? (
            <Text style={st.tapHint}>TAP TO REVEAL</Text>
          ) : (
            <Animated.View style={[st.answerArea, { opacity: revealAnim }]}>
              <View style={st.divider} />
              <Text style={st.englishText}>{card.correct}</Text>
            </Animated.View>
          )}

          {feedbackType && (
            <Animated.View style={[st.feedbackOverlay, { opacity: feedbackAnim }]}>
              <Text style={[st.feedbackText, { color: feedbackType === "promoted" ? Sketch.green : Sketch.red }]}>
                {feedbackType === "promoted" ? "PROMOTED ↑" : "LAPSED ↓"}
              </Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {revealed && (
        <View style={st.ratingArea}>
          {([
            { grade: "again" as const, label: "AGAIN", color: Sketch.red, interval: intervalPreviews.again },
            { grade: "hard" as const, label: "HARD", color: Sketch.orange, interval: intervalPreviews.hard },
            { grade: "good" as const, label: "GOOD", color: Sketch.green, interval: intervalPreviews.good },
            { grade: "easy" as const, label: "EASY", color: Sketch.blue, interval: intervalPreviews.easy },
          ]).map((item) => (
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },

  progressWrap: { paddingHorizontal: 20, paddingTop: 10 },
  progressTrack: {
    height: 10,
    backgroundColor: Sketch.inkFaint,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Sketch.ink,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Sketch.orange },
  progressStats: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressText: { fontSize: 12, fontWeight: "900", color: Sketch.inkMuted },
  streakText: { fontSize: 12, fontWeight: "900", color: Sketch.orange },

  cardArea: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
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
  thaiText: { fontSize: 48, fontWeight: "bold", textAlign: "center", marginBottom: 10, color: Sketch.ink },
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
  tapHint: { fontSize: 13, fontWeight: "900", color: Sketch.inkFaint, letterSpacing: 2, marginTop: 10 },
  answerArea: { alignItems: "center", width: "100%" },
  divider: { height: 2, backgroundColor: Sketch.inkFaint, width: "100%", marginVertical: 15 },
  englishText: { fontSize: 26, fontWeight: "900", textAlign: "center", color: Sketch.ink },

  feedbackOverlay: { position: "absolute", top: 10, right: 15 },
  feedbackText: { fontSize: 14, fontWeight: "900", letterSpacing: 1 },

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
  rateBtnInterval: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.8)", marginTop: 2 },

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
  summaryTitle: { fontSize: 20, fontWeight: "900", marginBottom: 20, color: Sketch.ink },
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
  summaryLabel: { fontSize: 10, fontWeight: "900", color: Sketch.inkMuted, letterSpacing: 1, marginTop: 2 },

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
  emptyText: { fontSize: 18, fontWeight: "700", color: Sketch.inkMuted, marginBottom: 20 },

  guestWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, gap: 12 },
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
  guestSub: { fontSize: 14, fontWeight: "500", color: Sketch.inkMuted, textAlign: "center", lineHeight: 20 },
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
