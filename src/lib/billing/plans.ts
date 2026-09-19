export type KindCarePlanKey = "companion" | "family" | "family_plus";

export type KindCarePlan = {
  key: KindCarePlanKey;
  name: string;
  summary: string;
  productId: string;
  monthlyPriceId: string;
  annualPriceId: string;
  monthlyCents: number;
  annualCents: number;
};

/** Official SkillBinder live catalog. Do not invent KindCare prices. */
export const KINDCARE_TRIAL_DAYS = 7;

/**
 * Dashboard SKU for a $0 charge every 7 days. KindCare does not sell this at
 * Checkout. New households get a 7-day trial on Companion, Family, or Family
 * Plus (`trial_period_days`) so the card is on file and the chosen plan starts
 * when the trial ends.
 */
export const kindCareFreeTrial = {
  key: "free_trial",
  name: "KindCare Free Trial",
  productId: "prod_VHZLhMtG6FV68M",
  priceId: "price_1UH0DCDzwkYa5R1FcuPmBtdP",
} as const;

export const kindCarePlans: KindCarePlan[] = [
  {
    key: "companion",
    name: "KindCare Companion",
    summary: "One household, one person you support, and the caregiver who organizes care.",
    productId: "prod_VHZLxConhu5NGl",
    monthlyPriceId: "price_1UH0DCDzwkYa5R1F29rWrzb1",
    annualPriceId: "price_1UH0DCDzwkYa5R1FNdgvfh3d",
    monthlyCents: 999,
    annualCents: 9900,
  },
  {
    key: "family",
    name: "KindCare Family",
    summary: "A larger household: up to two people you support and up to four caregivers.",
    productId: "prod_VHZLBYqQP5Frtx",
    monthlyPriceId: "price_1UH0DCDzwkYa5R1FDg1eW1nB",
    annualPriceId: "price_1UH0DCDzwkYa5R1FncDChiXT",
    monthlyCents: 1499,
    annualCents: 14900,
  },
  {
    key: "family_plus",
    name: "KindCare Family Plus",
    summary: "Up to four people you support and up to eight caregivers, each with a private care circle.",
    productId: "prod_VHZLiKqVSOUaBF",
    monthlyPriceId: "price_1UH0DCDzwkYa5R1FTOsuGlrS",
    annualPriceId: "price_1UH0DCDzwkYa5R1FxZdGMZRc",
    monthlyCents: 2499,
    annualCents: 24900,
  },
];

export { formatUsd } from "./money.ts";

export function planForPriceId(priceId: string | null | undefined) {
  if (!priceId) return null;
  if (priceId === kindCareFreeTrial.priceId) {
    return { name: kindCareFreeTrial.name };
  }
  return (
    kindCarePlans.find(
      (plan) => plan.monthlyPriceId === priceId || plan.annualPriceId === priceId,
    ) ?? null
  );
}

export function isKnownPriceId(priceId: string) {
  return kindCarePlans.some(
    (plan) => plan.monthlyPriceId === priceId || plan.annualPriceId === priceId,
  );
}

export function allowedPriceIds() {
  return kindCarePlans.flatMap((plan) => [plan.monthlyPriceId, plan.annualPriceId]);
}
