import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { VerseOfTheDay as VerseOfTheDayType } from "@/hooks/useVerseOfTheDay";

interface VerseOfTheDayProps {
  verse: VerseOfTheDayType | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (screen: string, surahId?: number, verseNumber?: number) => void;
  itemVariants: any;
}


const VerseOfTheDay = ({ verse, loading, onNavigate, itemVariants }: VerseOfTheDayProps) => {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

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

      // Web Share API (mobile natif)
      if (navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "vers-du-jour.png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Vers du Jour — Malikina" });
            return;
          }
        } catch {
          // fallback download
        }
      }

      // Fallback : téléchargement
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

  if (loading) {
    return (
      <motion.section variants={itemVariants}>
        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-6 shadow-card border border-secondary/20">
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner message="Chargement du vers..." />
          </div>
        </div>
      </motion.section>
    );
  }

  if (!verse) {
    return (
      <motion.section variants={itemVariants}>
        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-6 shadow-card border border-secondary/20">
          <p className="text-center text-muted-foreground">Impossible de charger le vers du jour</p>
        </div>
      </motion.section>
    );
  }

  return (
    <>
      {/* Carte cachée pour la capture — rendue hors écran */}
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
        {/* Bande dorée en haut */}
        <div style={{
          height: 5,
          background: "linear-gradient(90deg, #b5832a 0%, #d4a843 50%, #b5832a 100%)",
        }} />

        <div style={{ padding: "28px 28px 24px" }}>
          {/* En-tête : logo + titre */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <img
              src="/icons/icon-192.png"
              alt="Malikina"
              crossOrigin="anonymous"
              style={{ width: 48, height: 48, borderRadius: 14 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#1a4a2e", lineHeight: 1.2 }}>Malikina</div>
              <div style={{ fontSize: 11, color: "#b5832a", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Vers du Jour</div>
            </div>
            {/* Ornement décoratif islamique */}
            <div style={{
              marginLeft: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}>
              <span style={{ color: "#b5832a", fontSize: 18, lineHeight: 1 }}>✦</span>
              <span style={{ color: "#d4a843", fontSize: 10, lineHeight: 1 }}>✦</span>
              <span style={{ color: "#b5832a", fontSize: 18, lineHeight: 1 }}>✦</span>
            </div>
          </div>

          {/* Séparateur décoratif */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "18px" }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(181,131,42,0.4))" }} />
            <span style={{ color: "#b5832a", fontSize: 14 }}>❧</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(181,131,42,0.4), transparent)" }} />
          </div>

          {/* Badge : numéro du vers */}
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <span style={{
              display: "inline-block",
              fontSize: 11,
              color: "#2d6a4f",
              background: "rgba(45,106,79,0.08)",
              border: "1px solid rgba(45,106,79,0.15)",
              padding: "5px 16px",
              borderRadius: 20,
              fontWeight: 600,
              letterSpacing: "0.02em",
              maxWidth: "100%",
              whiteSpace: "normal",
              wordBreak: "break-word",
              lineHeight: 1.6,
            }}>
              {verse.verse_number > 0 ? `Vers ${verse.verse_number}` : ""}
              {verse.chapter_number > 1 ? ` · Chapitre ${verse.chapter_number}` : ""}
              {" — Khilâss Zahab"}
            </span>
          </div>

          {/* Texte arabe */}
          <div style={{
            background: "rgba(255,255,255,0.7)",
            borderRadius: 18,
            padding: "22px 18px",
            marginBottom: 16,
            border: "1px solid rgba(45,106,79,0.1)",
            textAlign: "right",
            direction: "rtl",
          }}>
            <p style={{
              fontSize: 32,
              lineHeight: 2,
              color: "#1a4a2e",
              fontFamily: "'Amiri', serif",
              margin: 0,
            }}>
              {verse.text_arabic}
            </p>
          </div>

          {/* Translittération */}
          {verse.transcription && (
            <p style={{
              fontSize: 12,
              color: "#6b8e7a",
              textAlign: "center",
              fontStyle: "italic",
              marginBottom: 14,
              lineHeight: 1.6,
            }}>
              {verse.transcription}
            </p>
          )}

          {/* Traduction française */}
          {verse.translation_fr && (
            <div style={{
              background: "rgba(181,131,42,0.06)",
              borderLeft: "3px solid #b5832a",
              borderRadius: "0 8px 8px 0",
              padding: "10px 14px",
              marginBottom: 24,
            }}>
              <p style={{
                fontSize: 13,
                color: "#374151",
                fontStyle: "italic",
                lineHeight: 1.7,
                margin: 0,
              }}>
                &ldquo;{verse.translation_fr}&rdquo;
              </p>
            </div>
          )}

          {/* Pied de page */}
          <div style={{
            borderTop: "1px solid rgba(45,106,79,0.12)",
            paddingTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 10, color: "#aab8b0", letterSpacing: "0.03em" }}>malikina.app</span>
            <span style={{ fontSize: 10, color: "#b5832a", fontWeight: 600, letterSpacing: "0.03em" }}>Al Moutahabbina Fillahi</span>
          </div>
        </div>
      </div>

      {/* Carte visible */}
      <motion.section variants={itemVariants}>
        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-6 shadow-card border border-secondary/20">

          {/* En-tête */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Vers du Jour</h3>
                <p className="text-xs text-muted-foreground">Khilâss Zahab</p>
              </div>
            </div>

            {/* Bouton capture */}
            <motion.button
              onClick={handleCapture}
              disabled={capturing}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-secondary/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Partager ce vers"
            >
              {capturing ? (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Share2 className="w-4 h-4 text-secondary" />
                </motion.div>
              ) : (
                <Share2 className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.button>
          </div>

          {/* Numéro du vers */}
          <div className="text-center mb-4">
            <p className="text-xs text-muted-foreground">
              Vers {verse.verse_number}
              {verse.chapter_number > 1 ? ` · Chapitre ${verse.chapter_number}` : ""}
            </p>
          </div>

          {/* Texte arabe */}
          <div className="bg-card/50 rounded-xl p-4 mb-3 border border-border">
            <p className="text-right text-xl font-arabic leading-loose">{verse.text_arabic}</p>
          </div>

          {/* Translittération */}
          {verse.transcription && (
            <p className="text-sm text-muted-foreground text-center mb-3 italic">{verse.transcription}</p>
          )}

          {/* Traduction française */}
          {verse.translation_fr && (
            <div className="mb-4">
              <p className="text-sm text-foreground italic">&ldquo;{verse.translation_fr}&rdquo;</p>
            </div>
          )}

          {/* Bouton naviguer */}
          <motion.button
            onClick={() => onNavigate("qassidas")}
            className="w-full bg-primary/10 text-primary py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BookOpen className="w-4 h-4" />
            Lire Khilâss Zahab
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.section>
    </>
  );
};

export default VerseOfTheDay;
