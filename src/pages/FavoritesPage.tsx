import React, { useState } from 'react';
import { Heart, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { Product } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useFavorites } from '../context/FavoritesContext.tsx';
import { ProductCard } from '../components/common/ProductCard.tsx';
import { ProductModal } from '../components/common/ProductModal.tsx';

interface FavoritesPageProps {
  navigate: (path: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ navigate }) => {
  const { language, t } = useLanguage();
  const { favoriteProducts } = useFavorites();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Heart className="w-8 h-8 text-[#D62828] fill-current" />
          <span>{t('favorites')}</span>
        </h1>
        <p className="text-sm text-gray-400">
          {language === 'ar'
            ? 'أطباقك وسندوتشاتك المفضلة محفوظة هنا لتطلبها بضغطة زر واحدة في أي وقت.'
            : 'Your favorite Egyptian meals and sandwiches saved for quick 1-click re-ordering.'}
        </p>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#222222] text-gray-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {language === 'ar' ? 'لا توجد أطباق مفضلة بعد' : 'No saved meals yet'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto">
            {language === 'ar'
              ? 'اضغط على رمز القلب في أي وجبة بالقائمة لحفظها في قائمتك المفضلة.'
              : 'Click the heart icon on any sandwich or meal card to save it here.'}
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="py-3 px-6 rounded-xl bg-[#D62828] text-white font-bold text-sm shadow-md"
          >
            {t('exploreMenu')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={(item) => setSelectedProduct(item)}
            />
          ))}
        </div>
      )}

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
