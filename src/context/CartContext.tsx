import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, SelectedAddon, DeliveryZone } from '../types/index.ts';
import { useSound } from './SoundContext.tsx';
import { calculateLineItemTotal } from '../server/rules.ts';

interface AppliedPromo {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountPiastres: number;
}

interface CartContextType {
  items: CartItem[];
  totalItemCount: number;
  subtotalPiastres: number;
  discountPiastres: number;
  deliveryFeePiastres: number;
  finalTotalPiastres: number;
  orderType: 'delivery' | 'pickup';
  setOrderType: (type: 'delivery' | 'pickup') => void;
  selectedZone: DeliveryZone | null;
  setSelectedZone: (zone: DeliveryZone | null) => void;
  appliedPromo: AppliedPromo | null;
  promoError: string | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (product: Product, variant?: ProductVariant, addons?: SelectedAddon[], quantity?: number, notes?: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  removePromoCode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { playAddToCartSound } = useSound();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('app_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist cart items
  useEffect(() => {
    localStorage.setItem('app_cart_items', JSON.stringify(items));
  }, [items]);

  // Total count of distinct units in cart
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Subtotal in piastres
  const subtotalPiastres = items.reduce((sum, item) => sum + item.totalPricePiastres, 0);

  // Delivery fee
  const deliveryFeePiastres = orderType === 'delivery' && selectedZone ? selectedZone.delivery_fee_piastres : 0;

  // Discount
  const discountPiastres = appliedPromo ? appliedPromo.discountPiastres : 0;

  // Final Total
  const finalTotalPiastres = Math.max(0, subtotalPiastres - discountPiastres + deliveryFeePiastres);

  // Re-validate promo code whenever subtotal changes
  useEffect(() => {
    if (appliedPromo && subtotalPiastres > 0) {
      applyPromoCode(appliedPromo.code);
    } else if (subtotalPiastres === 0 && appliedPromo) {
      setAppliedPromo(null);
    }
  }, [subtotalPiastres]);

  const addItem = (
    product: Product,
    variant?: ProductVariant,
    addons: SelectedAddon[] = [],
    quantity: number = 1,
    notes?: string
  ) => {
    playAddToCartSound();
    const qty = Math.max(1, quantity);

    // Calculate line total using exact server business rule
    const variantAdj = variant ? variant.price_adjustment_piastres : 0;
    const addonsTotal = addons.reduce((sum, a) => sum + a.pricePiastres * a.quantity, 0);
    const unitPrice = Math.max(0, product.base_price_piastres + variantAdj + addonsTotal);
    const totalPrice = unitPrice * qty;

    // Create unique key based on product, variant, sorted addons, and notes
    const addonKey = addons
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((a) => `${a.id}:${a.quantity}`)
      .join('-');
    const cartItemId = `${product.id}_${variant ? variant.id : 'novar'}_${addonKey}_${notes || ''}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === cartItemId);
      if (existingIdx > -1) {
        const next = [...prev];
        const newQty = next[existingIdx].quantity + qty;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: newQty,
          totalPricePiastres: next[existingIdx].unitPricePiastres * newQty,
        };
        return next;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          product,
          variantId: variant?.id,
          variant,
          addons,
          notes,
          quantity: qty,
          unitPricePiastres: unitPrice,
          totalPricePiastres: totalPrice,
        };
        return [newItem, ...prev];
      }
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPricePiastres: item.unitPricePiastres * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromo(null);
    setPromoError(null);
  };

  const applyPromoCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    setPromoError(null);
    if (!code || !code.trim()) {
      return { success: false, error: 'Please enter a promo code.' };
    }

    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          subtotalPiastres,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || 'Invalid promo code');
        setAppliedPromo(null);
        return { success: false, error: data.error || 'Invalid promo code' };
      }

      setAppliedPromo({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountPiastres: data.discountPiastres,
      });

      return { success: true };
    } catch {
      const err = 'Failed to validate promo code.';
      setPromoError(err);
      return { success: false, error: err };
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalItemCount,
        subtotalPiastres,
        discountPiastres,
        deliveryFeePiastres,
        finalTotalPiastres,
        orderType,
        setOrderType,
        selectedZone,
        setSelectedZone,
        appliedPromo,
        promoError,
        isCartOpen,
        setIsCartOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyPromoCode,
        removePromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
