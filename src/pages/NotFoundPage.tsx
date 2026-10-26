import React from 'react';
import { Flame, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  const { language, t, isRtl } = useLanguage();

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center mx-auto text-[#FF8A00] shadow-inner">
        <Flame className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-6xl font-black font-mono text-[#D62828] block">404</span>
        <h1 className="text-2xl font-black text-white">
          {language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto">
          {language === 'ar'
            ? 'يبدو أن الرابط الذي طلبته غير متوفر أو تم نقله. يمكنك العودة للقائمة والطلب بكل سهولة.'
            : 'The requested route does not exist. Browse our authentic menu to discover our meals.'}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D62828]/25 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>{t('home')}</span>
        </button>

        <button
          onClick={() => navigate('/menu')}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-gray-300 hover:text-white font-bold text-xs sm:text-sm transition-colors"
        >
          <span>{t('exploreMenu')}</span>
        </button>
      </div>
    </div>
  );
};
