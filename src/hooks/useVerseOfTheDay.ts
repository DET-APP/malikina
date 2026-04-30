import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/apiUrl";

const FALLBACK_XASSIDA_ID = 61; // Khilâss Zahab — fallback garanti
const MAX_ATTEMPTS = 8;

export interface VerseOfTheDay {
  id: number;
  verse_number: number;
  chapter_number: number;
  text_arabic: string;
  transcription: string;
  translation_fr: string | null;
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

// Déterministe mais bien distribué — même résultat pour tous les utilisateurs le même jour
const daySeededOrder = (xassidas: XassidaMeta[], seed: number): XassidaMeta[] => {
  const result = [...xassidas];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.abs(((seed ^ (i * 2654435761)) >>> 0)) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const fetchTranslatedVerses = async (xassidaId: number, title: string): Promise<VerseOfTheDay[]> => {
  const res = await fetch(`${API_BASE_URL}/xassidas/${xassidaId}/verses`);
  if (!res.ok) return [];
  const verses: VerseOfTheDay[] = await res.json();
  return verses
    .filter(v => v.translation_fr && v.translation_fr.trim().length > 10)
    .map(v => ({ ...v, xassidaTitle: title, xassidaId }));
};

export const useVerseOfTheDay = () => {
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null);
  const [allVerses, setAllVerses] = useState<VerseOfTheDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchVerseOfDay();
  }, []);

  const fetchVerseOfDay = async () => {
    try {
      setLoading(true);
      const dayIndex = getDayIndex();

      // 1. Récupérer la liste de toutes les xassidas visibles
      const xassidasRes = await fetch(`${API_BASE_URL}/xassidas`);
      if (!xassidasRes.ok) throw new Error("xassidas list unavailable");
      const xassidas: XassidaMeta[] = await xassidasRes.json();

      // 2. Ordonner les xassidas selon le jour (déterministe)
      const ordered = daySeededOrder(
        xassidas.filter(x => x.actual_verse_count > 0),
        dayIndex
      );

      // 3. Essayer jusqu'à MAX_ATTEMPTS xassidas pour trouver des versets traduits
      for (let attempt = 0; attempt < Math.min(MAX_ATTEMPTS, ordered.length); attempt++) {
        const xassida = ordered[attempt];
        const translated = await fetchTranslatedVerses(xassida.id, xassida.title);
        if (translated.length > 0) {
          const idx = dayIndex % translated.length;
          setAllVerses(translated);
          setVerse(translated[idx]);
          setOffset(0);
          return;
        }
      }

      // 4. Fallback garanti : Khilâss Zahab
      const fallback = xassidas.find(x => x.id === FALLBACK_XASSIDA_ID);
      if (fallback) {
        const translated = await fetchTranslatedVerses(FALLBACK_XASSIDA_ID, fallback.title);
        if (translated.length > 0) {
          const idx = dayIndex % translated.length;
          setAllVerses(translated);
          setVerse(translated[idx]);
        }
      }
    } catch {
      setVerse(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshVerse = () => {
    if (allVerses.length === 0) return;
    const newOffset = offset + 1;
    const idx = (getDayIndex() + newOffset) % allVerses.length;
    setOffset(newOffset);
    setVerse(allVerses[idx]);
  };

  return { verse, loading, refreshVerse };
};
