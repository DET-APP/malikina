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
 * Fetch all xassidas from API with fallback to local data
 */
export const useXassidas = () => {
  const xassidasQuery = useQuery({
    queryKey: ['xassidas-api'],
    queryFn: async () => {
      try {
        console.log('Fetching xassidas from:', `${API_URL}/xassidas`);
        const response = await fetch(`${API_URL}/xassidas`);
        
        console.log('API Response status:', response.status);
        if (!response.ok) {
          console.warn(`API returned ${response.status}: ${response.statusText}`);
          throw new Error(`API offline: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Xassidas count:', Array.isArray(data) ? data.length : 0);
        return data;
      } catch (error) {
        console.warn('Could not fetch xassidas from API, using local data:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Merge API and local data
  let mergedXassidas: Qassida[] = [];
  
  if (xassidasQuery.data && Array.isArray(xassidasQuery.data) && xassidasQuery.data.length > 0) {
    // Use API data and merge with local data for enrichment
    console.log('Using API data for xassidas');
    const apiXassidas = xassidasQuery.data as APIXassida[];
    const convertedXassidas = apiXassidas.map(apiX => 
      convertAPIXassidaToLocal(apiX, apiX.author_name || 'Unknown')
    );
    
    // Also add local xassidas that aren't in API (if API has few items)
    if (convertedXassidas.length < qassidasDataWithExtended.length / 2) {
      // API is sparse, merge with local
      const apiTitles = new Set(convertedXassidas.map(x => x.title));
      const additionalLocal = qassidasDataWithExtended.filter(
        x => !apiTitles.has(x.title)
      );
      mergedXassidas = [...convertedXassidas, ...additionalLocal];
    } else {
      // API has good coverage, use API data
      mergedXassidas = convertedXassidas;
    }
  } else {
    // Fallback: use local data
    mergedXassidas = qassidasDataWithExtended;
  }

  return {
    xassidas: mergedXassidas,
    authors: localAuthorsData,
    isLoading: xassidasQuery.isLoading,
    error: xassidasQuery.error,
    isFromAPI: !!xassidasQuery.data && Array.isArray(xassidasQuery.data) && xassidasQuery.data.length > 0,
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
