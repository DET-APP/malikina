// src/components/screens/QuranScreen.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Play, ChevronLeft, ChevronRight, Headphones, Bookmark, Share2, Loader2, BookOpen } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

// Types
interface Chapter {
  id: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Verse {
  number: number;
  text: string;
  translation: string;
  numberInSurah: number;
}

interface QuranScreenProps {
  initialSurahId?: number;      // Nouveau prop
  initialVerseNumber?: number;  // Nouveau prop
  onBack?: () => void;          // Nouveau prop pour revenir à l'accueil
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
  const [recitationStyle, setRecitationStyle] = useState<'hafs' | 'warsh'>('hafs');
  const { toast } = useToast();

  // Effet pour charger automatiquement une sourate si initialSurahId est fourni
  useEffect(() => {
    if (initialSurahId && chapters.length > 0) {
      const surah = chapters.find(c => c.id === initialSurahId);
      if (surah) {
        handleSurahSelect(surah, initialVerseNumber);
      }
    }
  }, [initialSurahId, chapters, initialVerseNumber]);

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
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
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

  // Charger les versets d'une sourate
  const fetchVerses = async (chapterId: number, style: 'hafs' | 'warsh') => {
    try {
      setLoadingVerses(true);

      let arabicEndpoint = `https://api.alquran.cloud/v1/surah/${chapterId}`;
      if (style === 'warsh') {
        arabicEndpoint = `https://api.alquran.cloud/v1/surah/${chapterId}/quran-warsh`;
      }

      const arabicResponse = await fetch(arabicEndpoint);
      if (!arabicResponse.ok) {
        throw new Error(`Erreur lors du chargement du texte ${style}`);
      }
      const arabicData = await arabicResponse.json();

      const translationResponse = await fetch(
        `https://api.alquran.cloud/v1/surah/${chapterId}/fr.hamidullah`
      );

      if (!translationResponse.ok) {
        throw new Error('Erreur lors du chargement de la traduction');
      }

      const translationData = await translationResponse.json();

      const combinedVerses = arabicData.data.ayahs.map((ayah: any, index: number) => ({
        number: ayah.number,
        text: ayah.text,
        translation: translationData.data.ayahs[index]?.text || '',
        numberInSurah: ayah.numberInSurah
      }));

      setVerses(combinedVerses);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les versets.`,
        variant: "destructive",
      });
    } finally {
      setLoadingVerses(false);
    }
  };

  // Quand une sourate est sélectionnée
  const handleSurahSelect = (chapter: Chapter, verseNumber?: number) => {
    setSelectedSurah(chapter);
    fetchVerses(chapter.id, recitationStyle);

    // Si un numéro de verset est fourni, on pourra scroller vers ce verset après chargement
    if (verseNumber) {
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${verseNumber}`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000); // Délai pour laisser le temps au chargement
    }
  };

  // Retour à la liste
  const handleBackToList = () => {
    if (onBack) {
      onBack(); // Si onBack est fourni, on retourne à l'accueil
    } else {
      setSelectedSurah(null);
      setVerses([]);
    }
  };

  // Filtrer les sourates
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChapters(chapters);
    } else {
      const filtered = chapters.filter(chapter =>
        chapter.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.name.includes(searchQuery)
      );
      setFilteredChapters(filtered);
    }
  }, [searchQuery, chapters]);

  const getJuzForSurah = (surahId: number): number => {
    // ... votre fonction existante
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

  // Si une sourate est sélectionnée, afficher ses détails
  if (selectedSurah) {
    return (
      <motion.div
        className="min-h-screen bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header du détail */}
        <div className="relative bg-gradient-to-b from-primary to-primary/80 pt-12 pb-32 px-6">
          <button
            onClick={handleBackToList}
            className="absolute top-12 left-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div className="text-center mt-8">
            <p className="text-4xl font-arabic text-secondary mb-2">{selectedSurah.name}</p>
            <h1 className="text-2xl font-bold text-white">{selectedSurah.englishNameTranslation}</h1>
            <p className="text-white/70 text-sm mt-2">
              {selectedSurah.revelationType === "Meccan" ? "Mecquoise" : "Médinoise"} • {selectedSurah.numberOfAyahs} versets
            </p>
          </div>

          {/* Actions */}
          <div className="absolute -bottom-16 left-6 right-6">
            <div className="bg-card rounded-2xl p-4 shadow-xl flex justify-around">
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Play className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-xs text-muted-foreground">Lecture</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Headphones className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Audio</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Bookmark className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-xs text-muted-foreground">Marquer</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Partager</span>
              </button>
            </div>
          </div>
        </div>

        {/* Liste des versets */}
        <div className="pt-20 px-6 pb-24">
          {loadingVerses ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Basmala */}
              {selectedSurah.id !== 9 && (
                <div className="text-center mb-8">
                  <p className="text-3xl font-arabic text-primary mb-2">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                  <p className="text-sm text-muted-foreground">Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux</p>
                </div>
              )}

              {verses.map((verse) => (
                <motion.div
                  key={verse.number}
                  id={`verse-${verse.numberInSurah}`} // Ajout de l'ID pour le scroll
                  className="mb-6 pb-6 border-b border-border scroll-mt-32" // Ajout de scroll-mt pour compenser le header
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: verse.numberInSurah * 0.02 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {verse.numberInSurah}
                    </span>
                    <button className="text-muted-foreground hover:text-primary transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-right text-2xl font-arabic mb-3 leading-loose">
                    {verse.text}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {verse.translation}
                  </p>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // Vue liste des sourates (votre code existant)
  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Toaster />

      {/* Header avec bouton retour si onBack est fourni */}
      <div className="relative bg-gradient-to-b from-primary to-primary/90 pt-12 pb-32 px-6">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          <div>
            <p className="text-white/70 text-sm">Le Noble Coran</p>
            <h1 className="text-3xl font-bold text-white mt-1">Al-Quran</h1>
          </div>
        </div>

        {/* Statistiques et recherche (votre code existant) */}
        {/* ... */}
      </div>

      {/* Espace pour compenser le header */}
      <div className="h-40" />

      {/* Liste des sourates (votre code existant) */}
      {!loading && (
        <div className="px-6 py-6">
          {/* ... votre code pour la liste des sourates ... */}
        </div>
      )}
    </motion.div>
  );
};

export default QuranScreen;