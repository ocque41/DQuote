type PricingRuleBase = {
  id: string;
  type: string;
  name?: string | null;
  config: Record<string, unknown> | null;
};

export type PricingLineItem = {
  optionId: string;
  qty: number;
  unitPrice: number;
  tags: string[];
};

export type PricingRuleViolation = {
  ruleId: string;
  ruleName?: string | null;
  message: string;
};

export type PricingEvaluation = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  violations: PricingRuleViolation[];
};

export type EvaluatePricingArgs = {
  items: PricingLineItem[];
  rules: PricingRuleBase[];
  fallbackTaxRate?: number;
};

type RequireRuleConfig = {
  triggerOptionIds: string[];
  triggerTags: string[];
  requiredOptionIds: string[];
  requiredTags: string[];
};

type MutexRuleConfig = {
  optionIds: string[];
  tags: string[];
};

type DiscountRuleConfig = {
  triggerOptionIds: string[];
  triggerTags: string[];
  appliesToOptionIds: string[];
  appliesToTags: string[];
};

type DiscountFixedRuleConfig = DiscountRuleConfig & {
  amount: number;
};

type DiscountPercentRuleConfig = DiscountRuleConfig & {
  percentage: number;
};

type DiscountThresholdTier = {
  minimum: number;
  percentage: number;
};

type DiscountThresholdRuleConfig = DiscountRuleConfig & {
  thresholds: DiscountThresholdTier[];
};

type TaxRuleConfig = {
  percentage: number;
};

export function evaluatePricing({ items, rules, fallbackTaxRate }: EvaluatePricingArgs): PricingEvaluation {
  const subtotal = Math.max(
    0,
    items.reduce((sum, item) => sum + Math.max(0, item.unitPrice) * Math.max(0, item.qty), 0)
  );

  const selectedOptionIds = new Set<string>();
  const selectedTags = new Set<string>();

  for (const item of items) {
    if (item.qty > 0) {
      selectedOptionIds.add(item.optionId);
      for (const tag of item.tags) {
        selectedTags.add(tag);
      }
    }
  }

  let discountTotal = 0;
  let taxRate = typeof fallbackTaxRate === "number" && Number.isFinite(fallbackTaxRate) ? fallbackTaxRate : 0;
  const violations: PricingRuleViolation[] = [];

  for (const rule of rules) {
    const config = rule.config ?? {};
    switch (rule.type) {
      case "require": {
        const parsed = parseRequireConfig(config);
        const triggered = isTriggerSatisfied(parsed, selectedOptionIds, selectedTags);
        if (!triggered) {
          break;
        }
        const satisfied = isRequirementSatisfied(parsed, selectedOptionIds, selectedTags);
        if (!satisfied) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            message: ruleMessage(rule.name, "requires an additional selection")
          });
        }
        break;
      }
      case "mutex": {
        const parsed = parseMutexConfig(config);
        const conflictingOptionIds = new Set<string>();
        for (const optionId of parsed.optionIds) {
          if (selectedOptionIds.has(optionId)) {
            conflictingOptionIds.add(optionId);
          }
        }
        if (parsed.tags.length) {
          for (const item of items) {
            if (item.qty > 0 && item.tags.some((tag) => parsed.tags.includes(tag))) {
              conflictingOptionIds.add(item.optionId);
            }
          }
        }
        if (conflictingOptionIds.size > 1) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            message: ruleMessage(rule.name, "allows only one of the conflicting options")
          });
        }
        break;
      }
      case "discount_fixed": {
        const parsed = parseDiscountFixedConfig(config);
        if (!parsed) {
          break;
        }
        if (!isTriggerSatisfied(parsed, selectedOptionIds, selectedTags)) {
          break;
        }
        const eligibleSubtotal = calculateEligibleSubtotal(items, parsed);
        if (eligibleSubtotal <= 0) {
          break;
        }
        discountTotal += Math.min(parsed.amount, eligibleSubtotal);
        break;
      }
      case "discount_pct": {
        const parsed = parseDiscountPercentConfig(config);
        if (!parsed) {
          break;
        }
        if (!isTriggerSatisfied(parsed, selectedOptionIds, selectedTags)) {
          break;
        }
        const eligibleSubtotal = calculateEligibleSubtotal(items, parsed);
        if (eligibleSubtotal <= 0) {
          break;
        }
        discountTotal += eligibleSubtotal * (parsed.percentage / 100);
        break;
      }
      case "discount_threshold_pct": {
        const parsed = parseDiscountThresholdConfig(config);
        if (!parsed) {
          break;
        }
        if (!isTriggerSatisfied(parsed, selectedOptionIds, selectedTags)) {
          break;
        }
        const eligibleSubtotal = calculateEligibleSubtotal(items, parsed);
        if (eligibleSubtotal <= 0) {
          break;
        }
        const applicableTier = [...parsed.thresholds]
          .filter((tier) => eligibleSubtotal >= tier.minimum)
          .sort((a, b) => b.minimum - a.minimum)[0];
        if (!applicableTier) {
          break;
        }
        discountTotal += eligibleSubtotal * (applicableTier.percentage / 100);
        break;
      }
      case "tax_pct": {
        const parsed = parseTaxConfig(config);
        if (!parsed) {
          break;
        }
        taxRate = parsed.percentage / 100;
        break;
      }
      default:
        break;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - Math.min(discountTotal, subtotal));
  const tax = discountedSubtotal * Math.max(taxRate, 0);
  const total = discountedSubtotal + tax;

  return {
    subtotal,
    discount: subtotal - discountedSubtotal,
    tax,
    total,
    violations
  };
}

function parseRequireConfig(config: Record<string, unknown>): RequireRuleConfig {
  return {
    triggerOptionIds: stringList(config["triggerOptionIds"] ?? config["triggers"] ?? []),
    triggerTags: stringList(config["triggerTags"] ?? []),
    requiredOptionIds: stringList(config["requiredOptionIds"] ?? config["requires"] ?? []),
    requiredTags: stringList(config["requiredTags"] ?? [])
  };
}

function parseMutexConfig(config: Record<string, unknown>): MutexRuleConfig {
  return {
    optionIds: stringList(config["optionIds"] ?? config["options"] ?? []),
    tags: stringList(config["tags"] ?? config["groupTags"] ?? [])
  };
}

function parseDiscountFixedConfig(config: Record<string, unknown>): DiscountFixedRuleConfig | null {
  const amount = parseNumber(config["amount"]);
  if (amount === null || amount <= 0) {
    return null;
  }
  return {
    amount,
    triggerOptionIds: stringList(config["triggerOptionIds"] ?? config["triggers"] ?? []),
    triggerTags: stringList(config["triggerTags"] ?? []),
    appliesToOptionIds: stringList(config["appliesToOptionIds"] ?? config["targets"] ?? []),
    appliesToTags: stringList(config["appliesToTags"] ?? [])
  };
}

function parseDiscountPercentConfig(config: Record<string, unknown>): DiscountPercentRuleConfig | null {
  const percentage = parseNumber(config["percentage"] ?? config["percent"]);
  if (percentage === null || percentage <= 0) {
    return null;
  }
  return {
    percentage,
    triggerOptionIds: stringList(config["triggerOptionIds"] ?? config["triggers"] ?? []),
    triggerTags: stringList(config["triggerTags"] ?? []),
    appliesToOptionIds: stringList(config["appliesToOptionIds"] ?? config["targets"] ?? []),
    appliesToTags: stringList(config["appliesToTags"] ?? [])
  };
}

function parseDiscountThresholdConfig(config: Record<string, unknown>): DiscountThresholdRuleConfig | null {
  const thresholdsConfig = Array.isArray(config["thresholds"]) ? config["thresholds"] : [];
  const thresholds: DiscountThresholdTier[] = [];
  for (const entry of thresholdsConfig) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const entryRecord = entry as Record<string, unknown>;
    const minimum = parseNumber(entryRecord["minimum"] ?? entryRecord["subtotal"] ?? entryRecord["min"]);
    const percentage = parseNumber(entryRecord["percentage"] ?? entryRecord["percent"]);
    if (minimum === null || minimum < 0) {
      continue;
    }
    if (percentage === null || percentage <= 0) {
      continue;
    }
    thresholds.push({ minimum, percentage });
  }
  if (!thresholds.length) {
    return null;
  }
  thresholds.sort((a, b) => a.minimum - b.minimum);
  return {
    thresholds,
    triggerOptionIds: stringList(config["triggerOptionIds"] ?? config["triggers"] ?? []),
    triggerTags: stringList(config["triggerTags"] ?? []),
    appliesToOptionIds: stringList(config["appliesToOptionIds"] ?? config["targets"] ?? []),
    appliesToTags: stringList(config["appliesToTags"] ?? [])
  };
}

function parseTaxConfig(config: Record<string, unknown>): TaxRuleConfig | null {
  const percentage = parseNumber(config["percentage"] ?? config["percent"]);
  if (percentage === null || percentage < 0) {
    return null;
  }
  return { percentage };
}

function isTriggerSatisfied(
  config: { triggerOptionIds: string[]; triggerTags: string[] },
  selectedOptionIds: Set<string>,
  selectedTags: Set<string>
): boolean {
  const optionSatisfied =
    !config.triggerOptionIds.length || config.triggerOptionIds.some((id) => selectedOptionIds.has(id));
  const tagSatisfied = !config.triggerTags.length || config.triggerTags.every((tag) => selectedTags.has(tag));
  return optionSatisfied && tagSatisfied;
}

function isRequirementSatisfied(
  config: RequireRuleConfig,
  selectedOptionIds: Set<string>,
  selectedTags: Set<string>
): boolean {
  const optionsSatisfied =
    !config.requiredOptionIds.length || config.requiredOptionIds.every((id) => selectedOptionIds.has(id));
  const tagsSatisfied = !config.requiredTags.length || config.requiredTags.every((tag) => selectedTags.has(tag));
  return optionsSatisfied && tagsSatisfied;
}

function calculateEligibleSubtotal(
  items: PricingLineItem[],
  config: DiscountRuleConfig
): number {
  return items.reduce((sum, item) => {
    if (item.qty <= 0) {
      return sum;
    }
    if (config.appliesToOptionIds.length && !config.appliesToOptionIds.includes(item.optionId)) {
      return sum;
    }
    if (
      config.appliesToTags.length &&
      !item.tags.some((tag) => config.appliesToTags.includes(tag))
    ) {
      return sum;
    }
    return sum + Math.max(0, item.unitPrice) * item.qty;
  }, 0);
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry): entry is string => entry.length > 0);
  }
  return [];
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function ruleMessage(ruleName: string | null | undefined, fallback: string): string {
  return ruleName ? `${ruleName} ${fallback}` : fallback;
}
