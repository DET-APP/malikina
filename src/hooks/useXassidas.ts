// src/hooks/useXassidas.ts
import { useQuery } from '@tanstack/react-query';
import { authorsData as localAuthorsData, type Qassida, type Author } from '@/data/qassidasData';
import { cacheData, getCachedData } from '@/lib/offlineDb';

// API interfaces
export interface APIAuthor {
  id: string;
  name?: string;
  full_name?: string;
  fullName?: string;
  description?: string;
  photo_url?: string;
  tradition?: string;
}

export interface APIXassida {
  id: string;
  title: string;
  author_id: string;
  author_name: string;
  description?: string;
  verse_count: number;
  audio_url?: string;
  youtube_id?: string;
  arabic_name?: string;
  categorie?: string;
  created_at: string;
}

export interface AudioInfo {
  type: 'local' | 'youtube';
  url?: string;
  video_id?: string;
  embed_url?: string;
  watch_url?: string;
}

const toStableNumericId = (value: any): number => {
  const str = typeof value === 'number' ? String(value) : String(value || '');
  const compact = str.replace(/-/g, '').slice(0, 12);
  const parsed = Number.parseInt(compact, 16);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return str.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647, 7);
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://malikina-api.onrender.com/api');

export const fetchAudioInfo = async (xassidaId: string): Promise<AudioInfo | null> => {
  try {
    const res = await fetch(`${API_URL}/xassidas/${xassidaId}/audio`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch audio info:', error);
    return null;
  }
};

export const fetchAudioUrl = async (xassidaNumericId: number): Promise<string | null> => {
  // ... (inchangé)
};

const convertAPIXassidaToLocal = (apiXassida: APIXassida, authorName: string): Qassida => ({
  id: toStableNumericId(apiXassida.id),
  apiId: apiXassida.id,
  title: apiXassida.title,
  arabic: apiXassida.arabic_name || '',
  author: authorName,
  confraternity: '',
  categorie: apiXassida.categorie,
  verseCount: apiXassida.verse_count,
  isFavorite: false,
});

export const useXassidas = () => {
  // Requête pour les xassidas
  const xassidaQuery = useQuery({
    queryKey: ['xassidas-api'],
    queryFn: async () => {
      const cached = await getCachedData('xassida', 'all-xassidas');
      if (cached) {
        console.log('[useXassidas] Données chargées depuis le cache IndexedDB');
        return cached;
      }
      console.log('[useXassidas] Cache vide, appel à l\'API...');
      try {
        const response = await fetch(`${API_URL}/xassidas`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        const xassidas = Array.isArray(data) ? (data as APIXassida[]) : [];
        if (xassidas.length > 0) {
          await cacheData('xassida', 'all-xassidas', xassidas, 24 * 60 * 60 * 1000);
        }
        return xassidas;
      } catch (error) {
        console.warn('[useXassidas] Échec de l\'API et pas de cache :', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // Requête pour les auteurs
  const authorsQuery = useQuery({
    queryKey: ['authors-api'],
    queryFn: async () => {
      const cached = await getCachedData('authors', 'all-authors');
      if (cached) {
        console.log('[useXassidas] Auteurs chargés depuis le cache');
        return cached;
      }
      try {
        const response = await fetch(`${API_URL}/authors`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        const authors = Array.isArray(data) ? (data as APIAuthor[]) : [];
        if (authors.length > 0) {
          await cacheData('authors', 'all-authors', authors, 7 * 24 * 60 * 60 * 1000);
        }
        return authors;
      } catch (error) {
        console.warn('[useXassidas] Échec API auteurs :', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const apiXassidas: APIXassida[] = Array.isArray(xassidaQuery.data) ? xassidaQuery.data : [];
  const apiAuthors: APIAuthor[] = Array.isArray(authorsQuery.data) ? authorsQuery.data : [];

  // Convertir les auteurs en format local avec gestion robuste des noms
  const convertedAuthors: Author[] = apiAuthors.length > 0
    ? apiAuthors.map((a, idx) => {
        // Extraire le nom complet depuis différents champs possibles
        const fullName = a.name || a.full_name || a.fullName || 'Inconnu';
        const shortName = fullName.split(' ').slice(0, 2).join(' ');
        return {
          id: idx + 1,
          fullName,
          shortName,
          arabic: '',
          imageUrl: a.photo_url || '',
          confraternity: a.tradition || 'Tidjane',
          bio: a.description || '',
        };
      })
    : localAuthorsData;

  return {
    xassidas: apiXassidas.map((x) => convertAPIXassidaToLocal(x, x.author_name || 'Inconnu')),
    authors: convertedAuthors,
    isLoading: xassidaQuery.isLoading || authorsQuery.isLoading,
    error: xassidaQuery.isError ? (xassidaQuery.error as Error).message : authorsQuery.isError ? (authorsQuery.error as Error).message : null,
    isFromAPI: apiXassidas.length > 0,
    refetch: xassidaQuery.refetch,
    fetchAudioUrl,
    fetchAudioInfo,
  };
};

export const useXassidasDetail = (xassidasId: string | null) => {
  return useQuery({
    queryKey: ['xassida-detail', xassidasId],
    queryFn: async () => {
      if (!xassidasId) return null;
      const cached = await getCachedData('xassida', `detail-${xassidasId}`);
      if (cached) {
        console.log(`[useXassidasDetail] Détails chargés depuis le cache pour ${xassidasId}`);
        return cached;
      }
      try {
        const response = await fetch(`${API_URL}/xassidas/${xassidasId}`);
        if (!response.ok) throw new Error('Failed to fetch xassida');
        const data = await response.json();
        await cacheData('xassida', `detail-${xassidasId}`, data, 7 * 24 * 60 * 60 * 1000);
        return data;
      } catch (error) {
        console.warn(`[useXassidasDetail] Échec API ${xassidasId}, pas de cache :`, error);
        throw error;
      }
    },
    enabled: !!xassidasId,
    staleTime: 0,
  });
};