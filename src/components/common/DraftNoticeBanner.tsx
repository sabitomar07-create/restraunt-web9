import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const DraftNoticeBanner: React.FC = () => {
  const { settings } = useSettings();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  // If owner approved catalog or user dismissed banner for this session, hide
  if (settings.isCatalogApproved || dismissed) {
    return null;
  }

  const noticeText = language === 'ar' ? settings.draftNoticeAr : settings.draftNoticeEn;

  return (
    <aside
      aria-label={language === 'ar' ? 'تنبيه القائمة التجريبية' : 'Draft Menu Notice'}
      className="bg-[#2A1810] border-b border-[#FF8A00]/40 text-[#FED7AA] px-4 py-2.5 text-xs sm:text-sm font-medium transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 bg-[#D62828] text-white px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0">
            <ShieldAlert className="w-3.5 h-3.5" />
            {language === 'ar' ? 'مسودة أسعار' : 'Draft Catalog'}
          </span>
          <span className="truncate text-gray-200">
            {noticeText}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white p-1 rounded transition-colors shrink-0"
          aria-label={language === 'ar' ? 'إغلاق الإشعار' : 'Dismiss notice'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
