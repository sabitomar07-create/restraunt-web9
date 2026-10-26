import React from 'react';
import { FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';

export const TermsPage: React.FC = () => {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const brandName = language === 'ar' ? settings.restaurantNameAr : settings.restaurantNameEn;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FF8A00]/15 border border-[#FF8A00]/30 flex items-center justify-center text-[#FF8A00]">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {language === 'ar' ? `قواعد الطلب والتوصيل • ${brandName}` : `Ordering & Service Rules • ${brandName}`}
          </p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-gray-300 leading-relaxed shadow-xl">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? '١. قائمة الأسعار التجريبية' : '1. Catalog Draft Status Notice'}
          </h2>
          <p>
            {language === 'ar'
              ? 'تعتبر الأسعار الحالية أسعاراً مقترحة قابلة للمراجعة والتعديل قبل الافتتاح الرسمي وتأكيد إدارة المطعم على الأحجام والأوزان.'
              : 'Current prices in the starter catalog are proposed draft launch figures subject to management confirmation prior to the grand opening.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? '٢. الدفع نقداً عند الاستلام' : '2. Cash on Delivery & Cash on Pickup'}
          </h2>
          <p>
            {language === 'ar'
              ? 'يتم تسديد قيمة الطلب بالجنيه المصري نقداً عند استلام الوجبات من المندوب أو استلامها من مقر المطعم.'
              : 'Payment is settled in Egyptian Pounds (EGP) upon receipt of food from courier or pickup at the restaurant.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? '٣. إلغاء الطلبات وتعديلها' : '3. Order Modifications & Cancellations'}
          </h2>
          <p>
            {language === 'ar'
              ? 'نظراً لأن الوجبات تُطهى طازجة فور استلام الطلب، يُرجى التواصل هاتفياً خلال ٥ دقائق من إرسال الطلب في حال رغبتك في أي تعديل.'
              : 'Because sandwiches and meals are freshly prepared to order on our griddle and grill, please contact the restaurant hotline within 5 minutes if modifications are needed.'}
          </p>
        </section>
      </div>
    </div>
  );
};
