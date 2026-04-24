export const PLAN_SLUGS = ["free", "standard", "pro"] as const;

export type PlanSlug = (typeof PLAN_SLUGS)[number];

export type PlanLimits = {
  maxBooks: number;
  maxSessionsPerMonth: number;
  maxMinutesPerSession: number;
};

export type PlanMeta = {
  slug: PlanSlug;
  name: string;
  tagline: string;
  limits: PlanLimits;
};

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: {
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxMinutesPerSession: 5,
  },
  standard: {
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxMinutesPerSession: 15,
  },
  pro: {
    maxBooks: 100,
    maxSessionsPerMonth: Number.POSITIVE_INFINITY,
    maxMinutesPerSession: 60,
  },
};

export const PLAN_META: Record<PlanSlug, PlanMeta> = {
  free: {
    slug: "free",
    name: "Free",
    tagline: "Try BookAlive with one book.",
    limits: PLAN_LIMITS.free,
  },
  standard: {
    slug: "standard",
    name: "Standard",
    tagline: "Ten books, longer conversations.",
    limits: PLAN_LIMITS.standard,
  },
  pro: {
    slug: "pro",
    name: "Pro",
    tagline: "Unlimited talks, hour-long sessions.",
    limits: PLAN_LIMITS.pro,
  },
};

export function getPlanLimits(plan: PlanSlug): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function isUnlimited(value: number): boolean {
  return !Number.isFinite(value);
}

export function getCurrentBillingPeriodStart(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
