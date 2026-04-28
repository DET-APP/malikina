import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import logo from "@/assets/logo.png";

interface AboutScreenProps {
  onBack: () => void;
}

const AboutScreen = ({ onBack }: AboutScreenProps) => {
  return (
    <motion.div
      className="min-h-screen bg-background pb-24"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-green-dark px-4 pt-12 pb-16 relative">
        <button onClick={onBack} className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-center text-xl font-bold text-white mt-1">Qui sommes-nous ?</h1>
      </div>

      {/* Logo card */}
      <div className="mx-4 -mt-10 bg-card rounded-2xl shadow-card p-6 flex flex-col items-center gap-3">
        <img src={logo} alt="Logo Univers Maodo Malick Sy" className="w-28 h-28 object-contain" />
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">Univers Maodo Malick Sy</h2>
          <p className="text-sm text-muted-foreground">Keeparu Maodo Malick Sy</p>
          <p className="text-xl font-arabic text-secondary mt-1">الْمُتَحَابِّينَ فِي اللَّهِ</p>
          <p className="text-sm text-muted-foreground mt-0.5">Al Moutahabbina Fillahi</p>
        </div>
      </div>

      {/* Devise */}
      <div className="mx-4 mt-4 bg-primary rounded-2xl p-5">
        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Notre Devise</p>
        <p className="font-arabic text-xl text-white text-right leading-relaxed mb-2 dir-rtl">
          ألاَ ياَ بَنِي هَذَا الزَّمَانُ دَعَوْتُكُمْ
        </p>
        <p className="font-arabic text-xl text-white text-right leading-relaxed dir-rtl">
          لِإحْيَاءِ دِينٍ بِالعُلُومِ أَجِيبُوا
        </p>
        <p className="text-sm text-white/70 italic mt-3 leading-relaxed">
          "Ala ya bani haza zamanou da awtoukoum li ihya i dinine bi ouloumi adjibo"
        </p>
        <p className="text-sm text-white/90 mt-2 leading-relaxed">
          «&nbsp;Ô jeunes de mon époque, je vous exhorte à revivifier la religion par les sciences, répondez.&nbsp;»
        </p>
        <p className="text-xs text-secondary font-semibold mt-3">— Seydi El Hadji Malick Sy</p>
      </div>

      {/* Mission */}
      <div className="mx-4 mt-4 bg-card rounded-2xl p-5 border border-border">
        <p className="text-sm font-bold text-foreground mb-2">Notre Mission</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          L'Univers Maodo Malick Sy est une plateforme numérique dédiée à la préservation et à la diffusion du patrimoine spirituel et littéraire de Seydi El Hadji Malick Sy et de la voie Tijaniyya au Sénégal.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          Notre application met à la disposition des fidèles les xassidas, leur translittération, leur traduction et leurs audios — dans un esprit d'éducation, de dévotion et d'unité.
        </p>
      </div>

      {/* Dahira info */}
      <div className="mx-4 mt-4 bg-card rounded-2xl p-5 border border-border">
        <p className="text-sm font-bold text-foreground mb-2">La Dahira</p>
        <div className="flex flex-col gap-2">
          {[
            { label: "Nom", value: "Al Moutahabbina Fillahi" },
            { label: "Nom Wolof", value: "Keeparu Maodo Malick Sy" },
            { label: "Confrérie", value: "Tijaniyya" },
            { label: "Université", value: "Université Alioune Diop de Bambey (UAD)" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md min-w-[80px] text-center">{label}</span>
              <span className="text-sm text-foreground flex-1">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6 mb-4">
        Version 1.0 · Univers Maodo Malick Sy © 2025
      </p>
    </motion.div>
  );
};

export default AboutScreen;
