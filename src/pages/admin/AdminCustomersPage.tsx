import React, { useEffect, useState } from 'react';
import { Users, Phone, Mail, ShoppingBag } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminCustomersPageProps {
  navigate: (path: string) => void;
}

export const AdminCustomersPage: React.FC<AdminCustomersPageProps> = ({ navigate }) => {
  const { language, formatMoney } = useLanguage();
  const { token } = useAuth();

  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/customers', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <AdminLayout currentTab="customers" navigate={navigate}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'ar' ? 'سجل العملاء' : 'Customer Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {language === 'ar'
              ? 'قائمة العملاء المسجلين، إجمالي الطلبات، والإنفاق لتسهيل المتابعة وخدمة العملاء.'
              : 'Registered customer accounts, orders placed, and lifetime spend.'}
          </p>
        </div>

        <div className="bg-[#181818] border border-[#262626] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs text-gray-300">
              <thead className="bg-[#141414] border-b border-[#262626] text-gray-400 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1E1E1E] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{c.full_name}</td>
                    <td className="py-3 px-4 space-y-0.5">
                      <span className="block text-gray-300 font-mono text-[11px] dir-ltr text-left rtl:text-right">{c.email}</span>
                      {c.phone && <span className="block text-gray-400 font-mono text-[11px] dir-ltr text-left rtl:text-right">{c.phone}</span>}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{c.order_count}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#FF8A00]">{formatMoney(c.total_spent_piastres)}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
