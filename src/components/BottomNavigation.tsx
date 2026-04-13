import { Home, Clock, BookOpen, BookMarked, Users } from "lucide-react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";

type Screen = "home" | "prayer" | "quran" | "qassidas" | "community";

interface BottomNavigationProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const navItems: { id: Screen; icon: typeof Home; labelKey: TranslationKey }[] = [
  { id: "home", icon: Home, labelKey: "navHome" },
  { id: "qassidas", icon: BookMarked, labelKey: "navXassidas" },
  { id: "quran", icon: BookOpen, labelKey: "navQuran" },
  { id: "prayer", icon: Clock, labelKey: "navPrayer" },
  { id: "community", icon: Users, labelKey: "navCommunity" },
];

const BottomNavigation = ({ activeScreen, onNavigate }: BottomNavigationProps) => {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <div key={item.id} className="flex-1 flex flex-col items-center justify-center h-full relative">
              <button
                onClick={() => onNavigate(item.id)}
                className={`flex items-center justify-center transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-6 h-6" />
              </button>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
