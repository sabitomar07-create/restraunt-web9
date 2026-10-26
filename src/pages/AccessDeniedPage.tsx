import React from 'react';
import { ShieldAlert, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface AccessDeniedPageProps {
  navigate: (path: string) => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ navigate }) => {
  const { language, t, isRtl } = useLanguage();

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-red-950/70 border border-red-800 flex items-center justify-center mx-auto text-red-400 shadow-xl">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-4xl font-black font-mono text-red-400 block">403</span>
        <h1 className="text-2xl font-black text-white">
          {language === 'ar' ? 'غير مصرح بالدخول' : 'Access Denied'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto">
          {language === 'ar'
            ? 'هذه المنطقة مخصصة للإدارة فقط. لا تملك الصلاحيات الكافية للوصول إليها.'
            : 'You do not have administrative privileges to view or mutate this resource.'}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => navigate('/admin/login')}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <Lock className="w-4 h-4" />
          <span>{language === 'ar' ? 'تسجيل دخول المشرف' : 'Admin Login'}</span>
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-gray-300 hover:text-white font-bold text-xs sm:text-sm transition-colors"
        >
          <span>{t('home')}</span>
        </button>
      </div>
    </div>
  );
};
