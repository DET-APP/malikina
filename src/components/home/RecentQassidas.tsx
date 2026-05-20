import { motion } from "framer-motion";
import { Play, ChevronRight, Clock } from "lucide-react";
import { useQassidasHistory, type QassidasHistoryItem } from "@/hooks/useQassidasHistory";

interface RecentQassidasProps {
  onNavigate: (screen: string, surahId?: number, verseNumber?: number, qassidaId?: number) => void;
  itemVariants: any;
  allQassidas: QassidasHistoryItem[];
}

const RecentQassidas = ({ onNavigate, itemVariants, allQassidas }: RecentQassidasProps) => {
  const { history, hasHistory, getFeaturedQassidas } = useQassidasHistory();
  const displayed = hasHistory ? history : getFeaturedQassidas(allQassidas);

  if (displayed.length === 0) return null;

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      {/* Header - Titre et bouton parfaitement alignés */}
      <div className="flex items-start justify-between px-0">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {hasHistory ? <Clock className="w-4 h-4 text-primary" /> : <span>🎵</span>}
            <h2 className="text-lg font-bold text-foreground">
              {hasHistory ? "Récemment consultées" : "À découvrir"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasHistory ? "Reprends où tu t'es arrêté" : "Xassidas populaires"}
          </p>
        </div>
        <button
          onClick={() => onNavigate("qassidas")}
          className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm transition-colors whitespace-nowrap mt-1"
        >
          Voir tout <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Carousel */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="flex gap-3 pb-2">
          {displayed.slice(0, 8).map((qassida, index) => (
            <motion.button
  key={`${qassida.id}-${index}`}
  onClick={() => onNavigate("qassidas", undefined, undefined, qassida.id)}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
  whileHover={{ scale: 1.03, y: -3 }}
  whileTap={{ scale: 0.97 }}
  className="group flex-shrink-0 w-44 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-4 border border-primary/20 hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer text-left flex flex-col"
>
  {/* Initials circle */}
  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center mb-3">
    <span className="text-xs font-bold text-primary">
      {qassida.title.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
    </span>
  </div>

  {/* Titre sur une ligne avec troncature */}
  <h3 className="font-bold text-foreground text-sm truncate leading-tight mb-1">
    {qassida.title}
  </h3>
  
  <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
    {qassida.author}
  </p>

  {/* Bouton Lire - pousse vers le bas avec mt-auto */}
  <div className="mt-auto">
    <div className="flex items-center justify-center gap-1.5 bg-primary/20 group-hover:bg-primary group-hover:text-primary-foreground text-primary rounded-lg px-3 py-1.5 transition-all w-full">
      <Play className="w-3.5 h-3.5 fill-current" />
      <span className="text-xs font-medium">Lire</span>
    </div>
  </div>
</motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RecentQassidas;
