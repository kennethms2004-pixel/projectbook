"use client";

import { Loader2, Mic, MicOff, PhoneOff } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { useVapi } from "@/hooks/use-vapi";

const FALLBACK_COVER = "/assets/book-cover.svg";
const MAX_SESSION_SECONDS = 15 * 60;

type BookConversationProps = {
  book: {
    _id: string;
    title: string;
    author: string;
    persona?: string;
    coverUrl?: string;
  };
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(1, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function BookConversation({ book }: BookConversationProps) {
  const {
    status,
    isSessionActive,
    isMuted,
    isAssistantSpeaking,
    transcript,
    elapsedSeconds,
    errorMessage,
    voiceLabel,
    start,
    stop,
    toggleMute,
  } = useVapi({ book });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    if (isSessionActive && elapsedSeconds >= MAX_SESSION_SECONDS) {
      void stop();
    }
  }, [isSessionActive, elapsedSeconds, stop]);

  const statusLabel = (() => {
    switch (status) {
      case "connecting":
        return "Connecting…";
      case "active":
        return isAssistantSpeaking ? "Speaking" : "Listening";
      case "ended":
        return "Ended";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  })();

  const statusDotClass =
    status === "active"
      ? isAssistantSpeaking
        ? "bg-emerald-500 animate-pulse"
        : "bg-blue-500"
      : status === "connecting"
        ? "bg-amber-500 animate-pulse"
        : status === "error"
          ? "bg-red-500"
          : "bg-[#b6a89a]";

  const handleMicClick = async () => {
    if (isSessionActive || status === "connecting") {
      await stop();
    } else {
      await start();
    }
  };

  return (
    <div className="book-page-container">
      <section className="vapi-header-card">
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <div className="overflow-hidden rounded-lg bg-[#f8f1e7] shadow-[0_12px_28px_rgba(79,63,43,0.18)]">
            <Image
              src={book.coverUrl || FALLBACK_COVER}
              alt={`Cover of ${book.title}`}
              width={120}
              height={180}
              className="block h-[180px] w-[120px] object-cover"
            />
          </div>

          <button
            type="button"
            onClick={handleMicClick}
            aria-label={
              isSessionActive ? "End voice conversation" : "Start voice conversation"
            }
            disabled={status === "connecting"}
            className="vapi-mic-btn disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "connecting" ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : isSessionActive ? (
              <PhoneOff className="size-6 text-red-600" aria-hidden />
            ) : (
              <MicOff className="size-6" aria-hidden />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#241913] sm:text-3xl">
              {book.title}
            </h1>
            <p className="mt-1 text-sm text-[#6f6257] sm:text-base">
              by {book.author}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="vapi-status-indicator">
              <span
                className={`vapi-status-dot ${statusDotClass}`}
                aria-hidden
              />
              <span className="vapi-status-text">{statusLabel}</span>
            </span>

            <span className="vapi-status-indicator">
              <span className="vapi-status-text">
                Voice: <span className="font-semibold">{voiceLabel}</span>
              </span>
            </span>

            <span className="vapi-status-indicator">
              <span className="vapi-status-text font-mono">
                {formatDuration(elapsedSeconds)}/15:00
              </span>
            </span>

            {isSessionActive && (
              <button
                type="button"
                onClick={toggleMute}
                className="vapi-status-indicator hover:bg-[#f3e4c7]"
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMuted ? (
                  <MicOff className="size-3.5" aria-hidden />
                ) : (
                  <Mic className="size-3.5" aria-hidden />
                )}
                <span className="vapi-status-text">
                  {isMuted ? "Muted" : "Live"}
                </span>
              </button>
            )}
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </section>

      <section className="transcript-container">
        {transcript.length === 0 ? (
          <div className="transcript-empty">
            <Mic className="size-12 text-[#2f241d]" aria-hidden />
            <p className="transcript-empty-text">
              {isSessionActive ? "Listening…" : "No conversation yet"}
            </p>
            <p className="transcript-empty-hint">
              {isSessionActive
                ? "Speak naturally — the assistant is ready."
                : "Click the mic button above to start talking"}
            </p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex h-full max-h-[500px] w-full flex-col gap-3 overflow-y-auto"
          >
            {transcript.map((message, idx) => (
              <div
                key={`${message.timestamp}-${idx}`}
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  message.role === "assistant"
                    ? "self-start bg-[#f3e4c7] text-[#241913]"
                    : "self-end bg-[#241913] text-white"
                } ${message.isFinal ? "" : "opacity-70 italic"}`}
              >
                {message.text}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
