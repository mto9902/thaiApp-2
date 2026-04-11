import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getPractice } from "@/src/api/getPractice";
import { getPracticePreview } from "@/src/api/getPracticePreview";
import { GrammarPoint } from "@/src/data/grammar";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import {
  GrammarProgressData,
  isGrammarPracticed,
  saveRound,
} from "@/src/utils/grammarProgress";

import {
  buildBuilderWords,
  buildMatchOptions,
  buildSentenceSlots,
  computePrefill,
  getBreakdownRomanizations,
  getNextMiniMode,
  normalizePracticeSentence,
  PracticeBuilderWord,
  PracticeMatchOption,
  PracticeSentenceData,
  shuffleNotSame,
} from "@/src/practice/miniExerciseHelpers";
import { trackPracticeWords } from "@/src/practice/trackPracticeWords";

type MiniExercisePhase = "explanation" | "exercise";
type MiniExerciseMode = "wordScraps" | "matchThai";
type ResultState = "" | "correct" | "wrong" | "revealed";

type StoredMiniExerciseState = {
  currentGrammarId?: string | null;
  currentMode?: MiniExerciseMode;
};

type UseDashboardMiniExerciseArgs<TGrammar extends GrammarPoint> = {
  grammarPoints: TGrammar[];
  progress: Record<string, GrammarProgressData>;
  isPremium: boolean;
};

type BuildState = {
  prefilled: (string | null)[];
  words: PracticeBuilderWord[];
  builtSentence: PracticeBuilderWord[];
};

const STORAGE_KEY = "dashboard-mini-exercise-sandbox-v1";

export function useDashboardMiniExercise<TGrammar extends GrammarPoint>({
  grammarPoints,
  progress,
  isPremium,
}: UseDashboardMiniExerciseArgs<TGrammar>) {
  const accessibleGrammar = useMemo(
    () =>
      grammarPoints.filter((point) =>
        isPremium ? true : !isPremiumGrammarPoint(point),
      ),
    [grammarPoints, isPremium],
  );

  const anchorGrammarId = useMemo(() => {
    const firstUnpracticed = accessibleGrammar.find(
      (point) => !isGrammarPracticed(progress[point.id]),
    );
    if (firstUnpracticed) {
      return firstUnpracticed.id;
    }

    const mostRecentPracticed = accessibleGrammar
      .filter((point) => isGrammarPracticed(progress[point.id]))
      .sort((left, right) => {
        const leftTime = progress[left.id]?.lastPracticed
          ? new Date(progress[left.id].lastPracticed).getTime()
          : 0;
        const rightTime = progress[right.id]?.lastPracticed
          ? new Date(progress[right.id].lastPracticed).getTime()
          : 0;
        return rightTime - leftTime;
      })[0];

    return mostRecentPracticed?.id ?? accessibleGrammar[0]?.id ?? null;
  }, [accessibleGrammar, progress]);

  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<MiniExercisePhase>("explanation");
  const [currentGrammarId, setCurrentGrammarId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<MiniExerciseMode>("wordScraps");
  const [previewSentence, setPreviewSentence] = useState<PracticeSentenceData | null>(
    null,
  );
  const [activeSentence, setActiveSentence] = useState<PracticeSentenceData | null>(
    null,
  );
  const [romanTokens, setRomanTokens] = useState<string[]>([]);
  const [buildState, setBuildState] = useState<BuildState>({
    prefilled: [],
    words: [],
    builtSentence: [],
  });
  const [matchOptions, setMatchOptions] = useState<PracticeMatchOption[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [matchRevealed, setMatchRevealed] = useState(false);
  const [result, setResult] = useState<ResultState>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [transitionPending, setTransitionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRequestIdRef = useRef(0);
  const roundRequestIdRef = useRef(0);
  const transitionPendingRef = useRef(false);

  const currentPoint = useMemo(
    () =>
      currentGrammarId
        ? accessibleGrammar.find((point) => point.id === currentGrammarId) ?? null
        : null,
    [accessibleGrammar, currentGrammarId],
  );

  const currentIndex = useMemo(
    () =>
      currentPoint
        ? accessibleGrammar.findIndex((point) => point.id === currentPoint.id)
        : -1,
    [accessibleGrammar, currentPoint],
  );

  const previousPoint =
    currentIndex > 0 ? accessibleGrammar[currentIndex - 1] ?? null : null;
  const nextPoint =
    currentIndex >= 0 && currentIndex < accessibleGrammar.length - 1
      ? accessibleGrammar[currentIndex + 1] ?? null
      : null;

  const canStartMiniPractice = previewSentence !== null && !exerciseLoading;
  const isSolved = result === "correct" || result === "revealed";
  const activeSlots = useMemo(
    () => buildSentenceSlots(buildState.prefilled, buildState.builtSentence),
    [buildState.builtSentence, buildState.prefilled],
  );

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const setPendingState = useCallback((nextValue: boolean) => {
    transitionPendingRef.current = nextValue;
    setTransitionPending(nextValue);
  }, []);

  const resetRoundState = useCallback(() => {
    clearAdvanceTimeout();
    setPendingState(false);
    setActiveSentence(null);
    setRomanTokens([]);
    setBuildState({
      prefilled: [],
      words: [],
      builtSentence: [],
    });
    setMatchOptions([]);
    setSelectedOptionIndex(null);
    setMatchRevealed(false);
    setResult("");
    setErrorMessage(null);
  }, [clearAdvanceTimeout, setPendingState]);

  const persistState = useCallback(
    async (state: StoredMiniExerciseState) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to persist dashboard mini exercise state:", error);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreState() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const stored = raw ? (JSON.parse(raw) as StoredMiniExerciseState) : null;
        if (cancelled) return;

        const savedId = stored?.currentGrammarId ?? null;
        const savedMode = stored?.currentMode ?? "wordScraps";
        const validSavedId =
          savedId && accessibleGrammar.some((point) => point.id === savedId)
            ? savedId
            : null;

        setCurrentGrammarId(validSavedId ?? anchorGrammarId);
        setCurrentMode(savedMode);
        setHydrated(true);
      } catch (error) {
        console.error("Failed to restore dashboard mini exercise state:", error);
        if (!cancelled) {
          setCurrentGrammarId(anchorGrammarId);
          setCurrentMode("wordScraps");
          setHydrated(true);
        }
      }
    }

    if (!accessibleGrammar.length) {
      setCurrentGrammarId(null);
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    void restoreState();
    return () => {
      cancelled = true;
    };
  }, [accessibleGrammar, anchorGrammarId]);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentGrammarId || !currentPoint) {
      if (anchorGrammarId && anchorGrammarId !== currentGrammarId) {
        setCurrentGrammarId(anchorGrammarId);
      }
      return;
    }

    void persistState({
      currentGrammarId,
      currentMode,
    });
  }, [anchorGrammarId, currentGrammarId, currentMode, currentPoint, hydrated, persistState]);

  const fetchSentenceForCurrentGrammar = useCallback(async () => {
    if (!currentPoint) {
      return null;
    }

    const response = await getPractice(currentPoint.id);
    return normalizePracticeSentence(response);
  }, [currentPoint]);

  const loadPreviewSentence = useCallback(
    async ({
      fresh = false,
      excludeThai,
    }: {
      fresh?: boolean;
      excludeThai?: string | null;
    } = {}) => {
      if (!currentPoint) {
        setPreviewSentence(null);
        return;
      }

      const requestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = requestId;
      setPreviewLoading(true);

      const fallbackPreview = normalizePracticeSentence({
        thai: currentPoint.example?.thai,
        romanization: currentPoint.example?.roman,
        english: currentPoint.example?.english,
        breakdown: currentPoint.example?.breakdown,
      });

      try {
        let nextPreview: PracticeSentenceData | null = null;

        if (fresh) {
          const attempts = 4;
          for (let index = 0; index < attempts; index += 1) {
            const candidate = await fetchSentenceForCurrentGrammar();
            if (!candidate) continue;
            nextPreview = candidate;
            if (!excludeThai || candidate.thai !== excludeThai) {
              break;
            }
          }
        } else {
          const response = await getPracticePreview(currentPoint.id);
          nextPreview = normalizePracticeSentence(response);
        }

        if (previewRequestIdRef.current !== requestId) {
          return;
        }

        setPreviewSentence(nextPreview ?? fallbackPreview);
      } catch (error) {
        console.error("Failed to load sandbox practice preview:", error);
        if (previewRequestIdRef.current === requestId) {
          setPreviewSentence((current) => current ?? fallbackPreview);
        }
      } finally {
        if (previewRequestIdRef.current === requestId) {
          setPreviewLoading(false);
        }
      }
    },
    [currentPoint, fetchSentenceForCurrentGrammar],
  );

  useEffect(() => {
    if (!currentPoint) {
      setPreviewSentence(null);
      return;
    }

    resetRoundState();
    setPhase("explanation");

    const fallbackPreview = normalizePracticeSentence({
      thai: currentPoint.example?.thai,
      romanization: currentPoint.example?.roman,
      english: currentPoint.example?.english,
      breakdown: currentPoint.example?.breakdown,
    });

    setPreviewSentence(fallbackPreview);
    void loadPreviewSentence();
  }, [currentPoint, loadPreviewSentence, resetRoundState]);

  useEffect(() => () => clearAdvanceTimeout(), [clearAdvanceTimeout]);

  const fetchSentenceBatchForCurrentGrammar = useCallback(
    async (count: number) => {
      const sentencesByThai = new Map<string, PracticeSentenceData>();
      let attempts = 0;
      const maxAttempts = count * 5;

      while (sentencesByThai.size < count && attempts < maxAttempts) {
        const remaining = count - sentencesByThai.size;
        const batchSize = Math.min(remaining * 2, maxAttempts - attempts);
        attempts += batchSize;

        const responses = await Promise.all(
          Array.from({ length: batchSize }, () => fetchSentenceForCurrentGrammar()),
        );

        responses.forEach((sentence) => {
          if (!sentence?.thai) return;
          if (sentencesByThai.has(sentence.thai)) return;
          sentencesByThai.set(sentence.thai, sentence);
        });
      }

      return Array.from(sentencesByThai.values()).slice(0, count);
    },
    [fetchSentenceForCurrentGrammar],
  );

  const fetchRound = useCallback(
    async (mode: MiniExerciseMode) => {
      if (!currentPoint) return;

      const requestId = roundRequestIdRef.current + 1;
      roundRequestIdRef.current = requestId;
      clearAdvanceTimeout();
      setPendingState(true);
      setExerciseLoading(true);
      setErrorMessage(null);
      setSelectedOptionIndex(null);
      setMatchRevealed(false);
      setResult("");

      try {
        const sentenceBatch =
          mode === "matchThai"
            ? await fetchSentenceBatchForCurrentGrammar(4)
            : await fetchSentenceBatchForCurrentGrammar(1);

        if (roundRequestIdRef.current !== requestId) {
          return;
        }

        const mainSentence = sentenceBatch[0] ?? null;
        if (!mainSentence) {
          throw new Error("This lesson does not have practice-ready sentences yet.");
        }

        const perWordRoman = getBreakdownRomanizations(
          mainSentence.romanization,
          mainSentence.breakdown,
        );

        setActiveSentence(mainSentence);
        setRomanTokens(perWordRoman);
        setCurrentMode(mode);
        setPhase("exercise");

        if (mode === "wordScraps") {
          const prefilled = computePrefill(mainSentence.breakdown);
          const words = buildBuilderWords(mainSentence, prefilled, perWordRoman);
          setBuildState({
            prefilled,
            words: shuffleNotSame(words, (word) => word.thai),
            builtSentence: [],
          });
          setMatchOptions([]);
        } else {
          const distractors = sentenceBatch.slice(1);

          setBuildState({
            prefilled: [],
            words: [],
            builtSentence: [],
          });
          setMatchOptions(buildMatchOptions(mainSentence, distractors));
        }
      } catch (error) {
        if (roundRequestIdRef.current !== requestId) {
          return;
        }
        console.error("Failed to fetch sandbox mini exercise round:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "This lesson does not have practice-ready sentences yet.",
        );
        setPhase("explanation");
      } finally {
        if (roundRequestIdRef.current === requestId) {
          setExerciseLoading(false);
          setPendingState(false);
        }
      }
    },
    [
      clearAdvanceTimeout,
      currentPoint,
      fetchSentenceBatchForCurrentGrammar,
      setPendingState,
    ],
  );

  const scheduleAdvance = useCallback(
    (nextMode: MiniExerciseMode) => {
      if (transitionPendingRef.current) return;
      clearAdvanceTimeout();
      setPendingState(true);
      advanceTimeoutRef.current = setTimeout(() => {
        void fetchRound(nextMode);
      }, 1200);
    },
    [clearAdvanceTimeout, fetchRound, setPendingState],
  );

  const resetToExplanation = useCallback(() => {
    clearAdvanceTimeout();
    setPendingState(false);
    setPhase("explanation");
    setResult("");
    setSelectedOptionIndex(null);
    setMatchRevealed(false);
    setErrorMessage(null);
  }, [clearAdvanceTimeout, setPendingState]);

  const selectGrammar = useCallback(
    (grammarId: string | null) => {
      if (!grammarId || grammarId === currentGrammarId || transitionPendingRef.current)
        return;
      clearAdvanceTimeout();
      roundRequestIdRef.current += 1;
      setCurrentGrammarId(grammarId);
      setCurrentMode("wordScraps");
      resetRoundState();
      setPhase("explanation");
    },
    [clearAdvanceTimeout, currentGrammarId, resetRoundState],
  );

  const goToPreviousGrammar = useCallback(() => {
    if (!previousPoint) return;
    selectGrammar(previousPoint.id);
  }, [previousPoint, selectGrammar]);

  const goToNextGrammar = useCallback(() => {
    if (!nextPoint) return;
    selectGrammar(nextPoint.id);
  }, [nextPoint, selectGrammar]);

  const startMiniPractice = useCallback(() => {
    if (exerciseLoading || transitionPendingRef.current) return;
    void fetchRound("wordScraps");
  }, [exerciseLoading, fetchRound]);

  const nextPreviewSentence = useCallback(() => {
    if (
      phase !== "explanation" ||
      previewLoading ||
      exerciseLoading ||
      transitionPendingRef.current
    ) {
      return;
    }

    void loadPreviewSentence({
      fresh: true,
      excludeThai: previewSentence?.thai ?? null,
    });
  }, [
    exerciseLoading,
    loadPreviewSentence,
    phase,
    previewLoading,
    previewSentence?.thai,
  ]);

  const handleWordTap = useCallback((word: PracticeBuilderWord) => {
    if (exerciseLoading || transitionPendingRef.current) return;
    setResult("");
    setBuildState((current) => {
      if (current.builtSentence.some((item) => item.id === word.id)) {
        return current;
      }

      return {
        ...current,
        builtSentence: [...current.builtSentence, word],
      };
    });
  }, [exerciseLoading]);

  const removeBuiltWord = useCallback(
    (wordId: number) => {
      if (result === "revealed" || exerciseLoading || transitionPendingRef.current) return;

      setResult("");
      setBuildState((current) => ({
        ...current,
        builtSentence: current.builtSentence.filter((item) => item.id !== wordId),
      }));
    },
    [exerciseLoading, result],
  );

  const recordRound = useCallback(
    (wasCorrect: boolean) => {
      if (!currentPoint) return;
      void saveRound(currentPoint.id, wasCorrect);
    },
    [currentPoint],
  );

  const checkBuildAnswer = useCallback(() => {
    if (!activeSentence || result === "correct" || exerciseLoading || transitionPendingRef.current)
      return;

    const fullSentence = buildSentenceSlots(
      buildState.prefilled,
      buildState.builtSentence,
    );
    const correct = activeSentence.breakdown.map((word) => word.thai);
    const attempt = fullSentence.map((slot) => slot ?? "");
    const isCorrect =
      JSON.stringify(correct) === JSON.stringify(attempt);

    setResult(isCorrect ? "correct" : "wrong");
    recordRound(isCorrect);

    if (!isCorrect) return;

    void trackPracticeWords(
      activeSentence.breakdown,
      "dashboard-mini-wordScraps-correct",
      romanTokens,
    );
    scheduleAdvance(getNextMiniMode(currentMode));
  }, [
    activeSentence,
    buildState.builtSentence,
    buildState.prefilled,
    currentMode,
    exerciseLoading,
    recordRound,
    result,
    romanTokens,
    scheduleAdvance,
  ]);

  useEffect(() => {
    if (
      phase !== "exercise" ||
      currentMode !== "wordScraps" ||
      !activeSentence ||
      result !== "" ||
      exerciseLoading ||
      transitionPendingRef.current
    ) {
      return;
    }

    const fullSentence = buildSentenceSlots(
      buildState.prefilled,
      buildState.builtSentence,
    );

    if (fullSentence.some((slot) => slot === null)) {
      return;
    }

    const correct = activeSentence.breakdown.map((word) => word.thai);
    const attempt = fullSentence.map((slot) => slot ?? "");
    const isCorrect =
      JSON.stringify(correct) === JSON.stringify(attempt);

    setResult(isCorrect ? "correct" : "wrong");
    recordRound(isCorrect);

    if (!isCorrect) {
      return;
    }

    void trackPracticeWords(
      activeSentence.breakdown,
      "dashboard-mini-wordScraps-correct",
      romanTokens,
    );
    scheduleAdvance(getNextMiniMode(currentMode));
  }, [
    activeSentence,
    buildState.builtSentence,
    buildState.prefilled,
    currentMode,
    exerciseLoading,
    phase,
    recordRound,
    result,
    romanTokens,
    scheduleAdvance,
  ]);

  const revealBuildAnswer = useCallback(() => {
    if (
      !activeSentence ||
      result === "correct" ||
      result === "revealed" ||
      exerciseLoading ||
      transitionPendingRef.current
    )
      return;

    const orderedWords = [...buildState.words].sort(
      (left, right) => left.breakdownIndex - right.breakdownIndex,
    );
    setBuildState((current) => ({
      ...current,
      builtSentence: orderedWords,
    }));
    setResult("revealed");
  }, [activeSentence, buildState.words, exerciseLoading, result]);

  const selectMatchOption = useCallback(
    (index: number) => {
      if (
        matchRevealed ||
        !activeSentence ||
        exerciseLoading ||
        transitionPendingRef.current
      )
        return;

      setSelectedOptionIndex(index);
      setMatchRevealed(true);
      const option = matchOptions[index];
      const isCorrect = option?.isCorrect === true;
      setResult(isCorrect ? "correct" : "wrong");
      recordRound(isCorrect);

      if (!isCorrect) return;

      void trackPracticeWords(
        activeSentence.breakdown,
        "dashboard-mini-matchThai-correct",
        romanTokens,
      );
      scheduleAdvance(getNextMiniMode(currentMode));
    },
    [
      activeSentence,
      currentMode,
      exerciseLoading,
      matchOptions,
      matchRevealed,
      recordRound,
      romanTokens,
      scheduleAdvance,
    ],
  );

  const revealMatchAnswer = useCallback(() => {
    if (matchRevealed || exerciseLoading || transitionPendingRef.current) return;
    setSelectedOptionIndex(null);
    setMatchRevealed(true);
    setResult("revealed");
  }, [exerciseLoading, matchRevealed]);

  const continueToNextRound = useCallback(() => {
    if (exerciseLoading || transitionPendingRef.current) return;
    setPendingState(true);
    void fetchRound(getNextMiniMode(currentMode));
  }, [currentMode, exerciseLoading, fetchRound, setPendingState]);

  return {
    hydrated,
    phase,
    currentMode,
    currentPoint,
    previousPoint,
    nextPoint,
    previewSentence,
    activeSentence,
    romanTokens,
    buildState,
    activeSlots,
    matchOptions,
    selectedOptionIndex,
    matchRevealed,
    result,
    previewLoading,
    exerciseLoading,
    transitionPending,
    errorMessage,
    canStartMiniPractice,
    isSolved,
    nextPreviewSentence,
    resetToExplanation,
    selectGrammar,
    startMiniPractice,
    goToPreviousGrammar,
    goToNextGrammar,
    handleWordTap,
    removeBuiltWord,
    checkBuildAnswer,
    revealBuildAnswer,
    selectMatchOption,
    revealMatchAnswer,
    continueToNextRound,
  };
}
