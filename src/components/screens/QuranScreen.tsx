// src/components/screens/QuranScreen.tsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import QuranHeader from "@/components/quran/QuranHeader";
import SurahList from "@/components/quran/SurahList";
import SurahDetail from "@/components/quran/SurahDetail";
import VerseDisplay from "@/components/quran/VerseDisplay";
import { getPhoneticTranscription } from "@/services/phoneticService";
import { frenchSurahNames } from "@/data/frenchSurahNames";

// Types
export interface Chapter {
  id: number;
  name: string;
  frenchName: string;
  frenchNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Verse {
  number: number;
  text: string;
  translation: string;
  numberInSurah: number;
  phonetic?: string;
}

export type RecitationStyle = 'hafs' | 'warsh';

interface QuranScreenProps {
  initialSurahId?: number;
  initialVerseNumber?: number;
  onBack?: () => void;
}

const QuranScreen = ({ initialSurahId, initialVerseNumber, onBack }: QuranScreenProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [recitationStyle, setRecitationStyle] = useState<RecitationStyle>('hafs');
  const [showGlobalPhonetic, setShowGlobalPhonetic] = useState(false);
  const { toast } = useToast();

  const hasInitialLoadAttempted = useRef(false);

  // Charger toutes les sourates
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.alquran.cloud/v1/surah');

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des sourates');
        }

        const data = await response.json();

        const formattedChapters = data.data.map((surah: any) => ({
          id: surah.number,
          name: frenchSurahNames[surah.number]?.name || surah.name,
          frenchName: frenchSurahNames[surah.number]?.translation || surah.englishName,
          frenchNameTranslation: frenchSurahNames[surah.number]?.translation || surah.englishNameTranslation,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: surah.revelationType
        }));

        setChapters(formattedChapters);
        setFilteredChapters(formattedChapters);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des sourates",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  // Charger automatiquement la sourate si initialSurahId est fourni
  useEffect(() => {
    if (initialSurahId && chapters.length > 0 && !hasInitialLoadAttempted.current) {
      const surah = chapters.find(c => c.id === initialSurahId);
      if (surah) {
        handleSurahSelect(surah);
        hasInitialLoadAttempted.current = true;
      }
    }
  }, [initialSurahId, chapters]);

  // Charger les versets d'une sourate
  const fetchVerses = async (chapterId: number, style: RecitationStyle) => {
    try {
      setLoadingVerses(true);

      const arabicEndpoint = style === 'warsh'
        ? `https://api.alquran.cloud/v1/surah/${chapterId}/quran-warsh`
        : `https://api.alquran.cloud/v1/surah/${chapterId}`;

      const [arabicRes, translationRes] = await Promise.all([
        fetch(arabicEndpoint),
        fetch(`https://api.alquran.cloud/v1/surah/${chapterId}/fr.hamidullah`)
      ]);

      if (!arabicRes.ok || !translationRes.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const arabicData = await arabicRes.json();
      const translationData = await translationRes.json();

      const combinedVerses = arabicData.data.ayahs.map((ayah: any, index: number) => ({
        number: ayah.number,
        text: ayah.text,
        translation: translationData.data.ayahs[index]?.text || '',
        numberInSurah: ayah.numberInSurah,
        phonetic: getPhoneticTranscription(ayah.text)
      }));

      setVerses(combinedVerses);

      // Scroll vers le verset spécifique après chargement
      if (initialVerseNumber) {
        setTimeout(() => {
          document.getElementById(`verse-${initialVerseNumber}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les versets",
        variant: "destructive",
      });
    } finally {
      setLoadingVerses(false);
    }
  };

  const handleSurahSelect = (chapter: Chapter) => {
    setSelectedSurah(chapter);
    fetchVerses(chapter.id, recitationStyle);
  };

  const handleBackToList = () => {
    if (onBack) {
      onBack();
    } else {
      setSelectedSurah(null);
      setVerses([]);
    }
  };

  const toggleRecitationStyle = () => {
    const newStyle = recitationStyle === 'hafs' ? 'warsh' : 'hafs';
    setRecitationStyle(newStyle);
    if (selectedSurah) {
      fetchVerses(selectedSurah.id, newStyle);
    }
  };

  // Filtrer les sourates
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChapters(chapters);
    } else {
      const filtered = chapters.filter(chapter =>
        chapter.frenchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.frenchNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.name.includes(searchQuery)
      );
      setFilteredChapters(filtered);
    }
  }, [searchQuery, chapters]);

  const getJuzForSurah = (surahId: number): number => {
    if (surahId <= 1) return 1;
    if (surahId <= 2) return 2;
    if (surahId <= 3) return 3;
    if (surahId <= 4) return 4;
    if (surahId <= 5) return 5;
    if (surahId <= 6) return 6;
    if (surahId <= 7) return 7;
    if (surahId <= 8) return 8;
    if (surahId <= 9) return 9;
    if (surahId <= 11) return 10;
    if (surahId <= 12) return 11;
    if (surahId <= 13) return 12;
    if (surahId <= 14) return 13;
    if (surahId <= 15) return 14;
    if (surahId <= 16) return 15;
    if (surahId <= 17) return 16;
    if (surahId <= 18) return 17;
    if (surahId <= 20) return 18;
    if (surahId <= 21) return 19;
    if (surahId <= 22) return 20;
    if (surahId <= 23) return 21;
    if (surahId <= 25) return 22;
    if (surahId <= 26) return 23;
    if (surahId <= 27) return 24;
    if (surahId <= 29) return 25;
    if (surahId <= 33) return 26;
    if (surahId <= 36) return 27;
    if (surahId <= 39) return 28;
    if (surahId <= 46) return 29;
    return 30;
  };

  // Affichage du détail d'une sourate
  if (selectedSurah) {
    return (
      <motion.div
        className="min-h-screen bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <SurahDetail
          selectedSurah={selectedSurah}
          verses={verses}
          loadingVerses={loadingVerses}
          recitationStyle={recitationStyle}
          onBack={handleBackToList}
          onToggleStyle={toggleRecitationStyle}
        />

        {/* Version avec phonétique */}
        <div className="pt-20 px-6 pb-24" style={{ marginTop: '-80px' }}>
          {!loadingVerses && verses.map((verse, index) => (
            <VerseDisplay
              key={verse.number}
              verse={verse}
              index={index}
              globalShowPhonetic={showGlobalPhonetic}
              totalVerses={verses.length}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Affichage de la liste des sourates
  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Toaster />

      <QuranHeader
        chaptersCount={chapters.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showGlobalPhonetic={showGlobalPhonetic}
        onTogglePhonetic={() => setShowGlobalPhonetic(!showGlobalPhonetic)}
      />

      <div className="h-40" />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <SurahList
          chapters={filteredChapters}
          viewMode={viewMode}
          onSurahSelect={handleSurahSelect}
          getJuzForSurah={getJuzForSurah}
        />
      )}
    </motion.div>
  );
};

export default QuranScreen;