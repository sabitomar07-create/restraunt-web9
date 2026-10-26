import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  ChefHat,
  ArrowRight,
  ArrowLeft,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminDashboardPageProps {
  navigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const { language, formatMoney, isRtl } = useLanguage();
  const { token } = useAuth();

  const [stats, setStats] = useState<{
    totalRevenuePiastres: number;
    totalOrders: number;
    pendingOrders: number;
    preparingOrders: number;
    popularDishes: Array<{
      product_name_en: string;
      product_name_ar: string;
      total_qty: number;
      total_sales: number;
    }>;
    recentOrders: any[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = () => {
    if (!token) return;
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout currentTab="dashboard" navigate={navigate}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'ar' ? 'لوحة المتابعة المباشرة' : 'Live Restaurant Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {language === 'ar'
              ? 'إحصائيات المبيعات الحقيقية، والطلبات الواردة من قاعدة البيانات.'
              : 'Real persisted sales analytics and order fulfillment pipeline.'}
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue */}
          <div className="bg-[#181818] border border-[#262626] rounded-2xl p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              {stats ? formatMoney(stats.totalRevenuePiastres) : '...'}
            </p>
            <span className="text-[11px] text-gray-500 block">
              {language === 'ar' ? 'من جميع الطلبات المسجلة' : 'From all completed orders'}
            </span>
          </div>

          {/* Total Orders */}
          <div className="bg-[#181818] border border-[#262626] rounded-2xl p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'عدد الطلبات' : 'Total Orders'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/15 flex items-center justify-center text-[#FF8A00]">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              {stats ? stats.totalOrders : '...'}
            </p>
            <span className="text-[11px] text-gray-500 block">
              {language === 'ar' ? 'طلبات مسجلة' : 'Recorded in database'}
            </span>
          </div>

          {/* Pending Orders */}
          <div className="bg-[#181818] border border-[#262626] rounded-2xl p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'طلبات جديدة بالانتظار' : 'Pending Confirmation'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#FF8A00]">
              {stats ? stats.pendingOrders : '...'}
            </p>
            <span className="text-[11px] text-gray-500 block">
              {language === 'ar' ? 'تحتاج تأكيد المطبخ' : 'Awaiting kitchen confirmation'}
            </span>
          </div>

          {/* Cooking in Kitchen */}
          <div className="bg-[#181818] border border-[#262626] rounded-2xl p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'ar' ? 'جاري الطهي بالمطبخ' : 'Cooking in Kitchen'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#D62828]/15 flex items-center justify-center text-[#D62828]">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#D62828]">
              {stats ? stats.preparingOrders : '...'}
            </p>
            <span className="text-[11px] text-gray-500 block">
              {language === 'ar' ? 'على الجريل والشواية' : 'Currently being prepared'}
            </span>
          </div>
        </div>

        {/* Popular Dishes & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Popular Dishes Table */}
          <div className="lg:col-span-6 bg-[#181818] border border-[#262626] rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FF8A00]" />
              <span>{language === 'ar' ? 'الأصناف الأكثر طلباً' : 'Top Selling Street Dishes'}</span>
            </h2>

            {stats && stats.popularDishes && stats.popularDishes.length > 0 ? (
              <div className="space-y-3">
                {stats.popularDishes.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#222222] text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-[#252525] font-black text-gray-300 flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white">
                        {language === 'ar' ? item.product_name_ar : item.product_name_en}
                      </span>
                    </div>
                    <div className="text-right rtl:text-left">
                      <span className="font-bold text-[#FF8A00] block">{item.total_qty} sold</span>
                      <span className="text-[10px] text-gray-500">{formatMoney(item.total_sales)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-6 text-center">
                {language === 'ar' ? 'لا توجد مبيعات مسجلة حتى الآن.' : 'No sales recorded yet. Place orders to populate real metrics.'}
              </p>
            )}
          </div>

          {/* Recent Orders Overview */}
          <div className="lg:col-span-6 bg-[#181818] border border-[#262626] rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {language === 'ar' ? 'آخر الطلبات الواردة' : 'Recent Incoming Orders'}
              </h2>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-xs font-bold text-[#FF8A00] hover:underline"
              >
                {language === 'ar' ? 'عرض الكل' : 'View All'}
              </button>
            </div>

            {stats && stats.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl bg-[#121212] border border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{ord.order_number}</span>
                        <span className="text-gray-400">• {ord.customer_name}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 block mt-0.5">
                        {formatMoney(ord.total_piastres)} • {ord.payment_method.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={ord.order_status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                        className="bg-[#1B1B1B] border border-[#333333] text-gray-200 text-xs rounded-lg py-1 px-2 focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => navigate(`/track-order/${ord.id}`)}
                        className="p-1 text-gray-400 hover:text-white"
                        title="View order tracking"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-6 text-center">
                {language === 'ar' ? 'لا توجد طلبات واردة بعد.' : 'No orders received yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
