import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X, Search, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { Product, Category } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminMenuPageProps {
  navigate: (path: string) => void;
}

export const AdminMenuPage: React.FC<AdminMenuPageProps> = ({ navigate }) => {
  const { language, formatMoney } = useLanguage();
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal for Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCatId, setFormCatId] = useState('');
  const [formPriceEgp, setFormPriceEgp] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAllergensEn, setFormAllergensEn] = useState('');
  const [formAllergensAr, setFormAllergensAr] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  const fetchMenu = () => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([cats, prods]) => {
        if (Array.isArray(cats)) {
          setCategories(cats);
          if (cats.length > 0 && !formCatId) setFormCatId(cats[0].id);
        }
        if (Array.isArray(prods)) setProducts(prods);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormNameEn('');
    setFormNameAr('');
    setFormPriceEgp('85');
    setFormDescEn('');
    setFormDescAr('');
    setFormImageUrl('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80');
    setFormAllergensEn('');
    setFormAllergensAr('');
    setFormIsFeatured(false);
    if (categories.length > 0) setFormCatId(categories[0].id);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormNameEn(p.name_en);
    setFormNameAr(p.name_ar);
    setFormPriceEgp((p.base_price_piastres / 100).toString());
    setFormDescEn(p.description_en);
    setFormDescAr(p.description_ar);
    setFormImageUrl(p.image_url);
    setFormCatId(p.category_id);
    setFormAllergensEn(p.allergens_en || '');
    setFormAllergensAr(p.allergens_ar || '');
    setFormIsFeatured(Boolean(p.is_featured));
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const pricePiastres = Math.round(parseFloat(formPriceEgp) * 100);

    const payload = {
      categoryId: formCatId,
      nameEn: formNameEn.trim(),
      nameAr: formNameAr.trim(),
      descriptionEn: formDescEn.trim(),
      descriptionAr: formDescAr.trim(),
      imageUrl: formImageUrl.trim(),
      basePricePiastres: pricePiastres,
      allergensEn: formAllergensEn.trim(),
      allergensAr: formAllergensAr.trim(),
      isFeatured: formIsFeatured,
    };

    if (editingProduct) {
      // PUT
      await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } else {
      // POST
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }

    setModalOpen(false);
    fetchMenu();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchMenu();
  };

  const handleToggleAvailable = async (p: Product) => {
    const next = p.is_available ? 0 : 1;
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isAvailable: Boolean(next) }),
    });
    fetchMenu();
  };

  const filtered = products.filter((p) => {
    if (selectedCat !== 'all' && p.category_id !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name_en.toLowerCase().includes(q) || p.name_ar.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AdminLayout currentTab="menu" navigate={navigate}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {language === 'ar' ? 'إدارة القائمة والأصناف' : 'Menu & Product Catalog'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {language === 'ar'
                ? 'تعديل أسعار السندوتشات، إضافة أصناف جديدة، وتفعيل أو إيقاف التوافر.'
                : 'Manage sandwich prices, launch new items, and adjust descriptions or photos.'}
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="py-2.5 px-5 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#D62828]/25"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة صنف جديد' : 'Add New Item'}</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#181818] border border-[#262626] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-2.5 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالاسم...' : 'Search items...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl py-2 px-9 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedCat('all')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${
                selectedCat === 'all' ? 'bg-[#D62828] text-white' : 'bg-[#222222] text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${
                  selectedCat === c.id ? 'bg-[#D62828] text-white' : 'bg-[#222222] text-gray-400 hover:text-white'
                }`}
              >
                {language === 'ar' ? c.name_ar : c.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-[#181818] border border-[#262626] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs text-gray-300">
              <thead className="bg-[#141414] border-b border-[#262626] text-gray-400 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filtered.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  const isAvail = Boolean(p.is_available);
                  return (
                    <tr key={p.id} className="hover:bg-[#1E1E1E] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-[#111111] shrink-0"
                          />
                          <div>
                            <span className="font-bold text-white block">
                              {language === 'ar' ? p.name_ar : p.name_en}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              {language === 'ar' ? p.name_en : p.name_ar}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {cat ? (language === 'ar' ? cat.name_ar : cat.name_en) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#FF8A00]">
                        {formatMoney(p.base_price_piastres)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAvailable(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isAvail
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-red-950/80 text-red-300 border border-red-800'
                          }`}
                        >
                          {isAvail ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{isAvail ? 'Available' : 'Sold Out'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#333333] text-gray-300 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit / Create Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#1B1B1B] border border-[#2E2E2E] rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? 'Edit Menu Item' : 'Add New Item'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      placeholder="e.g. Alexandrian Liver"
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Name (Arabic) *</label>
                    <input
                      type="text"
                      required
                      value={formNameAr}
                      onChange={(e) => setFormNameAr(e.target.value)}
                      placeholder="مثال: كبدة إسكندراني"
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Category *</label>
                    <select
                      value={formCatId}
                      onChange={(e) => setFormCatId(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_en} / {c.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Price (EGP) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={formPriceEgp}
                      onChange={(e) => setFormPriceEgp(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Description (English)</label>
                  <textarea
                    rows={2}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Description (Arabic)</label>
                  <textarea
                    rows={2}
                    value={formDescAr}
                    onChange={(e) => setFormDescAr(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2 text-white text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Allergens (EN)</label>
                    <input
                      type="text"
                      value={formAllergensEn}
                      onChange={(e) => setFormAllergensEn(e.target.value)}
                      placeholder="e.g. Gluten, Sesame"
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Allergens (AR)</label>
                    <input
                      type="text"
                      value={formAllergensAr}
                      onChange={(e) => setFormAllergensAr(e.target.value)}
                      placeholder="مثال: جلوتين، سمسم"
                      className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white text-right"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isFeaturedCheck"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded bg-[#111111] border-gray-600 text-[#D62828]"
                  />
                  <label htmlFor="isFeaturedCheck" className="text-gray-300 font-bold cursor-pointer">
                    Display as Featured Item on Homepage
                  </label>
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
                    Save Product
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
