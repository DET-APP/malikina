import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/apiUrl";

const KHILASS_ID = 61;

export interface VerseOfTheDay {
  id: number;
  verse_number: number;
  chapter_number: number;
  text_arabic: string;
  transcription: string;
  translation_fr: string | null;
}

const getDayIndex = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
};

export const useVerseOfTheDay = () => {
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null);
  const [allVerses, setAllVerses] = useState<VerseOfTheDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchVerses();
  }, []);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/xassidas/${KHILASS_ID}/verses`);
      if (!res.ok) throw new Error();
      const data: VerseOfTheDay[] = await res.json();
      setAllVerses(data);
      const idx = getDayIndex() % data.length;
      setVerse(data[idx]);
      setOffset(0);
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
