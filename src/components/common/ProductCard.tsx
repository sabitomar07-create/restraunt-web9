import React from 'react';
import { Heart, Plus, Clock, Sparkles } from 'lucide-react';
import { Product } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useFavorites } from '../../context/FavoritesContext.tsx';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { language, formatMoney, t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();

  const title = language === 'ar' ? product.name_ar : product.name_en;
  const description = language === 'ar' ? product.description_ar : product.description_en;
  const favorited = isFavorite(product.id);
  const isAvailable = Boolean(product.is_available) && product.stock_quantity > 0;

  return (
    <article
      className="group relative bg-[#1B1B1B] hover:bg-[#202020] border border-[#282828] hover:border-[#FF8A00]/40 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl hover:shadow-black/60"
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111111]">
        <img
          src={product.image_url}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B1B1B] via-transparent to-transparent opacity-80" />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product);
          }}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 ${
            language === 'ar' ? 'left-3' : 'right-3'
          } w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            favorited
              ? 'bg-[#D62828] text-white shadow-lg shadow-[#D62828]/40'
              : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/80'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Badges: Featured or Sold Out */}
        <div className={`absolute top-3 ${language === 'ar' ? 'right-3' : 'left-3'} flex flex-col gap-1.5`}>
          {!isAvailable ? (
            <span className="bg-red-950/90 text-red-300 border border-red-800 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md">
              {t('soldOut')}
            </span>
          ) : product.is_featured ? (
            <span className="bg-[#D62828] text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 text-[#FF8A00]" />
              {language === 'ar' ? 'مميز' : 'Featured'}
            </span>
          ) : null}
        </div>

        {/* Prep Time pill */}
        <div className={`absolute bottom-2.5 ${language === 'ar' ? 'right-3' : 'left-3'} flex items-center gap-1 text-[11px] text-gray-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full`}>
          <Clock className="w-3 h-3 text-[#FF8A00]" />
          <span>{product.prep_time_minutes} {t('minutes')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onSelect(product)}
            className="text-base sm:text-lg font-bold text-white group-hover:text-[#FF8A00] transition-colors cursor-pointer line-clamp-1"
          >
            {title}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-[#262626] flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-medium">
              {product.variants && product.variants.length > 0
                ? (language === 'ar' ? 'يبدأ من' : 'Starts at')
                : (language === 'ar' ? 'السعر' : 'Price')}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-[#FF8A00]">
              {formatMoney(product.base_price_piastres)}
            </span>
          </div>

          <button
            onClick={() => onSelect(product)}
            disabled={!isAvailable}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              !isAvailable
                ? 'bg-[#222222] text-gray-500 cursor-not-allowed'
                : 'bg-[#D62828] hover:bg-[#b82222] text-white shadow-md shadow-[#D62828]/20 active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{product.variants && product.variants.length > 0 ? t('customize') : t('addToCart')}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
