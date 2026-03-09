// src/components/quran/SurahDetail.tsx
import { motion } from "framer-motion";
import { ChevronLeft, Play, Headphones, Bookmark, Share2, Loader2, BookOpen } from "lucide-react";
import { Chapter, Verse, RecitationStyle } from "../screens/QuranScreen";

interface SurahDetailProps {
    selectedSurah: Chapter;
    verses: Verse[];
    loadingVerses: boolean;
    recitationStyle: RecitationStyle;
    onBack: () => void;
    onToggleStyle: () => void;
}

const SurahDetail = ({
    selectedSurah,
    verses,
    loadingVerses,
    recitationStyle,
    onBack,
    onToggleStyle,
}: SurahDetailProps) => {
    return (
        <motion.div
            className="min-h-screen bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Header */}
            <div className="relative bg-gradient-to-b from-primary to-primary/80 pt-12 pb-32 px-6">
                <div className="absolute top-12 left-6 flex gap-2">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={onToggleStyle}
                        className="px-4 h-10 bg-white/20 rounded-full flex items-center gap-2 hover:bg-white/30 transition-colors"
                    >
                        <BookOpen className="w-4 h-4 text-white" />
                        <span className="text-sm text-white font-medium">
                            {recitationStyle === 'hafs' ? 'Hafs' : 'Warsh'}
                        </span>
                    </button>
                </div>

                <div className="text-center mt-8">
                    <p className="text-4xl font-arabic text-secondary mb-2">{selectedSurah.name}</p>
                    <h1 className="text-2xl font-bold text-white">{selectedSurah.frenchNameTranslation}</h1>
                    <p className="text-white/70 text-sm mt-2">
                        {selectedSurah.revelationType === "Meccan" ? "Mecquoise" : "Médinoise"} •{" "}
                        {selectedSurah.numberOfAyahs} versets
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
                                <p className="text-3xl font-arabic text-primary mb-2">
                                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux
                                </p>
                            </div>
                        )}

                        {verses.map((verse, index) => (
                            <motion.div
                                key={verse.number}
                                className="mb-6 pb-6 border-b border-border"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
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
};

export default SurahDetail;