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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative transition-colors duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {t(item.labelKey)}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-10 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
