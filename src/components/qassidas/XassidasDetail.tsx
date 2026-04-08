// src/components/qassidas/XassidasDetail.tsx
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Play, Pause, Headphones, Share2,
  Loader2, Languages, AlignLeft, Volume2, X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useXassidasDetail, useXassidas } from "@/hooks/useXassidas";
import { useFavorites } from "@/hooks/useFavorites";
import type { Qassida } from "@/data/qassidasData";
import { authorsData } from "@/data/qassidasData";
import { enrichedQassidasData } from "@/data/enrichedQassidasData";
import { Heart } from "lucide-react";

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

const PAGE_SIZE = 20;

// ── Mini audio player ────────────────────────────────────────────────────────

interface AudioPlayerProps {
  url: string;
  dark: boolean;
}

const AudioPlayer = ({ url, dark }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => setError(true)); setPlaying(true); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const t = (Number(e.target.value) / 100) * duration;
    a.currentTime = t;
    setProgress(Number(e.target.value));
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const bg = dark ? "bg-slate-800/70 border-slate-700" : "bg-card border-border/30";
  const txt = dark ? "text-amber-100" : "text-foreground";
  const sub = dark ? "text-amber-300/70" : "text-muted-foreground";

  return (
    <div className={`rounded-2xl border p-4 mb-4 ${bg}`}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (!a || !a.duration) return;
          setProgress((a.currentTime / a.duration) * 100);
        }}
        onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setLoading(false); }}
        onEnded={() => setPlaying(false)}
        onError={() => { setError(true); setLoading(false); }}
      />

      {error ? (
        <p className={`text-xs text-center ${sub}`}>Audio indisponible pour cette xassida</p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            disabled={loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              dark ? "bg-amber-700/40 text-amber-200 hover:bg-amber-700/60" : "bg-primary/15 text-primary hover:bg-primary/25"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Volume2 className={`w-3 h-3 flex-shrink-0 ${sub}`} />
              <span className={`text-xs ${sub} truncate`}>Récitation</span>
            </div>
            <input
              type="range" min={0} max={100} value={progress}
              onChange={seek}
              className="w-full h-1 accent-primary cursor-pointer"
            />
            <div className={`flex justify-between text-xs mt-0.5 ${sub}`}>
              <span>{fmt((progress / 100) * duration)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

const XassidasDetail = ({ selectedQassida, onBack, onNext, onPrevious }: XassidasDetailProps) => {
  const [fontSize, setFontSize] = useState(20);
  const [darkMode, setDarkMode] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [audioUrl, setAudioUrl] = useState<string | null | undefined>(undefined); // undefined=loading, null=none

  const { toggleFavorite, isFavorite } = useFavorites();
  const { fetchAudioUrl } = useXassidas();
  const favorite = isFavorite(selectedQassida.id);

  const author = authorsData.find((a) => a.fullName === selectedQassida.author);
  const enrichedData = enrichedQassidasData[selectedQassida.id];
  const { data: apiDetail, isLoading: loadingVerses } = useXassidasDetail(selectedQassida.apiId || null);

  const apiVerses: XassidaVerse[] = Array.isArray(apiDetail?.verses) ? apiDetail.verses : [];
  const hasTranscription = apiVerses.some((v) => v.transcription);
  const hasTranslation = apiVerses.some((v) => v.translation_fr || v.translation_en);

  // Group by chapter
  const byChapter = apiVerses.reduce<Record<number, XassidaVerse[]>>((acc, v) => {
    const ch = v.chapter_number ?? 1;
    (acc[ch] ??= []).push(v);
    return acc;
  }, {});
  const chapters = Object.entries(byChapter).sort(([a], [b]) => Number(a) - Number(b));

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (apiVerses.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((n) => Math.min(n + PAGE_SIZE, apiVerses.length)); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [apiVerses.length]);

  // Reset pagination when xassida changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedQassida.id]);

  // Fetch audio URL
  useEffect(() => {
    setAudioUrl(undefined);
    // First try the stored audioUrl on the xassida object, then fetch from API
    if (selectedQassida.audioUrl) { setAudioUrl(selectedQassida.audioUrl); return; }
    // Try to get from xassida.sn audio table using the numeric ID embedded in apiId
    const numericId = selectedQassida.id;
    fetchAudioUrl(numericId).then(setAudioUrl);
  }, [selectedQassida.id, selectedQassida.apiId]);

  // Flatten verses up to visibleCount
  const allVersesFlat = chapters.flatMap(([, vv]) => vv);
  const visibleVerses = allVersesFlat.slice(0, visibleCount);

  // Dark mode theme tokens
  const d = darkMode;
  const bg       = d ? "bg-slate-900"            : "bg-background";
  const card     = d ? "bg-slate-800/60 border-slate-700" : "bg-card border-border/30";
  const header   = d ? "from-amber-950 via-orange-950 to-amber-900" : "from-secondary via-secondary to-secondary/80";
  const headTxt  = "text-white";
  const headSub  = d ? "text-amber-200/70"        : "text-white/75";
  const headMut  = d ? "text-amber-200/50"        : "text-white/55";
  const ctrl     = d ? "bg-slate-800/80 border-slate-700" : "bg-muted/60 border-border/20";
  const ctrlBtn  = d ? "text-amber-300 hover:bg-slate-700" : "text-muted-foreground hover:bg-muted";
  const active   = d ? "bg-amber-700/40 text-amber-200" : "bg-primary/15 text-primary";
  const arabicTxt= d ? "text-amber-50"            : "text-foreground";
  const translit = d ? "text-amber-400/80"        : "text-secondary/80";
  const trFr     = d ? "text-amber-200/70"        : "text-muted-foreground";
  const badge    = d ? "bg-amber-900/50 text-amber-300" : "bg-primary/10 text-primary";
  const chSep    = d ? "text-amber-500/60"        : "text-muted-foreground/60";

  return (
    <motion.div className={`min-h-screen transition-colors ${bg}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className={`relative pt-12 pb-28 px-6 bg-gradient-to-b ${header}`}>
        <button onClick={onBack} className="absolute top-12 left-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button onClick={() => setDarkMode(!d)} className="absolute top-12 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-lg">
          {d ? "☀️" : "🌙"}
        </button>

        <div className="text-center mt-10">
          {selectedQassida.arabic && (
            <p className={`text-3xl font-arabic ${headTxt} mb-2 leading-relaxed`}>{selectedQassida.arabic}</p>
          )}
          <h1 className={`text-xl font-bold ${headTxt}`}>{selectedQassida.title}</h1>
          {author && <p className={`text-sm ${headSub} mt-1`}>{author.fullName} · {author.confraternity}</p>}
          {apiVerses.length > 0 && <p className={`text-xs ${headMut} mt-1`}>{apiVerses.length} versets</p>}
        </div>

        {/* Action bar */}
        <div className="absolute -bottom-14 left-6 right-6">
          <div className="bg-card rounded-2xl px-2 py-3 shadow-xl flex justify-around">
            {[
              {
                icon: <Heart className={`w-5 h-5 ${favorite ? "fill-secondary text-secondary" : "text-secondary"}`} />,
                label: "Favori",
                bg: favorite ? "bg-secondary/20" : "bg-secondary/10 hover:bg-secondary/20",
                action: () => toggleFavorite({ id: selectedQassida.id, title: selectedQassida.title, arabic: selectedQassida.arabic, author: selectedQassida.author, addedAt: Date.now() })
              },
              { icon: <Headphones className="w-5 h-5 text-secondary" />, label: "Audio", bg: "bg-secondary/10 hover:bg-secondary/20", action: () => {} },
              { icon: <Share2 className="w-5 h-5 text-primary" />, label: "Partager", bg: "bg-primary/10 hover:bg-primary/20", action: () => {} },
            ].map(({ icon, label, bg: btnBg, action }) => (
              <button key={label} onClick={action} className="flex flex-col items-center gap-1">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${btnBg}`}>{icon}</div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="pt-20 px-4 pb-28">

        {/* Audio player */}
        {audioUrl && <AudioPlayer url={audioUrl} dark={d} />}

        {/* Reading controls */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-5 flex-wrap ${ctrl}`}>
          <div className="flex items-center gap-1">
            <button onClick={() => setFontSize((f) => Math.max(14, f - 2))} className={`w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center ${ctrlBtn}`}>A‑</button>
            <span className={`text-xs w-6 text-center tabular-nums ${ctrlBtn}`}>{fontSize}</span>
            <button onClick={() => setFontSize((f) => Math.min(32, f + 2))} className={`w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center ${ctrlBtn}`}>A+</button>
          </div>
          <div className="w-px h-5 bg-border/40 mx-1" />
          {hasTranscription && (
            <button onClick={() => setShowTranscription((s) => !s)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showTranscription ? active : ctrlBtn}`}>
              <AlignLeft className="w-3.5 h-3.5" /> Translitération
            </button>
          )}
          {hasTranslation && (
            <button onClick={() => setShowTranslation((s) => !s)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showTranslation ? active : ctrlBtn}`}>
              <Languages className="w-3.5 h-3.5" /> Traduction
            </button>
          )}
        </div>

        {/* Verses */}
        {loadingVerses ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>

        ) : apiVerses.length > 0 ? (
          <>
            {/* Chapter separators are handled inline */}
            {(() => {
              let chapterShown = 0;
              return visibleVerses.map((verse, vi) => {
                const ch = verse.chapter_number ?? 1;
                const isFirstOfChapter = vi === 0 || (visibleVerses[vi - 1].chapter_number ?? 1) !== ch;
                const showChapterHead = isFirstOfChapter && chapters.length > 1;
                if (isFirstOfChapter) chapterShown++;
                return (
                  <div key={verse.id || `${ch}-${verse.verse_number}`}>
                    {showChapterHead && (
                      <div className="flex items-center gap-3 mb-3 mt-5">
                        <div className="flex-1 h-px bg-border/30" />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${chSep}`}>Chapitre {ch}</span>
                        <div className="flex-1 h-px bg-border/30" />
                      </div>
                    )}
                    <motion.div
                      className={`rounded-2xl border p-4 mb-3 transition-colors ${card}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(vi, 10) * 0.02 }}
                    >
                      <div className="flex justify-end mb-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${badge}`}>
                          {verse.verse_number}
                        </span>
                      </div>
                      <p className={`text-right font-arabic leading-loose ${arabicTxt}`} style={{ fontSize: `${fontSize}px` }} dir="rtl">
                        {verse.text_arabic}
                      </p>
                      <AnimatePresence>
                        {showTranscription && verse.transcription && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 10 }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className={`text-sm italic text-center leading-relaxed ${translit}`}
                          >
                            {verse.transcription}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {showTranslation && (verse.translation_fr || verse.translation_en) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 10 }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          >
                            <div className="h-px bg-border/20 mb-2" />
                            <p className={`text-sm leading-relaxed ${trFr}`}>{verse.translation_fr || verse.translation_en}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                );
              });
            })()}

            {/* Infinite scroll sentinel */}
            {visibleCount < apiVerses.length && (
              <div ref={sentinelRef} className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
              </div>
            )}
            {visibleCount >= apiVerses.length && apiVerses.length > PAGE_SIZE && (
              <p className={`text-center text-xs py-4 ${d ? "text-amber-300/40" : "text-muted-foreground/50"}`}>
                Fin · {apiVerses.length} versets
              </p>
            )}
          </>

        ) : enrichedData?.fullText ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border overflow-hidden ${card}`}>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <p className={`leading-loose font-arabic text-right whitespace-pre-wrap break-words ${arabicTxt}`} style={{ fontSize: `${fontSize}px` }}>
                {enrichedData.fullText}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className={`text-sm ${d ? "text-amber-300/50" : "text-muted-foreground/60"}`}>Aucun verset disponible.</p>
          </div>
        )}

        {/* Navigation */}
        {(onNext || onPrevious) && (
          <div className="flex gap-3 mt-8">
            {onPrevious && (
              <button onClick={onPrevious} className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors font-medium text-sm">
                ← Précédente
              </button>
            )}
            {onNext && (
              <button onClick={onNext} className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors font-medium text-sm">
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
