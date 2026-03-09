// src/components/screens/QuranScreen.tsx
import { useState, useEffect, useRef } from "react";
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
  const [recitationStyle, setRecitationStyle] = useState<'hafs' | 'warsh'>('hafs');
  const { toast } = useToast();

  // Ref pour savoir si on a déjà tenté de charger la sourate initiale
  const hasInitialLoadAttempted = useRef(false);

  // Effet pour charger automatiquement une sourate si initialSurahId est fourni
  useEffect(() => {
    if (initialSurahId && chapters.length > 0 && !hasInitialLoadAttempted.current) {
      const surah = chapters.find(c => c.id === initialSurahId);
      if (surah) {
        console.log("Chargement automatique de la sourate:", initialSurahId);
        handleSurahSelect(surah, initialVerseNumber);
        hasInitialLoadAttempted.current = true;
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

      // Si un numéro de verset est fourni, scroller vers ce verset après chargement
      if (initialVerseNumber) {
        setTimeout(() => {
          const verseElement = document.getElementById(`verse-${initialVerseNumber}`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
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
    console.log("Sourate sélectionnée:", chapter.id);
    setSelectedSurah(chapter);
    fetchVerses(chapter.id, recitationStyle);
  };

  // Retour à la liste
  const handleBackToList = () => {
    if (onBack) {
      onBack();
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
                  id={`verse-${verse.numberInSurah}`}
                  className="mb-6 pb-6 border-b border-border scroll-mt-32"
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

  // Vue liste des sourates
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

        {/* Statistiques */}
        <div className="absolute -bottom-16 left-6 right-6">
          <div className="bg-card rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-primary">{chapters.length}</p>
                <p className="text-xs text-muted-foreground">Sourates</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-primary">6236</p>
                <p className="text-xs text-muted-foreground">Versets</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-primary">30</p>
                <p className="text-xs text-muted-foreground">Juz</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="absolute -bottom-32 left-6 right-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une sourate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card rounded-xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Espace pour compenser le header */}
      <div className="h-40" />

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Liste des sourates */}
      {!loading && (
        <div className="px-6 py-6">
          {filteredChapters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune sourate trouvée
            </p>
          ) : viewMode === "grid" ? (
            // Vue en grille
            <div className="grid grid-cols-2 gap-4">
              {filteredChapters.map((chapter) => (
                <motion.button
                  key={chapter.id}
                  className="bg-card rounded-xl p-4 shadow-soft relative overflow-hidden hover:shadow-lg transition-shadow"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSurahSelect(chapter)}
                >
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full" />
                  <div className="absolute -right-2 -top-2 w-10 h-10 bg-primary/10 rounded-full" />

                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <span className="text-sm font-bold text-primary">{chapter.id}</span>
                  </div>

                  <div className="text-left">
                    <p className="text-lg font-arabic text-primary mb-1">{chapter.name}</p>
                    <p className="font-semibold text-foreground text-sm">{chapter.englishNameTranslation}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        Juz {getJuzForSurah(chapter.id)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {chapter.numberOfAyahs} versets
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            // Vue en liste
            <div className="space-y-3">
              {filteredChapters.map((chapter) => (
                <motion.button
                  key={chapter.id}
                  className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4 w-full hover:shadow-lg transition-shadow"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSurahSelect(chapter)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{chapter.id}</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-secondary">{getJuzForSurah(chapter.id)}</span>
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {chapter.englishNameTranslation}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${chapter.revelationType === "Meccan"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                        {chapter.revelationType === "Meccan" ? "Mecquoise" : "Médinoise"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-lg font-arabic text-muted-foreground">
                        {chapter.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        • {chapter.numberOfAyahs} versets
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default QuranScreen;