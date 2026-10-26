import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const dictionary: Translations = {
  // Navigation
  home: { en: 'Home', ar: 'الرئيسية' },
  menu: { en: 'Menu', ar: 'القائمة' },
  offers: { en: 'Offers & Deals', ar: 'العروض والخصومات' },
  favorites: { en: 'Saved Meals', ar: 'المفضلة' },
  orders: { en: 'Order History', ar: 'طلباتي السابقة' },
  contact: { en: 'Contact & Hours', ar: 'تواصل معنا' },
  privacy: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  terms: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
  adminAccess: { en: 'Admin Access', ar: 'دخول الإدارة' },
  adminDashboard: { en: 'Admin Dashboard', ar: 'لوحة التحكم' },
  cart: { en: 'Cart', ar: 'سلة الطلبات' },
  signIn: { en: 'Sign In', ar: 'تسجيل الدخول' },
  signOut: { en: 'Sign Out', ar: 'تسجيل الخروج' },
  profile: { en: 'My Profile', ar: 'حسابي' },

  // Hero & CTAs
  orderNow: { en: 'Order Now', ar: 'اطلب الآن' },
  exploreMenu: { en: 'Explore Menu', ar: 'تصفح القائمة' },
  delivery: { en: 'Delivery', ar: 'توصيل للمنزل' },
  pickup: { en: 'Pickup', ar: 'استلام من المطعم' },
  streetFoodTitle: { en: 'Authentic Egyptian Street Food & Sandwiches', ar: 'أصل السندوتشات المصرية وطعم زمان' },
  streetFoodSubtitle: {
    en: 'Alexandrian liver, sizzling baladi sausage, charcoal grills, and crispy hawawshi delivered piping hot.',
    ar: 'كبدة إسكندراني على أصولها، سجق بلدي متبل، مشويات على الفحم، وحواوشي مقرمش يوصلك سخن ومولع.',
  },

  // Menu & Product
  categories: { en: 'Categories', ar: 'الأقسام' },
  allCategories: { en: 'All Items', ar: 'جميع الأصناف' },
  featuredDishes: { en: 'Featured Egyptian Dishes', ar: 'أشهر الأطباق المميزة' },
  searchPlaceholder: { en: 'Search sandwiches, hawawshi, meals...', ar: 'ابحث عن سندوتشات، حواوشي، وجبات...' },
  addToCart: { en: 'Add to Cart', ar: 'أضف للسلة' },
  customize: { en: 'Customize', ar: 'تخصيص الطلب' },
  soldOut: { en: 'Sold Out', ar: 'نفدت الكمية' },
  available: { en: 'Available', ar: 'متاح للطلب' },
  prepTime: { en: 'Prep time', ar: 'وقت التحضير' },
  minutes: { en: 'mins', ar: 'دقيقة' },
  allergens: { en: 'Allergen Information', ar: 'معلومات الحساسية' },
  chooseSize: { en: 'Choose Portion / Size', ar: 'اختر الحجم أو التقطيع' },
  chooseAddons: { en: 'Add Extra Sauces & Sides', ar: 'إضافات ومقبلات مقترحة' },
  specialNotes: { en: 'Special cooking instructions or notes', ar: 'تعليمات أو ملاحظات خاصة على الطلب' },
  notesPlaceholder: { en: 'e.g., extra lemon, no hot peppers...', ar: 'مثال: ليمون زيادة، بدون شطة، تسوية زيادة...' },

  // Cart & Checkout
  yourCart: { en: 'Your Order Cart', ar: 'سلة طلباتك' },
  emptyCart: { en: 'Your cart is currently empty.', ar: 'سلة طلباتك فارغة حالياً.' },
  emptyCartPrompt: { en: 'Add some delicious Egyptian sandwiches to get started!', ar: 'تصفح قائمتنا اللذيذة واختر ما تشتهيه!' },
  subtotal: { en: 'Subtotal', ar: 'المجموع الفرعي' },
  deliveryFee: { en: 'Delivery Fee', ar: 'تكلفة التوصيل' },
  discount: { en: 'Discount', ar: 'قيمة الخصم' },
  total: { en: 'Total Amount', ar: 'الإجمالي النهائي' },
  checkout: { en: 'Proceed to Checkout', ar: 'متابعة الدفع والطلب' },
  applyPromo: { en: 'Apply Code', ar: 'تطبيق الكود' },
  enterPromo: { en: 'Have a promo code?', ar: 'هل لديك كود خصم؟' },
  deliveryZone: { en: 'Select Delivery Area', ar: 'اختر منطقة التوصيل' },
  deliveryAddress: { en: 'Delivery Street Address, Building, Floor', ar: 'العنوان بالتفصيل، رقم العمارة، الشقة، وأقرب علامة مميزة' },
  customerName: { en: 'Your Full Name', ar: 'الاسم بالكامل' },
  customerPhone: { en: 'Phone Number (Egyptian mobile)', ar: 'رقم الهاتف المحمول (مصر)' },
  paymentMethod: { en: 'Payment Method', ar: 'طريقة الدفع' },
  cashOnDelivery: { en: 'Cash on Delivery', ar: 'الدفع نقداً عند الاستلام' },
  cashOnPickup: { en: 'Cash on Pickup', ar: 'الدفع نقداً عند استلام الطلب من المطعم' },
  placeOrder: { en: 'Confirm and Place Order', ar: 'تأكيد وإرسال الطلب' },

  // Order Success & Tracking
  orderPlaced: { en: 'Order Placed Successfully!', ar: 'تم استلام طلبك بنجاح!' },
  orderNumber: { en: 'Order Number', ar: 'رقم الطلب' },
  trackOrder: { en: 'Track Order Status', ar: 'متابعة مسار الطلب' },
  statusPending: { en: 'Order Received', ar: 'تم استلام الطلب' },
  statusPreparing: { en: 'Cooking in Kitchen', ar: 'جاري التحضير في المطبخ' },
  statusOutForDelivery: { en: 'Out with Courier', ar: 'خرج مع مندوب التوصيل' },
  statusDelivered: { en: 'Delivered Fresh', ar: 'تم التوصيل بنجاح' },
  statusCancelled: { en: 'Cancelled', ar: 'تم الإلغاء' },

  // Draft Notice
  draftCatalogBadge: { en: 'Draft Menu Catalog', ar: 'قائمة طعام تجريبية' },
  draftNoticeText: {
    en: 'Proposed launch prices and draft menu for owner review. Final items and portions will be confirmed prior to public grand opening.',
    ar: 'أسعار وقائمة تجريبية مقترحة للمراجعة والاعتماد. سيتم تأكيد الأصناف والأسعار النهائية قبل الافتتاح الرسمي.',
  },

  // Sound
  soundOn: { en: 'Sound Effects: ON', ar: 'المؤثرات الصوتية: مفعلة' },
  soundOff: { en: 'Sound Effects: MUTED', ar: 'المؤثرات الصوتية: صامت' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  formatMoney: (piastres: number) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return saved === 'ar' || saved === 'en' ? saved : 'en';
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    localStorage.setItem('app_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language, isRtl]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: string): string => {
    const entry = dictionary[key];
    if (!entry) return key;
    return entry[language] || entry.en || key;
  };

  const formatMoney = (piastres: number): string => {
    const egp = (piastres / 100).toFixed(2).replace(/\.00$/, '');
    return language === 'ar' ? `${egp} ج.م` : `EGP ${egp}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatMoney,
        isRtl,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
