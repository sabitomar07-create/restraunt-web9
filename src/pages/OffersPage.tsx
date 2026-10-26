import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Flame, Tag, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Offer } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface OffersPageProps {
  navigate: (path: string) => void;
}

export const OffersPage: React.FC<OffersPageProps> = ({ navigate }) => {
  const { language, t, formatMoney, isRtl } = useLanguage();
  const { applyPromoCode, setIsCartOpen } = useCart();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/offers')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOffers(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    applyPromoCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D62828]/20 border border-[#D62828]/40 text-[#FF8A00] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'عروض المحروسة الحصرية' : 'Exclusive Street Deals'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          {t('offers')}
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed">
          {language === 'ar'
            ? 'وفر مع أقوى عروض السندوتشات وبوكسات الحواوشي العائلية، واستمتع بخصومات حصرية على طلبات التوصيل.'
            : 'Save big with our special hawawshi party boxes, first-order discounts, and lunch sandwich combos.'}
        </p>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="group relative bg-[#1B1B1B] hover:bg-[#202020] border border-[#2D2D2D] hover:border-[#FF8A00]/40 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between"
          >
            {/* Banner Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#111111]">
              <img
                src={offer.banner_url}
                alt={offer.title_en}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B1B1B] via-black/40 to-transparent" />

              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="bg-[#D62828] text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                  {offer.discount_type === 'percentage'
                    ? `${offer.discount_value}% OFF`
                    : `${formatMoney(offer.discount_value)} OFF`}
                </span>

                {offer.min_order_piastres > 0 && (
                  <span className="bg-black/70 backdrop-blur-md text-gray-200 text-xs font-bold px-3 py-1 rounded-full border border-gray-700">
                    {language === 'ar'
                      ? `للطلبات فوق ${formatMoney(offer.min_order_piastres)}`
                      : `Orders over ${formatMoney(offer.min_order_piastres)}`}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#FF8A00] transition-colors">
                  {language === 'ar' ? offer.title_ar : offer.title_en}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {language === 'ar' ? offer.description_ar : offer.description_en}
                </p>
              </div>

              {/* Promo Code & Action */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-between gap-4">
                {offer.promo_code ? (
                  <button
                    onClick={() => handleCopy(offer.promo_code!)}
                    className="flex items-center gap-2 bg-[#252525] hover:bg-[#303030] border border-[#3A3A3A] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold text-[#FF8A00] transition-colors"
                    title="Click to copy and apply code"
                  >
                    {copiedCode === offer.promo_code ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">{language === 'ar' ? 'تم النسخ!' : 'Applied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{offer.promo_code}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 font-medium">
                    {language === 'ar' ? 'يطبق تلقائياً' : 'Applies automatically'}
                  </span>
                )}

                <button
                  onClick={() => navigate('/menu')}
                  className="py-2.5 px-5 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-md"
                >
                  <span>{language === 'ar' ? 'اطلب الآن' : 'Order Dishes'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
