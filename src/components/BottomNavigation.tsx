// src/components/navigation/BottomNavigation.tsx
import { motion } from "framer-motion";
import { Home, Clock, BookOpen, BookMarked, Users } from "lucide-react";

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
  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-background/80 border-t border-border/30 shadow-lg shadow-black/5"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="max-w-lg mx-auto px-2 py-3">
        <div className="flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex flex-col items-center flex-1 py-2 px-1 rounded-lg transition-all duration-200"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
              >
                {/* Background animé pour l'item actif */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-primary/15 to-primary/5 rounded-lg"
                    layoutId="navBackground"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icône */}
                <motion.div
                  className={`relative z-10 mb-1 transition-all duration-300 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  animate={{
                    scale: isActive ? 1.2 : 1,
                    y: isActive ? -2 : 0,
                  }}
                >
                  <item.icon
                    className={`w-6 h-6 ${
                      isActive ? "fill-current" : ""
                    }`}
                  />
                </motion.div>

                {/* Label animé */}
                <motion.span
                  className={`relative z-10 text-[10px] font-semibold transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-muted-foreground text-opacity-70"
                  }`}
                  animate={{
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  {item.label}
                </motion.span>

                {/* Indicateur actif en bas */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                    layoutId="navIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;