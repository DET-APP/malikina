import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/apiUrl";

const MAX_VERSES_TO_CACHE = 500;
const CACHE_DURATION = 1000 * 60 * 60;

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
}

interface XassidaMeta {
  id: number;
  title: string;
  actual_verse_count: number;
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
    const res = await fetch(`${API_BASE_URL}/xassidas/${xassidaId}/verses`);
    if (!res.ok) return [];

    const verses = await res.json();

    const validVerses = verses
      .filter((v: any) =>
        v.text_arabic &&
        v.text_arabic.trim().length > 0 &&
        v.translation_fr &&
        v.translation_fr.trim() !== "" &&
        v.translation_fr !== "Traduction non disponible"
      )
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
      }));

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

    if (isFetchingInProgress) {
      const waitForFetch = setInterval(() => {
        if (!isFetchingInProgress) {
          clearInterval(waitForFetch);
          loadVerseFromCache();
        }
      }, 100);
      return;
    }

    try {
      isFetchingInProgress = true;
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      const xassidasRes = await fetch(`${API_BASE_URL}/xassidas`);
      if (!xassidasRes.ok) {
        throw new Error(`xassidas list unavailable: ${xassidasRes.status}`);
      }

      const xassidas: XassidaMeta[] = await xassidasRes.json();

      const xassidasWithTranslations = await Promise.all(
        xassidas
          .filter(x => x.actual_verse_count > 0)
          .map(async (x) => {
            const verses = await fetchVersesWithTranslation(x.id, x.title);
            return { ...x, versesWithTranslation: verses };
          })
      );

      const validXassidas = xassidasWithTranslations.filter(x => x.versesWithTranslation.length > 0);

      if (validXassidas.length === 0) {
        throw new Error("No xassidas with translations found");
      }

      const ordered = daySeededOrder(validXassidas, currentDayIndex);
      const selectedXassida = ordered[0];
      const translatedVerses = selectedXassida.versesWithTranslation;

      if (translatedVerses.length === 0) {
        throw new Error("No translated verses in selected xassida");
      }

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

    } catch {
      if (isMounted.current) {
        setError("Impossible de charger le vers du jour");
        setVerse(null);
      }
    } finally {
      isFetchingInProgress = false;
      if (isMounted.current) {
        setLoading(false);
      }
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