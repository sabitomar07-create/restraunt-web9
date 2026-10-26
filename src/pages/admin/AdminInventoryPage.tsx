import React, { useEffect, useState } from 'react';
import { Boxes, Save, Check, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminInventoryPageProps {
  navigate: (path: string) => void;
}

export const AdminInventoryPage: React.FC<AdminInventoryPageProps> = ({ navigate }) => {
  const { language, formatMoney } = useLanguage();
  const { token } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const fetchInventory = () => {
    fetch('/api/admin/inventory', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setItems(data);
          const initialQ: Record<string, number> = {};
          data.forEach((i) => {
            initialQ[i.id] = i.stock_quantity ?? 100;
          });
          setQuantities(initialQ);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  const handleUpdate = async (id: string, isAvailable: boolean) => {
    const qty = quantities[id] ?? 100;
    await fetch(`/api/admin/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        stockQuantity: qty,
        isAvailable,
      }),
    });

    setSavedId(id);
    setTimeout(() => setSavedId(null), 2000);
    fetchInventory();
  };

  return (
    <AdminLayout currentTab="inventory" navigate={navigate}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'ar' ? 'المخزون والتوافر الفوري' : 'Stock & Availability Fast Editor'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {language === 'ar'
              ? 'تحديث سريع لتوافر السندوتشات أو تمييزها بنفاد الكمية (Sold Out).'
              : 'Toggle item availability instantly when ingredients run out in kitchen.'}
          </p>
        </div>

        <div className="bg-[#181818] border border-[#262626] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs text-gray-300">
              <thead className="bg-[#141414] border-b border-[#262626] text-gray-400 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock Units</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {items.map((it) => {
                  const isAvail = Boolean(it.is_available);
                  return (
                    <tr key={it.id} className="hover:bg-[#1E1E1E] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        {language === 'ar' ? it.name_ar : it.name_en}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#FF8A00]">
                        {formatMoney(it.base_price_piastres)}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          value={quantities[it.id] ?? 0}
                          onChange={(e) =>
                            setQuantities({ ...quantities, [it.id]: parseInt(e.target.value || '0', 10) })
                          }
                          className="w-24 bg-[#111111] border border-[#2E2E2E] rounded-lg py-1 px-2.5 text-xs text-white"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleUpdate(it.id, !isAvail)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isAvail
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-red-950/80 text-red-300 border border-red-800'
                          }`}
                        >
                          {isAvail ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isAvail ? 'In Stock' : 'Sold Out'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleUpdate(it.id, isAvail)}
                          className="py-1 px-3 rounded-lg bg-[#252525] hover:bg-[#333333] text-white font-bold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          {savedId === it.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                          <span>{savedId === it.id ? 'Saved' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
