import React, { useEffect, useState } from 'react';
import { ShoppingBag, Search, Phone, MapPin, Clock, ExternalLink } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { OrderRecord } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminOrdersPageProps {
  navigate: (path: string) => void;
}

export const AdminOrdersPage: React.FC<AdminOrdersPageProps> = ({ navigate }) => {
  const { language, formatMoney, t } = useLanguage();
  const { token } = useAuth();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = () => {
    let url = `/api/admin/orders?status=${statusFilter}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, token]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <AdminLayout currentTab="orders" navigate={navigate}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'ar' ? 'إدارة ومتابعة الطلبات' : 'Order Management & Dispatch'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {language === 'ar'
              ? 'تحديث حالة تحضير الوجبات، متابعة مندوبي التوصيل، وفواتير الطلبات.'
              : 'Kitchen dispatch pipeline, driver status updates, and order invoices.'}
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-[#181818] border border-[#262626] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="absolute top-2.5 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'رقم الطلب أو اسم العميل...' : 'Order #, name, phone...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl py-2 px-9 text-xs text-white focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {['all', 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                  statusFilter === st ? 'bg-[#D62828] text-white' : 'bg-[#222222] text-gray-400 hover:text-white'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-[#181818] border border-[#262626] rounded-3xl p-12 text-center text-gray-400 text-xs">
            No orders found matching the filter.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-[#181818] border border-[#262626] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-lg text-[#FF8A00]">{ord.order_number}</span>
                    <span className="text-xs bg-[#222222] text-gray-300 font-bold px-2 py-0.5 rounded-full capitalize">
                      {ord.order_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white">{formatMoney(ord.total_piastres)}</span>
                    <select
                      value={ord.order_status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="bg-[#111111] border border-[#303030] text-gray-200 text-xs font-bold rounded-xl py-1.5 px-3 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => navigate(`/track-order/${ord.id}`)}
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-[#222222]"
                      title="View Customer Tracking"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Recipient & items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{ord.customer_name}</span>
                      <a href={`tel:${ord.customer_phone}`} className="text-[#FF8A00] hover:underline dir-ltr">
                        {ord.customer_phone}
                      </a>
                    </div>
                    {ord.delivery_address && (
                      <p className="text-gray-400 mt-1 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                        <span>{ord.delivery_address}</span>
                      </p>
                    )}
                    {ord.delivery_notes && (
                      <p className="text-amber-400/80 italic mt-0.5">Note: "{ord.delivery_notes}"</p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="bg-[#121212] p-3 rounded-xl border border-[#222222] space-y-1">
                    {ord.items && ord.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-[11px]">
                        <span>
                          <strong className="text-white">{it.quantity}x</strong> {it.product_name_en}
                          {it.variant_name_en && ` (${it.variant_name_en})`}
                        </span>
                        <span className="text-gray-400 font-mono">{formatMoney(it.total_price_piastres)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
