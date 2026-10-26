import React from 'react';
import {
  Shield,
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Tag,
  Users,
  Boxes,
  Settings,
  ExternalLink,
  LogOut,
  Globe,
  Flame,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useSettings } from '../../context/SettingsContext.tsx';

interface AdminLayoutProps {
  currentTab: string;
  navigate: (path: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, navigate, children }) => {
  const { language, toggleLanguage, isRtl } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const { settings } = useSettings();

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">
          {language === 'ar' ? 'غير مصرح بالدخول' : 'Access Restricted'}
        </h1>
        <p className="text-sm text-gray-400">
          {language === 'ar'
            ? 'هذه الصفحة مخصصة لمدير المطعم فقط. يرجى تسجيل الدخول بحساب المشرف.'
            : 'This portal requires verified administrator permissions.'}
        </p>
        <button
          onClick={() => navigate('/admin/login')}
          className="py-3 px-6 rounded-xl bg-[#D62828] text-white font-bold text-sm"
        >
          {language === 'ar' ? 'تسجيل دخول الإدارة' : 'Admin Login'}
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', path: '/admin', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'menu', path: '/admin/menu', labelEn: 'Menu & Prices', labelAr: 'القائمة والأسعار', icon: UtensilsCrossed },
    { id: 'orders', path: '/admin/orders', labelEn: 'Orders', labelAr: 'إدارة الطلبات', icon: ShoppingBag },
    { id: 'offers', path: '/admin/offers', labelEn: 'Offers & Promos', labelAr: 'العروض والأكواد', icon: Tag },
    { id: 'customers', path: '/admin/customers', labelEn: 'Customers', labelAr: 'بيانات العملاء', icon: Users },
    { id: 'inventory', path: '/admin/inventory', labelEn: 'Inventory', labelAr: 'المخزون والتوافر', icon: Boxes },
    { id: 'settings', path: '/admin/settings', labelEn: 'Settings & Brand', labelAr: 'الهوية والإعدادات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-gray-200">
      {/* Top Admin Bar */}
      <header className="bg-[#141414] border-b border-[#262626] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D62828] to-[#FF8A00] flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm sm:text-base text-white uppercase tracking-tight flex items-center gap-1.5">
                <span>{language === 'ar' ? settings.restaurantNameAr : settings.restaurantNameEn}</span>
                <span className="text-[10px] bg-[#D62828]/20 text-[#FF8A00] font-bold px-2 py-0.5 rounded border border-[#D62828]/40">
                  {language === 'ar' ? 'الإدارة' : 'Admin'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* View storefront */}
            <button
              onClick={() => navigate('/')}
              className="py-2 px-3 rounded-xl bg-[#202020] hover:bg-[#2A2A2A] text-gray-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span className="hidden sm:inline">{language === 'ar' ? 'عرض المتجر' : 'Storefront'}</span>
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="py-2 px-3 rounded-xl bg-[#202020] hover:bg-[#2A2A2A] text-gray-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
              className="py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 font-bold flex items-center gap-1.5 transition-colors border border-red-800/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'خروج' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Tab navigation bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#D62828] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{language === 'ar' ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
