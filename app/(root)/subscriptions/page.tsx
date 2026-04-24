import { PricingTable } from "@clerk/nextjs";

import { PLAN_META } from "@/lib/subscription-constants";

export const dynamic = "force-dynamic";

const planHighlights = [
  {
    slug: PLAN_META.free.slug,
    name: PLAN_META.free.name,
    tagline: PLAN_META.free.tagline,
    features: [
      "1 book in your library",
      "5 voice sessions per month",
      "Up to 5-minute conversations",
    ],
  },
  {
    slug: PLAN_META.standard.slug,
    name: PLAN_META.standard.name,
    tagline: PLAN_META.standard.tagline,
    features: [
      "10 books in your library",
      "100 voice sessions per month",
      "Up to 15-minute conversations",
    ],
  },
  {
    slug: PLAN_META.pro.slug,
    name: PLAN_META.pro.name,
    tagline: PLAN_META.pro.tagline,
    features: [
      "100 books in your library",
      "Unlimited monthly sessions",
      "Up to 60-minute conversations",
    ],
  },
] as const;

export default function SubscriptionsPage() {
  return (
    <main className="flex flex-1 bg-[#f4f6fb]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1e3a8a]">
            Pricing
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#0a1530] sm:text-[2.85rem]">
            Pick the plan that fits your reading life
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#4a5b7b] sm:text-lg">
            Upgrade any time to add more books, longer conversations, and more
            monthly sessions with your voice assistant.
          </p>
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-3">
          {planHighlights.map((plan) => (
            <article
              key={plan.slug}
              className="rounded-[1.2rem] border border-[#e5ecf7] bg-white px-6 py-6 shadow-[0_12px_26px_rgba(15,30,60,0.08)]"
            >
              <h2 className="font-serif text-xl font-semibold text-[#0a1530]">
                {plan.name}
              </h2>
              <p className="mt-1 text-sm text-[#5b6b8a]">{plan.tagline}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#10213f]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#2563eb]"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-[1.2rem] border border-[#e5ecf7] bg-white px-4 py-8 shadow-[0_12px_26px_rgba(15,30,60,0.08)] sm:px-8 sm:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-semibold text-[#0a1530]">
              Choose your plan
            </h2>
            <p className="mt-2 text-sm text-[#5b6b8a]">
              Billing is handled securely by Clerk. You can change or cancel any
              time.
            </p>
          </div>

          <div className="mt-6">
            <PricingTable />
          </div>
        </section>
      </div>
    </main>
  );
}
