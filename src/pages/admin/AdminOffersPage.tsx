import React, { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, X, Sparkles } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { Offer } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminOffersPageProps {
  navigate: (path: string) => void;
}

export const AdminOffersPage: React.FC<AdminOffersPageProps> = ({ navigate }) => {
  const { language, formatMoney } = useLanguage();
  const { token } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('15');
  const [minOrderEgp, setMinOrderEgp] = useState('100');
  const [promoCode, setPromoCode] = useState('');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80');

  const fetchOffers = () => {
    fetch('/api/offers')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOffers(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = discountType === 'percentage'
      ? parseInt(discountValue, 10)
      : Math.round(parseFloat(discountValue) * 100);

    const minOrderPiastres = Math.round(parseFloat(minOrderEgp || '0') * 100);

    await fetch('/api/admin/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim(),
        descriptionEn: descEn.trim(),
        descriptionAr: descAr.trim(),
        discountType,
        discountValue: value,
        minOrderPiastres,
        promoCode: promoCode.trim().toUpperCase() || undefined,
        bannerUrl: bannerUrl.trim(),
      }),
    });

    setModalOpen(false);
    fetchOffers();
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;
    await fetch(`/api/admin/offers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchOffers();
  };

  return (
    <AdminLayout currentTab="offers" navigate={navigate}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {language === 'ar' ? 'العروض وأكواد الخصم' : 'Offers & Promo Codes'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {language === 'ar' ? 'إنشاء خصومات مئوية أو ثابتة، وتحديد الحد الأدنى للطلب.' : 'Create promotional percentage or fixed discounts and promo vouchers.'}
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="py-2.5 px-5 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#D62828]/25"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة عرض جديد' : 'New Offer'}</span>
          </button>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((o) => (
            <div
              key={o.id}
              className="bg-[#181818] border border-[#262626] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] bg-[#D62828] text-white font-bold px-2 py-0.5 rounded-full uppercase">
                    {o.discount_type === 'percentage' ? `${o.discount_value}% OFF` : `${formatMoney(o.discount_value)} OFF`}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">
                    {language === 'ar' ? o.title_ar : o.title_en}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'ar' ? o.description_ar : o.description_en}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteOffer(o.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400"
                  title="Delete offer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs text-gray-300">
                {o.promo_code ? (
                  <span className="font-mono bg-[#111111] border border-[#303030] text-[#FF8A00] font-bold px-2.5 py-1 rounded-lg">
                    {o.promo_code}
                  </span>
                ) : (
                  <span className="text-gray-500">Auto applied</span>
                )}

                {o.min_order_piastres > 0 && (
                  <span className="text-gray-400">
                    Min order: {formatMoney(o.min_order_piastres)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#1B1B1B] border border-[#2E2E2E] rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <h3 className="text-lg font-bold text-white">Create New Offer</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Title (EN) *</label>
                    <input
                      type="text"
                      required
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      placeholder="e.g. 20% Lunch Deal"
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Title (AR) *</label>
                    <input
                      type="text"
                      required
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      placeholder="مثال: خصم ٢٠٪ غداء"
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (EGP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Value *</label>
                    <input
                      type="number"
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'percentage' ? '15' : '30'}
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Min Order (EGP)</label>
                    <input
                      type="number"
                      value={minOrderEgp}
                      onChange={(e) => setMinOrderEgp(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Promo Code (optional)</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CAIRO20"
                    className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Description (English)</label>
                  <textarea
                    rows={2}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Description (Arabic)</label>
                  <textarea
                    rows={2}
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2 text-white text-right"
                  />
                </div>

                <div className="pt-3 border-t border-[#262626] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="py-2 px-4 rounded-xl bg-[#222222] text-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl bg-[#D62828] text-white font-bold"
                  >
                    Save Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
