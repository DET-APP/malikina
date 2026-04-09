// src/components/navigation/BottomNavigation.tsx
import { motion } from "framer-motion";
import { Home, Clock, BookOpen, BookMarked, Users } from "lucide-react";
import { useMemo } from "react";

type Screen = "home" | "prayer" | "quran" | "qassidas" | "community";

interface BottomNavigationProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const navItems = [
  { id: "home" as Screen, icon: Home, label: "Accueil" },
  { id: "qassidas" as Screen, icon: BookMarked, label: "Xassidas" },
  { id: "quran" as Screen, icon: BookOpen, label: "Coran" },
  { id: "prayer" as Screen, icon: Clock, label: "Prières" },
  { id: "community" as Screen, icon: Users, label: "Communauté" },
];

const BottomNavigation = ({ activeScreen, onNavigate }: BottomNavigationProps) => {
  // Trouver l'index de l'item actif
  const activeIndex = useMemo(
    () => navItems.findIndex((item) => item.id === activeScreen),
    [activeScreen]
  );

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Barre avec couleur du design app */}
      <div className="relative h-20 bg-card border-t border-border shadow-lg rounded-t-3xl">
        <div className="max-w-lg mx-auto h-full flex items-end justify-between px-6 pb-4">
          {navItems.map((item, index) => {
            const isActive = activeIndex === index;
            
            return (
              <div key={item.id} className="flex-1 flex justify-center relative">
                {/* Icône active qui sort au centre */}
                {isActive ? (
                  <motion.button
                    onClick={() => onNavigate(item.id)}
                    className="absolute -top-10 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-xl"
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <item.icon className="w-10 h-10 text-primary-foreground" />
                  </motion.button>
                ) : (
                  /* Icône inactive dans la barre avec point indicateur */
                  <div className="flex flex-col items-center gap-1 relative">
                    <motion.button
                      onClick={() => onNavigate(item.id)}
                      className="flex items-center justify-center transition-colors duration-200 text-muted-foreground hover:text-foreground"
                      whileTap={{ scale: 0.95 }}
                    >
                      <item.icon className="w-6 h-6" />
                    </motion.button>
                    {/* Petit point vert indicateur */}
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;