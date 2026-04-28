import { motion } from "framer-motion";
import { ChevronLeft, Heart, BookOpen, Users } from "lucide-react";
import logo from "@/assets/logo.png";

interface AboutScreenProps {
  onBack: () => void;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45 },
});

const AboutScreen = ({ onBack }: AboutScreenProps) => {
  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-primary via-primary to-green-dark px-6 pt-14 pb-12 flex flex-col items-center overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 20L20 0h20v20L20 40H0V20z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <button
          onClick={onBack}
          className="absolute top-14 left-4 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <motion.img
          src={logo}
          alt="Logo Univers Maodo Malick Sy"
          className="w-28 h-28 object-contain relative z-10"
          {...fadeUp(0.1)}
        />
        <motion.div className="text-center mt-4 relative z-10" {...fadeUp(0.2)}>
          <h1 className="text-xl font-bold text-white leading-tight">Univers Maodo Malick Sy</h1>
          <p className="text-sm text-white/60 mt-0.5">Keeparu Maodo Malick Sy</p>
          <p className="font-arabic text-2xl text-secondary mt-2">الْمُتَحَابِّينَ فِي اللَّهِ</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4 pb-28">

        {/* Devise */}
        <motion.div
          className="rounded-2xl overflow-hidden border border-secondary/30"
          {...fadeUp(0.05)}
        >
          <div className="bg-secondary/10 px-4 pt-3 pb-1">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest">Notre Devise</p>
          </div>
          <div className="bg-card px-5 pb-5 pt-3">
            <p className="font-arabic text-xl text-foreground text-right leading-loose" dir="rtl">
              ألاَ ياَ بَنِي هَذَا الزَّمَانُ دَعَوْتُكُمْ
            </p>
            <p className="font-arabic text-xl text-foreground text-right leading-loose" dir="rtl">
              لِإحْيَاءِ دِينٍ بِالعُلُومِ أَجِيبُوا
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                «&nbsp;Ô jeunes de mon époque, je vous exhorte à revivifier la religion par les sciences — répondez.&nbsp;»
              </p>
              <p className="text-xs text-secondary font-semibold mt-2">— Seydi El Hadji Malick Sy</p>
            </div>
          </div>
        </motion.div>

        {/* Mission */}
        <motion.div className="bg-card rounded-2xl p-5 border border-border" {...fadeUp(0.1)}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">Notre Mission</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Une plateforme numérique dédiée à la préservation et à la diffusion du patrimoine spirituel et littéraire de Seydi El Hadji Malick Sy et de la voie Tijaniyya.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            Xassidas, translittérations, traductions et audios — dans un esprit d'éducation, de dévotion et d'unité.
          </p>
        </motion.div>

        {/* Dahira */}
        <motion.div className="bg-card rounded-2xl p-5 border border-border" {...fadeUp(0.15)}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">La Dahira</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Nom officiel", value: "Al Moutahabbina Fillahi" },
              { label: "Nom Wolof", value: "Keeparu Maodo Malick Sy" },
              { label: "Confrérie", value: "Tijaniyya" },
              { label: "Université", value: "Université Alioune Diop de Bambey (UAD)" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quran reference */}
        <motion.div className="bg-card rounded-2xl p-5 border border-border" {...fadeUp(0.2)}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">Notre Nom</p>
          </div>
          <p className="font-arabic text-lg text-secondary text-right leading-loose" dir="rtl">
            الْمُتَحَابِّينَ فِي اللَّهِ
          </p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            «&nbsp;Ceux qui s'aiment pour Allah&nbsp;» — tiré du hadith du Prophète ﷺ sur les sept catégories de personnes que Allah couvre de Son ombre le Jour du Jugement.
          </p>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground pt-2">
          Version 1.0 · Univers Maodo Malick Sy © 2025
        </p>
      </div>
    </motion.div>
  );
};

export default AboutScreen;
