import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Wifi, X } from "lucide-react";
import { useXassidas } from "@/hooks/useXassidas";
import { useQassidasHistory } from "@/hooks/useQassidasHistory";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { searchMatch } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import XassidasList from "@/components/qassidas/XassidasList";
import XassidasDetail from "@/components/qassidas/XassidasDetail";
import FavoritesList from "@/components/qassidas/FavoritesList";
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { addToHistory } = useQassidasHistory();
  const { isFavorite, toggleFavorite, favorites, count: favCount } = useFavorites();
  const { xassidas: allQassidas, authors: authorsData, isLoading, error } = useXassidas();
  const { t } = useLanguage();

  const handleQassidasClick = useCallback((qassida: Qassida) => {
    addToHistory({ id: qassida.id, title: qassida.title, arabic: qassida.arabic, author: qassida.author });
    setSelectedQassida(qassida);
    setShowSearchDropdown(false);
    setSearchQuery("");
  }, [addToHistory]);

  // Navigate to another xassida from search results
  const handleNavigateToXassida = useCallback((qassida: Qassida) => {
    handleQassidasClick(qassida);
  }, [handleQassidasClick]);

  // Navigate to a qassida from favorites list by ID
  const handleFavoriteClick = useCallback((id: number) => {
    const target = allQassidas.find((q) => q.id === id);
    if (target) handleQassidasClick(target);
  }, [allQassidas, handleQassidasClick]);

  // Navigate directly to requested qassida when data loads
  useEffect(() => {
    if (!initialQassidaId || allQassidas.length === 0) return;
    const target = allQassidas.find((q) => q.id === initialQassidaId);
    if (target) setSelectedQassida(target);
  }, [initialQassidaId, allQassidas]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get unique categories from xassidas (if available via API)
  const uniqueCategories = Array.from(
    new Set(
      allQassidas
        .filter((q) => q.categorie)
        .map((q) => q.categorie!)
    )
  ).sort();

  const filteredQassidas = allQassidas.filter((q) => {
    const matchesSearch =
      searchMatch(q.title, searchQuery) ||
      searchMatch(q.arabic, searchQuery) ||
      searchMatch(q.author, searchQuery);
    const matchesAuthor = selectedAuthorId
      ? authorsData.find((a) => a.id === selectedAuthorId)?.fullName === q.author
      : true;
    const matchesCategory = selectedCategory
      ? q.categorie === selectedCategory
      : true;
    const matchesFavorite = showFavorites ? isFavorite(q.id) : true;
    return matchesSearch && matchesAuthor && matchesCategory && matchesFavorite;
  });

  // Search results for dropdown (max 6)
  const searchResults = searchQuery.trim().length > 0
    ? allQassidas
        .filter(
          (q) =>
            searchMatch(q.title, searchQuery) ||
            searchMatch(q.arabic, searchQuery) ||
            searchMatch(q.author, searchQuery)
        )
        .slice(0, 6)
    : [];

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
        onNavigateToXassida={handleNavigateToXassida}
      />
    );
  }

  return (
    <motion.div className="min-h-screen pb-24 bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="bg-gradient-to-br from-secondary via-secondary to-gold-light pt-12 pb-8 px-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-foreground">{t("xassidasTitle")}</h1>
            <p className="text-4xl font-arabic text-card mt-2">الْقَصَائِدُ</p>
            <p className="text-sm text-secondary-foreground/70 mt-2">
              {isLoading ? t("loading") : `${filteredQassidas.length} ${t("xassidasCount")}`}
            </p>
          </div>
          <LanguageSwitcher variant="light" />
        </div>

        {/* Search with dropdown */}
        <div ref={searchRef} className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(e.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setShowSearchDropdown(true);
            }}
            className="w-full bg-card rounded-xl pl-12 pr-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/50"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Search results dropdown */}
          <AnimatePresence>
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden z-50 max-h-[320px] overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground px-4 pt-3 pb-1 font-semibold uppercase tracking-wider">
                      {t("searchResults")} ({searchResults.length}{filteredQassidas.length > 6 ? "+" : ""})
                    </p>
                    {searchResults.map((qassida) => (
                      <button
                        key={qassida.id}
                        onClick={() => handleQassidasClick(qassida)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/10 last:border-b-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-secondary">
                            {qassida.title.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{qassida.title}</p>
                          {qassida.arabic && (
                            <p className="text-sm font-arabic text-primary truncate">{qassida.arabic}</p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">{qassida.author}</p>
                        </div>
                      </button>
                    ))}
                    {filteredQassidas.length > 6 && (
                      <button
                        onClick={() => setShowSearchDropdown(false)}
                        className="w-full text-center text-sm text-primary font-medium py-2.5 hover:bg-muted/30 transition-colors"
                      >
                        {t("seeAll")} ({filteredQassidas.length})
                      </button>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-muted-foreground">{t("noResults")}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View + favorites toggles */}
        <div className="mt-4 flex gap-2">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setShowFavorites(false); }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === mode && !showFavorites ? "bg-card text-foreground" : "bg-card/30 text-secondary-foreground/70"
              }`}
            >
              {mode === "grid" ? `⊞ ${t("gridView")}` : `☰ ${t("listView")}`}
            </button>
          ))}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showFavorites ? "bg-card text-foreground" : "bg-card/30 text-secondary-foreground/70"
            }`}
          >
            {showFavorites ? "❤️" : "♡"}
            {favCount > 0 && (
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{favCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── Favorites Panel ───────────────────────────────────── */}
      {showFavorites && (
        <div className="px-4 py-4">
          <FavoritesList onQassidasClick={handleFavoriteClick} />
        </div>
      )}

      {/* ── Category filter ────────────────────────────────────── */}
      {!showFavorites && !isLoading && !error && uniqueCategories.length > 0 && (
        <div className="px-4 pt-5 pb-3 border-b border-border/20">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            {t("byCategory")}
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
              {t("allFem")}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1.5 inline-block ${selectedCategory === null ? "bg-white/20" : "bg-muted-foreground/20"}`}>
                {filteredQassidas.length}
              </span>
            </button>

            {uniqueCategories.map((category) => {
              const count = allQassidas.filter((q) => q.categorie === category).length;
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

      {/* ── Author filter ─────────────────────────────────────── */}
      {!showFavorites && !isLoading && !error && authorsData.length > 0 && (
        <div className="px-4 pt-5 pb-3 border-b border-border/20">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            {t("byAuthor")}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* Tous */}
            <button
              onClick={() => setSelectedAuthorId(null)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedAuthorId === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("all")}
              <span className={`text-xs px-2 py-0.5 rounded-full ${selectedAuthorId === null ? "bg-white/20" : "bg-muted-foreground/20"}`}>
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
                  className={`flex-shrink-0 flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ${isActive ? "ring-2 ring-white/40" : ""}`}>
                    {author.imageUrl ? (
                      <img
                        src={author.imageUrl}
                        alt={author.shortName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${isActive ? "bg-white/20" : "bg-primary/20 text-primary"}`}>
                        {author.shortName[0]}
                      </div>
                    )}
                  </div>
                  <span className="truncate max-w-[100px] text-sm">{author.shortName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${isActive ? "bg-white/20" : "bg-muted-foreground/20"}`}>
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
          <p className="font-semibold text-foreground">{t("serverUnavailable")}</p>
          <p className="text-sm text-muted-foreground">{t("serverError")}</p>
        </div>
      )}

      {!isLoading && !error && allQassidas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-3">
          <p className="text-4xl font-arabic text-primary/40">الْقَصَائِدُ</p>
          <p className="font-semibold text-foreground">{t("noXassida")}</p>
          <p className="text-sm text-muted-foreground">{t("dbPopulating")}</p>
        </div>
      )}

      {/* ── List ─────────────────────────────────────────────── */}
      {!showFavorites && !isLoading && !error && allQassidas.length > 0 && (
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
