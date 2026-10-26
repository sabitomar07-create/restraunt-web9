import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft, Key } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminLoginPageProps {
  navigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ navigate }) => {
  const { language, t, isRtl } = useLanguage();
  const { login, user, isAdmin } = useAuth();

  const [email, setEmail] = useState('admin@yourrestaurant.eg');
  const [password, setPassword] = useState('123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as admin, redirect to /admin
  if (user && isAdmin) {
    navigate('/admin');
    return null;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Invalid administrator credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D62828] to-[#FF8A00] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#D62828]/25">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {language === 'ar' ? 'بوابة إدارة المطعم' : 'Restaurant Management Portal'}
          </h1>
          <p className="text-xs text-gray-400">
            {language === 'ar'
              ? 'تسجيل دخول مخصص للمشرفين ومدير المطعم لإدارة الطلبات والأسعار والقائمة.'
              : 'Dedicated administrator access to manage menu, prices, orders, and restaurant branding.'}
          </p>
        </div>

        {/* Temporary Owner Dev Credentials Notice */}
        <div className="bg-[#241712] border border-[#FF8A00]/40 rounded-2xl p-4 space-y-1.5 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-bold text-[#FF8A00]">
            <Key className="w-4 h-4" />
            <span>{language === 'ar' ? 'بيانات دخول المطور المؤقتة' : 'Initial Admin Credentials'}</span>
          </div>
          <p className="text-[11px] text-gray-300">
            <strong>Email:</strong> <code className="text-white">admin@yourrestaurant.eg</code>
          </p>
          <p className="text-[11px] text-gray-300">
            <strong>Password:</strong> <code className="text-white">123</code>
          </p>
          <p className="text-[10px] text-gray-400 pt-1 border-t border-[#35201A]">
            {language === 'ar'
              ? 'يمكنك تغيير كلمة المرور في أي وقت من تبويب إعدادات المطعم.'
              : 'You can update your admin password at any time inside the Admin Settings tab.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">
              {language === 'ar' ? 'البريد الإلكتروني للإدارة' : 'Admin Email'}
            </label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none dir-ltr text-left"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D62828] to-[#b82222] hover:from-[#e02d2d] hover:to-[#c02323] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#D62828]/25 transition-all"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{language === 'ar' ? 'تسجيل الدخول كمدير' : 'Access Admin Dashboard'}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#262626]">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
          >
            {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{language === 'ar' ? 'الرجوع للمطعم' : 'Return to Storefront'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
