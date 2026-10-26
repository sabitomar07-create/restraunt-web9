import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertTriangle, Clock, ShoppingBag, Check } from 'lucide-react';
import { Product, ProductVariant, SelectedAddon } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useCart } from '../../context/CartContext.tsx';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { language, formatMoney, t, isRtl } = useLanguage();
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, SelectedAddon>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      const defaultVar = product.variants?.find((v) => Boolean(v.is_default)) || product.variants?.[0];
      setSelectedVariant(defaultVar);
      setSelectedAddons({});
      setQuantity(1);
      setNotes('');
    }
  }, [product]);

  if (!product) return null;

  const title = language === 'ar' ? product.name_ar : product.name_en;
  const description = language === 'ar' ? product.description_ar : product.description_en;
  const allergens = language === 'ar' ? product.allergens_ar : product.allergens_en;

  // Calculate live item unit price & line total in integer piastres
  const variantAdj = selectedVariant ? selectedVariant.price_adjustment_piastres : 0;
  const addonsTotal = Object.values(selectedAddons).reduce(
    (sum, a) => sum + a.pricePiastres * a.quantity,
    0
  );
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
    addItem(
      product,
      selectedVariant,
      Object.values(selectedAddons),
      quantity,
      notes.trim() || undefined
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-xl bg-[#1B1B1B] border border-[#2E2E2E] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative aspect-[16/9] w-full bg-[#111111] shrink-0">
          <img
            src={product.image_url}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B1B1B] via-transparent to-black/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close customization dialog"
            className={`absolute top-4 ${
              isRtl ? 'left-4' : 'right-4'
            } w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prep Time */}
          <div className={`absolute bottom-3 ${isRtl ? 'right-4' : 'left-4'} flex items-center gap-1.5 text-xs text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full`}>
            <Clock className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>{product.prep_time_minutes} {t('minutes')}</span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Title & Description */}
          <div>
            <h2 id="product-modal-title" className="text-xl sm:text-2xl font-black text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-300 leading-relaxed">
              {description}
            </p>

            {/* Allergens Notice */}
            {allergens && allergens.trim() !== '' && (
              <div className="mt-3 flex items-start gap-2 bg-[#261814] border border-[#FF8A00]/20 rounded-xl p-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-[#FF8A00] shrink-0 mt-0.5" />
                <span>
                  <strong>{t('allergens')}:</strong> {allergens}
                </span>
              </div>
            )}
          </div>

          {/* Variants / Sizes */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>{t('chooseSize')}</span>
                <span className="text-[11px] text-[#FF8A00] font-normal normal-case">
                  ({language === 'ar' ? 'مطلوب' : 'Required'})
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((v) => {
                  const isSel = selectedVariant?.id === v.id;
                  const vName = language === 'ar' ? v.name_ar : v.name_en;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left rtl:text-right transition-all flex items-center justify-between ${
                        isSel
                          ? 'bg-[#D62828]/15 border-[#D62828] text-white shadow-sm'
                          : 'bg-[#222222] border-[#303030] text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSel ? 'border-[#D62828] bg-[#D62828]' : 'border-gray-500'
                          }`}
                        >
                          {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-bold">{vName}</span>
                      </div>
                      {v.price_adjustment_piastres > 0 && (
                        <span className="text-xs font-semibold text-[#FF8A00]">
                          +{formatMoney(v.price_adjustment_piastres)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addons / Extras */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {t('chooseAddons')}
              </h3>
              <div className="space-y-2">
                {product.addons.map((a) => {
                  const isSelected = Boolean(selectedAddons[a.id]);
                  const aName = language === 'ar' ? a.name_ar : a.name_en;
                  return (
                    <div
                      key={a.id}
                      onClick={() => toggleAddon(a)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#252525] border-[#FF8A00]/60 text-white'
                          : 'bg-[#202020] border-[#2E2E2E] text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#FF8A00] border-[#FF8A00] text-black font-bold'
                              : 'border-gray-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm font-semibold">{aName}</span>
                      </div>
                      <span className="text-xs font-bold text-[#FF8A00]">
                        +{formatMoney(a.price_piastres)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cooking Notes */}
          <div className="space-y-2">
            <label htmlFor="item-notes" className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              {t('specialNotes')}
            </label>
            <textarea
              id="item-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full bg-[#151515] border border-[#2E2E2E] focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00] rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#141414] border-t border-[#262626] flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Counter */}
          <div className="flex items-center bg-[#202020] border border-[#303030] rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-black text-white">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Submit */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D62828] to-[#b82222] hover:from-[#e02d2d] hover:to-[#c02323] text-white font-extrabold text-sm sm:text-base flex items-center justify-between shadow-lg shadow-[#D62828]/25 transition-all transform active:scale-95"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{t('addToCart')}</span>
            </div>
            <span className="font-black text-[#FED7AA]">{formatMoney(lineTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
