// src/components/BottomNavigation.tsx
import { Home, Clock, Scale, BookMarked, MessageCircle } from "lucide-react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";

type Screen = "home" | "prayer" | "fiqh" | "qassidas" | "chatbot";

interface BottomNavigationProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const navItems: { id: Screen; icon: typeof Home; labelKey: TranslationKey }[] = [
  { id: "home", icon: Home, labelKey: "navHome" },
  { id: "qassidas", icon: BookMarked, labelKey: "navXassidas" },
  { id: "chatbot", icon: MessageCircle, labelKey: "navChatbot" },
  { id: "fiqh", icon: Scale, labelKey: "navFiqh" },
  { id: "prayer", icon: Clock, labelKey: "navPrayer" },
];

const BottomNavigation = ({ activeScreen, onNavigate }: BottomNavigationProps) => {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      {/* Barre transparente flottante – comme WhatsApp */}
      <div className="pointer-events-auto w-full max-w-lg mx-4 mb-4 bg-background/40 backdrop-blur-xl rounded-3xl shadow-sm border border-white/10">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative transition-all duration-200 rounded-xl ${
                  isActive ? "text-primary" : "text-muted-foreground/70 hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-all ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className={`text-[10px] font-medium transition-all ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground/70"
                }`}>
                  {t(item.labelKey)}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;