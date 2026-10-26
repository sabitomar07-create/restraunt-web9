import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  PackageCheck,
  XCircle,
  Phone,
  MapPin,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { OrderRecord } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';

interface TrackOrderPageProps {
  orderId: string;
  navigate: (path: string) => void;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ orderId, navigate }) => {
  const { language, formatMoney, t, isRtl } = useLanguage();
  const { settings } = useSettings();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error('Order not found or unauthorized');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 15s for status updates
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">{language === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'}</h2>
        <p className="text-gray-400 text-sm">{error || 'Could not find the specified order.'}</p>
        <button
          onClick={() => navigate('/menu')}
          className="py-2.5 px-6 rounded-xl bg-[#D62828] text-white font-bold text-sm"
        >
          {t('exploreMenu')}
        </button>
      </div>
    );
  }

  const steps = [
    { key: 'pending', label: t('statusPending'), icon: Clock },
    { key: 'preparing', label: t('statusPreparing'), icon: ChefHat },
    { key: 'out_for_delivery', label: t('statusOutForDelivery'), icon: Bike },
    { key: 'delivered', label: t('statusDelivered'), icon: PackageCheck },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'preparing': return 1;
      case 'out_for_delivery': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.order_status);
  const isCancelled = order.order_status === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF8A00] uppercase tracking-wider block">
            {t('trackOrder')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>{t('orderNumber')}:</span>
            <span className="font-mono text-[#D62828]">{order.order_number}</span>
          </h1>
        </div>

        <button
          onClick={() => {
            setIsRefreshing(true);
            fetchOrder();
          }}
          disabled={isRefreshing}
          className="self-start sm:self-auto py-2 px-4 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-xs font-bold text-gray-300 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{language === 'ar' ? 'تحديث الحالة' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Status Stepper */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
        {isCancelled ? (
          <div className="bg-red-950/60 border border-red-700 rounded-2xl p-6 text-center space-y-2">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-xl font-bold text-red-200">{t('statusCancelled')}</h3>
            <p className="text-xs text-red-300">
              {language === 'ar' ? 'تم إلغاء هذا الطلب من قبل إدارة المطعم.' : 'This order has been cancelled.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Step icons grid */}
            <div className="grid grid-cols-4 gap-2 text-center relative z-10">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={s.key} className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/25'
                          : isCurrent
                          ? 'bg-[#D62828] text-white shadow-xl shadow-[#D62828]/35 ring-4 ring-[#D62828]/25 animate-pulse'
                          : 'bg-[#222222] text-gray-500 border border-[#303030]'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-[#FF8A00]'
                          : isCompleted
                          ? 'text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status updates history */}
        {order.history && order.history.length > 0 && (
          <div className="pt-6 border-t border-[#262626] space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {language === 'ar' ? 'سجل متابعة المطبخ والمندوب' : 'Kitchen & Courier Activity Log'}
            </h3>
            <div className="space-y-2">
              {order.history.map((h) => (
                <div key={h.id} className="flex items-start justify-between text-xs text-gray-300 bg-[#141414] p-3 rounded-xl border border-[#222222]">
                  <div>
                    <span className="font-bold text-white block capitalize">
                      {h.status.replace(/_/g, ' ')}
                    </span>
                    {h.notes && <span className="text-gray-400 text-[11px]">{h.notes}</span>}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delivery & Items Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recipient Details */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? 'بيانات التوصيل' : 'Delivery Details'}
          </h3>
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#FF8A00]" />
              <span className="font-bold text-white">{order.customer_name}</span>
              <span className="dir-ltr text-gray-400">({order.customer_phone})</span>
            </div>
            {order.delivery_address && (
              <div className="flex items-start gap-2 pt-1">
                <MapPin className="w-4 h-4 text-[#FF8A00] shrink-0 mt-0.5" />
                <span>{order.delivery_address}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs">
            <span className="text-gray-400">{language === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
            <span className="font-bold text-white capitalize">{order.payment_method.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* Restaurant Contact Box */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'ar' ? 'تحتاج مساعدة أو استفسار؟' : 'Need Help With Your Order?'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {language === 'ar'
                ? 'فريق الدعم ومطبخ المطعم جاهز للرد على استفسارك ومتابعة التوصيل مباشرة.'
                : 'Our dispatch team and restaurant staff are ready to assist with live updates.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${settings.phone}`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#262626] hover:bg-[#333333] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#FF8A00]" />
              <span>{settings.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
