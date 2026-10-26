import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, AlertTriangle, ShoppingBag, Heart, Check, Plus, Minus } from 'lucide-react';
import { Product, ProductVariant, SelectedAddon } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useFavorites } from '../context/FavoritesContext.tsx';

interface ProductDetailPageProps {
  slug: string;
  navigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, navigate }) => {
  const { language, formatMoney, t, isRtl } = useLanguage();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, SelectedAddon>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data: Product) => {
        setProduct(data);
        const defaultVar = data.variants?.find((v) => Boolean(v.is_default)) || data.variants?.[0];
        setSelectedVariant(defaultVar);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">{language === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}</h2>
        <p className="text-gray-400 text-sm">
          {language === 'ar' ? 'لم نتمكن من العثور على هذا الصنف.' : 'The item you are looking for is unavailable.'}
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="py-2.5 px-6 rounded-xl bg-[#D62828] text-white font-bold text-sm"
        >
          {t('exploreMenu')}
        </button>
      </div>
    );
  }

  const title = language === 'ar' ? product.name_ar : product.name_en;
  const description = language === 'ar' ? product.description_ar : product.description_en;
  const allergens = language === 'ar' ? product.allergens_ar : product.allergens_en;
  const favorited = isFavorite(product.id);

  const variantAdj = selectedVariant ? selectedVariant.price_adjustment_piastres : 0;
  const addonsTotal = Object.values(selectedAddons).reduce((s, a) => s + a.pricePiastres * a.quantity, 0);
  const unitPrice = Math.max(0, product.base_price_piastres + variantAdj + addonsTotal);
  const lineTotal = unitPrice * quantity;

  const toggleAddon = (addon: any) => {
    setSelectedAddons((prev) => {
      const copy = { ...prev };
      if (copy[addon.id]) {
        delete copy[addon.id];
      } else {
        copy[addon.id] = {
          id: addon.id,
          nameEn: addon.name_en,
          nameAr: addon.name_ar,
          pricePiastres: addon.price_piastres,
          quantity: 1,
        };
      }
      return copy;
    });
  };

  const handleAddToCart = () => {
    addItem(product, selectedVariant, Object.values(selectedAddons), quantity, notes.trim() || undefined);
    navigate('/cart');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/menu')}
        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
      >
        {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{t('menu')}</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Product Image */}
        <div className="relative aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden bg-[#111111]">
          <img src={product.image_url} alt={title} className="w-full h-full object-cover" />
          <button
            onClick={() => toggleFavorite(product)}
            className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center ${
              favorited ? 'bg-[#D62828] text-white' : 'bg-black/60 text-white hover:bg-black'
            }`}
          >
            <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Details & Form */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
            <p className="text-gray-300 text-sm leading-relaxed">{description}</p>

            <div className="flex items-center gap-2 text-xs text-[#FF8A00] font-bold">
              <Clock className="w-4 h-4" />
              <span>{product.prep_time_minutes} {t('minutes')} {t('prepTime')}</span>
            </div>

            {allergens && allergens.trim() !== '' && (
              <div className="flex items-start gap-2 bg-[#281814] border border-[#FF8A00]/30 rounded-xl p-3 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-[#FF8A00] shrink-0 mt-0.5" />
                <span><strong>{t('allergens')}:</strong> {allergens}</span>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{t('chooseSize')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variants.map((v) => {
                    const isSel = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-left rtl:text-right text-xs font-bold flex justify-between items-center ${
                          isSel ? 'bg-[#D62828]/20 border-[#D62828] text-white' : 'bg-[#222222] border-[#303030] text-gray-300'
                        }`}
                      >
                        <span>{language === 'ar' ? v.name_ar : v.name_en}</span>
                        {v.price_adjustment_piastres > 0 && (
                          <span className="text-[#FF8A00]">+{formatMoney(v.price_adjustment_piastres)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Addons */}
            {product.addons && product.addons.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{t('chooseAddons')}</h3>
                <div className="space-y-1.5">
                  {product.addons.map((a) => {
                    const isSel = Boolean(selectedAddons[a.id]);
                    return (
                      <div
                        key={a.id}
                        onClick={() => toggleAddon(a)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                          isSel ? 'bg-[#262626] border-[#FF8A00] text-white' : 'bg-[#202020] border-[#2A2A2A] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSel ? 'bg-[#FF8A00] text-black font-bold' : 'border-gray-500'}`}>
                            {isSel && <Check className="w-3 h-3" />}
                          </div>
                          <span>{language === 'ar' ? a.name_ar : a.name_en}</span>
                        </div>
                        <span className="text-[#FF8A00]">+{formatMoney(a.price_piastres)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">{t('specialNotes')}</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                className="w-full bg-[#141414] border border-[#2E2E2E] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF8A00]"
              />
            </div>
          </div>

          {/* Quantity & CTA */}
          <div className="pt-4 border-t border-[#262626] flex items-center gap-4">
            <div className="flex items-center bg-[#222222] border border-[#303030] rounded-xl p-1 shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-black text-white">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D62828] to-[#b82222] text-white font-extrabold text-sm sm:text-base flex items-center justify-between shadow-lg shadow-[#D62828]/25"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>{t('addToCart')}</span>
              </div>
              <span className="text-[#FED7AA] font-black">{formatMoney(lineTotal)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
