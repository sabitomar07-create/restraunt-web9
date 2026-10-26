import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types/index.ts';
import { useAuth } from './AuthContext.tsx';
import { useSound } from './SoundContext.tsx';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  favoriteProducts: Product[];
  isLoading: boolean;
  toggleFavorite: (product: Product) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { playFavoriteSound } = useSound();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('app_guest_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync favorites when user logs in
  useEffect(() => {
    if (token) {
      setIsLoading(true);
      fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setFavoriteProducts(data);
            setFavoriteIds(new Set(data.map((p) => p.id)));
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const toggleFavorite = async (product: Product) => {
    playFavoriteSound();
    const isCurrentlyFav = favoriteIds.has(product.id);

    // Optimistically update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFav) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      localStorage.setItem('app_guest_favorites', JSON.stringify(Array.from(next)));
      return next;
    });

    setFavoriteProducts((prev) => {
      if (isCurrentlyFav) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [product, ...prev];
      }
    });

    if (token) {
      try {
        await fetch('/api/favorites/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.id }),
        });
      } catch (err) {
        console.error('Failed to sync favorite to server:', err);
      }
    }
  };

  const isFavorite = (productId: string) => favoriteIds.has(productId);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoriteProducts,
        isLoading,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
