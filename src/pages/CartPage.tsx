import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, ArrowLeft, Trash2, Plus, Minus, Tag, Bike, Store } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface CartPageProps {
  navigate: (path: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ navigate }) => {
  const { language, formatMoney, t, isRtl } = useLanguage();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotalPiastres,
    discountPiastres,
    deliveryFeePiastres,
    finalTotalPiastres,
    orderType,
    setOrderType,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    promoError,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    await applyPromoCode(promoInput);
    setIsApplyingPromo(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-[#1F1F1F] text-gray-500 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t('emptyCart')}</h1>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">{t('emptyCartPrompt')}</p>
        <button
          onClick={() => navigate('/menu')}
          className="py-3.5 px-8 rounded-2xl bg-[#D62828] hover:bg-[#b82020] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#D62828]/25 transition-all"
        >
          {t('exploreMenu')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <ShoppingBag className="w-7 h-7 text-[#FF8A00]" />
          <span>{t('yourCart')}</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-xs sm:text-sm font-semibold text-gray-400 hover:text-red-400 transition-colors"
        >
          {language === 'ar' ? 'تفريغ السلة' : 'Clear Cart'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-7 bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 space-y-4 divide-y divide-[#262626]">
          {/* Order type toggle */}
          <div className="pb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              {language === 'ar' ? 'نوع الطلب' : 'Fulfillment Type'}
            </span>
            <div className="grid grid-cols-2 gap-2 bg-[#121212] p-1.5 rounded-2xl">
              <button
                onClick={() => setOrderType('delivery')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'delivery'
                    ? 'bg-[#D62828] text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>{t('delivery')}</span>
              </button>
              <button
                onClick={() => setOrderType('pickup')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
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

          {items.map((item) => {
            const pName = language === 'ar' ? item.product.name_ar : item.product.name_en;
            const vName = item.variant ? (language === 'ar' ? item.variant.name_ar : item.variant.name_en) : null;
            return (
              <div key={item.id} className="pt-4 first:pt-0 flex gap-4 items-start">
                <img
                  src={item.product.image_url}
                  alt={pName}
                  className="w-20 h-20 rounded-2xl object-cover bg-[#111111] shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white truncate">{pName}</h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {vName && <p className="text-xs text-[#FF8A00] font-semibold mt-0.5">{vName}</p>}

                  {item.addons && item.addons.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      + {item.addons.map((a) => (language === 'ar' ? a.nameAr : a.nameEn)).join(', ')}
                    </p>
                  )}

                  {item.notes && (
                    <p className="text-xs text-gray-400 italic mt-1">
                      "{item.notes}"
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center bg-[#141414] border border-[#2E2E2E] rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-base font-black text-white">
                      {formatMoney(item.totalPricePiastres)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-7 space-y-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? 'ملخص الحساب' : 'Order Summary'}
          </h2>

          {/* Promo form */}
          <div className="space-y-2">
            {appliedPromo ? (
              <div className="flex items-center justify-between bg-[#1C291B] border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300">
                <div className="flex items-center gap-2 font-bold">
                  <Tag className="w-4 h-4" />
                  <span>{appliedPromo.code} (-{formatMoney(appliedPromo.discountPiastres)})</span>
                </div>
                <button
                  onClick={removePromoCode}
                  className="text-gray-400 hover:text-white font-medium"
                >
                  {language === 'ar' ? 'حذف' : 'Remove'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('enterPromo')}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#141414] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl px-3 py-2.5 text-xs text-white uppercase focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isApplyingPromo || !promoInput.trim()}
                  className="py-2 px-4 bg-[#262626] hover:bg-[#333333] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {t('applyPromo')}
                </button>
              </form>
            )}
            {promoError && <p className="text-xs text-red-400">{promoError}</p>}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 text-sm text-gray-300 pt-2 border-t border-[#262626]">
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
                <span className="font-bold text-white">
                  {deliveryFeePiastres > 0 ? formatMoney(deliveryFeePiastres) : (language === 'ar' ? 'يحدد بالخطوة التالية' : 'Selected at checkout')}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-[#2A2A2A] flex justify-between text-lg font-black text-white">
              <span>{t('total')}</span>
              <span className="text-[#FF8A00]">{formatMoney(finalTotalPiastres)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D62828] to-[#b82222] hover:from-[#e02d2d] hover:to-[#c02323] text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-[#D62828]/25 transition-all transform active:scale-95"
          >
            <span>{t('checkout')}</span>
            {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
