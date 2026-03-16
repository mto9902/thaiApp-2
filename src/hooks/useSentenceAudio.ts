import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef } from "react";

import { API_BASE } from "@/src/config";
import { getAuthToken } from "@/src/utils/authStorage";
import { normalizeThaiTtsText } from "@/src/utils/thaiSpeech";

type TtsSpeed = "slow" | "normal" | "fast";

type PlaySentenceOptions = {
  onDone?: () => void;
  speed?: TtsSpeed;
};

const SPEAKING_RATE_MAP: Record<TtsSpeed, number> = {
  slow: 0.8,
  normal: 1,
  fast: 1.15,
};

function runCallbackOnce(callback?: () => void) {
  let handled = false;

  return () => {
    if (handled) return;
    handled = true;
    callback?.();
  };
}

export function useSentenceAudio() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const completionRef = useRef<(() => void) | null>(null);

  const stopSentenceAudio = useCallback(() => {
    completionRef.current = null;
    Speech.stop();

    try {
      player.pause();
      player.seekTo(0);
    } catch {
      // Ignore player-stop errors so fallback speech still works.
    }
  }, [player]);

  useEffect(() => {
    if (status.didJustFinish && completionRef.current) {
      const callback = completionRef.current;
      completionRef.current = null;
      callback();
    }
  }, [status.didJustFinish]);

  useEffect(() => {
    if (status.error && completionRef.current) {
      console.warn("[SentenceAudio] Audio player error:", status.error);
      const callback = completionRef.current;
      completionRef.current = null;
      callback();
    }
  }, [status.error]);

  useEffect(() => stopSentenceAudio, [stopSentenceAudio]);

  const playSentence = useCallback(
    async (text: string, options: PlaySentenceOptions = {}) => {
      const normalizedText = normalizeThaiTtsText(text);
      const speed = options.speed ?? "normal";
      const speakingRate = SPEAKING_RATE_MAP[speed] ?? 1;
      const complete = runCallbackOnce(options.onDone);

      if (!normalizedText) {
        complete();
        return false;
      }

      stopSentenceAudio();

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/tts/sentence`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            speakingRate,
            text: normalizedText,
          }),
        });

        if (!response.ok) {
          let detail = "";

          try {
            const errorData = await response.json();
            if (errorData && typeof errorData.error === "string") {
              detail = errorData.error;
            }
          } catch {
            try {
              detail = await response.text();
            } catch {
              detail = "";
            }
          }

          throw new Error(
            detail
              ? `Sentence audio request failed: ${response.status} - ${detail}`
              : `Sentence audio request failed: ${response.status}`,
          );
        }

        const data = await response.json();

        if (!data || typeof data.path !== "string") {
          throw new Error("Sentence audio response was missing a file path");
        }

        completionRef.current = complete;
        player.replace({ uri: `${API_BASE}${data.path}` });
        player.play();
        return true;
      } catch (err) {
        console.warn("[SentenceAudio] Falling back to expo-speech:", err);

        Speech.speak(normalizedText, {
          language: "th-TH",
          rate: speakingRate,
          onDone: complete,
          onError: complete,
          onStopped: complete,
        });
        return false;
      }
    },
    [player, stopSentenceAudio],
  );

  return {
    playSentence,
    stopSentenceAudio,
  };
}
