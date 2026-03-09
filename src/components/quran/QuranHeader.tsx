// src/components/quran/QuranHeader.tsx
import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface QuranHeaderProps {
    chaptersCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
}

const QuranHeader = ({
    chaptersCount,
    searchQuery,
    onSearchChange,
    viewMode,
    onViewModeChange,
}: QuranHeaderProps) => {
    return (
        <div className="relative bg-gradient-to-b from-primary to-primary/90 pt-12 pb-32 px-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-white/70 text-sm">Le Noble Coran</p>
                        <h1 className="text-3xl font-bold text-white mt-1">Al-Quran</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onViewModeChange("grid")}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${viewMode === "grid"
                                    ? "bg-white text-primary"
                                    : "bg-white/20 text-white hover:bg-white/30"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onViewModeChange("list")}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${viewMode === "list"
                                    ? "bg-white text-primary"
                                    : "bg-white/20 text-white hover:bg-white/30"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Statistiques */}
            <motion.div
                className="absolute -bottom-16 left-6 right-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="bg-card rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                            <p className="text-2xl font-bold text-primary">{chaptersCount}</p>
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
            </motion.div>

            {/* Barre de recherche */}
            <motion.div
                className="absolute -bottom-32 left-6 right-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher une sourate..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-card rounded-xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary shadow-lg"
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default QuranHeader;