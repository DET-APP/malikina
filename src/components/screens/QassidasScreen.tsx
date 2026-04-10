import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Wifi } from "lucide-react";
import { useXassidas } from "@/hooks/useXassidas";
import { useQassidasHistory } from "@/hooks/useQassidasHistory";
import { useFavorites } from "@/hooks/useFavorites";
import XassidasList from "@/components/qassidas/XassidasList";
import XassidasDetail from "@/components/qassidas/XassidasDetail";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Qassida } from "@/data/qassidasData";

interface QassidasScreenProps {
  initialQassidaId?: number;
}

const QassidasScreen = ({ initialQassidaId }: QassidasScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedQassida, setSelectedQassida] = useState<Qassida | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { addToHistory } = useQassidasHistory();
  const { isFavorite } = useFavorites();
  const { xassidas: allQassidas, authors: authorsData, isLoading, error } = useXassidas();

  const handleQassidasClick = useCallback((qassida: Qassida) => {
    addToHistory({ id: qassida.id, title: qassida.title, arabic: qassida.arabic, author: qassida.author });
    setSelectedQassida(qassida);
  }, [addToHistory]);

  // Navigate directly to requested qassida when data loads
  useEffect(() => {
    if (!initialQassidaId || allQassidas.length === 0) return;
    const target = allQassidas.find((q) => q.id === initialQassidaId);
    if (target) setSelectedQassida(target);
  }, [initialQassidaId, allQassidas]);

  // Get unique categories from xassidas (if available via API)
  const uniqueCategories = Array.from(
    new Set(
      allQassidas
        .filter((q) => (q as any).categorie)
        .map((q) => (q as any).categorie)
    )
  ).sort() as string[];

  const filteredQassidas = allQassidas.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.arabic && q.arabic.includes(searchQuery));
    const matchesAuthor = selectedAuthorId
      ? authorsData.find((a) => a.id === selectedAuthorId)?.fullName === q.author
      : true;
    const matchesCategory = selectedCategory
      ? (q as any).categorie === selectedCategory
      : true;
    const matchesFavorite = showFavorites ? isFavorite(q.id) : true;
    return matchesSearch && matchesAuthor && matchesCategory && matchesFavorite;
  });

  const handleNext = () => {
    if (!selectedQassida) return;
    const idx = filteredQassidas.findIndex((q) => q.id === selectedQassida.id);
    if (idx < filteredQassidas.length - 1) handleQassidasClick(filteredQassidas[idx + 1]);
  };

  const handlePrevious = () => {
    if (!selectedQassida) return;
    const idx = filteredQassidas.findIndex((q) => q.id === selectedQassida.id);
    if (idx > 0) handleQassidasClick(filteredQassidas[idx - 1]);
  };

  if (selectedQassida) {
    const idx = filteredQassidas.findIndex((q) => q.id === selectedQassida.id);
    return (
      <XassidasDetail
        selectedQassida={selectedQassida}
        onBack={() => setSelectedQassida(null)}
        onNext={idx < filteredQassidas.length - 1 ? handleNext : undefined}
        onPrevious={idx > 0 ? handlePrevious : undefined}
      />
    );
  }

  return (
    <motion.div className="min-h-screen pb-24 bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="bg-gradient-to-br from-secondary via-secondary to-gold-light pt-12 pb-8 px-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-foreground">Xassidas</h1>
          <p className="text-4xl font-arabic text-card mt-2">الْقَصَائِدُ</p>
          <p className="text-sm text-secondary-foreground/70 mt-2">
            {isLoading ? "Chargement…" : `${filteredQassidas.length} xassidas`}
          </p>
        </div>

        {/* Search */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une xassida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* View + favorites toggles */}
        <div className="mt-4 flex gap-2">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === mode ? "bg-card text-foreground" : "bg-card/30 text-secondary-foreground/70"
              }`}
            >
              {mode === "grid" ? "⊞ Grille" : "☰ Liste"}
            </button>
          ))}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${showFavorites ? "bg-card text-foreground" : "bg-card/30 text-secondary-foreground/70"}`}
          >
            {showFavorites ? "❤️" : "♡"}
          </button>
        </div>
      </header>

      {/* ── Author filter ─────────────────────────────────────── */}
      {!isLoading && !error && authorsData.length > 0 && (
        <div className="px-4 pt-5 pb-3 border-b border-border/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Par auteur
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Tous */}
            <button
              onClick={() => setSelectedAuthorId(null)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedAuthorId === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Tous
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedAuthorId === null ? "bg-white/20" : "bg-muted-foreground/20"}`}>
                {allQassidas.length}
              </span>
            </button>

            {authorsData.map((author) => {
              const count = allQassidas.filter((q) => q.author === author.fullName).length;
              if (count === 0) return null;
              const isActive = selectedAuthorId === author.id;
              return (
                <motion.button
                  key={author.id}
                  onClick={() => setSelectedAuthorId(isActive ? null : author.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ${isActive ? "ring-2 ring-white/40" : ""}`}>
                    {author.imageUrl ? (
                      <img
                        src={author.imageUrl}
                        alt={author.shortName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-white/20" : "bg-primary/20 text-primary"}`}>
                        {author.shortName[0]}
                      </div>
                    )}
                  </div>
                  <span className="truncate max-w-[80px]">{author.shortName}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? "bg-white/20" : "bg-muted-foreground/20"}`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Category filter ────────────────────────────────────── */}
      {!isLoading && !error && uniqueCategories.length > 0 && (
        <div className="px-4 pt-5 pb-3 border-b border-border/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Par catégorie
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Toutes */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === null
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Toutes
              <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1.5 inline-block ${selectedCategory === null ? "bg-white/20" : "bg-muted-foreground/20"}`}>
                {filteredQassidas.length}
              </span>
            </button>

            {uniqueCategories.map((category) => {
              const count = allQassidas.filter((q) => (q as any).categorie === category).length;
              const isActive = selectedCategory === category;
              return (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(isActive ? null : category)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1.5 inline-block ${isActive ? "bg-white/20" : "bg-muted-foreground/20"}`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── States ────────────────────────────────────────────── */}
      {isLoading && <LoadingSpinner />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-3">
          <Wifi className="w-12 h-12 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">Serveur indisponible</p>
          <p className="text-sm text-muted-foreground">Le chargement des xassidas a échoué. Réessaie plus tard.</p>
        </div>
      )}

      {!isLoading && !error && allQassidas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-3">
          <p className="text-4xl font-arabic text-primary/40">الْقَصَائِدُ</p>
          <p className="font-semibold text-foreground">Aucune xassida</p>
          <p className="text-sm text-muted-foreground">La base de données est en cours de peuplement sur le serveur.</p>
        </div>
      )}

      {/* ── List ─────────────────────────────────────────────── */}
      {!isLoading && !error && allQassidas.length > 0 && (
        <XassidasList
          qassidas={filteredQassidas}
          viewMode={viewMode}
          onQassidasSelect={handleQassidasClick}
        />
      )}
    </motion.div>
  );
};

export default QassidasScreen;
