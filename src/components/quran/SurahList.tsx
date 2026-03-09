// src/components/quran/SurahList.tsx
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Chapter } from "../screens/QuranScreen";

interface SurahListProps {
    chapters: Chapter[];
    viewMode: "grid" | "list";
    onSurahSelect: (chapter: Chapter) => void;
    getJuzForSurah: (surahId: number) => number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const SurahList = ({ chapters, viewMode, onSurahSelect, getJuzForSurah }: SurahListProps) => {
    if (chapters.length === 0) {
        return (
            <p className="text-center text-muted-foreground py-8">
                Aucune sourate trouvée
            </p>
        );
    }

    return (
        <motion.div
            className="px-6 py-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {viewMode === "grid" ? (
                // Vue en grille
                <div className="grid grid-cols-2 gap-4">
                    {chapters.map((chapter) => (
                        <motion.button
                            key={chapter.id}
                            className="bg-card rounded-xl p-4 shadow-soft relative overflow-hidden hover:shadow-lg transition-shadow"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSurahSelect(chapter)}
                        >
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full" />
                            <div className="absolute -right-2 -top-2 w-10 h-10 bg-primary/10 rounded-full" />

                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <span className="text-sm font-bold text-primary">{chapter.id}</span>
                            </div>

                            <div className="text-left">
                                <p className="text-lg font-arabic text-primary mb-1">{chapter.name}</p>
                                <p className="font-semibold text-foreground text-sm">{chapter.frenchNameTranslation}</p>
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
                    {chapters.map((chapter) => (
                        <motion.button
                            key={chapter.id}
                            className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4 w-full hover:shadow-lg transition-shadow"
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onSurahSelect(chapter)}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-lg font-bold text-primary">{chapter.id}</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-secondary">
                                        {getJuzForSurah(chapter.id)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground">
                                        {chapter.frenchNameTranslation}
                                    </h3>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${chapter.revelationType === "Meccan"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                            }`}
                                    >
                                        {chapter.revelationType === "Meccan" ? "Mecquoise" : "Médinoise"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-lg font-arabic text-muted-foreground">{chapter.name}</p>
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
        </motion.div>
    );
};

export default SurahList;