// src/components/qassidas/XassidasDetail.tsx
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Play, Pause, Headphones, Share2,
  Loader2, Languages, AlignLeft, Volume2, Search,
  Copy, Check, X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useXassidasDetail, useXassidas } from "@/hooks/useXassidas";
import { useFavorites } from "@/hooks/useFavorites";
import { Heart } from "lucide-react";
import type { Qassida } from "@/data/qassidasData";
import { authorsData } from "@/data/qassidasData";
import { enrichedQassidasData } from "@/data/enrichedQassidasData";
import { searchMatch, extractYouTubeId } from "@/lib/utils";

const XASSIDA_API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://165-245-211-201.sslip.io/api');

interface XassidaAudio {
  id: string;
  xassida_id: string;
  chapter_number: number | null;
  reciter_name: string;
  youtube_id: string | null;
  audio_url: string | null;
  label: string | null;
  order_index: number;
  start_time?: number; // In seconds
  end_time?: number | null; // In seconds, null = use full duration
}

interface XassidasDetailProps {
  selectedQassida: Qassida;
  onBack: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onNavigateToXassida?: (qassida: Qassida, verseNumber?: number) => void;
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

// ── Audio player ─────────────────────────────────────────────────────────────

// ── YouTube IFrame API loader (singleton) ────────────────────────────────────

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: (() => void) | null; }
}

let _ytLoaded = false;
let _ytReady  = false;
const _ytCallbacks: Array<() => void> = [];

function loadYT() {
  if (_ytLoaded) return;
  _ytLoaded = true;
  window.onYouTubeIframeAPIReady = () => {
    _ytReady = true;
    _ytCallbacks.forEach((cb) => cb());
    _ytCallbacks.length = 0;
  };
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
}

function onYTReady(cb: () => void) {
  if (_ytReady) { cb(); return; }
  loadYT();
  _ytCallbacks.push(cb);
}

// ── YouTube audio player (hidden iframe + custom controls) ───────────────────

interface YouTubeAudioPlayerProps { 
  videoId: string; 
  dark: boolean;
  startTime?: number; // In seconds
  endTime?: number | null; // In seconds, null = use full duration
}

const YouTubeAudioPlayer = ({ videoId, dark, startTime = 0, endTime = null }: YouTubeAudioPlayerProps) => {
  const divId   = useRef(`yt-${Math.random().toString(36).slice(2)}`).current;
  const player  = useRef<any>(null);
  const ticker  = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  // Calculate effective duration (trimmed or full)
  const effectiveDuration = endTime !== null && endTime > startTime ? (endTime - startTime) : duration - startTime;

  useEffect(() => {
    onYTReady(() => {
      const el = document.getElementById(divId);
      if (!el) return;
      player.current = new window.YT.Player(divId, {
        videoId,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            setLoading(false);
            setDuration(player.current?.getDuration() ?? 0);
            // Seek to start_time on load
            if (startTime > 0) {
              player.current?.seekTo(startTime, true);
            }
          },
          onStateChange: (e: any) => {
            if (e.data === 1 /* PLAYING */) {
              setPlaying(true);
              setDuration(player.current?.getDuration() ?? 0);
              ticker.current = setInterval(() => {
                const cur = player.current?.getCurrentTime() ?? 0;
                
                // Stop at end_time if specified
                if (endTime !== null && cur >= endTime) {
                  player.current?.pauseVideo();
                  player.current?.seekTo(startTime, true);
                  setProgress(0);
                  setPlaying(false);
                  clearInterval(ticker.current!);
                  return;
                }
                
                // Calculate progress relative to trimmed audio
                const adjustedCur = Math.max(0, cur - startTime);
                if (effectiveDuration > 0) {
                  setProgress((adjustedCur / effectiveDuration) * 100);
                }
              }, 500);
            } else {
              setPlaying(false);
              if (ticker.current) { clearInterval(ticker.current); ticker.current = null; }
              if (e.data === 0 /* ENDED */) setProgress(0);
            }
          },
          onError: () => { setError(true); setLoading(false); },
        },
      });
    });
    return () => {
      if (ticker.current) clearInterval(ticker.current);
      player.current?.destroy?.();
      player.current = null;
    };
  }, [videoId, divId, startTime, endTime]);

  const toggle = () => {
    if (!player.current) return;
    if (playing) {
      player.current.pauseVideo();
    } else {
      const currentTime = player.current?.getCurrentTime() ?? 0;
      // If paused and before start_time, seek to start_time
      if (currentTime < startTime) {
        player.current?.seekTo(startTime, true);
      }
      player.current.playVideo();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player.current) return;
    const pct = Number(e.target.value);
    // Convert percentage to absolute time, accounting for start/end trim
    const seekTime = startTime + (pct / 100) * effectiveDuration;
    player.current.seekTo(seekTime, true);
    setProgress(pct);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const bg  = dark ? "bg-slate-800/70 border-slate-700" : "bg-card border-border/30";
  const sub = dark ? "text-amber-300/70" : "text-muted-foreground";

  return (
    <div className={`rounded-2xl border p-4 mb-4 ${bg}`}>
      {/* Hidden YT iframe — placed off-screen, never visible */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}>
        <div id={divId} />
      </div>

      {/* Trim indicator */}
      {(startTime > 0 || endTime !== null) && !error && (
        <div className={`text-xs mb-2 px-2 py-1 rounded ${dark ? 'bg-amber-900/30 text-amber-300/70' : 'bg-primary/10 text-primary/70'}`}>
          📌 {fmt(startTime)} - {endTime !== null ? fmt(endTime) : 'Fin'}
        </div>
      )}

      {error ? (
        <p className={`text-xs text-center ${sub}`}>❌ Audio indisponible</p>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={toggle} disabled={loading} className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${dark ? "bg-amber-700/40 text-amber-200 hover:bg-amber-700/60" : "bg-primary/15 text-primary hover:bg-primary/25"}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Volume2 className={`w-3 h-3 ${sub}`} />
              <span className={`text-xs ${sub}`}>Récitation</span>
            </div>
            <input type="range" min={0} max={100} value={progress} onChange={seek} className="w-full h-1 accent-primary cursor-pointer" />
            <div className={`flex justify-between text-xs mt-0.5 ${sub}`}>
              <span>{fmt((progress / 100) * effectiveDuration)}</span>
              <span>{fmt(effectiveDuration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Native audio player (MP3/local) ──────────────────────────────────────────

interface AudioPlayerProps { 
  url: string; 
  dark: boolean;
  startTime?: number; // In seconds
  endTime?: number | null; // In seconds, null = use full duration
}

const AudioPlayer = ({ url, dark, startTime = 0, endTime = null }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Calculate effective duration (trimmed or full)
  const effectiveDuration = endTime !== null && endTime > startTime ? (endTime - startTime) : duration - startTime;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { 
      a.pause(); 
      setPlaying(false); 
    } else { 
      // Seek to start_time if before it
      if (a.currentTime < startTime) {
        a.currentTime = startTime;
      }
      a.play().catch((err) => { console.error('Audio play error:', err); setError(true); }); 
      setPlaying(true); 
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    // Convert percentage to absolute time, accounting for start/end trim
    const seekTime = startTime + (Number(e.target.value) / 100) * effectiveDuration;
    a.currentTime = seekTime;
    setProgress(Number(e.target.value));
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const bg  = dark ? "bg-slate-800/70 border-slate-700" : "bg-card border-border/30";
  const sub = dark ? "text-amber-300/70" : "text-muted-foreground";

  return (
    <div className={`rounded-2xl border p-4 mb-4 ${bg}`}>
      <audio
        ref={audioRef}
        src={url}
        crossOrigin="anonymous"
        onTimeUpdate={() => { 
          const a = audioRef.current;
          if (!a || !a.duration) return;
          
          // Stop at end_time if specified
          if (endTime !== null && a.currentTime >= endTime) {
            a.pause();
            a.currentTime = startTime;
            setProgress(0);
            setPlaying(false);
            return;
          }
          
          // Calculate progress relative to trimmed audio
          const adjustedCur = Math.max(0, a.currentTime - startTime);
          setProgress((adjustedCur / effectiveDuration) * 100);
        }}
        onLoadedMetadata={() => { 
          setDuration(audioRef.current?.duration ?? 0);
          setLoading(false);
          // Seek to start_time on load
          if (audioRef.current && startTime > 0) {
            audioRef.current.currentTime = startTime;
          }
        }}
        onEnded={() => setPlaying(false)}
        onError={(e) => { console.error('Audio error:', e); setError(true); setLoading(false); }}
      />
      
      {/* Trim indicator */}
      {(startTime > 0 || endTime !== null) && !error && (
        <div className={`text-xs mb-2 px-2 py-1 rounded ${dark ? 'bg-amber-900/30 text-amber-300/70' : 'bg-primary/10 text-primary/70'}`}>
          📌 {fmt(startTime)} - {endTime !== null ? fmt(endTime) : 'Fin'}
        </div>
      )}
      
      {error ? (
        <p className={`text-xs text-center ${sub}`}>❌ Audio indisponible — Lien ou format incompatible</p>
      ) : !url ? (
        <p className={`text-xs text-center ${sub}`}>📢 Pas d'audio disponible</p>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={toggle} disabled={loading} className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${dark ? "bg-amber-700/40 text-amber-200 hover:bg-amber-700/60" : "bg-primary/15 text-primary hover:bg-primary/25"}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Volume2 className={`w-3 h-3 ${sub}`} />
              <span className={`text-xs ${sub}`}>Récitation</span>
            </div>
            <input type="range" min={0} max={100} value={progress} onChange={seek} className="w-full h-1 accent-primary cursor-pointer" />
            <div className={`flex justify-between text-xs mt-0.5 ${sub}`}>
              <span>{fmt((progress / 100) * effectiveDuration)}</span>
              <span>{fmt(effectiveDuration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const fallbackCopy = (text: string, onSuccess: () => void) => {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand("copy"); onSuccess(); } catch {}
  document.body.removeChild(ta);
};

// ── Main ─────────────────────────────────────────────────────────────────────

const XassidasDetail = ({ selectedQassida, onBack, onNext, onPrevious, onNavigateToXassida }: XassidasDetailProps) => {
  const [fontSize, setFontSize]           = useState(20);
  const [darkMode, setDarkMode]           = useState(false);
  const [showTranscription, setShowTr]    = useState(false);
  const [showTranslation, setShowTl]      = useState(false);
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [copiedId, setCopiedId]           = useState<string | null>(null);
  const [selectedChapter, setChapter]     = useState<number | null>(null);
  const [verseSearch, setVerseSearch]     = useState("");
  const [showSearch, setShowSearch]       = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<Qassida[]>([]);

  const { toggleFavorite, isFavorite } = useFavorites();
  const { xassidas: allXassidas } = useXassidas();
  const favorite = isFavorite(selectedQassida.id);

  const author      = authorsData.find((a) => a.fullName === selectedQassida.author);
  const enriched    = enrichedQassidasData[selectedQassida.id];
  const { data: apiDetail, isLoading: loadingVerses } = useXassidasDetail(selectedQassida.apiId || null);
  const apiVerses: XassidaVerse[] = Array.isArray(apiDetail?.verses) ? apiDetail.verses : [];

  const hasTranscription = apiVerses.some((v) => v.transcription);
  const hasTranslation   = apiVerses.some((v) => v.translation_fr || v.translation_en);

  // Group by chapter
  const byChapter = apiVerses.reduce<Record<number, XassidaVerse[]>>((acc, v) => {
    const ch = v.chapter_number ?? 1;
    (acc[ch] ??= []).push(v);
    return acc;
  }, {});
  const chapterKeys = Object.keys(byChapter).map(Number).sort((a, b) => a - b);
  const multipleChapters = chapterKeys.length > 1;

  // Filtered flat list — always sorted by chapter then verse_number
  const filtered = apiVerses
    .filter((v) => {
      const ch = v.chapter_number ?? 1;
      if (selectedChapter !== null && ch !== selectedChapter) return false;
      if (verseSearch) {
        // Search with accent-insensitive matching
        return searchMatch(v.text_arabic, verseSearch) ||
               searchMatch(v.transcription, verseSearch) ||
               searchMatch(v.translation_fr, verseSearch);
      }
      return true;
    })
    .sort((a, b) => {
      const chA = a.chapter_number ?? 1;
      const chB = b.chapter_number ?? 1;
      if (chA !== chB) return chA - chB;
      return a.verse_number - b.verse_number;
    });

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filtered.length) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length)); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filtered.length]);

  // Reset pagination when filter/search/xassida changes (skip during chapter navigation)
  useEffect(() => {
    if (pendingScrollKey.current) return;
    setVisibleCount(PAGE_SIZE);
  }, [selectedQassida.id, selectedChapter, verseSearch]);

  // Fetch all audios for this xassida (new multi-reciter system)
  const { data: xassidaAudios = [] } = useQuery<XassidaAudio[]>({
    queryKey: ['xassida-audios', selectedQassida.apiId],
    queryFn: async () => {
      if (!selectedQassida.apiId) return [];
      const res = await fetch(`${XASSIDA_API_URL}/xassidas/${selectedQassida.apiId}/audios`);
      if (!res.ok) return [];
      const audios = await res.json() as XassidaAudio[];
      // Enrich audios: extract YouTube ID from audio_url if youtube_id is null
      return audios.map(audio => ({
        ...audio,
        youtube_id: audio.youtube_id || extractYouTubeId(audio.audio_url) || null
      }));
    },
    enabled: !!selectedQassida.apiId,
    staleTime: 60_000,
  });

  // Pre-cache YouTube URLs when audios are loaded
  useEffect(() => {
    if (xassidaAudios.length > 0 && 'serviceWorker' in navigator) {
      const youtubeUrls = xassidaAudios
        .filter(a => a.youtube_id)
        .map(a => `https://www.youtube.com/watch?v=${a.youtube_id}`);
      
      if (youtubeUrls.length > 0) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_URLS',
          urls: youtubeUrls
        });
        console.log(`[Offline] Pre-caching ${youtubeUrls.length} YouTube URLs`);
      }
    }
  }, [xassidaAudios]);

  // Reset selected reciter when xassida or chapter changes
  useEffect(() => {
    setSelectedAudioId(null);
  }, [selectedQassida.id, selectedChapter]);

  // Audios relevant to the current chapter:
  //   1. chapter-specific audios for selectedChapter
  //   2. fallback: global audios (chapter_number === null)
  const relevantAudios = useMemo(() => {
    const chapterSpecific = xassidaAudios.filter(a => a.chapter_number === selectedChapter);
    if (chapterSpecific.length > 0) return chapterSpecific;
    return xassidaAudios.filter(a => a.chapter_number === null);
  }, [xassidaAudios, selectedChapter]);

  // Currently playing audio (selected by user or auto first)
  const activeAudio = relevantAudios.find(a => a.id === selectedAudioId) ?? relevantAudios[0] ?? null;

  // Legacy fallback: old youtube_id / audio_url on the xassida itself
  const legacyAudio = useMemo(() => {
    if (xassidaAudios.length > 0) return null;
    if (apiDetail?.youtube_id) return { youtube_id: apiDetail.youtube_id, audio_url: null };
    if (apiDetail?.audio_url)  return { youtube_id: null, audio_url: apiDetail.audio_url };
    if (selectedQassida.audioUrl) return { youtube_id: null, audio_url: selectedQassida.audioUrl };
    return null;
  }, [xassidaAudios, apiDetail, selectedQassida.audioUrl]);

  // Copy verse — fallback for mobile / non-HTTPS
  const copyVerse = useCallback((verse: XassidaVerse) => {
    const lines: string[] = [verse.text_arabic];
    if (showTranscription && verse.transcription) lines.push(verse.transcription);
    if (showTranslation && (verse.translation_fr || verse.translation_en))
      lines.push(verse.translation_fr || verse.translation_en || "");
    const text = lines.join("\n");
    const key = verse.id || `${verse.chapter_number}-${verse.verse_number}`;
    const succeed = () => { setCopiedId(key); setTimeout(() => setCopiedId(null), 2000); };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(succeed).catch(() => fallbackCopy(text, succeed));
    } else {
      fallbackCopy(text, succeed);
    }
  }, [showTranscription, showTranslation]);

  // Verse refs for scrolling to search results
  const verseRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingScrollKey = useRef<string | null>(null);

  // Scroll to verse and highlight it (same-chapter, verse already rendered)
  const scrollToVerse = useCallback((verse: XassidaVerse) => {
    const key = verse.id || `${verse.chapter_number}-${verse.verse_number}`;
    const ref = verseRefsMap.current.get(key);
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
      ref.classList.add("ring-2", "ring-primary", "rounded-2xl");
      setTimeout(() => ref.classList.remove("ring-2", "ring-primary", "rounded-2xl"), 2000);
    }
  }, []);

  // Navigate to a verse's chapter then scroll to it (cross-chapter navigation)
  const navigateToChapterAndVerse = useCallback((verse: XassidaVerse) => {
    const key = verse.id || `${verse.chapter_number}-${verse.verse_number}`;
    const ch = verse.chapter_number ?? 1;
    const chapterSize = byChapter[ch]?.length ?? apiVerses.length;
    pendingScrollKey.current = key;
    // Show all verses of the target chapter so the target is guaranteed visible
    setVisibleCount(Math.max(chapterSize + PAGE_SIZE, PAGE_SIZE));
    setChapter(ch);
    setVerseSearch("");
    setShowSearch(false);
  }, [byChapter, apiVerses.length]);

  // After chapter navigation re-render, scroll to pending verse
  useEffect(() => {
    if (!pendingScrollKey.current) return;
    const key = pendingScrollKey.current;
    requestAnimationFrame(() => {
      const ref = verseRefsMap.current.get(key);
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" });
        ref.classList.add("ring-2", "ring-primary", "rounded-2xl");
        setTimeout(() => ref.classList.remove("ring-2", "ring-primary", "rounded-2xl"), 2000);
        pendingScrollKey.current = null;
      }
    });
  }, [selectedChapter, visibleCount]);

  // Search in other xassidas when local search returns no results
  useEffect(() => {
    if (!verseSearch || filtered.length > 0 || !allXassidas) {
      setGlobalSearchResults([]);
      return;
    }

    // Search for matching xassidas in other records
    const matchingXassidas = allXassidas.filter(
      (xassida) => 
        xassida.id !== selectedQassida.id && (
          searchMatch(xassida.title, verseSearch) ||
          searchMatch(xassida.author, verseSearch)
        )
    );
    
    setGlobalSearchResults(matchingXassidas);
  }, [verseSearch, filtered.length, selectedQassida.id, allXassidas]);

  const visibleVerses = filtered.slice(0, visibleCount);

  // Theme tokens
  const d = darkMode;
  const bg        = d ? "bg-slate-900"                    : "bg-background";
  const card      = d ? "bg-slate-800/60 border-slate-700" : "bg-card border-border/30";
  const header    = d ? "from-amber-950 via-orange-950 to-amber-900" : "from-secondary via-secondary to-secondary/80";
  const headSub   = d ? "text-amber-200/70"               : "text-white/75";
  const headMut   = d ? "text-amber-200/50"               : "text-white/55";
  const ctrl      = d ? "bg-slate-800/80 border-slate-700" : "bg-muted/60 border-border/20";
  const ctrlBtn   = d ? "text-amber-300 hover:bg-slate-700" : "text-muted-foreground hover:bg-muted";
  const active    = d ? "bg-amber-700/40 text-amber-200"  : "bg-primary/15 text-primary";
  const arabicTxt = d ? "text-amber-50"                   : "text-foreground";
  const translit  = d ? "text-amber-400/80"               : "text-secondary/80";
  const trFr      = d ? "text-amber-200/70"               : "text-muted-foreground";
  const badge     = d ? "bg-amber-900/50 text-amber-300"  : "bg-primary/10 text-primary";
  const chSep     = d ? "text-amber-500/60"               : "text-muted-foreground/60";
  const searchBg  = d ? "bg-slate-800 border-slate-600 text-amber-50 placeholder:text-amber-300/40" : "bg-background border-border text-foreground placeholder:text-muted-foreground/60";
  const chPill    = (active: boolean) => active
    ? (d ? "bg-amber-700/50 text-amber-100" : "bg-primary text-primary-foreground")
    : (d ? "text-amber-300/70 hover:bg-slate-700/60" : "text-muted-foreground hover:bg-muted");

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
            <p className="text-3xl font-arabic text-white mb-2 leading-relaxed">{selectedQassida.arabic}</p>
          )}
          <h1 className="text-xl font-bold text-white">{selectedQassida.title}</h1>
          {author && <p className={`text-sm ${headSub} mt-1`}>{author.fullName} · {author.confraternity}</p>}
          {apiVerses.length > 0 && (
            <p className={`text-xs ${headMut} mt-1`}>
              {filtered.length !== apiVerses.length
                ? `${filtered.length} / ${apiVerses.length} vers`
                : `${apiVerses.length} vers`}
              {multipleChapters && ` · ${chapterKeys.length} chapitres`}
            </p>
          )}
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

        {/* ── Audio section ─────────────────────────────────── */}
        {(relevantAudios.length > 0 || legacyAudio) && (
          <div className="mb-4">
            {/* Reciter selector — only shown when multiple options */}
            {relevantAudios.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                {relevantAudios.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAudioId(a.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeAudio?.id === a.id
                        ? d ? 'bg-amber-600 text-white' : 'bg-primary text-primary-foreground'
                        : d ? 'bg-slate-700 text-amber-200/70' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {a.reciter_name}{a.label ? ` · ${a.label}` : ''}
                  </button>
                ))}
              </div>
            )}

            {/* Chapter-specific audio badge */}
            {activeAudio && activeAudio.chapter_number !== null && (
              <p className={`text-xs mb-1.5 font-medium ${d ? 'text-amber-300/60' : 'text-muted-foreground'}`}>
                Ch. {activeAudio.chapter_number} · {activeAudio.reciter_name}
              </p>
            )}
            {activeAudio && activeAudio.chapter_number === null && relevantAudios.length === 1 && (
              <p className={`text-xs mb-1.5 ${d ? 'text-amber-300/60' : 'text-muted-foreground'}`}>
                {activeAudio.reciter_name}
              </p>
            )}

            {/* Player */}
            {activeAudio?.youtube_id ? (
              <YouTubeAudioPlayer 
                key={activeAudio.id} 
                videoId={activeAudio.youtube_id} 
                dark={d}
                startTime={activeAudio.start_time ?? 0}
                endTime={activeAudio.end_time ?? null}
              />
            ) : activeAudio?.audio_url ? (
              <AudioPlayer 
                key={activeAudio.id} 
                url={activeAudio.audio_url} 
                dark={d}
                startTime={activeAudio.start_time ?? 0}
                endTime={activeAudio.end_time ?? null}
              />
            ) : legacyAudio?.youtube_id ? (
              <YouTubeAudioPlayer 
                key="legacy-yt" 
                videoId={legacyAudio.youtube_id} 
                dark={d}
                startTime={legacyAudio.start_time ?? 0}
                endTime={legacyAudio.end_time ?? null}
              />
            ) : legacyAudio?.audio_url ? (
              <AudioPlayer 
                key="legacy-mp3" 
                url={legacyAudio.audio_url} 
                dark={d}
                startTime={legacyAudio.start_time ?? 0}
                endTime={legacyAudio.end_time ?? null}
              />
            ) : null}
          </div>
        )}

        {/* Reading controls */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 flex-wrap ${ctrl}`}>
          <div className="flex items-center gap-1">
            <button onClick={() => setFontSize((f) => Math.max(14, f - 2))} className={`w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center ${ctrlBtn}`}>A‑</button>
            <span className={`text-xs w-6 text-center tabular-nums ${ctrlBtn}`}>{fontSize}</span>
            <button onClick={() => setFontSize((f) => Math.min(32, f + 2))} className={`w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center ${ctrlBtn}`}>A+</button>
          </div>
          <div className="w-px h-5 bg-border/40 mx-1" />
          {hasTranscription && (
            <button onClick={() => setShowTr((s) => !s)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${showTranscription ? active : ctrlBtn}`}>
              <AlignLeft className="w-3.5 h-3.5" /> Translitération
            </button>
          )}
          <button onClick={() => setShowTl((s) => !s)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${showTranslation ? active : ctrlBtn}`}>
            <Languages className="w-3.5 h-3.5" /> Traduction
          </button>
          {apiVerses.length > 0 && (
            <button onClick={() => { setShowSearch((s) => !s); if (showSearch) setVerseSearch(""); }} className={`ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${showSearch ? active : ctrlBtn}`}>
              {showSearch ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Verse search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${d ? "text-amber-300/50" : "text-muted-foreground/60"}`} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Rechercher dans les vers…"
                  value={verseSearch}
                  onChange={(e) => setVerseSearch(e.target.value)}
                  className={`w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${searchBg}`}
                />
                {verseSearch && (
                  <button onClick={() => setVerseSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className={`w-4 h-4 ${d ? "text-amber-300/50" : "text-muted-foreground/60"}`} />
                  </button>
                )}
              </div>
              {/* Search results dropdown */}
              {verseSearch && (filtered.length > 0 || globalSearchResults.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 rounded-xl border overflow-hidden max-h-80 overflow-y-auto ${ctrl}`}
                >
                  {/* Local results */}
                  {filtered.length > 0 && (
                    <>
                      {filtered.slice(0, 8).map((verse, idx) => (
                        <button
                          key={`${verse.chapter_number}-${verse.verse_number}-${idx}`}
                          onClick={() => navigateToChapterAndVerse(verse)}
                          className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-primary/10 active:bg-primary/20`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`text-xs font-bold flex-shrink-0 mt-0.5 ${badge}`}>
                              {verse.verse_number}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold mb-1 ${d ? "text-amber-300/60" : "text-muted-foreground/60"}`}>
                                Chapitre {verse.chapter_number ?? 1} · Vers {verse.verse_number}
                              </p>
                              <p className={`text-sm leading-snug ${arabicTxt}`} dir="rtl" style={{ fontSize: `${Math.min(16, fontSize)}px` }}>
                                {verse.text_arabic.substring(0, 60)}{verse.text_arabic.length > 60 ? "…" : ""}
                              </p>
                              {verse.transcription && (
                                <p className={`text-xs italic mt-1 line-clamp-1 ${translit}`}>
                                  {verse.transcription.substring(0, 50)}{verse.transcription.length > 50 ? "…" : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      {filtered.length > 8 && (
                        <div className={`px-4 py-2 text-xs text-center border-b ${d ? "text-amber-300/60" : "text-muted-foreground"}`}>
                          +{filtered.length - 8} résultat{filtered.length - 8 > 1 ? "s" : ""}
                        </div>
                      )}
                    </>
                  )}

                  {/* Global results from other xassidas */}
                  {globalSearchResults.length > 0 && (
                    <>
                      {filtered.length > 0 && <div className="h-px bg-border/30" />}
                      <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${d ? "text-amber-300/70 bg-amber-900/20" : "text-primary/70 bg-primary/5"}`}>
                        📚 Autres xassidas
                      </div>
                      {globalSearchResults.slice(0, 5).map((qassida) => (
                        <button
                          key={qassida.id}
                          onClick={() => {
                            if (onNavigateToXassida) {
                              onNavigateToXassida(qassida);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-primary/10 active:bg-primary/20`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`text-xs font-bold flex-shrink-0 mt-0.5 rounded-full w-6 h-6 flex items-center justify-center ${d ? "bg-amber-700/40 text-amber-300" : "bg-primary/10 text-primary"}`}>
                              📖
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-semibold ${arabicTxt}`}>
                                {qassida.title}
                              </p>
                              <p className={`text-xs mt-1 ${translit}`}>
                                {qassida.author}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                      {globalSearchResults.length > 5 && (
                        <div className={`px-4 py-2 text-xs text-center ${d ? "text-amber-300/60" : "text-muted-foreground"}`}>
                          +{globalSearchResults.length - 5} xassida{globalSearchResults.length - 5 > 1 ? "s" : ""}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
              
              {verseSearch && (
                <p className={`text-xs mt-1.5 px-1 ${d ? "text-amber-300/50" : "text-muted-foreground/60"}`}>
                  {filtered.length > 0 ? `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""}` : 
                   globalSearchResults.length > 0 ? `Pas trouvé ici • ${globalSearchResults.length} autre${globalSearchResults.length > 1 ? "s" : ""} xassida${globalSearchResults.length > 1 ? "s" : ""}` :
                   "Aucun résultat"}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chapter filter tabs */}
        {multipleChapters && !verseSearch && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
            <button
              onClick={() => setChapter(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${chPill(selectedChapter === null)}`}
            >
              Tous ({apiVerses.length})
            </button>
            {chapterKeys.map((ch) => (
              <button
                key={ch}
                onClick={() => setChapter(selectedChapter === ch ? null : ch)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${chPill(selectedChapter === ch)}`}
              >
                Chap. {ch} ({byChapter[ch].length})
              </button>
            ))}
          </div>
        )}

        {/* Verses */}
        {loadingVerses ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>

        ) : apiVerses.length > 0 ? (
          <>
            {filtered.length === 0 ? (
              <div className={`text-center py-12 text-sm ${d ? "text-amber-300/50" : "text-muted-foreground/60"}`}>
                Aucun verset ne correspond à la recherche.
              </div>
            ) : (
              visibleVerses.map((verse, vi) => {
                const ch = verse.chapter_number ?? 1;
                const key = verse.id || `${ch}-${verse.verse_number}`;
                const isCopied = copiedId === key;
                const prevVerse = visibleVerses[vi - 1];
                const prevCh = prevVerse ? (prevVerse.chapter_number ?? 1) : null;
                const showChapterHead = multipleChapters && !verseSearch && selectedChapter === null && ch !== prevCh;

                return (
                  <div key={key}>
                    {showChapterHead && (
                      <div className="flex items-center gap-3 mb-3 mt-5">
                        <div className="flex-1 h-px bg-border/30" />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${chSep}`}>Chapitre {ch}</span>
                        <div className="flex-1 h-px bg-border/30" />
                      </div>
                    )}
                    <motion.div
                      ref={(el) => {
                        if (el) verseRefsMap.current.set(key, el);
                      }}
                      className={`rounded-2xl border p-4 mb-3 transition-colors ${card}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(vi, 8) * 0.02 }}
                    >
                      {/* Header row: number + copy */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => copyVerse(verse)}
                          title="Copier le verset"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                            isCopied
                              ? (d ? "bg-green-800/40 text-green-300" : "bg-green-500/15 text-green-600")
                              : ctrlBtn
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? "Copié !" : "Copier"}</span>
                        </button>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${badge}`}>
                          {verse.verse_number}
                        </span>
                      </div>

                      {/* Arabic */}
                      <p className={`text-right font-arabic leading-loose ${arabicTxt}`} style={{ fontSize: `${fontSize}px` }} dir="rtl">
                        {verse.text_arabic.includes('|')
                          ? verse.text_arabic.split('|').map((part, i, arr) => (
                              <span key={i}>
                                {part.trim()}
                                {i < arr.length - 1 && (
                                  <span
                                    className="inline-block mx-3 text-primary font-bold select-none align-middle"
                                    style={{ fontSize: `${Math.round(fontSize * 0.7)}px` }}
                                    aria-hidden
                                  >
                                    ◆
                                  </span>
                                )}
                              </span>
                            ))
                          : verse.text_arabic}
                      </p>

                      {/* Transliteration */}
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

                      {/* Translation */}
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
              })
            )}

            {/* Infinite scroll sentinel */}
            {visibleCount < filtered.length && (
              <div ref={sentinelRef} className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
              </div>
            )}
            {!verseSearch && visibleCount >= filtered.length && filtered.length > PAGE_SIZE && (
              <p className={`text-center text-xs py-4 ${d ? "text-amber-300/40" : "text-muted-foreground/40"}`}>
                Fin · {filtered.length} vers
              </p>
            )}
          </>

        ) : enriched?.fullText ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border overflow-hidden ${card}`}>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <p className={`leading-loose font-arabic text-right whitespace-pre-wrap break-words ${arabicTxt}`} style={{ fontSize: `${fontSize}px` }}>
                {enriched.fullText}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className={`text-sm ${d ? "text-amber-300/50" : "text-muted-foreground/60"}`}>Aucun verset disponible.</p>
          </div>
        )}

        {/* Prev / Next */}
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
