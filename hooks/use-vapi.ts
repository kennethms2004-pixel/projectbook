"use client";

import Vapi from "@vapi-ai/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_VOICE,
  VOICE_SETTINGS,
  voiceOptions,
} from "@/lib/constants";

export type TranscriptMessage = {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  isFinal: boolean;
};

export type VapiStatus =
  | "idle"
  | "connecting"
  | "active"
  | "ended"
  | "error";

type UseVapiBook = {
  _id: string;
  title: string;
  author: string;
  persona?: string;
};

type UseVapiOptions = {
  book: UseVapiBook;
};

type UseVapiReturn = {
  status: VapiStatus;
  isSessionActive: boolean;
  isMuted: boolean;
  isAssistantSpeaking: boolean;
  transcript: TranscriptMessage[];
  elapsedSeconds: number;
  errorMessage: string | null;
  voiceLabel: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  toggleMute: () => void;
};

function resolveVoiceId(persona?: string) {
  const key = (persona as keyof typeof voiceOptions | undefined) ?? undefined;
  if (key && key in voiceOptions) return voiceOptions[key].id;
  return voiceOptions[DEFAULT_VOICE as keyof typeof voiceOptions].id;
}

function resolveVoiceLabel(persona?: string) {
  const key = (persona as keyof typeof voiceOptions | undefined) ?? undefined;
  if (key && key in voiceOptions) return voiceOptions[key].name;
  return voiceOptions[DEFAULT_VOICE as keyof typeof voiceOptions].name;
}

export function useVapi({ book }: UseVapiOptions): UseVapiReturn {
  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<VapiStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const voiceId = useMemo(() => resolveVoiceId(book.persona), [book.persona]);
  const voiceLabel = useMemo(
    () => resolveVoiceLabel(book.persona),
    [book.persona],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!publicKey) return;

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    const onCallStart = () => {
      setStatus("active");
      setElapsedSeconds(0);
      clearTimer();
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    };

    const onCallEnd = () => {
      setStatus("ended");
      setIsAssistantSpeaking(false);
      clearTimer();
    };

    const onSpeechStart = () => setIsAssistantSpeaking(true);
    const onSpeechEnd = () => setIsAssistantSpeaking(false);

    const onMessage = (message: {
      type?: string;
      transcriptType?: string;
      role?: "user" | "assistant";
      transcript?: string;
    }) => {
      if (
        message.type !== "transcript" ||
        !message.role ||
        !message.transcript
      ) {
        return;
      }

      const role = message.role;
      const text = message.transcript;
      const isFinal = message.transcriptType !== "partial";

      setTranscript((prev) => {
        const last = prev[prev.length - 1];

        if (last && last.role === role && !last.isFinal) {
          const next = prev.slice(0, -1);
          next.push({ role, text, timestamp: Date.now(), isFinal });
          return next;
        }

        return [...prev, { role, text, timestamp: Date.now(), isFinal }];
      });
    };

    const onError = (error: unknown) => {
      console.error("[useVapi] error", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected Vapi error occurred.",
      );
      clearTimer();
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      clearTimer();
      try {
        vapi.stop();
      } catch {
        // noop
      }
      vapiRef.current = null;
    };
  }, [clearTimer]);

  const start = useCallback(async () => {
    const vapi = vapiRef.current;
    const assistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID;

    if (!vapi) {
      setErrorMessage(
        process.env.NEXT_PUBLIC_VAPI_API_KEY
          ? "Voice client is not initialized."
          : "Missing NEXT_PUBLIC_VAPI_API_KEY — voice chat is disabled.",
      );
      setStatus("error");
      return;
    }
    if (!assistantId) {
      setErrorMessage("Missing NEXT_PUBLIC_ASSISTANT_ID.");
      setStatus("error");
      return;
    }

    try {
      setErrorMessage(null);
      setTranscript([]);
      setStatus("connecting");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
      } catch (micError) {
        console.error("[useVapi] microphone permission denied", micError);
        setStatus("error");
        setErrorMessage(
          "Microphone access is blocked. Allow mic permission in your browser and try again."
        );
        return;
      }

      await vapi.start(assistantId, {
        variableValues: {
          bookId: book._id,
          bookTitle: book.title,
          bookAuthor: book.author,
          voiceName: voiceLabel,
        },
        voice: {
          provider: "11labs",
          voiceId,
          stability: VOICE_SETTINGS.stability,
          similarityBoost: VOICE_SETTINGS.similarityBoost,
          style: VOICE_SETTINGS.style,
          useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        },
      });
    } catch (error) {
      console.error("[useVapi] failed to start", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start voice call.",
      );
    }
  }, [book._id, book.title, book.author, voiceId, voiceLabel]);

  const stop = useCallback(async () => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    try {
      vapi.stop();
    } catch (error) {
      console.error("[useVapi] stop failed", error);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const next = !isMuted;
    try {
      vapi.setMuted(next);
      setIsMuted(next);
    } catch (error) {
      console.error("[useVapi] setMuted failed", error);
    }
  }, [isMuted]);

  return {
    status,
    isSessionActive: status === "active",
    isMuted,
    isAssistantSpeaking,
    transcript,
    elapsedSeconds,
    errorMessage,
    voiceLabel,
    start,
    stop,
    toggleMute,
  };
}
