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

export const KINDCARE_TRIAL_DAYS = 7;

export const kindCarePlans: KindCarePlan[] = [
  {
    key: "companion",
    name: "KindCare Companion",
    summary: "One household, one person you support, and the caregiver who organizes care.",
    productId: process.env.STRIPE_PRODUCT_COMPANION ?? "prod_VHZLxConhu5NGl",
    monthlyPriceId: process.env.STRIPE_PRICE_COMPANION_MONTHLY ?? "price_1UH0DCDzwkYa5R1F29rWrzb1",
    annualPriceId: process.env.STRIPE_PRICE_COMPANION_ANNUAL ?? "price_1UH0DCDzwkYa5R1FNdgvfh3d",
    monthlyCents: 999,
    annualCents: 9900,
  },
  {
    key: "family",
    name: "KindCare Family",
    summary: "A larger household: up to two people you support and up to four caregivers.",
    productId: process.env.STRIPE_PRODUCT_FAMILY ?? "prod_VHZLBYqQP5Frtx",
    monthlyPriceId: process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? "price_1UH0DCDzwkYa5R1FDg1eW1nB",
    annualPriceId: process.env.STRIPE_PRICE_FAMILY_ANNUAL ?? "price_1UH0DCDzwkYa5R1FncDChiXT",
    monthlyCents: 1499,
    annualCents: 14900,
  },
  {
    key: "family_plus",
    name: "KindCare Family Plus",
    summary: "Up to four people you support and up to eight caregivers, each with a private care circle.",
    productId: process.env.STRIPE_PRODUCT_FAMILY_PLUS ?? "prod_VHZLiKqVSOUaBF",
    monthlyPriceId: process.env.STRIPE_PRICE_FAMILY_PLUS_MONTHLY ?? "price_1UH0DCDzwkYa5R1FTOsuGlrS",
    annualPriceId: process.env.STRIPE_PRICE_FAMILY_PLUS_ANNUAL ?? "price_1UH0DCDzwkYa5R1FxZdGMZRc",
    monthlyCents: 2499,
    annualCents: 24900,
  },
];

export { formatUsd } from "@/lib/billing/money";

export function planForPriceId(priceId: string | null | undefined) {
  if (!priceId) return null;
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
