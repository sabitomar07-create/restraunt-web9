import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLineItemTotal,
  calculateSubtotal,
  validatePromoCode,
  calculateOrderTotals,
  formatPiastresToEgp,
} from './rules.ts';

test('calculateLineItemTotal correctly computes base + variant + addons * qty', () => {
  // Alexandrian liver sandwich: 8500 piastres (85 EGP)
  // Large size variant: +2000 piastres
  // Addon Tahini: 2000 piastres x 2 = 4000 piastres
  // Unit = 8500 + 2000 + 4000 = 14500 piastres (145 EGP)
  // Quantity: 3 => 43500 piastres
  const lineItem = {
    basePricePiastres: 8500,
    variantAdjustmentPiastres: 2000,
    addons: [{ pricePiastres: 2000, quantity: 2 }],
    quantity: 3,
  };
  const total = calculateLineItemTotal(lineItem);
  assert.equal(total, 43500);
});

test('calculateLineItemTotal returns 0 for zero or negative quantity', () => {
  const lineItem = {
    basePricePiastres: 5000,
    addons: [],
    quantity: 0,
  };
  assert.equal(calculateLineItemTotal(lineItem), 0);
});

test('calculateSubtotal sums multiple items correctly', () => {
  const items = [
    { basePricePiastres: 3500, addons: [], quantity: 2 }, // Foul: 7000 piastres
    { basePricePiastres: 11000, addons: [], quantity: 1 }, // Hawawshi: 11000 piastres
  ];
  assert.equal(calculateSubtotal(items), 18000);
});

test('validatePromoCode applies percentage discount with cap', () => {
  const promo = {
    code: 'WELCOME10',
    discountType: 'percentage' as const,
    discountValue: 10, // 10%
    maxDiscountPiastres: 2500, // 25 EGP cap
    isActive: true,
  };

  // Subtotal = 30000 piastres (300 EGP). 10% is 3000, capped at 2500
  const result = validatePromoCode(promo, 30000);
  assert.equal(result.valid, true);
  assert.equal(result.discountPiastres, 2500);
});

test('validatePromoCode rejects expired or inactive code', () => {
  const expiredPromo = {
    code: 'OLDDEAL',
    discountType: 'fixed' as const,
    discountValue: 2000,
    isActive: true,
    expiresAt: '2020-01-01T00:00:00Z',
  };
  const result = validatePromoCode(expiredPromo, 10000, new Date('2026-10-22T00:00:00Z'));
  assert.equal(result.valid, false);
});

test('calculateOrderTotals enforces delivery zone min order and adds delivery fee', () => {
  const zone = {
    id: 'zone-1',
    nameEn: 'Downtown / Zamalek',
    nameAr: 'وسط البلد / الزمالك',
    deliveryFeePiastres: 2500, // 25 EGP
    minOrderPiastres: 10000, // 100 EGP min
    estimatedMinutes: 35,
    isActive: true,
  };

  // Item under minimum: 8500 piastres (85 EGP)
  const lowItem = [{ basePricePiastres: 8500, addons: [], quantity: 1 }];
  const lowRes = calculateOrderTotals({
    items: lowItem,
    orderType: 'delivery',
    deliveryZone: zone,
  });
  assert.ok(lowRes.error);

  // Item meeting minimum: 2x 8500 = 17000 piastres (170 EGP)
  const okItems = [{ basePricePiastres: 8500, addons: [], quantity: 2 }];
  const okRes = calculateOrderTotals({
    items: okItems,
    orderType: 'delivery',
    deliveryZone: zone,
  });
  assert.equal(okRes.error, undefined);
  assert.equal(okRes.subtotalPiastres, 17000);
  assert.equal(okRes.deliveryFeePiastres, 2500);
  assert.equal(okRes.totalPiastres, 19500); // 17000 + 2500
});

test('calculateOrderTotals for pickup has 0 delivery fee', () => {
  const okItems = [{ basePricePiastres: 8500, addons: [], quantity: 1 }];
  const res = calculateOrderTotals({
    items: okItems,
    orderType: 'pickup',
  });
  assert.equal(res.subtotalPiastres, 8500);
  assert.equal(res.deliveryFeePiastres, 0);
  assert.equal(res.totalPiastres, 8500);
});

test('formatPiastresToEgp formats correctly for English and Arabic', () => {
  assert.equal(formatPiastresToEgp(8500, 'en'), 'EGP 85');
  assert.equal(formatPiastresToEgp(8500, 'ar'), '85 ج.م');
  assert.equal(formatPiastresToEgp(1250, 'en'), 'EGP 12.50');
});
