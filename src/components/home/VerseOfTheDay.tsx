import { motion } from "framer-motion";
import { BookOpen, RefreshCw, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { VerseOfTheDay as VerseOfTheDayType } from "@/hooks/useVerseOfTheDay";

interface VerseOfTheDayProps {
  verse: VerseOfTheDayType | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (screen: string, surahId?: number, verseNumber?: number) => void;
  itemVariants: any;
}

const VerseOfTheDay = ({ verse, loading, onRefresh, onNavigate, itemVariants }: VerseOfTheDayProps) => {
  if (loading) {
    return (
      <motion.section variants={itemVariants}>
        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-6 shadow-card border border-secondary/20">
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner message="Chargement du vers..." />
          </div>
        </div>
      </motion.section>
    );
  }

  if (!verse) {
    return (
      <motion.section variants={itemVariants}>
        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-6 shadow-card border border-secondary/20">
          <p className="text-center text-muted-foreground">Impossible de charger le vers du jour</p>
          <button
            onClick={onRefresh}
            className="mt-4 w-full bg-primary/10 text-primary py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section variants={itemVariants}>
      <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-6 shadow-card border border-secondary/20">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Vers du Jour</h3>
              <p className="text-xs text-muted-foreground">Khilâss Zahab</p>
            </div>
          </div>
          <motion.button
            onClick={onRefresh}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Numéro du vers */}
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground">
            Vers {verse.verse_number}
            {verse.chapter_number > 1 ? ` · Chapitre ${verse.chapter_number}` : ''}
          </p>
        </div>

        {/* Texte arabe */}
        <div className="bg-card/50 rounded-xl p-4 mb-3 border border-border">
          <p className="text-right text-xl font-arabic leading-loose">{verse.text_arabic}</p>
        </div>

        {/* Translittération */}
        {verse.transcription && (
          <p className="text-sm text-muted-foreground text-center mb-3 italic">{verse.transcription}</p>
        )}

        {/* Traduction française */}
        {verse.translation_fr && (
          <div className="mb-4">
            <p className="text-sm text-foreground italic">"{verse.translation_fr}"</p>
          </div>
        )}

        {/* Bouton naviguer */}
        <motion.button
          onClick={() => onNavigate("qassidas")}
          className="w-full bg-primary/10 text-primary py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <BookOpen className="w-4 h-4" />
          Lire Khilâss Zahab
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.section>
  );
};

export default VerseOfTheDay;
