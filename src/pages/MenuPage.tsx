import React, { useState, useEffect } from 'react';
import { Search, Flame, Filter, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Product, Category } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ProductCard } from '../components/common/ProductCard.tsx';
import { ProductModal } from '../components/common/ProductModal.tsx';

interface MenuPageProps {
  navigate: (path: string) => void;
  initialCategory?: string;
  initialSearch?: string;
}

export const MenuPage: React.FC<MenuPageProps> = ({ navigate, initialCategory, initialSearch }) => {
  const { language, t, isRtl } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync category & search when URL props change
  useEffect(() => {
    setActiveCategory(initialCategory || 'all');
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([cats, prods]) => {
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(prods)) setProducts(prods);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Filter products by category, search, and availability
  const filteredProducts = products.filter((p) => {
    if (activeCategory !== 'all') {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat && p.category_id !== cat.id) return false;
    }

    if (onlyAvailable && (!p.is_available || p.stock_quantity <= 0)) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName =
        p.name_en.toLowerCase().includes(q) ||
        p.name_ar.toLowerCase().includes(q) ||
        p.description_en.toLowerCase().includes(q) ||
        p.description_ar.toLowerCase().includes(q);
      if (!matchName) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
          <Flame className="w-8 h-8 text-[#D62828]" />
          <span>{t('menu')}</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
          {language === 'ar'
            ? 'تصفح قائمتنا الكاملة من السندوتشات والحواوشي والمشويات والوجبات المصرية المحضرة طازجة.'
            : 'Explore our complete selection of authentic Egyptian sandwiches, Hawawshi, grills, and street combos.'}
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-[#181818] border border-[#282828] rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className={`absolute top-3.5 ${isRtl ? 'right-4' : 'left-4'} w-5 h-5 text-gray-400`} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors ${
              isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'
            }`}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-[#D62828] text-white shadow-md'
                : 'bg-[#222222] text-gray-300 hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.slug)}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === c.slug
                  ? 'bg-[#D62828] text-white shadow-md'
                  : 'bg-[#222222] text-gray-300 hover:text-white hover:bg-[#2A2A2A]'
              }`}
            >
              {language === 'ar' ? c.name_ar : c.name_en}
            </button>
          ))}
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-[#262626]">
          <span>
            {language === 'ar'
              ? `عرض ${filteredProducts.length} صنف`
              : `Showing ${filteredProducts.length} items`}
          </span>

          <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded bg-[#222222] border-[#444444] text-[#D62828] focus:ring-[#D62828]"
            />
            <span>{language === 'ar' ? 'الأصناف المتاحة فقط' : 'Available items only'}</span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-[#1B1B1B] rounded-2xl h-80 animate-pulse border border-[#282828]" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#161616] border border-[#262626] rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#222222] text-gray-500 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {language === 'ar' ? 'لم نجد أصناف مطابقة لبحثك' : 'No items found matching your criteria'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {language === 'ar'
              ? 'جرّب كتابة اسم آخر أو اختيار قسم مختلف من الأقسام بالأعلى.'
              : 'Try searching for another sandwich, or reset your category filter.'}
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
              setOnlyAvailable(false);
            }}
            className="py-2.5 px-6 rounded-xl bg-[#252525] hover:bg-[#333333] text-white text-xs font-bold transition-colors"
          >
            {language === 'ar' ? 'إعادة ضبط البحث' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={(item) => setSelectedProduct(item)}
            />
          ))}
        </div>
      )}

      {/* Product Customization Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
