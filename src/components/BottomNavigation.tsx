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
      className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="max-w-lg mx-auto px-1 py-2">
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            // Vérifier si cet item est l'écran actif
            const isActive = activeScreen === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-300 flex-1 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    layoutId="navBackground"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <item.icon
                  className={`relative z-10 w-5 h-5 transition-transform duration-300 ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                <span className="relative z-10 text-[10px] mt-1 font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute -top-1 w-1 h-1 rounded-full bg-secondary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
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