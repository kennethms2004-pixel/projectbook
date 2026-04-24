"use client";

import { PricingTable } from "@clerk/nextjs";

/**
 * Clerk Billing <PricingTable /> with appearance aligned to the app’s
 * warm literary / cream layout (see design system).
 */
const pricingAppearance = {
  variables: {
    colorPrimary: "#2d2a26",
    colorDanger: "#b45309",
    colorSuccess: "#6B4423",
    colorText: "#1c1917",
    colorTextSecondary: "#5c5346",
    colorTextOnPrimaryBackground: "#f9f6f1",
    colorBackground: "#ffffff",
    colorInputText: "#1c1917",
    colorInputBackground: "#f9f6f1",
    colorShimmer: "rgba(107, 68, 35, 0.12)",
    borderRadius: "0.85rem",
    fontFamily: "var(--font-mona-sans), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-mona-sans), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    card: "shadow-[0_8px_30px_rgba(28,25,22,0.08)] border border-stone-200/80",
    buttonPrimary:
      "bg-[#2d2a26] hover:bg-[#1a1816] text-[#f9f6f1] font-semibold",
    buttonText: "text-[#2d2a26] font-medium",
  },
} as const;

export function SubscriptionsPricingTable() {
  return (
    <div className="clerk-pricing-host w-full max-w-6xl">
      <PricingTable
        appearance={pricingAppearance}
        ctaPosition="bottom"
        for="user"
        newSubscriptionRedirectUrl="/"
      />
    </div>
  );
}
