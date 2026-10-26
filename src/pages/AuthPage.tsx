import React, { useState } from 'react';
import { Lock, Mail, User, Phone, MapPin, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthPageProps {
  navigate: (path: string) => void;
  redirectTo?: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({ navigate, redirectTo = '/' }) => {
  const { language, t, isRtl } = useLanguage();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === 'login') {
      const res = await login(email, password);
      setIsLoading(false);
      if (res.success) {
        navigate(redirectTo);
      } else {
        setError(res.error || 'Failed to sign in.');
      }
    } else {
      if (!fullName.trim()) {
        setError(language === 'ar' ? 'يرجى إدخال الاسم بالكامل' : 'Full name is required');
        setIsLoading(false);
        return;
      }
      const res = await register({
        email,
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        defaultAddress: address.trim() || undefined,
      });
      setIsLoading(false);
      if (res.success) {
        navigate(redirectTo);
      } else {
        setError(res.error || 'Registration failed.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      {/* Header Tabs */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-2 gap-2 bg-[#121212] p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'login'
                ? 'bg-[#D62828] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('signIn')}
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'register'
                ? 'bg-[#D62828] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {language === 'ar' ? 'حساب جديد' : 'Create Account'}
          </button>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">{t('customerName')} *</label>
              <div className="relative">
                <User className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Omar Sabit"
                  className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
            </label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none dir-ltr text-left"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-300 block">
                {language === 'ar' ? 'كلمة المرور' : 'Password'} *
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[11px] text-[#FF8A00] hover:underline"
                >
                  {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">{t('customerPhone')}</label>
                <div className="relative">
                  <Phone className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none dir-ltr text-left"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">{t('deliveryAddress')}</label>
                <div className="relative">
                  <MapPin className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={language === 'ar' ? 'الشارع ورقم العمارة...' : 'Street name and building...'}
                    className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D62828] to-[#b82222] hover:from-[#e02d2d] hover:to-[#c02323] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#D62828]/25 transition-all transform active:scale-95 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{mode === 'login' ? t('signIn') : (language === 'ar' ? 'تسجيل حساب' : 'Create Account')}</span>
            )}
          </button>
        </form>

        {/* Social Authentication Status */}
        <div className="pt-4 border-t border-[#262626] space-y-3">
          <p className="text-[11px] text-gray-400 text-center uppercase tracking-wider font-semibold">
            {language === 'ar' ? 'تسجيل الدخول السريع (الشبكات الاجتماعية)' : 'Social Single Sign-On'}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => alert(language === 'ar' ? 'يرجى ربط مفاتيح Google OAuth في إعدادات البيئة لتفعيل هذا المزود.' : 'Google OAuth credentials must be configured in environment secrets.')}
              className="py-2 px-3 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-gray-300 font-bold border border-[#303030] text-center"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => alert(language === 'ar' ? 'يرجى ربط مفاتيح Apple Sign-In في إعدادات البيئة لتفعيل هذا المزود.' : 'Apple Sign-In credentials must be configured in environment secrets.')}
              className="py-2 px-3 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-gray-300 font-bold border border-[#303030] text-center"
            >
              Apple
            </button>
          </div>
          <p className="text-[10px] text-gray-500 text-center leading-tight">
            {language === 'ar'
              ? 'يتم تشفير كلمات المرور باستخدام خوارزمية scrypt المشددة لحماية حسابك.'
              : 'Passwords hashed with high-grade scrypt to protect user privacy.'}
          </p>
        </div>
      </div>
    </div>
  );
};
