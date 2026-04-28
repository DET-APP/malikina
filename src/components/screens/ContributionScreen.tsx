import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Copy, Check, Heart } from "lucide-react";

interface ContributionScreenProps {
  onBack: () => void;
}

const WAVE_NUMBER = import.meta.env.VITE_WAVE_NUMBER ?? "";
const ORANGE_NUMBER = import.meta.env.VITE_ORANGE_NUMBER ?? "";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text.replace(/\s/g, "")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-medium transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copié !" : "Copier"}
    </button>
  );
};

const ContributionScreen = ({ onBack }: ContributionScreenProps) => {
  return (
    <motion.div
      className="min-h-screen bg-background pb-24"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary to-gold-light px-4 pt-12 pb-16 relative">
        <button onClick={onBack} className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-center text-xl font-bold text-white mt-1">Contribuer</h1>
        <p className="text-center text-sm text-white/80 mt-1">Soutenir le projet</p>
      </div>

      {/* Intro card */}
      <div className="mx-4 -mt-10 bg-card rounded-2xl shadow-card p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center flex-shrink-0">
          <Heart className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h2 className="font-bold text-foreground text-base">Soutenez notre mission</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Votre contribution aide à maintenir et enrichir l'application — nouveaux contenus, audios, traductions.
          </p>
        </div>
      </div>

      {/* Wave */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1B6BF5, #0A4FC4)" }}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <span className="text-[#1B6BF5] font-black text-lg">W</span>
            </div>
            <div>
              <p className="font-bold text-white text-base">Wave</p>
              <p className="text-xs text-white/70">Transfert instantané</p>
            </div>
          </div>
          <p className="text-xs text-white/70 mb-1">Numéro Wave :</p>
          <div className="flex items-center justify-between bg-white/15 rounded-xl px-4 py-3">
            <span className="text-white font-bold text-lg tracking-widest">{WAVE_NUMBER}</span>
            <CopyButton text={WAVE_NUMBER} />
          </div>
          <p className="text-xs text-white/60 mt-3 leading-relaxed">
            Ouvrez Wave → Envoyer → entrez le numéro → choisissez le montant → confirmez.
          </p>
        </div>
      </div>

      {/* Orange Money */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #FF6B00, #E05500)" }}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <span className="text-[#FF6B00] font-black text-lg">O</span>
            </div>
            <div>
              <p className="font-bold text-white text-base">Orange Money</p>
              <p className="text-xs text-white/70">Transfert Mobile Money</p>
            </div>
          </div>
          <p className="text-xs text-white/70 mb-1">Numéro Orange Money :</p>
          <div className="flex items-center justify-between bg-white/15 rounded-xl px-4 py-3">
            <span className="text-white font-bold text-lg tracking-widest">{ORANGE_NUMBER}</span>
            <CopyButton text={ORANGE_NUMBER} />
          </div>
          <p className="text-xs text-white/60 mt-3 leading-relaxed">
            Composez #144# → Transfert d'argent → entrez le numéro et le montant.
          </p>
        </div>
      </div>

      {/* Baraka */}
      <div className="mx-4 mt-4 bg-card rounded-2xl p-5 border border-border text-center">
        <p className="text-2xl font-arabic text-secondary">جَزَاكُمُ اللَّهُ خَيْرًا</p>
        <p className="text-sm text-muted-foreground mt-2">Que Allah vous récompense du bien</p>
        <p className="text-xs text-muted-foreground mt-1">Toute contribution, grande ou petite, est bénie.</p>
      </div>
    </motion.div>
  );
};

export default ContributionScreen;
