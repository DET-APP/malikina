// src/components/screens/QuranScreen.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react"; // AJOUTER CET IMPORT
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import QuranHeader from "@/components/quran/QuranHeader";
import SurahList from "@/components/quran/SurahList";
import SurahDetail from "@/components/quran/SurahDetail";
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
  textHafs?: string;
  textWarsh?: string;
  translation: string;
  numberInSurah: number;
}

export type RecitationStyle = 'hafs' | 'warsh';

const QuranScreen = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [recitationStyle, setRecitationStyle] = useState<RecitationStyle>('hafs');
  const { toast } = useToast();

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

  // Charger les versets d'une sourate avec le style choisi
  const fetchVerses = async (chapterId: number, style: RecitationStyle) => {
    try {
      setLoadingVerses(true);
      
      // Récupérer le texte en fonction du style
      let arabicEndpoint = `https://api.alquran.cloud/v1/surah/${chapterId}`;
      if (style === 'warsh') {
        arabicEndpoint = `https://api.alquran.cloud/v1/surah/${chapterId}/quran-warsh`;
      }
      
      const arabicResponse = await fetch(arabicEndpoint);
      if (!arabicResponse.ok) {
        throw new Error(`Erreur lors du chargement du texte ${style}`);
      }
      const arabicData = await arabicResponse.json();
      
      // Récupérer la traduction française
      const translationResponse = await fetch(
        `https://api.alquran.cloud/v1/surah/${chapterId}/fr.hamidullah`
      );
      
      if (!translationResponse.ok) {
        throw new Error('Erreur lors du chargement de la traduction');
      }
      
      const translationData = await translationResponse.json();
      
      // Fusionner les données
      const combinedVerses = arabicData.data.ayahs.map((ayah: any, index: number) => {
        const baseVerse = {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          translation: translationData.data.ayahs[index]?.text || '',
        };
        
        if (style === 'hafs') {
          return {
            ...baseVerse,
            text: ayah.text,
            textHafs: ayah.text,
          };
        } else {
          return {
            ...baseVerse,
            text: ayah.text,
            textWarsh: ayah.text,
          };
        }
      });
      
      setVerses(combinedVerses);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les versets en ${style === 'hafs' ? 'Hafs' : 'Warsh'}.`,
        variant: "destructive",
      });
    } finally {
      setLoadingVerses(false);
    }
  };

  // Quand une sourate est sélectionnée
  const handleSurahSelect = (chapter: Chapter) => {
    setSelectedSurah(chapter);
    fetchVerses(chapter.id, recitationStyle);
  };

  // Changer de style de récitation
  const toggleRecitationStyle = () => {
    const newStyle = recitationStyle === 'hafs' ? 'warsh' : 'hafs';
    setRecitationStyle(newStyle);
    
    if (selectedSurah) {
      fetchVerses(selectedSurah.id, newStyle);
    }
    
    toast({
      title: "Style de récitation changé",
      description: `Vous lisez maintenant en ${newStyle === 'hafs' ? 'Hafs' : 'Warsh'}.`,
    });
  };

  // Retour à la liste
  const handleBackToList = () => {
    setSelectedSurah(null);
    setVerses([]);
  };

  // Filtrer les sourates lors de la recherche
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

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Toaster />

      {selectedSurah ? (
        <SurahDetail
          selectedSurah={selectedSurah}
          verses={verses}
          loadingVerses={loadingVerses}
          recitationStyle={recitationStyle}
          onBack={handleBackToList}
          onToggleStyle={toggleRecitationStyle}
        />
      ) : (
        <>
          <QuranHeader
            chaptersCount={chapters.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
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
        </>
      )}
    </motion.div>
  );
};

// Fonction utilitaire pour obtenir le Juz d'une sourate
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

export default QuranScreen;