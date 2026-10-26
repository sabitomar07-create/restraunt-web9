import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';

export const PrivacyPolicyPage: React.FC = () => {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const brandName = language === 'ar' ? settings.restaurantNameAr : settings.restaurantNameEn;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#D62828]/15 border border-[#D62828]/30 flex items-center justify-center text-[#D62828]">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'ar' ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy & Customer Data Protection'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {language === 'ar' ? `آخر تحديث: أكتوبر ٢٠٢٦ • ${brandName}` : `Last updated: October 2026 • ${brandName}`}
          </p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-gray-300 leading-relaxed shadow-xl">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? '١. جمع البيانات لغرض التوصيل' : '1. Minimum Data Required for Order Fulfillment'}
          </h2>
          <p>
            {language === 'ar'
              ? `في ${brandName}، نحرص على خصوصيتك. نقوم فقط بجمع المعلومات الضرورية لتوصيل وجباتك وتأكيد طلبك: اسم العميل، رقم الهاتف للتواصل، وعنوان التوصيل.`
              : `At ${brandName}, we prioritize your privacy. We only collect the minimal customer data required to fulfill your food orders: your name, contact phone number, and delivery street address.`}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? '٢. أمان كلمات المرور والتشفير' : '2. Password Security & Strong Encryption'}
          </h2>
          <p>
            {language === 'ar'
              ? 'يتم تشفير كلمات المرور باستخدام خوارزميات التجزئة الحديثة (scrypt). لا يتم تخزين أو نقل أي كلمات مرور بنص صريح أبداً، ولا يستطيع أي موظف الاطلاع عليها.'
              : 'User passwords are encrypted with server-side scrypt hashing with cryptographic salt. Plaintext passwords are never stored or transmitted.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? '٣. عدم مشاركة البيانات مع جهات خارجية' : '3. Zero Third-Party Selling'}
          </h2>
          <p>
            {language === 'ar'
              ? 'نحن لا نبيع أو نؤجر بيانات عملائنا لأي أطراف إعلانية أو جهات خارجية. تُستخدم بياناتك حصرياً لتجهيز وتوصيل طلبات الطعام الخاصة بك.'
              : 'We do not sell, rent, or trade your personal information with external advertising networks. Customer information is solely used for order preparation and dispatch.'}
          </p>
        </section>
      </div>
    </div>
  );
};
