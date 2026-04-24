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
import { resolvePlanFromHas } from "@/lib/subscription-plan";

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
    if (!isLoaded) return "free";
    return resolvePlanFromHas(has ?? undefined);
  }, [isLoaded, has]);

  return {
    isLoaded: Boolean(isLoaded),
    isSignedIn: Boolean(isSignedIn),
    plan,
    limits: getPlanLimits(plan),
    meta: PLAN_META[plan],
  };
}
