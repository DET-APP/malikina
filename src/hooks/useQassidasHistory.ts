// src/hooks/useQassidasHistory.ts
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

  const addToHistory = (qassida: QassidasHistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== qassida.id);
      const updated = [
        { ...qassida, lastViewed: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getFeaturedQassidas = (allQassidas: QassidasHistoryItem[]) => {
    return allQassidas.filter((q) => q.id <= 7).slice(0, 6);
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