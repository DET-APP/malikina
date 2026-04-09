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
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Barre avec couleur du design app */}
      <div className="relative h-20 bg-card border-t border-border shadow-lg rounded-t-3xl">
        <div className="max-w-lg mx-auto h-full flex items-end justify-between px-4 pb-4">
          {navItems.map((item, index) => {
            const isActive = activeScreen === item.id;
            const isCenter = index === 2; // Quran au centre
            
            return (
              <div key={item.id} className="flex-1 flex justify-center relative">
                {/* Icône active qui sort */}
                {isActive && isCenter && (
                  <motion.button
                    onClick={() => onNavigate(item.id)}
                    className="absolute -top-8 w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <item.icon className="w-8 h-8 text-primary-foreground" />
                  </motion.button>
                )}

                {/* Autres icônes dans la barre */}
                {!isActive || !isCenter ? (
                  <motion.button
                    onClick={() => onNavigate(item.id)}
                    className={`flex flex-col items-center gap-1.5 relative transition-colors duration-200 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="w-6 h-6" />
                    {/* Petit point indicateur pour les autres items actifs */}
                    {isActive && !isCenter && (
                      <motion.span
                        className="w-1 h-1 rounded-full bg-secondary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                    )}
                  </motion.button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;