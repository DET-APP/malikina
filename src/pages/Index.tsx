import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingMenu from "@/components/FloatingMenu";
import HomeScreen from "@/components/screens/HomeScreen";
import PrayerScreen from "@/components/screens/PrayerScreen";
import QuranScreen from "@/components/screens/QuranScreen";
import QassidasScreen from "@/components/screens/QassidasScreen";
import FiqhScreen from "@/components/screens/FiqhScreen";
import CalendarScreen from "@/components/screens/CalendarScreen";
import NewsScreen from "@/components/screens/NewsScreen";

type Screen = "home" | "prayer" | "quran" | "calendar" | "news" | "qassidas" | "fiqh";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeScreen, setActiveScreen] = useState<Screen>("home");

  useEffect(() => {
    // Meta tags for SEO
    document.title = "Al Moutahabbina Fillahi - Dahira des Étudiants Tidianes";
  }, []);

  const handleNavigate = (screen: Screen | string) => {
    setActiveScreen(screen as Screen);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "home":
        return <HomeScreen onNavigate={handleNavigate} />;
      case "prayer":
        return <PrayerScreen />;
      case "quran":
        return <QuranScreen />;
      case "qassidas":
        return <QassidasScreen />;
      case "fiqh":
        return <FiqhScreen />;
      case "calendar":
        return <CalendarScreen />;
      case "news":
        return <NewsScreen />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative overflow-hidden">
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {!showSplash && (
        <>
          <main className="relative">
            <AnimatePresence mode="wait">
              {renderScreen()}
            </AnimatePresence>
          </main>

          <FloatingMenu
            onNavigate={(screen) => setActiveScreen(screen)}
          />

          <BottomNavigation
            activeScreen={["qassidas", "fiqh"].includes(activeScreen) ? "home" : activeScreen as any}
            onNavigate={handleNavigate}
          />
        </>
      )}
    </div>
  );
};

export default Index;
