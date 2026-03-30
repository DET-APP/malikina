import { useQuery } from '@tanstack/react-query';
import { qassidasDataWithExtended, authorsData as localAuthorsData, type Qassida, type Author } from '@/data/qassidasData';

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

export interface APIAuthor {
  id: string;
  name: string;
  description?: string;
  photo_url?: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

/**
 * Convert API xassida format to local format
 */
const convertAPIXassidaToLocal = (apiXassida: APIXassida, authorName: string): Qassida => {
  // Find matching local xassida to get additional fields (arabic, fullText, etc)
  const localXassida = qassidasDataWithExtended.find(
    q => q.title.toLowerCase() === apiXassida.title.toLowerCase() || 
         q.author === authorName
  );

  return {
    id: parseInt(apiXassida.id) || Math.random() * 10000, // Convert string ID to number
    title: apiXassida.title,
    arabic: localXassida?.arabic || '',
    author: authorName,
    confraternity: localXassida?.confraternity || '',
    isFavorite: false,
    fullText: localXassida?.fullText,
    transliteration: localXassida?.transliteration,
    audioUrl: localXassida?.audioUrl,
    pdfUrl: localXassida?.pdfUrl,
  };
};

/**
 * Fetch all xassidas from API (no local fallback)
 * If API is empty, show empty list (for admin to add xassidas)
 */
export const useXassidas = () => {
  const xassidasQuery = useQuery({
    queryKey: ['xassidas-api'],
    queryFn: async () => {
      try {
        console.log('Fetching xassidas from API:', `${API_URL}/xassidas`);
        const response = await fetch(`${API_URL}/xassidas`);
        
        if (!response.ok) {
          console.error(`API error ${response.status}:`, response.statusText);
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ API returned', Array.isArray(data) ? data.length : 0, 'xassidas');
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('❌ Failed to fetch xassidas from API:', error);
        throw error; // Don't swallow error - let React Query handle it
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  // Convert API data to local format
  let mergedXassidas: Qassida[] = [];
  
  if (xassidasQuery.data && Array.isArray(xassidasQuery.data)) {
    // Use ONLY API data - convert format
    console.log('Converting', xassidasQuery.data.length, 'API xassidas to local format');
    const apiXassidas = xassidasQuery.data as APIXassida[];
    mergedXassidas = apiXassidas.map(apiX => 
      convertAPIXassidaToLocal(apiX, apiX.author_name || 'Unknown')
    );
  }
  // If API data is empty or null, mergedXassidas stays as []

  return {
    xassidas: mergedXassidas,
    authors: localAuthorsData,
    isLoading: xassidasQuery.isLoading,
    error: xassidasQuery.error,
    isFromAPI: true, // Always from API, never from local data
    refetch: xassidasQuery.refetch,
  };
};

/**
 * Fetch single xassida with verses from API
 */
export const useXassidasDetail = (xassidasId: string | null) => {
  return useQuery({
    queryKey: ['xassida-detail', xassidasId],
    queryFn: async () => {
      if (!xassidasId) return null;
      try {
        const response = await fetch(`${API_URL}/xassidas/${xassidasId}`);
        if (!response.ok) throw new Error('Failed to fetch xassida');
        return response.json();
      } catch (error) {
        console.warn('Could not fetch xassida details from API:', error);
        return null;
      }
    },
    enabled: !!xassidasId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
