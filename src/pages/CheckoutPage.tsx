import React, { useState, useEffect, useId } from 'react';
import {
  Bike,
  Store,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { DeliveryZone } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSound } from '../context/SoundContext.tsx';

interface CheckoutPageProps {
  navigate: (path: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ navigate }) => {
  const { language, formatMoney, t } = useLanguage();
  const {
    items,
    orderType,
    setOrderType,
    selectedZone,
    setSelectedZone,
    subtotalPiastres,
    discountPiastres,
    appliedPromo,
    clearCart,
  } = useCart();
  const { user, token } = useAuth();
  const { playOrderPlacedSound } = useSound();

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.defaultAddress || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'cash_on_pickup'>('cash_on_delivery');
  const [idempotencyKey] = useState(() => 'idem-' + Math.random().toString(36).substring(2, 15));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync user info if user logs in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.fullName);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!deliveryAddress && user.defaultAddress) setDeliveryAddress(user.defaultAddress);
    }
  }, [user]);

  // Fetch delivery zones
  useEffect(() => {
    fetch('/api/delivery-zones')
      .then((r) => r.json())
      .then((data: DeliveryZone[]) => {
        if (Array.isArray(data)) {
          setDeliveryZones(data);
          if (data.length > 0 && !selectedZone) {
            setSelectedZone(data[0]);
          }
        }
      })
      .catch(console.error);
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">{t('emptyCart')}</h2>
        <p className="text-gray-400 text-sm">{t('emptyCartPrompt')}</p>
        <button
          onClick={() => navigate('/menu')}
          className="py-3 px-6 rounded-xl bg-[#D62828] text-white font-bold text-sm"
        >
          {t('exploreMenu')}
        </button>
      </div>
    );
  }

  const deliveryFee = orderType === 'delivery' && selectedZone ? selectedZone.delivery_fee_piastres : 0;
  const currentTotal = Math.max(0, subtotalPiastres - discountPiastres + deliveryFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage(language === 'ar' ? 'يرجى إدخال اسم العميل' : 'Please provide your full name');
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 8) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى إدخال رقم هاتف محمول صحيح لتواصل مندوب التوصيل'
          : 'Please enter a valid contact phone number'
      );
      return;
    }

    if (orderType === 'delivery') {
      if (!selectedZone) {
        setErrorMessage(language === 'ar' ? 'يرجى اختيار منطقة التوصيل' : 'Please select a delivery area');
        return;
      }
      if (!deliveryAddress.trim() || deliveryAddress.length < 5) {
        setErrorMessage(
          language === 'ar'
            ? 'يرجى كتابة عنوان التوصيل بالتفصيل (اسم الشارع ورقم العمارة)'
            : 'Please enter your complete delivery street address'
        );
        return;
      }
      if (subtotalPiastres < selectedZone.min_order_piastres) {
        setErrorMessage(
          language === 'ar'
            ? `الحد الأدنى للطلب لمنطقة ${selectedZone.name_ar} هو ${formatMoney(selectedZone.min_order_piastres)}`
            : `Minimum order for ${selectedZone.name_en} is ${formatMoney(selectedZone.min_order_piastres)}`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          addons: i.addons,
          quantity: i.quantity,
          notes: i.notes,
        })),
        orderType,
        deliveryZoneId: orderType === 'delivery' ? selectedZone?.id : undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        promoCode: appliedPromo?.code,
        paymentMethod: orderType === 'pickup' ? 'cash_on_pickup' : 'cash_on_delivery',
        idempotencyKey,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to place order.');
        setIsSubmitting(false);
        return;
      }

      playOrderPlacedSound();
      clearCart();
      navigate(`/order-success/${data.orderId}`);
    } catch {
      setErrorMessage('A network error occurred while connecting to the restaurant. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#10B981]" />
          <span>{language === 'ar' ? 'إتمام الطلب وتأكيد التوصيل' : 'Checkout & Order Placement'}</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {language === 'ar'
            ? 'تأكيد فوري ومباشر مع مطبخ المطعم والدفع نقداً عند الاستلام.'
            : 'Instant direct confirmation with the kitchen. Pay with cash upon delivery or pickup.'}
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-950/80 border border-red-700 rounded-2xl p-4 flex items-center gap-3 text-red-200 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Customer Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Fulfillment Switcher */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1. {language === 'ar' ? 'طريقة الاستلام' : 'Fulfillment Method'}
            </h2>
            <div className="grid grid-cols-2 gap-3 bg-[#111111] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'delivery'
                    ? 'bg-[#D62828] text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>{t('delivery')}</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'pickup'
                    ? 'bg-[#D62828] text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{t('pickup')}</span>
              </button>
            </div>
          </div>

          {/* 2. Customer Contact */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              2. {language === 'ar' ? 'بيانات التواصل' : 'Customer Contact Details'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">{t('customerName')} *</label>
                <div className="relative">
                  <User className="absolute top-3.5 left-3.5 rtl:right-3.5 rtl:left-auto w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Omar Sabit"
                    className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-10 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">{t('customerPhone')} *</label>
                <div className="relative">
                  <Phone className="absolute top-3.5 left-3.5 rtl:right-3.5 rtl:left-auto w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="010XXXXXXXX or 011/012/015"
                    className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-10 text-sm text-white focus:outline-none dir-ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Delivery Details (if delivery) */}
          {orderType === 'delivery' && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 space-y-4 animate-in fade-in">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                3. {language === 'ar' ? 'عنوان ومنطقة التوصيل' : 'Delivery Address & Zone'}
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">{t('deliveryZone')} *</label>
                <select
                  value={selectedZone?.id || ''}
                  onChange={(e) => {
                    const z = deliveryZones.find((item) => item.id === e.target.value);
                    if (z) setSelectedZone(z);
                  }}
                  className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-3 px-3.5 text-sm text-white focus:outline-none"
                >
                  {deliveryZones.map((z) => (
                    <option key={z.id} value={z.id} className="bg-[#1B1B1B]">
                      {language === 'ar' ? z.name_ar : z.name_en} — {formatMoney(z.delivery_fee_piastres)}{' '}
                      ({language === 'ar' ? 'الحد الأدنى' : 'Min'}: {formatMoney(z.min_order_piastres)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">{t('deliveryAddress')} *</label>
                <div className="relative">
                  <MapPin className="absolute top-3.5 left-3.5 rtl:right-3.5 rtl:left-auto w-4 h-4 text-gray-400" />
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={
                      language === 'ar'
                        ? 'الشارع، رقم العمارة، الطابق، الشقة، وأقرب علامة مميزة'
                        : 'Street name, building number, floor, apt, landmarks'
                    }
                    className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-10 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  {language === 'ar' ? 'ملاحظات لمندوب التوصيل' : 'Courier Notes'}
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: رن الجرس مرتين، الاتصال عند الوصول...' : 'e.g. Ring twice, call upon arrival'}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 4. Payment method */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {orderType === 'delivery' ? '4.' : '3.'} {t('paymentMethod')}
            </h2>
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[#10B981] bg-[#10B981] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-black" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    {orderType === 'pickup' ? t('cashOnPickup') : t('cashOnDelivery')}
                  </span>
                  <span className="text-xs text-gray-400 block mt-0.5">
                    {language === 'ar' ? 'الدفع نقداً بالجنيه المصري عند استلام الطلب' : 'Pay in cash (EGP) when you receive your food'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold bg-[#1D2B1C] text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                {language === 'ar' ? 'مفعّل' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Summary & Submit CTA */}
        <div className="lg:col-span-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-7 space-y-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? 'أصناف الطلب' : 'Order Review'}
          </h2>

          {/* Items Recap */}
          <div className="max-h-60 overflow-y-auto space-y-2.5 divide-y divide-[#222222] pr-1">
            {items.map((i) => (
              <div key={i.id} className="pt-2 first:pt-0 flex justify-between items-start text-xs text-gray-300">
                <div>
                  <span className="font-bold text-white">{i.quantity}x </span>
                  <span>{language === 'ar' ? i.product.name_ar : i.product.name_en}</span>
                  {i.variant && (
                    <span className="block text-[11px] text-[#FF8A00]">
                      ({language === 'ar' ? i.variant.name_ar : i.variant.name_en})
                    </span>
                  )}
                  {i.addons.length > 0 && (
                    <span className="block text-[10px] text-gray-400">
                      +{i.addons.map((a) => (language === 'ar' ? a.nameAr : a.nameEn)).join(', ')}
                    </span>
                  )}
                </div>
                <span className="font-bold text-white shrink-0">
                  {formatMoney(i.totalPricePiastres)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-xs sm:text-sm text-gray-300 pt-4 border-t border-[#262626]">
            <div className="flex justify-between">
              <span>{t('subtotal')}</span>
              <span className="font-bold text-white">{formatMoney(subtotalPiastres)}</span>
            </div>

            {discountPiastres > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>{t('discount')}</span>
                <span className="font-bold">-{formatMoney(discountPiastres)}</span>
              </div>
            )}

            {orderType === 'delivery' && (
              <div className="flex justify-between">
                <span>{t('deliveryFee')}</span>
                <span className="font-bold text-white">{formatMoney(deliveryFee)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#2A2A2A] flex justify-between text-lg font-black text-white">
              <span>{t('total')}</span>
              <span className="text-[#FF8A00]">{formatMoney(currentTotal)}</span>
            </div>
          </div>

          {/* Security lock note */}
          <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
            <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span>
              {language === 'ar'
                ? 'حماية مشددة: يُعاد حساب جميع الأسعار والخصومات أوتوماتيكياً على السيرفر.'
                : 'Server-side validated: line items and discounts verified securely.'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D62828] to-[#b82222] hover:from-[#e02d2d] hover:to-[#c02323] text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-[#D62828]/25 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('placeOrder')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
