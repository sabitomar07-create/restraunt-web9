import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Globe,
  Volume2,
  VolumeX,
  User,
  Menu as MenuIcon,
  X,
  Flame,
  Shield,
  Clock,
  Phone,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useSound } from '../../context/SoundContext.tsx';
import { useSettings } from '../../context/SettingsContext.tsx';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { language, toggleLanguage, t, isRtl } = useLanguage();
  const { totalItemCount, setIsCartOpen } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const { isMuted, toggleMute } = useSound();
  const { settings } = useSettings();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const brandName = language === 'ar' ? settings.restaurantNameAr : settings.restaurantNameEn;

  const navLinks = [
    { path: '/', label: t('home') },
    { path: '/menu', label: t('menu') },
    { path: '/offers', label: t('offers'), badge: '15%' },
    { path: '/favorites', label: t('favorites') },
    { path: '/orders', label: t('orders') },
    { path: '/contact', label: t('contact') },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#D62828] rounded-xl p-1"
          aria-label={brandName}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D62828] to-[#FF8A00] flex items-center justify-center shadow-lg shadow-[#D62828]/25 text-white shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="block font-black text-lg sm:text-xl tracking-tight text-white uppercase leading-tight">
              {brandName}
            </span>
            <span className="block text-[11px] font-medium text-[#FF8A00] tracking-wide">
              {language === 'ar' ? 'سندوتشات وحواوشي على أصولها' : 'Authentic Egyptian Street Food'}
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white bg-[#222222] shadow-inner border border-[#333333]'
                    : 'text-gray-300 hover:text-white hover:bg-[#1B1B1B]'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="bg-[#D62828] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            aria-label={isMuted ? t('soundOff') : t('soundOn')}
            title={isMuted ? t('soundOff') : t('soundOn')}
            className={`p-2.5 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-[#1B1B1B] border-[#2A2A2A] text-gray-500 hover:text-gray-300'
                : 'bg-[#222222] border-[#FF8A00]/40 text-[#FF8A00] shadow-sm shadow-[#FF8A00]/10'
            }`}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            aria-label="Switch Language (AR / EN)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B1B1B] hover:bg-[#252525] border border-[#2A2A2A] text-xs font-bold text-gray-200 transition-colors"
          >
            <Globe className="w-4 h-4 text-[#FF8A00]" />
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label={`${t('cart')} (${totalItemCount} items)`}
            className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#D62828] to-[#c02323] hover:from-[#e02d2d] hover:to-[#d02727] text-white text-sm font-bold shadow-lg shadow-[#D62828]/25 transition-all transform active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">{t('cart')}</span>
            {totalItemCount > 0 && (
              <span className="w-5 h-5 bg-white text-[#D62828] text-xs font-extrabold rounded-full flex items-center justify-center">
                {totalItemCount}
              </span>
            )}
          </button>

          {/* User Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="p-2.5 rounded-xl bg-[#1B1B1B] hover:bg-[#252525] border border-[#2A2A2A] text-gray-200 transition-colors flex items-center gap-2"
              aria-label="User Account Menu"
              aria-expanded={userDropdownOpen}
            >
              <User className="w-5 h-5 text-gray-300" />
              {user && (
                <span className="hidden md:inline text-xs font-semibold text-gray-300 max-w-[100px] truncate">
                  {user.fullName}
                </span>
              )}
            </button>

            {userDropdownOpen && (
              <div
                className={`absolute ${
                  isRtl ? 'left-0' : 'right-0'
                } mt-2 w-56 bg-[#1A1A1A] border border-[#333333] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100`}
              >
                {user ? (
                  <>
                    <div className="px-3 py-2 border-b border-[#2A2A2A]">
                      <p className="text-xs text-gray-400">{language === 'ar' ? 'مرحباً بك' : 'Signed in as'}</p>
                      <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 bg-[#D62828]/20 text-[#FF8A00] text-[10px] font-bold px-2 py-0.5 rounded border border-[#D62828]/40">
                          {language === 'ar' ? 'مدير المطعم' : 'Administrator'}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleNav('/profile')}
                      className="w-full text-left rtl:text-right px-3 py-2 text-xs sm:text-sm font-medium text-gray-200 hover:bg-[#252525] rounded-lg mt-1 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      {t('profile')}
                    </button>

                    <button
                      onClick={() => handleNav('/orders')}
                      className="w-full text-left rtl:text-right px-3 py-2 text-xs sm:text-sm font-medium text-gray-200 hover:bg-[#252525] rounded-lg transition-colors flex items-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4 text-gray-400" />
                      {t('orders')}
                    </button>

                    <button
                      onClick={() => handleNav('/favorites')}
                      className="w-full text-left rtl:text-right px-3 py-2 text-xs sm:text-sm font-medium text-gray-200 hover:bg-[#252525] rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4 text-gray-400" />
                      {t('favorites')}
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleNav('/admin')}
                        className="w-full text-left rtl:text-right px-3 py-2 text-xs sm:text-sm font-bold text-[#FF8A00] hover:bg-[#FF8A00]/10 rounded-lg transition-colors flex items-center gap-2 border-t border-[#2A2A2A] mt-1"
                      >
                        <Shield className="w-4 h-4 text-[#FF8A00]" />
                        {t('adminDashboard')}
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        await logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left rtl:text-right px-3 py-2 text-xs sm:text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg mt-1 transition-colors border-t border-[#2A2A2A]"
                    >
                      {t('signOut')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleNav('/auth')}
                      className="w-full text-center py-2.5 px-3 bg-[#D62828] hover:bg-[#b92121] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-md"
                    >
                      {t('signIn')}
                    </button>
                    <button
                      onClick={() => handleNav('/admin/login')}
                      className="w-full mt-2 text-center py-1.5 px-3 text-gray-400 hover:text-gray-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-gray-500" />
                      {t('adminAccess')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-[#1B1B1B] hover:bg-[#252525] border border-[#2A2A2A] text-gray-200 transition-colors"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#151515] border-b border-[#2A2A2A] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-150">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNav(link.path)}
              className="w-full text-left rtl:text-right px-4 py-3 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#222222] transition-colors flex items-center justify-between"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="bg-[#D62828] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </button>
          ))}

          <div className="pt-3 border-t border-[#262626] flex flex-col gap-2">
            {!user ? (
              <button
                onClick={() => handleNav('/auth')}
                className="w-full py-3 bg-[#D62828] text-white text-center rounded-xl font-bold text-sm"
              >
                {t('signIn')}
              </button>
            ) : (
              <button
                onClick={() => handleNav('/profile')}
                className="w-full py-3 bg-[#222222] text-white text-center rounded-xl font-bold text-sm"
              >
                {t('profile')}
              </button>
            )}

            <button
              onClick={() => handleNav('/admin/login')}
              className="w-full py-2.5 text-center text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-[#FF8A00]" />
              {t('adminAccess')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
