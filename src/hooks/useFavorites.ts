import { useState, useEffect } from 'react';

const FAVORITES_STORAGE_KEY = 'malikina_favorites';

export interface FavoriteQassida {
  id: number;
  title: string;
  arabic: string;
  author: string;
  addedAt: number;
}

export const useFavorites = () => {
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
      // Check if already favorited
      if (prev.some(fav => fav.id === qassida.id)) {
        return prev;
      }
      return [...prev, { ...qassida, addedAt: Date.now() }];
    });
  };

  const removeFavorite = (qassidasId: number) => {
    setFavorites(prev => prev.filter(fav => fav.id !== qassidasId));
  };

  const toggleFavorite = (qassida: FavoriteQassida) => {
    if (isFavorite(qassida.id)) {
      removeFavorite(qassida.id);
    } else {
      addFavorite(qassida);
    }
  };

  const isFavorite = (qassidasId: number): boolean => {
    return favorites.some(fav => fav.id === qassidasId);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const getFavoritesByAuthor = (author: string) => {
    return favorites.filter(fav => fav.author === author);
  };

  return {
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
};
