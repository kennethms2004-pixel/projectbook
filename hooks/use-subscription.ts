"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

import {
  getPlanLimits,
  PLAN_META,
  type PlanLimits,
  type PlanMeta,
  type PlanSlug,
} from "@/lib/subscription-constants";

export type UseSubscriptionResult = {
  isLoaded: boolean;
  isSignedIn: boolean;
  plan: PlanSlug;
  limits: PlanLimits;
  meta: PlanMeta;
};

export function useSubscription(): UseSubscriptionResult {
  const { isLoaded, isSignedIn, has } = useAuth();

  const plan = useMemo<PlanSlug>(() => {
    if (!isLoaded || !has) return "free";
    try {
      if (has({ plan: "pro" })) return "pro";
      if (has({ plan: "standard" })) return "standard";
    } catch {
      return "free";
    }
    return "free";
  }, [isLoaded, has]);

  return {
    isLoaded: Boolean(isLoaded),
    isSignedIn: Boolean(isSignedIn),
    plan,
    limits: getPlanLimits(plan),
    meta: PLAN_META[plan],
  };
}
