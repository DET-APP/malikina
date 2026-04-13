import { useState, useEffect, createContext, useContext, ReactNode, createElement } from 'react';

const FAVORITES_STORAGE_KEY = 'malikina_favorites';

export interface FavoriteQassida {
  id: number;
  title: string;
  arabic: string;
  author: string;
  addedAt: number;
}

interface FavoritesContextType {
  favorites: FavoriteQassida[];
  loading: boolean;
  addFavorite: (qassida: FavoriteQassida) => void;
  removeFavorite: (qassidasId: number) => void;
  toggleFavorite: (qassida: FavoriteQassida) => void;
  isFavorite: (qassidasId: number) => boolean;
  clearFavorites: () => void;
  getFavoritesByAuthor: (author: string) => FavoriteQassida[];
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteQassida[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    }
  }, [favorites, loading]);

  const addFavorite = (qassida: FavoriteQassida) => {
    setFavorites(prev => {
      if (prev.some(fav => fav.id === qassida.id)) {
        return prev;
      }
      return [...prev, { ...qassida, addedAt: Date.now() }];
    });
  };

  const removeFavorite = (qassidasId: number) => {
    setFavorites(prev => prev.filter(fav => fav.id !== qassidasId));
  };

  const isFavorite = (qassidasId: number): boolean => {
    return favorites.some(fav => fav.id === qassidasId);
  };

  const toggleFavorite = (qassida: FavoriteQassida) => {
    if (isFavorite(qassida.id)) {
      removeFavorite(qassida.id);
    } else {
      addFavorite(qassida);
    }
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const getFavoritesByAuthor = (author: string) => {
    return favorites.filter(fav => fav.author === author);
  };

  const value: FavoritesContextType = {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    getFavoritesByAuthor,
    count: favorites.length,
  };

  return createElement(FavoritesContext.Provider, { value }, children);
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
