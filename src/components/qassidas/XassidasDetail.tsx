// src/components/qassidas/XassidasDetail.tsx
import { motion } from "framer-motion";
import { ChevronLeft, Play, Headphones, Bookmark, Share2, Loader2, Heart } from "lucide-react";
import { useState } from "react";
import { useXassidasDetail } from "@/hooks/useXassidas";
import type { Qassida } from "@/data/qassidasData";
import { authorsData } from "@/data/qassidasData";
import { enrichedQassidasData } from "@/data/enrichedQassidasData";

interface XassidasDetailProps {
  selectedQassida: Qassida;
  onBack: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

interface XassidaVerse {
  id?: string;
  verse_number: number;
  text_arabic: string;
  transcription?: string;
  translation_fr?: string;
}

const XassidasDetail = ({
  selectedQassida,
  onBack,
  onNext,
  onPrevious,
}: XassidasDetailProps) => {
  const [fontSize, setFontSize] = useState(18);
  const [isFavorite, setIsFavorite] = useState(selectedQassida.isFavorite);
  const [darkMode, setDarkMode] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);

  const author = authorsData.find(a => a.fullName === selectedQassida.author);
  const enrichedData = enrichedQassidasData[selectedQassida.id];
  const { data: apiDetail, isLoading: loadingVerses } = useXassidasDetail(selectedQassida.apiId || null);
  const apiVerses: XassidaVerse[] = Array.isArray(apiDetail?.verses)
    ? (apiDetail.verses as XassidaVerse[])
    : [];

  return (
    <motion.div
      className={`min-h-screen transition-colors ${darkMode ? "bg-slate-900" : "bg-background"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className={`relative pt-12 pb-32 px-6 transition-colors ${
        darkMode 
          ? "bg-gradient-to-b from-amber-900 to-orange-900" 
          : "bg-gradient-to-b from-secondary to-secondary/80"
      }`}>
        <div className="absolute top-12 left-6 flex gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-4xl font-arabic text-white mb-3 leading-relaxed">
            {selectedQassida.arabic}
          </p>
          <h1 className="text-2xl font-bold text-white">{selectedQassida.title}</h1>
          {author && (
            <p className="text-white/80 text-sm mt-2">
              {author.fullName} • {author.confraternity}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="absolute -bottom-16 left-6 right-6">
          <div className="bg-card rounded-2xl p-4 shadow-xl flex justify-around">
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-secondary/20 transition-colors ${
                isFavorite ? "bg-secondary/20" : "bg-secondary/10"
              }`}>
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-secondary text-secondary" : "text-secondary"}`} />
              </div>
              <span className="text-xs text-muted-foreground">Favori</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Play className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Lecture</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Headphones className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-xs text-muted-foreground">Audio</span>
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

      {/* Content */}
      <div className="pt-20 px-6 pb-24">
        {/* Author Card */}
        {author && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-5 rounded-2xl mb-8 border transition-all ${
              darkMode
                ? "bg-slate-800/50 border-slate-700"
                : "bg-primary/10 border-primary/20"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center ${
                darkMode ? "bg-amber-900/30" : "bg-primary/20"
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
                  <span className={`text-xl font-bold ${darkMode ? "text-amber-300" : "text-primary"}`}>
                    {author.fullName.split(' ')[0][0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className={`font-bold text-lg ${darkMode ? "text-amber-100" : ""}`}>
                  {author.fullName}
                </h3>
                <p className={`text-sm font-arabic ${darkMode ? "text-amber-200/70" : "text-muted-foreground"}`}>
                  {author.arabic}
                </p>
                {author.bio && (
                  <p className={`text-xs mt-1 ${darkMode ? "text-amber-200/50" : "text-muted-foreground"}`}>
                    {author.bio}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Reading Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`flex gap-2 p-4 rounded-xl mb-8 flex-wrap transition-colors ${
            darkMode 
              ? "bg-slate-800/50 border border-slate-700" 
              : "bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-32">
            <button 
              onClick={() => setFontSize(f => Math.max(14, f - 2))}
              className={`px-2 py-1 rounded text-xs font-bold ${darkMode ? "text-amber-300" : "text-primary"}`}
            >
              A-
            </button>
            <input
              type="range"
              min="14"
              max="32"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="flex-1 h-1 accent-primary"
            />
            <button 
              onClick={() => setFontSize(f => Math.min(32, f + 2))}
              className={`px-2 py-1 rounded text-xs font-bold ${darkMode ? "text-amber-300" : "text-primary"}`}
            >
              A+
            </button>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
              darkMode
                ? "bg-amber-700/30 text-amber-300"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {!!apiVerses.length && (
            <button
              onClick={() => setShowTranscription(!showTranscription)}
              className={`px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
                showTranscription
                  ? darkMode
                    ? "bg-amber-700/30 text-amber-200"
                    : "bg-primary/20 text-primary"
                  : darkMode
                    ? "text-amber-300/70 hover:bg-slate-700"
                    : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {showTranscription ? "Transcription ON" : "Transcription OFF"}
            </button>
          )}
        </motion.div>

        {/* Versets API (format lecture Coran) */}
        {loadingVerses ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : apiVerses.length > 0 ? (
          <div className="space-y-6">
            {apiVerses.map((verse, index: number) => (
              <motion.div
                key={verse.id || `${selectedQassida.id}-${verse.verse_number}`}
                className="mb-6 pb-6 border-b border-border scroll-mt-32"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    {verse.verse_number}
                  </span>
                  <button className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all duration-300">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-lg" />
                  <p
                    className="relative text-right font-arabic leading-loose p-4"
                    style={{ fontSize: `${fontSize + 6}px` }}
                    dir="rtl"
                  >
                    {verse.text_arabic}
                  </p>
                </div>

                {showTranscription && !!verse.transcription && (
                  <div className="mb-3 bg-secondary/5 rounded-lg p-3 border border-secondary/20">
                    <p className="text-sm text-secondary font-medium text-center italic">
                      {verse.transcription}
                    </p>
                  </div>
                )}

                {!!verse.translation_fr && (
                  <div className="bg-card/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {verse.translation_fr}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          enrichedData?.fullText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
          )
        )}

        {/* Navigation */}
        {(onNext || onPrevious) && (
          <div className="flex gap-4 mt-8">
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="flex-1 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors font-medium"
              >
                ← Précédente
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="flex-1 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors font-medium"
              >
                Suivante →
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default XassidasDetail;
