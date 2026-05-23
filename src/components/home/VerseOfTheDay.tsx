import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Share2, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { VerseOfTheDay as VerseOfTheDayType } from "@/hooks/useVerseOfTheDay";

interface VerseOfTheDayProps {
  verse: VerseOfTheDayType | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (screen: string, surahId?: number, verseNumber?: number) => void;
  itemVariants: any;
  error?: string | null;
}

const VerseOfTheDay = ({ verse, loading, onRefresh, onNavigate, itemVariants, error }: VerseOfTheDayProps) => {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCapture = async () => {
    if (!shareCardRef.current || capturing) return;
    setCapturing(true);
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");

      if (navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "vers-du-jour.png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Vers du Jour — Malikina" });
            return;
          }
        } catch {
          // fallback
        }
      }

      const link = document.createElement("a");
      link.download = "vers-du-jour.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Capture error:", err);
    } finally {
      setCapturing(false);
    }
  };

  const handleCopy = async () => {
    if (!verse) return;

    const textToCopy = `${verse.text_arabic}\n\n${verse.transcription || ""}\n\n${verse.translation_fr || ""}\n\n— ${verse.xassidaTitle} (Vers ${verse.verse_number}) —`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  if (loading) {
    return (
      <motion.section variants={itemVariants}>
        <div className="rounded-2xl p-6">
          <LoadingSpinner size="md" />
        </div>
      </motion.section>
    );
  }

  if (!verse || error) {
    return null;
  }

  const truncateTitle = (title: string, maxLength: number = 25) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  return (
    <>
      <div
        ref={shareCardRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "420px",
          padding: "0",
          background: "linear-gradient(160deg, #f2ede3 0%, #dceee5 100%)",
          borderRadius: "28px",
          fontFamily: "'Open Sans', system-ui, sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 5, background: "linear-gradient(90deg, #b5832a 0%, #d4a843 50%, #b5832a 100%)" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <img src="/icons/icon-192.png" alt="Malikina" crossOrigin="anonymous" style={{ width: 48, height: 48, borderRadius: 14 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#1a4a2e", lineHeight: 1.2 }}>Malikina</div>
              <div style={{ fontSize: 11, color: "#b5832a", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Vers du Jour</div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <span style={{ display: "inline-block", fontSize: 11, color: "#2d6a4f", background: "rgba(45,106,79,0.08)", border: "1px solid rgba(45,106,79,0.15)", padding: "5px 16px", borderRadius: 20, fontWeight: 600 }}>
              {truncateTitle(verse.xassidaTitle)} · Vers {verse.verse_number}
            </span>
          </div>
          <div style={{ marginBottom: 16, textAlign: "right", direction: "rtl" }}>
            <p style={{ fontSize: 32, lineHeight: 2, color: "#1a4a2e", fontFamily: "'Amiri', serif", margin: 0 }}>{verse.text_arabic}</p>
          </div>
          {verse.transcription && (
            <p style={{ fontSize: 12, color: "#6b8e7a", textAlign: "center", fontStyle: "italic", marginBottom: 14, lineHeight: 1.6 }}>{verse.transcription}</p>
          )}
          {verse.translation_fr && (
            <div style={{ background: "rgba(181,131,42,0.06)", borderLeft: "3px solid #b5832a", borderRadius: "0 8px 8px 0", padding: "10px 14px", marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: "#374151", fontStyle: "italic", lineHeight: 1.7, margin: 0 }}>&ldquo;{verse.translation_fr}&rdquo;</p>
            </div>
          )}
          <div style={{ borderTop: "1px solid rgba(45,106,79,0.12)", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#aab8b0", letterSpacing: "0.03em" }}>malikina.app</span>
            <span style={{ fontSize: 10, color: "#b5832a", fontWeight: 600, letterSpacing: "0.03em" }}>Al Moutahabbina Fillahi</span>
          </div>
        </div>
      </div>

      <motion.section variants={itemVariants}>
        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-5 shadow-card border border-secondary/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm truncate max-w-[200px]">
                {truncateTitle(verse.xassidaTitle)}
              </h3>
              <p className="text-xs text-muted-foreground">Vers {verse.verse_number}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <motion.button
                  onClick={handleCopy}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </motion.button>
                <AnimatePresence>
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: -5 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Copié</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={handleCapture}
                disabled={capturing}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-right text-lg font-arabic leading-loose">
              {verse.text_arabic}
            </p>
          </div>

          {verse.transcription && (
            <p className="text-xs text-muted-foreground text-center mb-3 italic">
              {verse.transcription}
            </p>
          )}

          <div className="mb-4">
            <p className="text-sm text-foreground leading-relaxed">
              “{verse.translation_fr || "Traduction non disponible"}”
            </p>
          </div>

          <motion.button
            onClick={() => onNavigate("qassidas")}
            className="w-full bg-primary/10 text-primary py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Lire {truncateTitle(verse.xassidaTitle, 20)}</span>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </motion.button>
        </div>
      </motion.section>
    </>
  );
};

export default VerseOfTheDay;