import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown } from "lucide-react";

interface FAQScreenProps {
  onBack: () => void;
}

const faqs = [
  {
    q: "C'est quoi l'application Univers Maodo Malick Sy ?",
    a: "C'est une application dédiée au patrimoine spirituel et littéraire de Seydi El Hadji Malick Sy. Elle donne accès aux xassidas, à leurs traductions, translittérations, audios, ainsi qu'aux horaires de prière et au calendrier islamique."
  },
  {
    q: "Comment accéder aux xassidas ?",
    a: "Appuyez sur l'onglet « Xassidas » dans la barre de navigation du bas. Vous pouvez rechercher par titre ou nom arabe, filtrer par auteur, et choisir entre vue grille ou liste."
  },
  {
    q: "Comment lire une xassida ?",
    a: "Appuyez sur une xassida pour l'ouvrir. Vous pouvez afficher le texte arabe, la translittération et la traduction en français ou en wolof. Utilisez les boutons zoom +/- pour ajuster la taille du texte."
  },
  {
    q: "Comment écouter les audios ?",
    a: "Sur la page d'une xassida, les lecteurs audio apparaissent en haut si des enregistrements sont disponibles. Appuyez sur le bouton lecture pour démarrer."
  },
  {
    q: "Comment changer la langue de l'application ?",
    a: "Appuyez sur l'icône du drapeau en haut à droite de l'écran d'accueil. Vous pouvez choisir entre Français, العربية, English et Wolof."
  },
  {
    q: "Qu'est-ce que le Fiqh ?",
    a: "La section Fiqh rassemble les ouvrages et traités de jurisprudence islamique des savants de la Tijaniyya. Cette section est en cours d'enrichissement."
  },
  {
    q: "Comment fonctionne le calendrier islamique ?",
    a: "L'onglet Calendrier affiche la correspondance entre le calendrier grégorien et le calendrier hijri (islamique), ainsi que les événements religieux importants du mois."
  },
  {
    q: "Les horaires de prière sont-ils précis ?",
    a: "Oui, les horaires sont calculés en temps réel selon votre position géographique via l'API Aladhan, avec la méthode de calcul de l'ISNA."
  },
  {
    q: "Puis-je utiliser l'app sans connexion internet ?",
    a: "Les xassidas déjà chargées sont disponibles hors ligne grâce au cache. Les horaires de prière nécessitent une connexion initiale."
  },
  {
    q: "Comment contribuer au projet ?",
    a: "Vous pouvez soutenir le projet financièrement via Wave ou Orange Money (voir la section Contribuer dans le menu), ou contribuer en partageant l'application."
  },
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-foreground leading-snug">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQScreen = ({ onBack }: FAQScreenProps) => {
  return (
    <motion.div
      className="min-h-screen bg-background pb-24"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-green-dark px-4 pt-12 pb-10 relative">
        <button onClick={onBack} className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-center text-xl font-bold text-white mt-1">FAQ</h1>
        <p className="text-center text-sm text-white/70 mt-1">Questions fréquentes</p>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-3">
        {faqs.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} />
        ))}
      </div>
    </motion.div>
  );
};

export default FAQScreen;
