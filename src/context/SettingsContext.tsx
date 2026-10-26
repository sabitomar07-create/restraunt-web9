import React, { createContext, useContext, useState, useEffect } from 'react';
import { RestaurantBranding } from '../types/index.ts';

const DEFAULT_BRANDING: RestaurantBranding = {
  restaurantNameEn: 'YOUR RESTAURANT',
  restaurantNameAr: 'مطعمك',
  taglineEn: 'Authentic Egyptian Street Food & Fresh Sandwiches',
  taglineAr: 'أشهى السندوتشات المصرية الأصيلة والحواوشي البلدي',
  logoUrl: '',
  phone: '+20 100 123 4567',
  whatsapp: '+20 100 123 4567',
  addressEn: '14 Al-Gomhoureya St, Downtown, Cairo, Egypt',
  addressAr: '١٤ شارع الجمهورية، وسط البلد، القاهرة، مصر',
  openingHoursEn: 'Daily: 10:00 AM – 3:00 AM',
  openingHoursAr: 'يومياً: ١٠:٠٠ ص – ٣:٠٠ ص',
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  isCatalogApproved: false,
  draftNoticeEn: 'Draft catalog & proposed launch prices for owner review. Not yet final menu.',
  draftNoticeAr: 'قائمة طعام تجريبية وأسعار مقترحة للمراجعة والاعتماد. ليست القائمة النهائية بعد.',
};

interface SettingsContextType {
  settings: RestaurantBranding;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<RestaurantBranding>, token: string) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantBranding>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.restaurantNameEn) {
          setSettings(data);
        }
      }
    } catch (err) {
      console.warn('Could not load restaurant settings from API, using default', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<RestaurantBranding>, token: string): Promise<boolean> => {
    try {
      const updated = { ...settings, ...newSettings };
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setSettings(updated);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
