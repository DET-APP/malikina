import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Volume2, Share2, Heart, Download, Plus, Minus, Eye, EyeOff, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Qassida } from "@/data/qassidasData";
import { authorsData } from "@/data/qassidasData";
import { enrichedQassidasData } from "@/data/enrichedQassidasData";

interface QassidasDetailsModalProps {
  qassida: Qassida | null;
  onClose: () => void;
}

const QassidasDetailsModal = ({ qassida, onClose }: QassidasDetailsModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(qassida?.isFavorite || false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const author = qassida ? authorsData.find(a => a.fullName === qassida.author || a.shortName === qassida.author) : null;
  const enrichedData = qassida ? enrichedQassidasData[qassida.id] : null;
  const hasAudio = enrichedData?.audioUrl || qassida?.audioUrl;

  // Handle audio play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle audio time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle audio metadata loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = percent * duration;
    }
  };

  // Format time
  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle audio end
  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  if (!qassida) return null;

  return (
    <AnimatePresence>
      {qassida && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-colors ${
              darkMode ? "bg-slate-900" : "bg-card"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b sticky top-0 backdrop-blur-sm transition-colors ${
              darkMode 
                ? "border-slate-700 bg-slate-900/95" 
                : "border-border/50 bg-card/95"
            }`}>
              <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
                ✨ Xassida
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? "hover:bg-slate-800 text-white" 
                    : "hover:bg-muted"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-6 space-y-6 ${darkMode ? "bg-slate-900" : ""}`}>
              {/* Author Info */}
              {author && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-4 p-5 rounded-2xl transition-colors ${
                    darkMode
                      ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/30"
                      : "bg-gradient-to-r from-primary/10 to-secondary/10"
                  }`}
                >
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 transition-colors ${
                    darkMode
                      ? "border-amber-700/50 bg-amber-900/20"
                      : "border-primary/30 bg-primary/20"
                  }`}>
                    {author.imageUrl ? (
                      <img 
                        src={author.imageUrl} 
                        alt={author.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-bold text-lg transition-colors ${
                        darkMode
                          ? "bg-amber-900/30 text-amber-300"
                          : "bg-primary/30 text-primary"
                      }`}>
                        {author.fullName.split(' ')[0][0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${darkMode ? "text-amber-100" : "text-foreground"}`}>
                      {author.fullName}
                    </h3>
                    <p className={`text-sm font-arabic ${darkMode ? "text-amber-200/70" : "text-muted-foreground"}`}>
                      {author.arabic}
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? "text-amber-200/50" : "text-muted-foreground"}`}>
                      🕌 {author.confraternity}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Qassida Title */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`space-y-3 pb-4 border-b transition-colors ${
                  darkMode ? "border-slate-700" : "border-border/30"
                }`}
              >
                <h1 className={`text-3xl font-bold ${darkMode ? "text-amber-100" : "text-foreground"}`}>
                  {qassida.title}
                </h1>
                <p className={`text-2xl font-arabic leading-relaxed text-right ${
                  darkMode ? "text-amber-200" : "text-primary"
                }`}>
                  {qassida.arabic}
                </p>
              </motion.div>

              {/* Reading Controls */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`flex gap-2 p-4 rounded-xl flex-wrap transition-colors ${
                  darkMode
                    ? "bg-slate-800/50 border border-slate-700"
                    : "bg-muted/50"
                }`}
              >
                {/* Font Size Control */}
                <div className="flex items-center gap-1 flex-1 min-w-32">
                  <Minus className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-amber-300" : "text-primary"}`} />
                  <input
                    type="range"
                    min="14"
                    max="32"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="flex-1 h-1 accent-primary"
                  />
                  <Plus className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-amber-300" : "text-primary"}`} />
                </div>

                {/* Toggle Translation/Full Text */}
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    darkMode
                      ? showTranslation ? "bg-amber-700/30 text-amber-300" : "hover:bg-slate-700 text-slate-400"
                      : showTranslation ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={showTranslation ? "Masquer texte" : "Afficher texte"}
                >
                  {showTranslation ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    darkMode
                      ? "bg-amber-700/30 text-amber-300"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  title={darkMode ? "Mode clair" : "Mode sombre"}
                >
                  {darkMode ? "☀️" : "🌙"}
                </button>
              </motion.div>

              {/* Audio Player */}
              {hasAudio && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`p-6 rounded-2xl space-y-4 border transition-all ${
                    darkMode
                      ? "bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-700/30"
                      : "bg-gradient-to-br from-secondary/20 to-primary/20 border-primary/20"
                  }`}
                >
                  <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-amber-100" : "text-foreground"}`}>
                    <Zap className="w-5 h-5" /> Écouter
                  </h3>
                  
                  {/* Hidden audio element */}
                  <audio
                    ref={audioRef}
                    src={enrichedData?.audioUrl || qassida?.audioUrl || ""}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleAudioEnd}
                  />
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div 
                      onClick={handleProgressClick}
                      className={`w-full h-2 rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all group ${
                        darkMode ? "bg-amber-700/20" : "bg-primary/30"
                      }`}
                    >
                      <div 
                        className={`h-full rounded-full transition-all ${
                          darkMode
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-secondary to-primary"
                        }`}
                        style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                      />
                    </div>
                    <div className={`flex items-center justify-between text-xs ${darkMode ? "text-amber-200/70" : "text-muted-foreground"}`}>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <motion.button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Math.max(0, currentTime - 10);
                        }
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? "hover:bg-amber-700/30 text-amber-300"
                          : "hover:bg-primary/20 text-primary"
                      }`}
                    >
                      <span className="text-sm font-bold">⏪ 10s</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => setIsPlaying(!isPlaying)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg font-semibold transition-all ${
                        darkMode
                          ? "bg-gradient-to-br from-amber-500 to-orange-500"
                          : "bg-gradient-to-br from-secondary to-primary"
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-7 h-7 fill-white" />
                      ) : (
                        <Play className="w-7 h-7 fill-white ml-1" />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Math.min(duration, currentTime + 10);
                        }
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? "hover:bg-amber-700/30 text-amber-300"
                          : "hover:bg-primary/20 text-primary"
                      }`}
                    >
                      <span className="text-sm font-bold">10s ⏩</span>
                    </motion.button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-3">
                    <Volume2 className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-amber-300" : "text-primary"}`} />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (audioRef.current) {
                          audioRef.current.volume = parseFloat(e.target.value);
                        }
                      }}
                      className="flex-1 h-1 bg-primary/30 rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <span className={`text-xs w-8 text-right ${darkMode ? "text-amber-200/70" : "text-muted-foreground"}`}>
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  {/* Download Button */}
                  {enrichedData?.audioUrl && (
                    <a
                      href={enrichedData.audioUrl}
                      download
                      className={`w-full flex items-center justify-center gap-2 py-2 font-medium rounded-lg transition-colors ${
                        darkMode
                          ? "text-amber-300 hover:bg-amber-700/20"
                          : "text-primary hover:bg-primary/10"
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Télécharger l'audio
                    </a>
                  )}
                </motion.div>
              )}

              {/* Full Text */}
              {showTranslation && enrichedData?.fullText && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className={`rounded-xl overflow-hidden border transition-all ${
                    darkMode
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-card border-border/20"
                  }`}
                >
                  <div className={`p-6 max-h-96 overflow-y-auto ${darkMode ? "bg-slate-800/30" : "bg-background/50"}`}>
                    <p
                      className={`leading-relaxed font-arabic text-right whitespace-pre-wrap break-words transition-all ${
                        darkMode ? "text-amber-100" : "text-foreground"
                      }`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {enrichedData.fullText}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsFavorite(!isFavorite);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                    isFavorite
                      ? darkMode
                        ? "bg-amber-700/30 text-amber-300"
                        : "bg-secondary text-secondary-foreground"
                      : darkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                  {isFavorite ? "❤️ Favori" : "♡ Ajouter"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (qassida && navigator.share) {
                      navigator.share({
                        title: qassida.title,
                        text: `${qassida.title} par ${qassida.author}`,
                        url: window.location.href,
                      });
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                    darkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Share2 className="w-5 h-5" />
                  Partager
                </motion.button>
              </motion.div>

              {/* Close button spacing */}
              <div className="h-8" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QassidasDetailsModal;
