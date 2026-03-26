import { useState, useEffect } from 'react';

export interface QassidasHistoryItem {
  id: number;
  title: string;
  arabic: string;
  author: string;
  lastViewed: number; // timestamp
}

const STORAGE_KEY = 'malikina_qassidas_history';
const MAX_HISTORY = 6;

export const useQassidasHistory = () => {
  const [history, setHistory] = useState<QassidasHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'historique au montage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      } catch (error) {
        console.error('Erreur parsing historique:', error);
        setHistory([]);
      }
    }
    setIsLoading(false);
  }, []);

  // Ajouter une Qassida à l'historique
  const addToHistory = (qassida: QassidasHistoryItem) => {
    setHistory((prev) => {
      // Supprimer si elle existe déjà
      const filtered = prev.filter((item) => item.id !== qassida.id);
      
      // Ajouter en début avec timestamp actuel
      const updated = [
        { ...qassida, lastViewed: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);

      // Sauvegarder
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      return updated;
    });
  };

  // Effacer l'historique
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Obtenir les Qassidas favoris par défaut (si historique vide)
  const getFeaturedQassidas = (allQassidas: QassidasHistoryItem[]) => {
    return allQassidas.filter((q) => q.id <= 7).slice(0, 6); // Les 7 premières
  };

  return {
    history,
    isLoading,
    addToHistory,
    clearHistory,
    getFeaturedQassidas,
    hasHistory: history.length > 0,
  };
};
