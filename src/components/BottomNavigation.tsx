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
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-background/85 border-t border-border/20"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="max-w-lg mx-auto px-2 py-2">
        <div className="flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex flex-col items-center flex-1 py-2 px-1 rounded-lg transition-all duration-200"
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Background subtle pour l'item actif */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-primary/8 rounded-lg"
                    layoutId="navBackground"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icône */}
                <motion.div
                  className={`relative z-10 mb-0.5 transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                >
                  <item.icon className="w-5 h-5" />
                </motion.div>

                {/* Label */}
                <motion.span
                  className={`relative z-10 text-[9px] font-medium transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground/60"
                  }`}
                >
                  {item.label}
                </motion.span>

                {/* Indicateur actif (ligne subtile en bas) */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-0.5 rounded-full bg-primary"
                    layoutId="navIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
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