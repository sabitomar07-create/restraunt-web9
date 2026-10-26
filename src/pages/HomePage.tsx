import React, { useEffect, useState } from 'react';
import {
  Flame,
  ArrowRight,
  ArrowLeft,
  Bike,
  Store,
  Sparkles,
  Clock,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Product, Category, Offer } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { ProductCard } from '../components/common/ProductCard.tsx';
import { ProductModal } from '../components/common/ProductModal.tsx';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { language, t, isRtl, formatMoney } = useLanguage();
  const { orderType, setOrderType } = useCart();
  const { settings } = useSettings();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products?featured=1').then((r) => r.json()),
      fetch('/api/offers').then((r) => r.json()),
    ])
      .then(([cats, prods, offs]) => {
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(prods)) setFeaturedProducts(prods);
        if (Array.isArray(offs)) setOffers(offs);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const brandName = language === 'ar' ? settings.restaurantNameAr : settings.restaurantNameEn;
  const tagline = language === 'ar' ? settings.taglineAr : settings.taglineEn;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#0D0D0D] border-b border-[#222222]">
        {/* Ambient street food backdrop glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D62828]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#FF8A00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left rtl:lg:text-right">
            {/* Delivery / Pickup quick toggle */}
            <div className="inline-flex p-1 bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl shadow-inner">
              <button
                onClick={() => setOrderType('delivery')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
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
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  orderType === 'pickup'
                    ? 'bg-[#D62828] text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{t('pickup')}</span>
              </button>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              {language === 'ar' ? (
                <>
                  أصل السندوتشات المصرية{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A00] to-[#D62828]">
                    وطعم الشارع الأصيل
                  </span>
                </>
              ) : (
                <>
                  Authentic Egyptian Street Food &{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A00] to-[#D62828]">
                    Sizzling Sandwiches
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
              {tagline} — {t('streetFoodSubtitle')}
            </p>

            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto lg:mx-0 flex gap-2">
              <div className="relative flex-1">
                <Search className={`absolute top-3.5 ${isRtl ? 'right-3.5' : 'left-3.5'} w-5 h-5 text-gray-400`} />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-[#181818] border border-[#303030] focus:border-[#FF8A00] rounded-2xl py-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors ${
                    isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="py-3 px-5 bg-[#252525] hover:bg-[#333333] border border-[#3A3A3A] text-white text-sm font-bold rounded-2xl transition-colors"
              >
                {language === 'ar' ? 'بحث' : 'Search'}
              </button>
            </form>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigate('/menu')}
                className="py-4 px-8 rounded-2xl bg-gradient-to-r from-[#D62828] to-[#b82222] hover:from-[#e02d2d] hover:to-[#c02323] text-white font-black text-base sm:text-lg flex items-center gap-3 shadow-xl shadow-[#D62828]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Flame className="w-5 h-5 text-[#FF8A00]" />
                <span>{t('orderNow')}</span>
                {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>

              <button
                onClick={() => navigate('/offers')}
                className="py-4 px-6 rounded-2xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#303030] text-gray-200 font-bold text-sm sm:text-base flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                <span>{t('offers')}</span>
              </button>
            </div>
          </div>

          {/* Right Hero Image Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square w-full rounded-3xl overflow-hidden shadow-2xl border border-[#2E2E2E]">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
                alt="Egyptian Alexandrian Liver & Hawawshi"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Floating Highlight Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#141414]/90 backdrop-blur-md border border-[#2A2A2A] rounded-2xl p-4 flex items-center justify-between shadow-xl">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF8A00] block">
                    {language === 'ar' ? 'سندوتش اليوم المميز' : "Today's Special"}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-white block">
                    {language === 'ar' ? 'كبدة إسكندراني مخصوص' : 'Alexandrian Liver Deluxe'}
                  </span>
                </div>
                <div className="text-right rtl:text-left">
                  <span className="text-xs text-gray-400 block">{language === 'ar' ? 'فقط' : 'Only'}</span>
                  <span className="text-base sm:text-lg font-black text-[#FF8A00]">{formatMoney(8500)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY PILLS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#D62828]" />
            <span>{t('categories')}</span>
          </h2>
          <button
            onClick={() => navigate('/menu')}
            className="text-xs sm:text-sm font-bold text-[#FF8A00] hover:underline flex items-center gap-1"
          >
            <span>{language === 'ar' ? 'عرض الكل' : 'View All'}</span>
            {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/menu?category=${c.slug}`)}
              className="py-3 px-5 rounded-2xl bg-[#1B1B1B] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#FF8A00]/40 text-sm font-bold text-gray-200 hover:text-white shrink-0 transition-all shadow-sm active:scale-95"
            >
              {language === 'ar' ? c.name_ar : c.name_en}
            </button>
          ))}
        </div>
      </section>

      {/* 3. ACTIVE OFFERS BANNER */}
      {offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="relative bg-gradient-to-br from-[#241310] to-[#1A1A1A] border border-[#D62828]/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div className="space-y-3 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D62828] text-white text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'عرض خاص' : 'Special Deal'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {language === 'ar' ? offer.title_ar : offer.title_en}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-md">
                    {language === 'ar' ? offer.description_ar : offer.description_en}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#35201A] flex items-center justify-between gap-4 relative z-10">
                  {offer.promo_code && (
                    <div className="bg-black/50 border border-[#FF8A00]/40 rounded-xl px-3 py-1.5 text-xs">
                      <span className="text-gray-400 block text-[10px]">{language === 'ar' ? 'كود الخصم' : 'Code'}</span>
                      <span className="font-mono font-black text-[#FF8A00] tracking-wider text-sm">{offer.promo_code}</span>
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/menu')}
                    className="py-2.5 px-5 rounded-xl bg-[#FF8A00] hover:bg-[#e67a00] text-black font-extrabold text-xs sm:text-sm transition-colors shadow-md"
                  >
                    {language === 'ar' ? 'اطلب العرض' : 'Claim Offer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. FEATURED EGYPTIAN DISHES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {t('featuredDishes')}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {language === 'ar' ? 'أكثر الأطباق طلباً بالسمنة والبهارات البلدية' : 'Authentic street specialties freshly prepared on charcoal & griddle'}
            </p>
          </div>

          <button
            onClick={() => navigate('/menu')}
            className="hidden sm:flex items-center gap-1 text-sm font-bold text-[#FF8A00] hover:underline"
          >
            <span>{t('exploreMenu')}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* 5. WHY CHOOSE OUR EGYPTIAN FOOD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#181818] border border-[#282828] rounded-3xl p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {language === 'ar' ? 'سر الطعم المصري الأصيل' : 'The Egyptian Street Food Standard'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {language === 'ar'
                ? 'نستخدم أفضل المكونات البلدية والخبز الطازج يومياً لنقدم لك تجربة شوارع القاهرة والإسكندرية'
                : 'Fresh baladi meats, hand-mixed street marinades, and fresh oven-baked bread daily.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 text-center sm:text-left rtl:sm:text-right">
              <div className="w-12 h-12 rounded-2xl bg-[#D62828]/15 border border-[#D62828]/30 flex items-center justify-center text-[#D62828] mx-auto sm:mx-0">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {language === 'ar' ? 'لحوم وسجق بلدي ١٠٠٪' : '100% Baladi Beef & Spices'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {language === 'ar'
                  ? 'لحوم بلدي طازجة يومياً مع بهارات إسكندرانية وتتبيلة سرية لا مثيل لها.'
                  : 'Daily fresh prime beef liver and oriental sausage seasoned with traditional Alexandrian cumin and garlic.'}
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left rtl:sm:text-right">
              <div className="w-12 h-12 rounded-2xl bg-[#FF8A00]/15 border border-[#FF8A00]/30 flex items-center justify-center text-[#FF8A00] mx-auto sm:mx-0">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {language === 'ar' ? 'توصيل سريع وسخن مولع' : 'Hot & Fresh Delivery'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {language === 'ar'
                  ? 'أكياس حرارية تحافظ على قرمشة الحواوشي وسخونة السندوتشات حتى باب بيتك.'
                  : 'Insulated thermal carriers ensure crispy hawawshi and piping hot sandwiches arrive at their best.'}
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left rtl:sm:text-right">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto sm:mx-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {language === 'ar' ? 'نظافة وجودة معتمدة' : 'Verified Food Safety'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {language === 'ar'
                  ? 'أعلى معايير النظافة والطهي الصحي بالسمنة البلدية وزيوت الذرة النقية.'
                  : 'Strict kitchen hygiene, pure vegetable oils, and authentic Egyptian country ghee for rich, safe flavor.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Customization Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
