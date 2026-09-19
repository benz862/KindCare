import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { kindCarePlans } from "../billing/plans.ts";
import {
  countByStatus,
  estimatedMrrCents,
  monthlyCentsForPriceId,
  planLabel,
  planMix,
  planName,
  stripeDashboardUrl,
} from "./metrics.ts";

describe("owner billing metrics", () => {
  it("converts monthly and annual price IDs into estimated MRR", () => {
    const companion = kindCarePlans[0];
    assert.equal(monthlyCentsForPriceId(companion.monthlyPriceId), 999);
    assert.equal(monthlyCentsForPriceId(companion.annualPriceId), Math.round(9900 / 12));
    assert.equal(
      estimatedMrrCents([
        { status: "active", stripePriceId: companion.monthlyPriceId, cancelAtPeriodEnd: false },
        { status: "trialing", stripePriceId: companion.annualPriceId, cancelAtPeriodEnd: false },
        { status: "canceled", stripePriceId: companion.monthlyPriceId, cancelAtPeriodEnd: false },
      ]),
      999 + Math.round(9900 / 12),
    );
  });

  it("counts subscription health and plan mix without payment details", () => {
    const companion = kindCarePlans[0];
    const family = kindCarePlans[1];
    const rows = [
      { status: "active", stripePriceId: companion.monthlyPriceId, cancelAtPeriodEnd: false },
      { status: "past_due", stripePriceId: family.monthlyPriceId, cancelAtPeriodEnd: false },
      { status: "trialing", stripePriceId: family.monthlyPriceId, cancelAtPeriodEnd: true },
    ];
    assert.equal(countByStatus(rows).active, 1);
    assert.equal(countByStatus(rows).past_due, 1);
    const mix = Object.fromEntries(planMix(rows).map((item) => [item.name, item.count]));
    assert.equal(mix["KindCare Family"], 1);
    assert.equal(mix["KindCare Companion"], 1);
  });

  it("labels catalog plans without exposing price IDs in owner copy", () => {
    const companion = kindCarePlans[0];
    assert.equal(planName(companion.monthlyPriceId), "KindCare Companion");
    assert.equal(planLabel(companion.monthlyPriceId), "KindCare Companion monthly");
    assert.equal(planLabel(companion.annualPriceId), "KindCare Companion annual");
    assert.equal(planLabel(null), "Unknown plan");
  });

  it("builds a Stripe Dashboard URL without embedding secrets", () => {
    assert.equal(
      stripeDashboardUrl({ livemode: true, kind: "subscriptions", id: "sub_123" }),
      "https://dashboard.stripe.com/subscriptions/sub_123",
    );
    assert.equal(
      stripeDashboardUrl({ livemode: false, kind: "invoices", id: "in_123" }),
      "https://dashboard.stripe.com/test/invoices/in_123",
    );
  });
});
