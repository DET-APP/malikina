import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/apiUrl";
import { getCachedData, cacheData } from "@/lib/offlineDb";

const MAX_VERSES_TO_CACHE = 500;
const CACHE_DURATION = 1000 * 60 * 60; // 1 heure

let cachedVerseData: {
  verse: VerseOfTheDay | null;
  cachedVerses: VerseOfTheDay[];
  timestamp: number;
  dayIndex: number;
} | null = null;

let isFetchingInProgress = false;

export interface VerseOfTheDay {
  id: number;
  verse_number: number;
  chapter_number: number;
  text_arabic: string;
  transcription: string;
  translation_fr: string;
  xassidaTitle: string;
  xassidaId: number;
  apiId: string;
}

interface XassidaMeta {
  id: number;
  title: string;
  verse_count: number;
}

const getDayIndex = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
};

const daySeededOrder = <T>(items: T[], seed: number): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.abs(((seed ^ (i * 2654435761)) >>> 0)) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const fetchVersesWithTranslation = async (xassidaId: number, title: string): Promise<VerseOfTheDay[]> => {
  try {
    const cacheKey = `verses-${xassidaId}`;
    const cachedVerses = await getCachedData('verses', cacheKey);
    if (cachedVerses && Array.isArray(cachedVerses) && cachedVerses.length > 0) {
      return cachedVerses;
    }

    const res = await fetch(`${API_BASE_URL}/xassidas/${xassidaId}/verses`);
    if (!res.ok) return [];

    const verses = await res.json();

    // 🔥 Seuls les versets avec une VRAIE traduction sont gardés
    const validVerses = verses
      .filter((v: any) => {
        const hasTranslation = v.translation_fr &&
          typeof v.translation_fr === 'string' &&
          v.translation_fr.trim().length > 0 &&
          v.translation_fr !== "Traduction non disponible";
        return hasTranslation;
      })
      .slice(0, MAX_VERSES_TO_CACHE)
      .map((v: any) => ({
        id: v.id,
        verse_number: v.verse_number,
        chapter_number: v.chapter_number || 1,
        text_arabic: v.text_arabic,
        transcription: v.transcription || "",
        translation_fr: v.translation_fr,
        xassidaTitle: title,
        xassidaId: xassidaId,
        apiId: String(xassidaId),
      }));

    if (validVerses.length > 0) {
      await cacheData('verses', cacheKey, validVerses, 24 * 60 * 60 * 1000);
    }

    return validVerses;
  } catch {
    return [];
  }
};

export const useVerseOfTheDay = () => {
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null);
  const [cachedVerses, setCachedVerses] = useState<VerseOfTheDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const currentDayIndex = getDayIndex();

  const loadVerseFromCache = () => {
    if (cachedVerseData &&
      cachedVerseData.dayIndex === currentDayIndex &&
      Date.now() - cachedVerseData.timestamp < CACHE_DURATION &&
      cachedVerseData.verse) {
      setVerse(cachedVerseData.verse);
      setCachedVerses(cachedVerseData.cachedVerses);
      setLoading(false);
      return true;
    }
    return false;
  };

  const fetchVerseOfDay = async () => {
    if (loadVerseFromCache()) return;
    if (isFetchingInProgress) return;

    try {
      isFetchingInProgress = true;
      setLoading(true);
      setError(null);

      const xassidasRes = await fetch(`${API_BASE_URL}/xassidas`);
      if (!xassidasRes.ok) throw new Error(`xassidas list unavailable: ${xassidasRes.status}`);

      const xassidas: XassidaMeta[] = await xassidasRes.json();

      // 🔥 On ne garde que les xassidas qui ont AU MOINS UN verset avec traduction
      const xassidasWithTranslations = await Promise.all(
        xassidas
          .filter(x => x.verse_count > 0)
          .slice(0, 20)
          .map(async (x) => {
            const verses = await fetchVersesWithTranslation(x.id, x.title);
            return { ...x, versesWithTranslation: verses };
          })
      );

      const validXassidas = xassidasWithTranslations.filter(x => x.versesWithTranslation.length > 0);

      if (validXassidas.length === 0) {
        throw new Error("Aucune xassida avec traduction trouvée");
      }

      const ordered = daySeededOrder(validXassidas, currentDayIndex);
      const selectedXassida = ordered[0];
      const translatedVerses = selectedXassida.versesWithTranslation;

      const verseIndex = currentDayIndex % translatedVerses.length;
      const selectedVerse = translatedVerses[verseIndex];

      cachedVerseData = {
        verse: selectedVerse,
        cachedVerses: translatedVerses,
        timestamp: Date.now(),
        dayIndex: currentDayIndex,
      };

      if (isMounted.current) {
        setCachedVerses(translatedVerses);
        setVerse(selectedVerse);
        setOffset(0);
      }
    } catch (err) {
      console.error("Erreur dans le vers du jour :", err);
      setError("Impossible de charger le vers du jour");
      setVerse(null);
    } finally {
      isFetchingInProgress = false;
      setLoading(false);
    }
  };

  const refreshVerse = () => {
    if (cachedVerses.length === 0) {
      fetchVerseOfDay();
      return;
    }
    const newOffset = offset + 1;
    const idx = (currentDayIndex + newOffset) % cachedVerses.length;
    setOffset(newOffset);
    setVerse(cachedVerses[idx]);
  };

  useEffect(() => {
    isMounted.current = true;
    fetchVerseOfDay();
    return () => {
      isMounted.current = false;
    };
  }, []);

  return { verse, loading, refreshVerse, error };
};

export default useVerseOfTheDay;