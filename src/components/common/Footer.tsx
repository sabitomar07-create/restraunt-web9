import React from 'react';
import { Flame, Phone, MapPin, Clock, MessageSquare, Shield, Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useSettings } from '../../context/SettingsContext.tsx';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { language, t } = useLanguage();
  const { settings } = useSettings();

  const brandName = language === 'ar' ? settings.restaurantNameAr : settings.restaurantNameEn;
  const tagline = language === 'ar' ? settings.taglineAr : settings.taglineEn;
  const address = language === 'ar' ? settings.addressAr : settings.addressEn;
  const hours = language === 'ar' ? settings.openingHoursAr : settings.openingHoursEn;

  return (
    <footer className="bg-[#0A0A0A] border-t border-[#222222] text-gray-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D62828] to-[#FF8A00] flex items-center justify-center text-white">
                <Flame className="w-5 h-5" />
              </div>
              <span className="font-black text-xl text-white tracking-tight uppercase">
                {brandName}
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {tagline}
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-[#FF8A00] font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>{language === 'ar' ? 'المطبخ يستقبل الطلبات الآن' : 'Kitchen Open for Orders'}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase">
              {language === 'ar' ? 'روابط سريعة' : 'Navigation'}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                  {t('home')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/menu')} className="hover:text-white transition-colors">
                  {t('menu')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/offers')} className="hover:text-white transition-colors">
                  {t('offers')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/favorites')} className="hover:text-white transition-colors">
                  {t('favorites')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/orders')} className="hover:text-white transition-colors">
                  {t('orders')}
                </button>
              </li>
            </ul>
          </div>

          {/* Customer & Legal */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase">
              {language === 'ar' ? 'خدمة العملاء' : 'Customer Care'}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button onClick={() => navigate('/cart')} className="hover:text-white transition-colors">
                  {t('cart')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/checkout')} className="hover:text-white transition-colors">
                  {t('checkout')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">
                  {t('contact')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">
                  {t('privacy')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">
                  {t('terms')}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase">
              {language === 'ar' ? 'تواصل معنا' : 'Get in Touch'}
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF8A00] shrink-0 mt-0.5" />
                <span className="text-gray-300">{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#FF8A00] shrink-0" />
                <span className="text-gray-300">{hours}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FF8A00] shrink-0" />
                <a href={`tel:${settings.phone}`} className="text-gray-300 hover:text-white dir-ltr">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-[#10B981] shrink-0" />
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#10B981] hover:underline"
                >
                  WhatsApp Orders
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar with discreet Admin Access link */}
        <div className="pt-12 mt-12 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} {brandName}. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}
          </p>

          <div className="flex items-center gap-6">
            <span className="text-gray-600">
              {language === 'ar' ? 'سندوتشات مصرية بجودة وفخامة' : 'Premium Cairo Street Eatery'}
            </span>
            <button
              onClick={() => navigate('/admin/login')}
              className="text-gray-500 hover:text-[#FF8A00] transition-colors flex items-center gap-1.5 font-medium"
              aria-label="Admin Access"
            >
              <Shield className="w-3.5 h-3.5 text-gray-600 hover:text-[#FF8A00]" />
              <span>Admin Access</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
