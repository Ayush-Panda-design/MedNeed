export interface EffectivePricing {
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
  savings: number;
  appliedRuleTitle?: string;
}

export interface RuleLike {
  id?: string;
  title?: string;
  scope: string; // 'ALL_MEDICINES' | 'CATEGORY'
  targetCategory?: string | null;
  discountPercentage: number | string | { toString(): string };
  isActive: boolean;
}

/**
 * Computes dynamic selling price and discount with strict precedence:
 * 1. Specific Category Rule (e.g. "Diabetes Special 20% OFF")
 * 2. Storewide Rule (e.g. "Storewide Flat 10% OFF")
 * 3. Base product discount (fallback)
 * 
 * Baseline MRP is never mutated. Toggling or deleting a discount rule
 * automatically restores original catalog pricing instantly on the next read.
 */
export function calculateEffectivePrice(
  baseMrp: number,
  baselineDiscount: number = 0,
  category: string = '',
  activeRules: RuleLike[] = []
): EffectivePricing {
  const mrp = Math.max(0, Number(baseMrp) || 0);
  let effectiveDiscount = Math.max(0, Math.min(90, Number(baselineDiscount) || 0));
  let appliedTitle: string | undefined;

  const normCat = (category || '').toLowerCase().trim();

  // 1. Check matching category rules
  const matchingCategoryRules = activeRules.filter(
    (r) => r.isActive && r.scope === 'CATEGORY' && (r.targetCategory || '').toLowerCase().trim() === normCat
  );
  if (matchingCategoryRules.length > 0) {
    const bestCategoryRule = matchingCategoryRules.reduce((prev, curr) =>
      Number(curr.discountPercentage) > Number(prev.discountPercentage) ? curr : prev
    );
    const catPercent = Number(bestCategoryRule.discountPercentage);
    if (catPercent > effectiveDiscount) {
      effectiveDiscount = catPercent;
      appliedTitle = bestCategoryRule.title;
    }
  }

  // 2. Check storewide rules
  const storewideRules = activeRules.filter((r) => r.isActive && r.scope === 'ALL_MEDICINES');
  if (storewideRules.length > 0) {
    const bestStorewideRule = storewideRules.reduce((prev, curr) =>
      Number(curr.discountPercentage) > Number(prev.discountPercentage) ? curr : prev
    );
    const storewidePercent = Number(bestStorewideRule.discountPercentage);
    if (storewidePercent > effectiveDiscount) {
      effectiveDiscount = storewidePercent;
      appliedTitle = bestStorewideRule.title;
    }
  }

  const sellingPrice = Number((mrp * (1 - effectiveDiscount / 100)).toFixed(2));
  const savings = Number((mrp - sellingPrice).toFixed(2));

  return {
    mrp,
    sellingPrice,
    discountPercentage: effectiveDiscount,
    savings,
    appliedRuleTitle: appliedTitle,
  };
}
