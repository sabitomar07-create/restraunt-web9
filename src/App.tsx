import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { SoundProvider } from './context/SoundContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { FavoritesProvider } from './context/FavoritesContext.tsx';

import { Navbar } from './components/common/Navbar.tsx';
import { Footer } from './components/common/Footer.tsx';
import { DraftNoticeBanner } from './components/common/DraftNoticeBanner.tsx';
import { CartDrawer } from './components/common/CartDrawer.tsx';

// Public Pages
import { HomePage } from './pages/HomePage.tsx';
import { MenuPage } from './pages/MenuPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { OffersPage } from './pages/OffersPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderSuccessPage } from './pages/OrderSuccessPage.tsx';
import { TrackOrderPage } from './pages/TrackOrderPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { FavoritesPage } from './pages/FavoritesPage.tsx';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage.tsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';
import { AdminMenuPage } from './pages/admin/AdminMenuPage.tsx';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage.tsx';
import { AdminOffersPage } from './pages/admin/AdminOffersPage.tsx';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage.tsx';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage.tsx';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.tsx';

import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { AccessDeniedPage } from './pages/AccessDeniedPage.tsx';

function MainRouter() {
  const [currentPath, setCurrentPath] = useState(
    () => (window.location.pathname || '/') + (window.location.search || '')
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath((window.location.pathname || '/') + (window.location.search || ''));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    const currentFull = window.location.pathname + window.location.search;
    if (currentFull !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  const [pathname, search] = currentPath.split('?');
  const searchParams = new URLSearchParams(search || '');
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';

  // Render active page based on path
  const renderPage = () => {
    // 1. Home
    if (pathname === '/') {
      return <HomePage navigate={navigate} />;
    }

    // 2. Menu
    if (pathname === '/menu') {
      const cat = searchParams.get('category') || undefined;
      const q = searchParams.get('search') || undefined;
      return <MenuPage navigate={navigate} initialCategory={cat} initialSearch={q} />;
    }

    // 3. Product Details: /menu/:slug
    if (pathname.startsWith('/menu/')) {
      const slug = pathname.replace('/menu/', '');
      if (slug) {
        return <ProductDetailPage slug={slug} navigate={navigate} />;
      }
    }

    // 4. Offers
    if (pathname === '/offers') {
      return <OffersPage navigate={navigate} />;
    }

    // 5. Cart
    if (pathname === '/cart') {
      return <CartPage navigate={navigate} />;
    }

    // 6. Checkout
    if (pathname === '/checkout') {
      return <CheckoutPage navigate={navigate} />;
    }

    // 7. Order Success: /order-success/:id
    if (pathname.startsWith('/order-success/')) {
      const orderId = pathname.replace('/order-success/', '');
      return <OrderSuccessPage orderId={orderId} navigate={navigate} />;
    }

    // 8. Track Order: /track-order/:id
    if (pathname.startsWith('/track-order/')) {
      const orderId = pathname.replace('/track-order/', '');
      return <TrackOrderPage orderId={orderId} navigate={navigate} />;
    }

    // 9. Auth
    if (pathname === '/auth') {
      return <AuthPage navigate={navigate} />;
    }

    // 10. Forgot Password
    if (pathname === '/forgot-password') {
      return <ForgotPasswordPage navigate={navigate} />;
    }

    // 11. Favorites
    if (pathname === '/favorites') {
      return <FavoritesPage navigate={navigate} />;
    }

    // 12. Past Orders
    if (pathname === '/orders') {
      return <OrdersHistoryPage navigate={navigate} />;
    }

    // 13. Profile
    if (pathname === '/profile') {
      return <ProfilePage navigate={navigate} />;
    }

    // 14. Contact
    if (pathname === '/contact') {
      return <ContactPage />;
    }

    // 15. Privacy & Terms
    if (pathname === '/privacy') {
      return <PrivacyPolicyPage />;
    }
    if (pathname === '/terms') {
      return <TermsPage />;
    }

    // ================= ADMIN ROUTES =================
    // Admin Login
    if (pathname === '/admin/login') {
      return <AdminLoginPage navigate={navigate} />;
    }

    // Admin Dashboard
    if (pathname === '/admin') {
      return <AdminDashboardPage navigate={navigate} />;
    }

    // Admin Menu
    if (pathname === '/admin/menu') {
      return <AdminMenuPage navigate={navigate} />;
    }

    // Admin Orders
    if (pathname === '/admin/orders') {
      return <AdminOrdersPage navigate={navigate} />;
    }

    // Admin Offers
    if (pathname === '/admin/offers') {
      return <AdminOffersPage navigate={navigate} />;
    }

    // Admin Customers
    if (pathname === '/admin/customers') {
      return <AdminCustomersPage navigate={navigate} />;
    }

    // Admin Inventory
    if (pathname === '/admin/inventory') {
      return <AdminInventoryPage navigate={navigate} />;
    }

    // Admin Settings
    if (pathname === '/admin/settings') {
      return <AdminSettingsPage navigate={navigate} />;
    }

    // 403 Access Denied
    if (pathname === '/access-denied') {
      return <AccessDeniedPage navigate={navigate} />;
    }

    // 404 Fallback
    return <NotFoundPage navigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F3F4F6] flex flex-col justify-between selection:bg-[#D62828] selection:text-white">
      {/* Top Draft Notice Banner */}
      {!isAdminRoute && <DraftNoticeBanner />}

      {/* Main Storefront Navbar (hidden on admin pages for cleaner focus) */}
      {!isAdminRoute && <Navbar currentPath={currentPath} navigate={navigate} />}

      {/* Main Content Area */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Cart Slide-over Drawer */}
      <CartDrawer navigate={navigate} />

      {/* Main Footer (hidden on admin management tabs) */}
      {!isAdminRoute && <Footer navigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SoundProvider>
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <MainRouter />
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </SoundProvider>
    </LanguageProvider>
  );
}
