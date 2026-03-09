// src/components/quran/VerseDisplay.tsx
import { motion } from "framer-motion";
import { Bookmark, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";

interface VerseDisplayProps {
    verse: {
        number: number;
        text: string;
        translation: string;
        numberInSurah: number;
        phonetic?: string;
    };
    index: number;
    globalShowPhonetic?: boolean;
    totalVerses?: number; // Ajout du nombre total de versets
}

const VerseDisplay = ({ verse, index, globalShowPhonetic = false, totalVerses }: VerseDisplayProps) => {
    const [showPhonetic, setShowPhonetic] = useState(globalShowPhonetic);
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        setShowPhonetic(globalShowPhonetic);
    }, [globalShowPhonetic]);

    const toggleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        // Ici vous pouvez ajouter la logique pour sauvegarder le bookmark
    };

    return (
        <motion.div
            id={`verse-${verse.numberInSurah}`}
            className="mb-6 pb-6 border-b border-border scroll-mt-32 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
        >
            {/* En-tête du verset */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        {verse.numberInSurah}
                    </span>

                    {verse.phonetic && (
                        <button
                            onClick={() => setShowPhonetic(!showPhonetic)}
                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-300 ${showPhonetic
                                ? 'bg-secondary text-secondary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                            title={showPhonetic ? "Masquer la phonétique" : "Afficher la phonétique"}
                        >
                            {showPhonetic ? (
                                <Volume2 className="w-3 h-3" />
                            ) : (
                                <VolumeX className="w-3 h-3" />
                            )}
                            <span className="text-xs">
                                {showPhonetic ? "Phonétique" : "Afficher"}
                            </span>
                        </button>
                    )}
                </div>

                <button
                    onClick={toggleBookmark}
                    className={`p-2 rounded-full transition-all duration-300 ${isBookmarked
                        ? 'text-secondary bg-secondary/10'
                        : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                        }`}
                    title={isBookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-secondary' : ''}`} />
                </button>
            </div>

            {/* Texte arabe avec arrière-plan décoratif */}
            <div className="relative mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-lg" />
                <p className="relative text-right text-2xl font-arabic leading-loose p-4">
                    {verse.text}
                </p>
            </div>

            {/* Transcription phonétique */}
            {showPhonetic && verse.phonetic && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-3"
                >
                    <div className="bg-secondary/5 rounded-lg p-3 border border-secondary/20">
                        <p className="text-sm text-secondary font-medium text-center italic">
                            {verse.phonetic}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Traduction française */}
            <div className="bg-card/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {verse.translation}
                </p>
            </div>

            {/* Séparateur décoratif pour les groupes de versets - CORRECTION */}
            {totalVerses && verse.numberInSurah % 10 === 0 && verse.numberInSurah !== totalVerses && (
                <div className="flex justify-center mt-4">
                    <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                        Page {Math.floor(verse.numberInSurah / 10)}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default VerseDisplay;