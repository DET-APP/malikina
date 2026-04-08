// src/components/qassidas/XassidasDetail.tsx
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, Headphones, Share2, Loader2, Heart, Languages, AlignLeft } from "lucide-react";
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
  chapter_number?: number;
  text_arabic: string;
  transcription?: string;
  translation_fr?: string;
  translation_en?: string;
}

const XassidasDetail = ({
  selectedQassida,
  onBack,
  onNext,
  onPrevious,
}: XassidasDetailProps) => {
  const [fontSize, setFontSize] = useState(20);
  const [isFavorite, setIsFavorite] = useState(selectedQassida.isFavorite);
  const [darkMode, setDarkMode] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const author = authorsData.find(a => a.fullName === selectedQassida.author);
  const enrichedData = enrichedQassidasData[selectedQassida.id];
  const { data: apiDetail, isLoading: loadingVerses } = useXassidasDetail(selectedQassida.apiId || null);
  const apiVerses: XassidaVerse[] = Array.isArray(apiDetail?.verses)
    ? (apiDetail.verses as XassidaVerse[])
    : [];

  const hasTranscription = apiVerses.some(v => v.transcription);
  const hasTranslation   = apiVerses.some(v => v.translation_fr || v.translation_en);

  // Group verses by chapter for display
  const byChapter = apiVerses.reduce<Record<number, XassidaVerse[]>>((acc, v) => {
    const ch = v.chapter_number ?? 1;
    if (!acc[ch]) acc[ch] = [];
    acc[ch].push(v);
    return acc;
  }, {});
  const chapters = Object.entries(byChapter).sort(([a], [b]) => Number(a) - Number(b));

  const dark = {
    bg:       "bg-slate-900",
    card:     "bg-slate-800/60 border-slate-700",
    header:   "from-amber-950 via-orange-950 to-amber-900",
    text:     "text-amber-50",
    sub:      "text-amber-200/70",
    muted:    "text-amber-200/50",
    ctrl:     "bg-slate-800/80 border-slate-700",
    ctrlBtn:  "text-amber-300 hover:bg-slate-700",
    active:   "bg-amber-700/40 text-amber-200",
    trans:    "text-amber-400/80",
    trFr:     "text-amber-300/70",
    badge:    "bg-amber-900/50 text-amber-300",
    num:      "text-amber-500",
  };

  const light = {
    bg:       "bg-background",
    card:     "bg-card border-border/30",
    header:   "from-secondary via-secondary to-secondary/80",
    text:     "text-white",
    sub:      "text-white/75",
    muted:    "text-white/55",
    ctrl:     "bg-muted/60 border-border/20",
    ctrlBtn:  "text-muted-foreground hover:bg-muted",
    active:   "bg-primary/15 text-primary",
    trans:    "text-secondary/80",
    trFr:     "text-muted-foreground",
    badge:    "bg-primary/10 text-primary",
    num:      "text-muted-foreground/60",
  };

  const t = darkMode ? dark : light;

  return (
    <motion.div
      className={`min-h-screen transition-colors ${t.bg}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={`relative pt-12 pb-28 px-6 bg-gradient-to-b ${t.header}`}>
        {/* Back */}
        <button
          onClick={onBack}
          className="absolute top-12 left-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Night-mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-12 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-lg"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <div className="text-center mt-10">
          {selectedQassida.arabic && (
            <p className={`text-3xl font-arabic ${t.text} mb-2 leading-relaxed`}>
              {selectedQassida.arabic}
            </p>
          )}
          <h1 className={`text-xl font-bold ${t.text}`}>{selectedQassida.title}</h1>
          {author && (
            <p className={`text-sm ${t.sub} mt-1`}>
              {author.fullName} · {author.confraternity}
            </p>
          )}
          {apiVerses.length > 0 && (
            <p className={`text-xs ${t.muted} mt-1`}>{apiVerses.length} versets</p>
          )}
        </div>

        {/* Action bar */}
        <div className="absolute -bottom-14 left-6 right-6">
          <div className="bg-card rounded-2xl px-2 py-3 shadow-xl flex justify-around">
            <button onClick={() => setIsFavorite(!isFavorite)} className="flex flex-col items-center gap-1">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isFavorite ? "bg-secondary/20" : "bg-secondary/10 hover:bg-secondary/20"}`}>
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-secondary text-secondary" : "text-secondary"}`} />
              </div>
              <span className="text-xs text-muted-foreground">Favori</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Play className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Lecture</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center transition-colors">
                <Headphones className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-xs text-muted-foreground">Audio</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Partager</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="pt-20 px-4 pb-28">

        {/* Reading controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-6 flex-wrap ${t.ctrl}`}
        >
          {/* Font size */}
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={() => setFontSize(f => Math.max(14, f - 2))}
              className={`w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center ${t.ctrlBtn}`}
            >
              A‑
            </button>
            <span className={`text-xs w-6 text-center tabular-nums ${t.ctrlBtn}`}>{fontSize}</span>
            <button
              onClick={() => setFontSize(f => Math.min(32, f + 2))}
              className={`w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center ${t.ctrlBtn}`}
            >
              A+
            </button>
          </div>

          <div className="w-px h-6 bg-border/40 mx-1" />

          {/* Transliteration toggle */}
          {hasTranscription && (
            <button
              onClick={() => setShowTranscription(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showTranscription ? t.active : t.ctrlBtn
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              Translitération
            </button>
          )}

          {/* Translation toggle */}
          {(hasTranslation || !apiVerses.length) && (
            <button
              onClick={() => setShowTranslation(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showTranslation ? t.active : t.ctrlBtn
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              Traduction
            </button>
          )}
        </motion.div>

        {/* Verses */}
        {loadingVerses ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>

        ) : apiVerses.length > 0 ? (
          <div className="space-y-3">
            {chapters.map(([chNum, verses], ci) => (
              <div key={chNum}>
                {/* Chapter heading (only if multiple chapters) */}
                {chapters.length > 1 && (
                  <div className="flex items-center gap-3 mb-3 mt-5">
                    <div className="flex-1 h-px bg-border/30" />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${t.num}`}>
                      Chapitre {chNum}
                    </span>
                    <div className="flex-1 h-px bg-border/30" />
                  </div>
                )}

                {verses.map((verse, vi) => (
                  <motion.div
                    key={verse.id || `${chNum}-${verse.verse_number}`}
                    className={`rounded-2xl border p-4 mb-3 transition-colors ${t.card}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (ci * 10 + vi) * 0.015 }}
                  >
                    {/* Verse number */}
                    <div className="flex justify-end mb-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${t.badge}`}>
                        {verse.verse_number}
                      </span>
                    </div>

                    {/* Arabic text */}
                    <p
                      className="text-right font-arabic leading-loose"
                      style={{ fontSize: `${fontSize}px` }}
                      dir="rtl"
                    >
                      {verse.text_arabic}
                    </p>

                    {/* Transliteration */}
                    <AnimatePresence>
                      {showTranscription && verse.transcription && (
                        <motion.p
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className={`text-sm italic text-center leading-relaxed ${t.trans}`}
                        >
                          {verse.transcription}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Translation */}
                    <AnimatePresence>
                      {showTranslation && (verse.translation_fr || verse.translation_en) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        >
                          <div className="h-px bg-border/20 mb-2" />
                          <p className={`text-sm leading-relaxed ${t.trFr}`}>
                            {verse.translation_fr || verse.translation_en}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

        ) : enrichedData?.fullText ? (
          /* Fallback: local full text */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border overflow-hidden ${t.card}`}
          >
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <p
                className="leading-loose font-arabic text-right whitespace-pre-wrap break-words"
                style={{ fontSize: `${fontSize}px` }}
              >
                {enrichedData.fullText}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className={`text-sm ${t.num}`}>Aucun verset disponible pour cette xassida.</p>
          </div>
        )}

        {/* Navigation prev / next */}
        {(onNext || onPrevious) && (
          <div className="flex gap-3 mt-8">
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors font-medium text-sm"
              >
                ← Précédente
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors font-medium text-sm"
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
