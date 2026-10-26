import React, { useEffect, useState } from 'react';
import { ClipboardList, Clock, ArrowRight, ArrowLeft, Bike, Store, ShoppingBag } from 'lucide-react';
import { OrderRecord } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface OrdersHistoryPageProps {
  navigate: (path: string) => void;
}

export const OrdersHistoryPage: React.FC<OrdersHistoryPageProps> = ({ navigate }) => {
  const { language, formatMoney, t, isRtl } = useLanguage();
  const { user, token } = useAuth();
  const { addItem } = useCart();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ClipboardList className="w-16 h-16 text-gray-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">
          {language === 'ar' ? 'سجّل دخولك لمشاهدة طلباتك' : 'Sign in to view your orders'}
        </h2>
        <p className="text-xs text-gray-400">
          {language === 'ar'
            ? 'يمكنك متابعة حالة الطلبات السابقة وتكرار الطلب بضغطة واحدة.'
            : 'Track status of past deliveries and re-order with 1 click.'}
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="py-3 px-6 rounded-xl bg-[#D62828] text-white font-bold text-sm shadow-md"
        >
          {t('signIn')}
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-950/80 text-[#FF8A00] border border-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">{t('statusPending')}</span>;
      case 'preparing':
        return <span className="bg-blue-950/80 text-blue-300 border border-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">{t('statusPreparing')}</span>;
      case 'out_for_delivery':
        return <span className="bg-purple-950/80 text-purple-300 border border-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">{t('statusOutForDelivery')}</span>;
      case 'delivered':
        return <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">{t('statusDelivered')}</span>;
      case 'cancelled':
        return <span className="bg-red-950/80 text-red-300 border border-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold">{t('statusCancelled')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-[#FF8A00]" />
          <span>{t('orders')}</span>
        </h1>
        <p className="text-sm text-gray-400">
          {language === 'ar' ? 'سجل جميع طلباتك السابقة وتفاصيل الفواتير وحالة التوصيل.' : 'History of your past meals, delivery addresses, and invoices.'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-[#1A1A1A] rounded-2xl animate-pulse border border-[#282828]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#222222] text-gray-500 flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {language === 'ar' ? 'لا توجد طلبات سابقة' : 'No past orders yet'}
          </h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {language === 'ar' ? 'اطلب الآن أول سندوتش كبدة أو حواوشي واستمتع بالطعم البلدي الأصيل!' : 'Order your first Egyptian sandwich or hawawshi now!'}
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="py-3 px-6 rounded-xl bg-[#D62828] text-white font-bold text-sm shadow-md"
          >
            {t('exploreMenu')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col sm:flex-row justify-between gap-6 shadow-xl"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-black text-base text-white">{o.order_number}</span>
                  {getStatusBadge(o.order_status)}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Items preview */}
                {o.items && o.items.length > 0 && (
                  <div className="space-y-1 text-xs text-gray-300">
                    {o.items.map((i) => (
                      <div key={i.id} className="truncate">
                        <span className="text-gray-400">{i.quantity}x</span>{' '}
                        <span>{language === 'ar' ? i.product_name_ar : i.product_name_en}</span>
                        {i.variant_name_en && (
                          <span className="text-[11px] text-[#FF8A00]">
                            {' '}({language === 'ar' ? i.variant_name_ar : i.variant_name_en})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  <span>{o.order_type === 'delivery' ? t('delivery') : t('pickup')}</span>
                  {o.delivery_address && <span> • {o.delivery_address}</span>}
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#262626]">
                <div className="text-left sm:text-right rtl:text-right rtl:sm:text-left">
                  <span className="text-[11px] text-gray-500 block uppercase tracking-wider">{t('total')}</span>
                  <span className="text-lg font-black text-[#FF8A00]">{formatMoney(o.total_piastres)}</span>
                </div>

                <button
                  onClick={() => navigate(`/track-order/${o.id}`)}
                  className="py-2.5 px-4 rounded-xl bg-[#252525] hover:bg-[#303030] border border-[#3A3A3A] text-xs font-bold text-white flex items-center gap-2 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>{t('trackOrder')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
