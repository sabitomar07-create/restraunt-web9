import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Check,
  AlertCircle,
  ShieldCheck,
  Key,
  Flame,
  Bike,
  Building,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useSettings } from '../../context/SettingsContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DeliveryZone } from '../../types/index.ts';

interface AdminSettingsPageProps {
  navigate: (path: string) => void;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ navigate }) => {
  const { language, formatMoney } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const { token } = useAuth();

  // Branding state
  const [nameEn, setNameEn] = useState(settings.restaurantNameEn);
  const [nameAr, setNameAr] = useState(settings.restaurantNameAr);
  const [taglineEn, setTaglineEn] = useState(settings.taglineEn);
  const [taglineAr, setTaglineAr] = useState(settings.taglineAr);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [addressEn, setAddressEn] = useState(settings.addressEn);
  const [addressAr, setAddressAr] = useState(settings.addressAr);
  const [hoursEn, setHoursEn] = useState(settings.openingHoursEn);
  const [hoursAr, setHoursAr] = useState(settings.openingHoursAr);
  const [isCatalogApproved, setIsCatalogApproved] = useState(settings.isCatalogApproved);

  // Delivery zones state
  const [zones, setZones] = useState<DeliveryZone[]>([]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  // Status feedback
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/delivery-zones', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setZones(data);
      })
      .catch(console.error);
  }, [token]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingBrand(true);

    const success = await updateSettings(
      {
        restaurantNameEn: nameEn.trim(),
        restaurantNameAr: nameAr.trim(),
        taglineEn: taglineEn.trim(),
        taglineAr: taglineAr.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        addressEn: addressEn.trim(),
        addressAr: addressAr.trim(),
        openingHoursEn: hoursEn.trim(),
        openingHoursAr: hoursAr.trim(),
        isCatalogApproved,
      },
      token
    );

    setIsSavingBrand(false);
    if (success) {
      setBrandSaved(true);
      setTimeout(() => setBrandSaved(false), 3000);
    }
  };

  const handleUpdateZone = async (z: DeliveryZone, newFeeEgp: number, newMinEgp: number) => {
    await fetch(`/api/admin/delivery-zones/${z.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deliveryFeePiastres: Math.round(newFeeEgp * 100),
        minOrderPiastres: Math.round(newMinEgp * 100),
      }),
    });

    // Refresh zones
    const res = await fetch('/api/admin/delivery-zones', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await res.json();
    if (Array.isArray(d)) setZones(d);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordErr(null);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordErr(data.error || 'Failed to update admin password.');
        return;
      }
      setPasswordMsg('Admin password updated successfully. The temporary password has been retired.');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setPasswordErr('Network error while updating password.');
    }
  };

  return (
    <AdminLayout currentTab="settings" navigate={navigate}>
      <div className="space-y-10 max-w-4xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'ar' ? 'إعدادات الهوية والعلامة التجارية' : 'Brand Identity & Store Settings'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {language === 'ar'
              ? 'تغيير اسم المطعم، العنوان، أرقام الهاتف، واعتماد قائمة الأسعار دون تعديل أي كود برمجي.'
              : 'Configure brand name, contact numbers, address, and catalog approval without code changes.'}
          </p>
        </div>

        {/* 1. BRANDING & RESTAURANT INFO */}
        <div className="bg-[#181818] border border-[#262626] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242424] pb-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-5 h-5 text-[#FF8A00]" />
              <span>{language === 'ar' ? 'بيانات المطعم والشعار' : 'Brand Name & Contact Details'}</span>
            </h2>

            {brandSaved && (
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تم الحفظ بنجاح!' : 'Settings Saved!'}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
            {/* Catalog Approval Banner Toggle */}
            <div className="bg-[#241712] border border-[#FF8A00]/40 rounded-2xl p-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="catalogApproval"
                checked={isCatalogApproved}
                onChange={(e) => setIsCatalogApproved(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-[#111111] border-gray-600 text-[#D62828] focus:ring-[#D62828]"
              />
              <div>
                <label htmlFor="catalogApproval" className="font-bold text-white text-xs sm:text-sm block cursor-pointer">
                  {language === 'ar'
                    ? 'اعتماد القائمة والأسعار رسمياً (إخفاء تنبيه المسودة)'
                    : 'Confirm and Approve Menu Catalog (Hides top draft notice)'}
                </label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {language === 'ar'
                    ? 'عند تفعيل هذا الخيار، يعتبر المطعم أن الأسعار والأحجام قد تمت مراجعتها واعتمادها للافتتاح.'
                    : 'When checked, the restaurant certifies the current menu portions and prices as confirmed.'}
                </p>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Brand Name (English) *</label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">اسم المطعم (عربي) *</label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl p-2.5 text-white text-right"
                />
              </div>
            </div>

            {/* Taglines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Tagline (English)</label>
                <input
                  type="text"
                  value={taglineEn}
                  onChange={(e) => setTaglineEn(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">الشعار اللفظي (عربي)</label>
                <input
                  type="text"
                  value={taglineAr}
                  onChange={(e) => setTaglineAr(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white text-right"
                />
              </div>
            </div>

            {/* Contact Phone & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Hotline / Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white dir-ltr text-left"
                />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">WhatsApp Orders Number</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white dir-ltr text-left"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Address (English)</label>
                <input
                  type="text"
                  value={addressEn}
                  onChange={(e) => setAddressEn(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">العنوان (عربي)</label>
                <input
                  type="text"
                  value={addressAr}
                  onChange={(e) => setAddressAr(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white text-right"
                />
              </div>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Opening Hours (English)</label>
                <input
                  type="text"
                  value={hoursEn}
                  onChange={(e) => setHoursEn(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">ساعات العمل (عربي)</label>
                <input
                  type="text"
                  value={hoursAr}
                  onChange={(e) => setHoursAr(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white text-right"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingBrand}
                className="py-3 px-6 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#D62828]/25"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingBrand ? 'Saving...' : (language === 'ar' ? 'حفظ إعدادات الهوية' : 'Save Brand Settings')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. DELIVERY ZONES & MINIMUM ORDER */}
        <div className="bg-[#181818] border border-[#262626] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#242424] pb-4">
            <Bike className="w-5 h-5 text-[#FF8A00]" />
            <span>{language === 'ar' ? 'مناطق التوصيل والحد الأدنى' : 'Delivery Zones & Area Fees'}</span>
          </h2>

          <div className="space-y-3">
            {zones.map((z) => (
              <div
                key={z.id}
                className="p-4 rounded-2xl bg-[#121212] border border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-bold text-white text-sm block">
                    {language === 'ar' ? z.name_ar : z.name_en}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Est. {z.estimated_minutes} minutes
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Fee (EGP)</label>
                    <input
                      type="number"
                      defaultValue={(z.delivery_fee_piastres / 100).toString()}
                      id={`fee-${z.id}`}
                      className="w-20 bg-[#1A1A1A] border border-[#333333] rounded-lg py-1 px-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Min Order (EGP)</label>
                    <input
                      type="number"
                      defaultValue={(z.min_order_piastres / 100).toString()}
                      id={`min-${z.id}`}
                      className="w-24 bg-[#1A1A1A] border border-[#333333] rounded-lg py-1 px-2 text-white"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const feeVal = parseFloat((document.getElementById(`fee-${z.id}`) as HTMLInputElement)?.value || '0');
                      const minVal = parseFloat((document.getElementById(`min-${z.id}`) as HTMLInputElement)?.value || '0');
                      handleUpdateZone(z, feeVal, minVal);
                    }}
                    className="self-end py-1.5 px-3 rounded-lg bg-[#252525] hover:bg-[#333333] text-white font-bold transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CHANGE ADMIN PASSWORD */}
        <div className="bg-[#181818] border border-[#262626] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1 border-b border-[#242424] pb-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-5 h-5 text-[#D62828]" />
              <span>{language === 'ar' ? 'تغيير كلمة مرور الإدارة' : 'Update Administrator Password'}</span>
            </h2>
            <p className="text-xs text-gray-400">
              {language === 'ar'
                ? 'استبدل كلمة المرور المؤقتة (123) بكلمة مرور مشفرة وآمنة لحماية لوحة التحكم.'
                : 'Replace initial temporary password (123) with a permanent secure password.'}
            </p>
          </div>

          {passwordMsg && (
            <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{passwordMsg}</span>
            </div>
          )}

          {passwordErr && (
            <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{passwordErr}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md text-xs">
            <div>
              <label className="font-bold text-gray-300 block mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password (e.g. 123)"
                className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="font-bold text-gray-300 block mb-1">New Secure Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 3 chars)"
                className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl p-2.5 text-white"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-[#252525] hover:bg-[#333333] border border-[#3A3A3A] text-white font-bold transition-colors shadow-md"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};
