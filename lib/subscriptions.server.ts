import "server-only";

import { auth } from "@clerk/nextjs/server";

import Book from "@/database/models/book.model";
import VoiceSession from "@/database/models/voice-session.model";
import { connectToDatabase } from "@/database/mongoose";
import {
  getCurrentBillingPeriodStart,
  getPlanLimits,
  isUnlimited,
  PLAN_LIMITS,
  type PlanLimits,
  type PlanSlug,
} from "@/lib/subscription-constants";

export type PlanResult = {
  userId: string | null;
  plan: PlanSlug;
  limits: PlanLimits;
  billingPeriodStart: Date;
};

type HasCheck = (params: { plan: string }) => boolean;

function resolvePlan(has: HasCheck | undefined | null): PlanSlug {
  if (!has) return "free";
  try {
    if (has({ plan: "pro" })) return "pro";
    if (has({ plan: "standard" })) return "standard";
  } catch {
    return "free";
  }
  return "free";
}

export async function getUserPlan(): Promise<PlanResult> {
  const authResult = await auth();
  const userId = authResult.userId ?? null;
  const plan = resolvePlan(authResult.has as HasCheck | undefined);

  return {
    userId,
    plan,
    limits: getPlanLimits(plan),
    billingPeriodStart: getCurrentBillingPeriodStart(),
  };
}

export async function getUserPlanUsage(userId: string): Promise<{
  bookCount: number;
  sessionCountThisMonth: number;
  billingPeriodStart: Date;
}> {
  await connectToDatabase();
  const billingPeriodStart = getCurrentBillingPeriodStart();

  const [bookCount, sessionCountThisMonth] = await Promise.all([
    Book.countDocuments({ clerkId: userId }),
    VoiceSession.countDocuments({
      clerkId: userId,
      billingPeriodStart,
    }),
  ]);

  return { bookCount, sessionCountThisMonth, billingPeriodStart };
}

export type LimitCheck =
  | { ok: true }
  | {
      ok: false;
      code:
        | "unauthenticated"
        | "book_limit_reached"
        | "session_limit_reached";
      message: string;
      plan: PlanSlug;
      limits: PlanLimits;
    };

export async function checkBookCreationAllowed(): Promise<LimitCheck> {
  const { userId, plan, limits } = await getUserPlan();

  if (!userId) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "Sign in to add a book.",
      plan,
      limits,
    };
  }

  await connectToDatabase();
  const bookCount = await Book.countDocuments({ clerkId: userId });

  if (!isUnlimited(limits.maxBooks) && bookCount >= limits.maxBooks) {
    return {
      ok: false,
      code: "book_limit_reached",
      message: `Your ${plan} plan allows up to ${limits.maxBooks} book${
        limits.maxBooks === 1 ? "" : "s"
      }. Upgrade to add more.`,
      plan,
      limits,
    };
  }

  return { ok: true };
}

export async function checkSessionStartAllowed(): Promise<LimitCheck> {
  const { userId, plan, limits } = await getUserPlan();

  if (!userId) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "Sign in to start a voice session.",
      plan,
      limits,
    };
  }

  const { sessionCountThisMonth } = await getUserPlanUsage(userId);

  if (
    !isUnlimited(limits.maxSessionsPerMonth) &&
    sessionCountThisMonth >= limits.maxSessionsPerMonth
  ) {
    return {
      ok: false,
      code: "session_limit_reached",
      message: `You've used all ${limits.maxSessionsPerMonth} voice sessions on the ${plan} plan this month. Upgrade for more.`,
      plan,
      limits,
    };
  }

  return { ok: true };
}

export { PLAN_LIMITS };
