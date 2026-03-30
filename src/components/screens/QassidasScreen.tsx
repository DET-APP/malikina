import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { qassidasDataWithExtended, authorsData } from "@/data/qassidasData";
import { useQassidasHistory } from "@/hooks/useQassidasHistory";
import { useFavorites } from "@/hooks/useFavorites";
import XassidasList from "@/components/qassidas/XassidasList";
import XassidasDetail from "@/components/qassidas/XassidasDetail";
import type { Qassida } from "@/data/qassidasData";

const QassidasScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedQassida, setSelectedQassida] = useState<Qassida | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { addToHistory } = useQassidasHistory();
  const { isFavorite } = useFavorites();

  // Use extended data (111-174 + original)
  const allQassidas = qassidasDataWithExtended;

  const filteredQassidas = allQassidas.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.arabic.includes(searchQuery);
    const matchesAuthor = selectedAuthorId 
      ? authorsData.find(a => a.id === selectedAuthorId)?.fullName === q.author 
      : true;
    const matchesFavorite = showFavorites ? isFavorite(q.id) : true;
    return matchesSearch && matchesAuthor && matchesFavorite;
  });

  const handleQassidasClick = (qassida: Qassida) => {
    addToHistory({
      id: qassida.id,
      title: qassida.title,
      arabic: qassida.arabic,
      author: qassida.author,
    });
    setSelectedQassida(qassida);
  };

  const handleNext = () => {
    if (!selectedQassida) return;
    const currentIndex = filteredQassidas.findIndex(q => q.id === selectedQassida.id);
    if (currentIndex < filteredQassidas.length - 1) {
      handleQassidasClick(filteredQassidas[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (!selectedQassida) return;
    const currentIndex = filteredQassidas.findIndex(q => q.id === selectedQassida.id);
    if (currentIndex > 0) {
      handleQassidasClick(filteredQassidas[currentIndex - 1]);
    }
  };

  // If a qassida is selected, show detail view
  if (selectedQassida) {
    return (
      <XassidasDetail
        selectedQassida={selectedQassida}
        onBack={() => setSelectedQassida(null)}
        onNext={
          filteredQassidas.findIndex(q => q.id === selectedQassida.id) <
          filteredQassidas.length - 1
            ? handleNext
            : undefined
        }
        onPrevious={
          filteredQassidas.findIndex(q => q.id === selectedQassida.id) > 0
            ? handlePrevious
            : undefined
        }
      />
    );
  }

  // Show list view
  return (
    <motion.div
      className="min-h-screen pb-24 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="bg-gradient-to-br from-secondary via-secondary to-gold-light pt-12 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-secondary-foreground">Xassidas</h1>
          <p className="text-4xl font-arabic text-card mt-2">الْقَصَائِدُ</p>
          <p className="text-sm text-secondary-foreground/70 mt-2">
            {filteredQassidas.length} xassidas
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          className="mt-6 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une xassida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </motion.div>

        {/* View Mode Toggle */}
        <motion.div
          className="mt-4 flex gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setViewMode("grid")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "grid"
                ? "bg-card text-foreground"
                : "bg-card/30 text-secondary-foreground/70"
            }`}
          >
            ⊞ Grille
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "list"
                ? "bg-card text-foreground"
                : "bg-card/30 text-secondary-foreground/70"
            }`}
          >
            ☰ Liste
          </button>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showFavorites
                ? "bg-card text-foreground"
                : "bg-card/30 text-secondary-foreground/70"
            }`}
          >
            {showFavorites ? "❤️" : "♡"}
          </button>
        </motion.div>
      </header>

      {/* Author Filter */}
      {authorsData.length > 0 && (
        <motion.div
          className="px-6 py-6 border-b border-border/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Par Auteur
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {authorsData.map((author) => {
              const qassidasCount = allQassidas.filter(q => q.author === author.fullName).length;
              if (qassidasCount === 0) return null;

              return (
                <motion.button
                  key={author.id}
                  onClick={() => setSelectedAuthorId(selectedAuthorId === author.id ? null : author.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full transition-all text-sm font-medium ${
                    selectedAuthorId === author.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {author.shortName}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Xassidas List */}
      <XassidasList
        qassidas={filteredQassidas}
        viewMode={viewMode}
        onQassidasSelect={handleQassidasClick}
      />
    </motion.div>
  );
};

export default QassidasScreen;
