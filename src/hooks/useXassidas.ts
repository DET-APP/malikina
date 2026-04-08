import { useQuery } from '@tanstack/react-query';
import { authorsData as localAuthorsData, type Qassida } from '@/data/qassidasData';

const SUPABASE_ANON_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTcyNjUzMjUyMCwiZXhwIjo0ODgyMjA2MTIwLCJyb2xlIjoiYW5vbiJ9.' +
  'IbM1B5YYZOXq47F8lPxuNvKtQiMMaYCKQBJTonYq8aQ';
const SUPABASE_URL = 'https://api.xassida.sn';

// API interfaces
export interface APIXassida {
  id: string;
  title: string;
  author_id: string;
  author_name: string;
  description?: string;
  verse_count: number;
  created_at: string;
}

const toStableNumericId = (value: string): number => {
  const compact = value.replace(/-/g, '').slice(0, 12);
  const parsed = Number.parseInt(compact, 16);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return value.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647, 7);
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://malikina-api.onrender.com/api');

/** Fetch audio URL from xassida.sn for a given xassida numeric ID */
const fetchAudioUrl = async (xassidaNumericId: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/audio?xassida_id=eq.${xassidaNumericId}&select=file&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.file) {
      return `${SUPABASE_URL}/storage/v1/object/public/audios/${data[0].file}.mp3`;
    }
    return null;
  } catch {
    return null;
  }
};

const convertAPIXassidaToLocal = (apiXassida: APIXassida, authorName: string): Qassida => ({
  id: toStableNumericId(apiXassida.id),
  apiId: apiXassida.id,
  title: apiXassida.title,
  arabic: '',
  author: authorName,
  confraternity: '',
  verseCount: apiXassida.verse_count,
  isFavorite: false,
});

/**
 * Fetch all xassidas from the local API.
 * No local fallback — if the API is unavailable or empty, returns [].
 */
export const useXassidas = () => {
  const query = useQuery({
    queryKey: ['xassidas-api'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/xassidas`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? (data as APIXassida[]) : [];
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const apiData: APIXassida[] = Array.isArray(query.data) ? query.data : [];

  return {
    xassidas: apiData.map((x) => convertAPIXassidaToLocal(x, x.author_name || 'Inconnu')),
    authors: localAuthorsData,
    isLoading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
    isFromAPI: apiData.length > 0,
    refetch: query.refetch,
    fetchAudioUrl,
  };
};

/**
 * Fetch single xassida with verses from local API
 */
export const useXassidasDetail = (xassidasId: string | null) => {
  return useQuery({
    queryKey: ['xassida-detail', xassidasId],
    queryFn: async () => {
      if (!xassidasId) return null;
      const response = await fetch(`${API_URL}/xassidas/${xassidasId}`);
      if (!response.ok) throw new Error('Failed to fetch xassida');
      return response.json();
    },
    enabled: !!xassidasId,
    staleTime: 10 * 60 * 1000,
  });
};
