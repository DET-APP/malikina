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
import CommunityScreen from "@/components/screens/CommunityScreen";

type Screen = "home" | "prayer" | "quran" | "calendar" | "news" | "qassidas" | "fiqh" | "community";

// Interface pour les paramètres de navigation du Coran
interface QuranNavigationParams {
  surahId?: number;
  verseNumber?: number;
}

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeScreen, setActiveScreen] = useState<Screen>("home");

  // États pour stocker les paramètres de navigation du Coran
  const [quranParams, setQuranParams] = useState<QuranNavigationParams>({});

  useEffect(() => {
    // Meta tags for SEO
    document.title = "Al Moutahabbina Fillahi - Dahira des Étudiants Tidianes";
  }, []);

  // Fonction de navigation pour les écrans simples (BottomNavigation et FloatingMenu)
  const handleSimpleNavigate = (screen: Screen | string) => {
    setActiveScreen(screen as Screen);
    setQuranParams({}); // Réinitialiser les paramètres
  };

  // Fonction de navigation complète avec paramètres (pour HomeScreen)
  const handleNavigateWithParams = (screen: string, surahId?: number, verseNumber?: number) => {
    setActiveScreen(screen as Screen);

    // Si on navigue vers le Coran avec des paramètres, on les stocke
    if (screen === "quran" && surahId) {
      setQuranParams({ surahId, verseNumber });
    } else {
      setQuranParams({});
    }
  };

  // Fonction pour revenir à l'accueil depuis le Coran
  const handleBackFromQuran = () => {
    setActiveScreen("home");
    setQuranParams({});
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "home":
        return <HomeScreen onNavigate={handleNavigateWithParams} />;
      case "prayer":
        return <PrayerScreen />;
      case "quran":
        return (
          <QuranScreen
            initialSurahId={quranParams.surahId}
            initialVerseNumber={quranParams.verseNumber}
            onBack={handleBackFromQuran}
          />
        );
      case "qassidas":
        return <QassidasScreen />;
      case "fiqh":
        return <FiqhScreen />;
      case "calendar":
        return <CalendarScreen />;
      case "news":
        return <NewsScreen />;
      case "community":
        return <CommunityScreen />;
      default:
        return <HomeScreen onNavigate={handleNavigateWithParams} />;
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
            onNavigate={handleSimpleNavigate}
          />

          <BottomNavigation
            activeScreen={["calendar", "fiqh"].includes(activeScreen) ? "home" : activeScreen as any}
            onNavigate={handleSimpleNavigate}
          />
        </>
      )}
    </div>
  );
};

export default Index;