import assert from "node:assert";
import test from "node:test";

import { evaluatePricing, PricingLineItem } from "./rules";

const baseItems: PricingLineItem[] = [
  {
    optionId: "core-a",
    qty: 1,
    unitPrice: 1200,
    tags: ["core", "dj"]
  },
  {
    optionId: "lighting-pro",
    qty: 0,
    unitPrice: 980,
    tags: ["lighting", "premium"]
  },
  {
    optionId: "lighting-basic",
    qty: 1,
    unitPrice: 550,
    tags: ["lighting"]
  }
];

test("require rule flags missing dependency", () => {
  const result = evaluatePricing({
    items: baseItems,
    rules: [
      {
        id: "rule-req",
        type: "require",
        name: "Premium lighting requires DJ",
        config: {
          triggerOptionIds: ["lighting-pro"],
          requiredOptionIds: ["core-a"]
        }
      }
    ]
  });

  assert.strictEqual(result.violations.length, 0, "no violation when trigger not selected");

  const withTrigger = evaluatePricing({
    items: baseItems.map((item) =>
      item.optionId === "lighting-pro" ? { ...item, qty: 1 } : item
    ),
    rules: [
      {
        id: "rule-req",
        type: "require",
        name: "Premium lighting requires DJ",
        config: {
          triggerOptionIds: ["lighting-pro"],
          requiredOptionIds: ["core-a"]
        }
      }
    ]
  });

  assert.strictEqual(withTrigger.violations.length, 0, "require satisfied when DJ is selected");

  const withoutRequired = evaluatePricing({
    items: baseItems.map((item) =>
      item.optionId === "core-a" ? { ...item, qty: 0 } : item.optionId === "lighting-pro" ? { ...item, qty: 1 } : item
    ),
    rules: [
      {
        id: "rule-req",
        type: "require",
        name: "Premium lighting requires DJ",
        config: {
          triggerOptionIds: ["lighting-pro"],
          requiredOptionIds: ["core-a"]
        }
      }
    ]
  });

  assert.strictEqual(withoutRequired.violations.length, 1, "violation raised when dependency missing");
  assert.match(withoutRequired.violations[0]?.message ?? "", /requires/);
});

test("mutex rule prevents conflicting options", () => {
  const result = evaluatePricing({
    items: baseItems,
    rules: [
      {
        id: "rule-mutex",
        type: "mutex",
        name: "Only one lighting package",
        config: {
          optionIds: ["lighting-pro", "lighting-basic"]
        }
      }
    ]
  });

  assert.strictEqual(result.violations.length, 0, "no violation with single lighting selection");

  const withConflict = evaluatePricing({
    items: baseItems.map((item) =>
      item.optionId === "lighting-pro" ? { ...item, qty: 1 } : item
    ),
    rules: [
      {
        id: "rule-mutex",
        type: "mutex",
        name: "Only one lighting package",
        config: {
          optionIds: ["lighting-pro", "lighting-basic"]
        }
      }
    ]
  });

  assert.strictEqual(withConflict.violations.length, 1, "violation raised when both lighting options active");
});

test("percentage discount and tax apply deterministically", () => {
  const result = evaluatePricing({
    items: baseItems,
    rules: [
      {
        id: "rule-discount",
        type: "discount_pct",
        name: "Bundle discount",
        config: {
          triggerTags: ["dj", "lighting"],
          percentage: 10
        }
      },
      {
        id: "rule-tax",
        type: "tax_pct",
        name: "VAT",
        config: {
          percentage: 21
        }
      }
    ]
  });

  const expectedSubtotal = 1750; // 1200 + 550
  const expectedDiscount = expectedSubtotal * 0.1;
  const expectedTaxBase = expectedSubtotal - expectedDiscount;
  const expectedTax = expectedTaxBase * 0.21;
  const expectedTotal = expectedTaxBase + expectedTax;

  assert.strictEqual(result.subtotal, expectedSubtotal);
  assert.ok(Math.abs(result.discount - expectedDiscount) < 0.0001);
  assert.ok(Math.abs(result.tax - expectedTax) < 0.0001);
  assert.ok(Math.abs(result.total - expectedTotal) < 0.0001);
  assert.strictEqual(result.violations.length, 0);
});

test("threshold discount selects highest qualifying tier", () => {
  const rule = {
    id: "rule-threshold",
    type: "discount_threshold_pct",
    name: "Spend more, save more",
    config: {
      thresholds: [
        { minimum: 1500, percentage: 8 },
        { minimum: 2500, percentage: 12 }
      ],
      appliesToTags: ["dj", "lighting"]
    }
  } as const;

  const baseResult = evaluatePricing({
    items: baseItems,
    rules: [rule]
  });

  assert.strictEqual(baseResult.violations.length, 0);
  assert.ok(Math.abs(baseResult.discount - 1750 * 0.08) < 0.0001);

  const upgradedItems = baseItems.map((item) =>
    item.optionId === "lighting-pro" ? { ...item, qty: 1 } : item
  );

  const upgradedResult = evaluatePricing({
    items: upgradedItems,
    rules: [rule]
  });

  const upgradedSubtotal = upgradedItems
    .filter((item) => item.qty > 0)
    .reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  assert.ok(upgradedSubtotal >= 2500);
  assert.ok(Math.abs(upgradedResult.discount - upgradedSubtotal * 0.12) < 0.0001);
});
