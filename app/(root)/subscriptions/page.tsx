import { SubscriptionsPricingTable } from "@/components/subscriptions-pricing-table";

export const dynamic = "force-dynamic";

export default function SubscriptionsPage() {
  return (
    <main className="subscriptions-page flex flex-1 bg-[#f9f6f1]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1c1917] sm:text-[2.75rem]">
            Choose Your Plan
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#5c5346] sm:text-lg">
            Upgrade to unlock more books, longer sessions, and advanced features.
          </p>
        </header>

        <section
          className="mt-10 w-full rounded-[1.25rem] border border-[#e7e0d6] bg-white/90 px-4 py-8 shadow-[0_20px_50px_rgba(28,25,22,0.06)] sm:px-8 sm:py-10"
          aria-label="Subscription plans"
        >
          <SubscriptionsPricingTable />
        </section>

        <p className="mt-8 max-w-md text-center text-xs text-[#78716c]">
          Secure checkout powered by Clerk Billing. You can change or cancel your
          plan anytime.
        </p>
      </div>
    </main>
  );
}
