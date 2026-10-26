/**
 * Pure business logic for restaurant order pricing, discounts, and validation.
 * Decoupled from Express and React for deterministic unit testing.
 * All monetary values are represented in integer piastres (1 EGP = 100 piastres).
 */

export interface ItemPricingInput {
  basePricePiastres: number;
  variantAdjustmentPiastres?: number;
  addons: Array<{ pricePiastres: number; quantity: number }>;
  quantity: number;
}

export interface PromoCodeInput {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 15 for 15% or 5000 for 50 EGP (in piastres)
  minOrderPiastres?: number;
  maxDiscountPiastres?: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  timesUsed?: number;
}

export interface DeliveryZoneInput {
  id: string;
  nameEn: string;
  nameAr: string;
  deliveryFeePiastres: number;
  minOrderPiastres: number;
  estimatedMinutes: number;
  isActive: boolean;
}

/**
 * Calculates line item total in integer piastres:
 * (basePrice + variantAdjustment + sum(addonPrice * addonQty)) * itemQuantity
 */
export function calculateLineItemTotal(item: ItemPricingInput): number {
  if (item.quantity <= 0) return 0;
  const base = Math.max(0, item.basePricePiastres);
  const variant = item.variantAdjustmentPiastres || 0;
  const addonsTotal = (item.addons || []).reduce((sum, a) => {
    return sum + Math.max(0, a.pricePiastres) * Math.max(0, a.quantity);
  }, 0);

  const unitTotal = Math.max(0, base + variant + addonsTotal);
  return unitTotal * item.quantity;
}

/**
 * Calculates cart subtotal across all items in piastres.
 */
export function calculateSubtotal(items: ItemPricingInput[]): number {
  return items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
}

/**
 * Validates a promo code against current subtotal and timestamps.
 */
export function validatePromoCode(
  promo: PromoCodeInput | null | undefined,
  subtotalPiastres: number,
  now: Date = new Date()
): { valid: boolean; discountPiastres: number; reason?: string } {
  if (!promo) {
    return { valid: false, discountPiastres: 0, reason: 'Promo code does not exist.' };
  }

  if (!promo.isActive) {
    return { valid: false, discountPiastres: 0, reason: 'Promo code is inactive.' };
  }

  if (promo.startsAt && new Date(promo.startsAt) > now) {
    return { valid: false, discountPiastres: 0, reason: 'Promo code is not yet active.' };
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < now) {
    return { valid: false, discountPiastres: 0, reason: 'Promo code has expired.' };
  }

  if (promo.usageLimit !== null && promo.usageLimit !== undefined && (promo.timesUsed ?? 0) >= promo.usageLimit) {
    return { valid: false, discountPiastres: 0, reason: 'Promo code usage limit reached.' };
  }

  if (promo.minOrderPiastres && subtotalPiastres < promo.minOrderPiastres) {
    const minEgp = (promo.minOrderPiastres / 100).toFixed(0);
    return {
      valid: false,
      discountPiastres: 0,
      reason: `Minimum order for this promo is EGP ${minEgp}.`,
    };
  }

  let discount = 0;
  if (promo.discountType === 'percentage') {
    // discountValue is percentage, e.g. 10 for 10%
    discount = Math.round((subtotalPiastres * promo.discountValue) / 100);
  } else {
    // fixed discount in piastres
    discount = Math.round(promo.discountValue);
  }

  if (promo.maxDiscountPiastres && discount > promo.maxDiscountPiastres) {
    discount = promo.maxDiscountPiastres;
  }

  // Discount cannot exceed subtotal
  discount = Math.min(discount, subtotalPiastres);
  discount = Math.max(0, discount);

  return { valid: true, discountPiastres: discount };
}

/**
 * Calculates final order totals in integer piastres.
 */
export function calculateOrderTotals(params: {
  items: ItemPricingInput[];
  orderType: 'delivery' | 'pickup';
  deliveryZone?: DeliveryZoneInput | null;
  promo?: PromoCodeInput | null;
  now?: Date;
}): {
  subtotalPiastres: number;
  discountPiastres: number;
  deliveryFeePiastres: number;
  totalPiastres: number;
  error?: string;
} {
  const { items, orderType, deliveryZone, promo, now } = params;

  if (!items || items.length === 0) {
    return {
      subtotalPiastres: 0,
      discountPiastres: 0,
      deliveryFeePiastres: 0,
      totalPiastres: 0,
      error: 'Order must contain at least one item.',
    };
  }

  const subtotal = calculateSubtotal(items);
  if (subtotal <= 0) {
    return {
      subtotalPiastres: 0,
      discountPiastres: 0,
      deliveryFeePiastres: 0,
      totalPiastres: 0,
      error: 'Order subtotal must be greater than zero.',
    };
  }

  let deliveryFee = 0;
  if (orderType === 'delivery') {
    if (!deliveryZone) {
      return {
        subtotalPiastres: subtotal,
        discountPiastres: 0,
        deliveryFeePiastres: 0,
        totalPiastres: subtotal,
        error: 'Please select a valid delivery zone.',
      };
    }

    if (!deliveryZone.isActive) {
      return {
        subtotalPiastres: subtotal,
        discountPiastres: 0,
        deliveryFeePiastres: 0,
        totalPiastres: subtotal,
        error: 'Selected delivery zone is currently unavailable.',
      };
    }

    if (subtotal < deliveryZone.minOrderPiastres) {
      const minEgp = (deliveryZone.minOrderPiastres / 100).toFixed(0);
      return {
        subtotalPiastres: subtotal,
        discountPiastres: 0,
        deliveryFeePiastres: 0,
        totalPiastres: subtotal,
        error: `Minimum order for ${deliveryZone.nameEn} is EGP ${minEgp}.`,
      };
    }

    deliveryFee = Math.max(0, deliveryZone.deliveryFeePiastres);
  }

  let discount = 0;
  if (promo) {
    const promoResult = validatePromoCode(promo, subtotal, now);
    if (promoResult.valid) {
      discount = promoResult.discountPiastres;
    }
  }

  const total = Math.max(0, subtotal - discount + deliveryFee);

  return {
    subtotalPiastres: subtotal,
    discountPiastres: discount,
    deliveryFeePiastres: deliveryFee,
    totalPiastres: total,
  };
}

/**
 * Currency display helper: formats piastres to EGP string.
 */
export function formatPiastresToEgp(piastres: number, lang: 'en' | 'ar' = 'en'): string {
  const egp = (piastres / 100).toFixed(2).replace(/\.00$/, '');
  return lang === 'ar' ? `${egp} ج.م` : `EGP ${egp}`;
}
