import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, ShoppingBag, Bike, Store } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useCart } from '../../context/CartContext.tsx';

interface CartDrawerProps {
  navigate: (path: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ navigate }) => {
  const { language, formatMoney, t, isRtl } = useLanguage();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
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

  if (!isCartOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    await applyPromoCode(promoInput);
    setIsApplyingPromo(false);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('yourCart')}
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[#161616] border-s border-[#2A2A2A] h-full flex flex-col shadow-2xl text-white relative animate-in slide-in-from-end duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#FF8A00]" />
            <h2 className="font-extrabold text-lg text-white">
              {t('yourCart')}
            </h2>
            <span className="text-xs bg-[#2A2A2A] text-gray-300 font-bold px-2 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart drawer"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delivery / Pickup Switcher */}
        <div className="p-3 bg-[#131313] border-b border-[#222222]">
          <div className="grid grid-cols-2 gap-1 bg-[#1F1F1F] p-1 rounded-xl">
            <button
              onClick={() => setOrderType('delivery')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#222222]">
          {items.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#222222] text-gray-500 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-gray-300">{t('emptyCart')}</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">{t('emptyCartPrompt')}</p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/menu');
                }}
                className="mt-2 py-2.5 px-6 rounded-xl bg-[#D62828] text-white text-xs font-bold hover:bg-[#b52020] transition-colors"
              >
                {t('exploreMenu')}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const pName = language === 'ar' ? item.product.name_ar : item.product.name_en;
              const vName = item.variant ? (language === 'ar' ? item.variant.name_ar : item.variant.name_en) : null;
              return (
                <div key={item.id} className="pt-3 first:pt-0 flex gap-3 items-start">
                  {/* Thumbnail */}
                  <img
                    src={item.product.image_url}
                    alt={pName}
                    className="w-16 h-16 rounded-xl object-cover bg-[#222222] shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{pName}</h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors"
                        aria-label={`Remove ${pName} from cart`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {vName && (
                      <p className="text-xs text-[#FF8A00] font-medium mt-0.5">
                        {vName}
                      </p>
                    )}

                    {item.addons && item.addons.length > 0 && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        + {item.addons.map((a) => (language === 'ar' ? a.nameAr : a.nameEn)).join(', ')}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-gray-400 italic mt-0.5 truncate">
                        "{item.notes}"
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-[#222222] border border-[#303030] rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-white">
                        {formatMoney(item.totalPricePiastres)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Promo Code Box */}
        {items.length > 0 && (
          <div className="p-4 bg-[#141414] border-t border-[#222222] space-y-2">
            {appliedPromo ? (
              <div className="flex items-center justify-between bg-[#1D2B1C] border border-[#10B981]/40 rounded-xl px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-[#34D399] font-bold">
                  <Tag className="w-4 h-4" />
                  <span>{appliedPromo.code} (-{formatMoney(appliedPromo.discountPiastres)})</span>
                </div>
                <button
                  onClick={removePromoCode}
                  className="text-gray-400 hover:text-white font-medium"
                >
                  {language === 'ar' ? 'إزالة' : 'Remove'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('enterPromo')}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#202020] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 uppercase tracking-wider focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isApplyingPromo || !promoInput.trim()}
                  className="py-2 px-3 bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {t('applyPromo')}
                </button>
              </form>
            )}
            {promoError && (
              <p className="text-[11px] text-red-400 font-medium">{promoError}</p>
            )}
          </div>
        )}

        {/* Pricing Summary & Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#121212] border-t border-[#262626] space-y-3">
            <div className="space-y-1.5 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>{t('subtotal')}</span>
                <span className="font-bold text-white">{formatMoney(subtotalPiastres)}</span>
              </div>

              {discountPiastres > 0 && (
                <div className="flex justify-between text-[#34D399]">
                  <span>{t('discount')}</span>
                  <span className="font-bold">-{formatMoney(discountPiastres)}</span>
                </div>
              )}

              {orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span>{t('deliveryFee')}</span>
                  <span className="font-bold text-white">
                    {deliveryFeePiastres > 0
                      ? formatMoney(deliveryFeePiastres)
                      : (language === 'ar' ? 'يُحسب عند الدفع' : 'Calculated at checkout')}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#262626] flex justify-between text-base font-black text-white">
                <span>{t('total')}</span>
                <span className="text-[#FF8A00]">{formatMoney(finalTotalPiastres)}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D62828] to-[#b82222] hover:from-[#e02d2d] hover:to-[#c02323] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-[#D62828]/25 transition-all transform active:scale-95"
            >
              <span>{t('checkout')}</span>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
