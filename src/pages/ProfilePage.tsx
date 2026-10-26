import React, { useState } from 'react';
import { User, Phone, MapPin, Mail, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfilePageProps {
  navigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { language, t } = useLanguage();
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [defaultAddress, setDefaultAddress] = useState(user?.defaultAddress || '');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <User className="w-16 h-16 text-gray-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">{language === 'ar' ? 'سجّل دخولك أولاً' : 'Please Sign In'}</h2>
        <button
          onClick={() => navigate('/auth')}
          className="py-3 px-6 rounded-xl bg-[#D62828] text-white font-bold text-sm"
        >
          {t('signIn')}
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSavedSuccess(false);

    const res = await updateProfile({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      defaultAddress: defaultAddress.trim() || undefined,
    });

    setIsSaving(false);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setError(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <User className="w-8 h-8 text-[#FF8A00]" />
          <span>{t('profile')}</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {language === 'ar' ? 'بيانات حسابك وعنوان التوصيل المفضل لتسريع الطلبات القادمة.' : 'Your personal account info and default address for faster checkout.'}
        </p>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {savedSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Profile updated successfully!'}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 block">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full bg-[#111111]/60 border border-[#262626] rounded-xl py-2.5 px-3 text-xs sm:text-sm text-gray-400 cursor-not-allowed dir-ltr text-left"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">{t('customerName')} *</label>
            <div className="relative">
              <User className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">{t('customerPhone')}</label>
            <div className="relative">
              <Phone className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none dir-ltr text-left"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">{t('deliveryAddress')}</label>
            <div className="relative">
              <MapPin className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
              <textarea
                rows={2}
                value={defaultAddress}
                onChange={(e) => setDefaultAddress(e.target.value)}
                placeholder={language === 'ar' ? 'العنوان الافتراضي للتوصيل...' : 'Default delivery address...'}
                className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-6 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white font-extrabold text-sm transition-colors shadow-lg shadow-[#D62828]/25"
          >
            {isSaving ? '...' : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
          </button>
        </form>
      </div>
    </div>
  );
};
