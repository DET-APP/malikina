import { motion } from "framer-motion";
import { Play, Heart, ChevronRight } from "lucide-react";
import { useQassidasHistory, type QassidasHistoryItem } from "@/hooks/useQassidasHistory";

interface RecentQassidasProps {
  onNavigate: (screen: string) => void;
  itemVariants: any;
  allQassidas: QassidasHistoryItem[];
}

const RecentQassidas = ({ onNavigate, itemVariants, allQassidas }: RecentQassidasProps) => {
  const { history, hasHistory, getFeaturedQassidas } = useQassidasHistory();
  const displayedQassidas = hasHistory ? history : getFeaturedQassidas(allQassidas);

  return (
    <motion.div
      variants={itemVariants}
      className="space-y-4"
    >
      {/* Header */}
      <div className="px-0 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {hasHistory ? "🎵 Récemment écoutées" : "🎵 À découvrir"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasHistory ? "Vos dernières consultations" : "Xassidas populaires"}
          </p>
        </div>
        <button
          onClick={() => onNavigate("qassidas")}
          className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
        >
          Voir tout <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Carousel Horizontal */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-2">
          {displayedQassidas.slice(0, 8).map((qassida, index) => (
            <motion.button
              key={qassida.id}
              onClick={() => onNavigate("qassidas")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group flex-shrink-0 w-48 bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/30 hover:border-primary/60 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              {/* Background blur effect on hover */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 space-y-3">
                {/* Title & Author */}
                <div>
                  <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight">
                    {qassida.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                    {qassida.author}
                  </p>
                </div>

                {/* Arabic text */}
                <p className="text-xs font-arabic text-right text-primary/70 line-clamp-1">
                  {qassida.arabic}
                </p>

                {/* Play Button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-full flex items-center justify-center gap-2 bg-primary/30 hover:bg-primary/50 text-primary font-medium rounded-xl py-2.5 transition-all group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span className="text-xs">Écouter</span>
                </motion.button>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RecentQassidas;
