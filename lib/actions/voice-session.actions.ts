"use server";

import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";

import Book from "@/database/models/book.model";
import VoiceSession from "@/database/models/voice-session.model";
import { connectToDatabase } from "@/database/mongoose";
import {
  checkSessionStartAllowed,
  getUserPlan,
} from "@/lib/subscriptions.server";

export type StartVoiceSessionResult =
  | {
      success: true;
      sessionId: string;
      plan: string;
      maxSessionSeconds: number;
    }
  | {
      success: false;
      code:
        | "unauthenticated"
        | "book_not_found"
        | "session_limit_reached"
        | "internal_error";
      message: string;
    };

export async function startVoiceSession(
  bookId: string
): Promise<StartVoiceSessionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        code: "unauthenticated",
        message: "Sign in to start a session.",
      };
    }

    const check = await checkSessionStartAllowed();
    if (!check.ok) {
      return {
        success: false,
        code:
          check.code === "session_limit_reached"
            ? "session_limit_reached"
            : "unauthenticated",
        message: check.message,
      };
    }

    await connectToDatabase();

    if (!Types.ObjectId.isValid(bookId)) {
      return {
        success: false,
        code: "book_not_found",
        message: "Book not found.",
      };
    }

    const book = await Book.findOne({
      _id: new Types.ObjectId(bookId),
      clerkId: userId,
    })
      .select("_id")
      .lean<{ _id: Types.ObjectId } | null>();

    if (!book) {
      return {
        success: false,
        code: "book_not_found",
        message: "Book not found.",
      };
    }

    const { plan, limits, billingPeriodStart } = await getUserPlan();

    const session = await VoiceSession.create({
      clerkId: userId,
      bookId: book._id,
      durationInSeconds: 0,
      billingPeriodStart,
      startedAt: new Date(),
    });

    const maxSessionSeconds = Number.isFinite(limits.maxMinutesPerSession)
      ? limits.maxMinutesPerSession * 60
      : 60 * 60;

    return {
      success: true,
      sessionId: String(session._id),
      plan,
      maxSessionSeconds,
    };
  } catch (error) {
    console.error("[voice-session.actions:startVoiceSession]", error);
    return {
      success: false,
      code: "internal_error",
      message: "Failed to start session.",
    };
  }
}

export async function endVoiceSession(
  sessionId: string,
  durationInSeconds: number
): Promise<{ success: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    await connectToDatabase();

    await VoiceSession.updateOne(
      { _id: sessionId, clerkId: userId },
      {
        durationInSeconds: Math.max(0, Math.round(durationInSeconds)),
        endedAt: new Date(),
      }
    );

    return { success: true };
  } catch (error) {
    console.error("[voice-session.actions:endVoiceSession]", error);
    return { success: false };
  }
}
