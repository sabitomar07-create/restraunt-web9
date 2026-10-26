import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Bike, Clock, Phone, MapPin, Receipt } from 'lucide-react';
import { OrderRecord } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';

interface OrderSuccessPageProps {
  orderId: string;
  navigate: (path: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderId, navigate }) => {
  const { language, formatMoney, t, isRtl } = useLanguage();
  const { settings } = useSettings();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) setOrder(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      {/* Success Badge */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-[#132B1C] border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/40 animate-in zoom-in-75 duration-200">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          {t('orderPlaced')}
        </h1>
        <p className="text-sm text-gray-300 max-w-md mx-auto">
          {language === 'ar'
            ? 'تم استلام طلبك وبدأ المطبخ بتجهيز السندوتشات الطازجة الآن.'
            : 'Your order is confirmed and our chefs have started preparing your meal.'}
        </p>

        {order && (
          <div className="inline-block bg-[#1B1B1B] border border-[#2E2E2E] rounded-2xl px-6 py-3 shadow-lg">
            <span className="text-xs text-gray-400 block uppercase tracking-wider">{t('orderNumber')}</span>
            <span className="text-xl sm:text-2xl font-mono font-black text-[#FF8A00] tracking-wider">{order.order_number}</span>
          </div>
        )}
      </div>

      {/* Order Summary Box */}
      {order && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#262626] pb-4">
            <Receipt className="w-5 h-5 text-[#FF8A00]" />
            <span>{language === 'ar' ? 'تفاصيل الطلب والفاتورة' : 'Order Invoice & Details'}</span>
          </h2>

          {/* Delivery & Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300">
            <div>
              <span className="text-gray-500 block uppercase tracking-wider">{t('customerName')}</span>
              <span className="font-bold text-white text-sm">{order.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-500 block uppercase tracking-wider">{t('customerPhone')}</span>
              <span className="font-bold text-white text-sm dir-ltr">{order.customer_phone}</span>
            </div>
            {order.order_type === 'delivery' && order.delivery_address && (
              <div className="sm:col-span-2">
                <span className="text-gray-500 block uppercase tracking-wider">{t('deliveryAddress')}</span>
                <span className="text-white text-sm">{order.delivery_address}</span>
              </div>
            )}
          </div>

          {/* Line items list */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#262626]">
              {order.items.map((i) => (
                <div key={i.id} className="flex justify-between text-xs text-gray-300">
                  <div>
                    <span className="font-bold text-white">{i.quantity}x </span>
                    <span>{language === 'ar' ? i.product_name_ar : i.product_name_en}</span>
                    {i.variant_name_en && (
                      <span className="text-[11px] text-[#FF8A00]">
                        {' '}({language === 'ar' ? i.variant_name_ar : i.variant_name_en})
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-white">{formatMoney(i.total_price_piastres)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Price Breakdown */}
          <div className="space-y-2 text-xs sm:text-sm text-gray-300 pt-4 border-t border-[#262626]">
            <div className="flex justify-between">
              <span>{t('subtotal')}</span>
              <span className="font-bold text-white">{formatMoney(order.subtotal_piastres)}</span>
            </div>
            {order.discount_piastres > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>{t('discount')}</span>
                <span className="font-bold">-{formatMoney(order.discount_piastres)}</span>
              </div>
            )}
            {order.delivery_fee_piastres > 0 && (
              <div className="flex justify-between">
                <span>{t('deliveryFee')}</span>
                <span className="font-bold text-white">{formatMoney(order.delivery_fee_piastres)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-[#2A2A2A] flex justify-between text-lg font-black text-white">
              <span>{t('total')}</span>
              <span className="text-[#FF8A00]">{formatMoney(order.total_piastres)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {order && (
          <button
            onClick={() => navigate(`/track-order/${order.id}`)}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D62828] to-[#b82222] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-[#D62828]/25"
          >
            <Clock className="w-5 h-5" />
            <span>{t('trackOrder')}</span>
            {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={() => navigate('/menu')}
          className="py-4 px-6 rounded-2xl bg-[#222222] hover:bg-[#2A2A2A] text-gray-200 font-bold text-sm sm:text-base transition-colors"
        >
          {t('exploreMenu')}
        </button>
      </div>
    </div>
  );
};
