// src/components/qassidas/XassidasList.tsx
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Qassida } from "@/data/qassidasData";
import { authorsData } from "@/data/qassidasData";

interface XassidasListProps {
  qassidas: Qassida[];
  viewMode: "grid" | "list";
  onQassidasSelect: (qassida: Qassida) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const XassidasList = ({ qassidas, viewMode, onQassidasSelect }: XassidasListProps) => {
  if (qassidas.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Aucune xassida trouvée
      </p>
    );
  }

  const getAuthorDisplay = (authorName: string) => {
    const author = authorsData.find(a => a.fullName === authorName);
    return {
      name: authorName,
      arabic: author?.arabic || '',
      initials: authorName.split(' ').slice(0, 2).map(w => w[0]).join('')
    };
  };

  return (
    <motion.div
      className="px-6 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {viewMode === "grid" ? (
        // Vue en grille
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {qassidas.map((qassida) => {
            const authorDisplay = getAuthorDisplay(qassida.author);
            return (
              <motion.button
                key={qassida.id}
                className="bg-card rounded-xl p-5 shadow-soft relative overflow-hidden hover:shadow-lg transition-shadow text-left"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQassidasSelect(qassida)}
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-secondary/5 rounded-full" />
                <div className="absolute -right-2 -top-2 w-10 h-10 bg-secondary/10 rounded-full" />

                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-secondary">{qassida.id}</span>
                </div>

                <div>
                  <p className="text-lg font-arabic text-primary mb-2 text-right leading-relaxed">
                    {qassida.arabic}
                  </p>
                  <p className="font-semibold text-foreground text-base mb-1">
                    {qassida.title}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      {authorDisplay.initials}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {qassida.confraternity || 'Tidjane'}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        // Vue en liste
        <div className="space-y-3">
          {qassidas.map((qassida) => {
            const authorDisplay = getAuthorDisplay(qassida.author);
            return (
              <motion.button
                key={qassida.id}
                className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4 w-full hover:shadow-lg transition-shadow"
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onQassidasSelect(qassida)}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-secondary">{qassida.id}</span>
                  </div>
                </div>

                <div className="flex-1 text-left">
                  <p className="font-arabic text-lg text-primary leading-relaxed mb-1">
                    {qassida.arabic}
                  </p>
                  <p className="font-semibold text-foreground">{qassida.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{authorDisplay.initials}</span>
                    <span>•</span>
                    <span>{qassida.confraternity || 'Tidjane'}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default XassidasList;
