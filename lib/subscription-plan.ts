import type { PlanSlug } from "@/lib/subscription-constants";

type HasCheck = (params: { plan: string }) => boolean;

/**
 * Resolves the app's plan slug from Clerk Billing using `has()`.
 * Dashboard plans use slugs `standard` and `pro`; no subscription ⇒ `free`.
 */
export function resolvePlanFromHas(
  has: HasCheck | null | undefined
): PlanSlug {
  if (!has) return "free";
  try {
    if (has({ plan: "pro" })) return "pro";
    if (has({ plan: "standard" })) return "standard";
  } catch {
    return "free";
  }
  return "free";
}
