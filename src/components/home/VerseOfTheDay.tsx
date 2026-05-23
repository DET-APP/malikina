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
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const handleShare = async () => {
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
            await navigator.share({ files: [file], title: "Vers du Jour — Univers Maodo Malick Sy" });
            return;
          }
        } catch {
          // Fallback to download
        }
      }

      const link = document.createElement("a");
      link.download = "vers-du-jour.png";
      link.href = dataUrl;
      link.click();

      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 1500);
    } catch {
      // Silent fail
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
    } catch {
      // Silent fail
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
          width: "400px",
          padding: "20px",
          background: "white",
          borderRadius: "16px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
          <img src="/icons/icon-192.png" alt="Univers Maodo Malick Sy" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div>
            <div style={{ fontWeight: "bold", fontSize: "16px", color: "#1f2937" }}>Univers Maodo Malick Sy</div>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>Vers du Jour</div>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "center", marginBottom: "12px" }}>
            {truncateTitle(verse.xassidaTitle)} · Vers {verse.verse_number}
          </div>

          <div style={{ background: "#f3f4f6", borderRadius: "12px", padding: "16px", marginBottom: "12px", textAlign: "right" }}>
            <p style={{ fontSize: "24px", lineHeight: "1.6", fontFamily: "'Amiri', serif", margin: 0 }}>
              {verse.text_arabic}
            </p>
          </div>

          {verse.transcription && (
            <p style={{ fontSize: "11px", color: "#6b7280", textAlign: "center", fontStyle: "italic", marginBottom: "12px" }}>
              {verse.transcription}
            </p>
          )}

          {verse.translation_fr && (
            <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "12px" }}>
              <p style={{ fontSize: "12px", color: "#166534", lineHeight: "1.5", margin: 0 }}>
                “{verse.translation_fr}”
              </p>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px", fontSize: "10px", color: "#9ca3af", textAlign: "center" }}>
          Univers Maodo Malick Sy
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
              {/* Bouton Copier */}
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
                      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded-full whitespace-nowrap z-10"
                    >
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Copié</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bouton Partager - même design que Copier */}
              {/* Bouton Partager - tooltip décalé vers la gauche */}
              <div className="relative">
                <motion.button
                  onClick={handleShare}
                  disabled={capturing}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </motion.button>
                <AnimatePresence>
                  {showShareTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: -5 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="absolute -top-8 -left-6 bg-primary text-white text-xs px-2 py-1 rounded-full whitespace-nowrap z-10"
                    >
                      <div className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        <span>Partagé</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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