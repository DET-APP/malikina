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
import CommunityScreen from "@/components/screens/CommunityScreen";
import AdminXassidaScreen from "@/components/screens/AdminXassidaScreen";
import NewsScreen from "@/components/screens/NewsScreen";

type Screen = "home" | "prayer" | "quran" | "calendar" | "qassidas" | "fiqh" | "community" | "admin-xassidas" | "news";

// Interface pour les paramètres de navigation du Coran
interface QuranNavigationParams {
  surahId?: number;
  verseNumber?: number;
}

interface AppNavigationParams {
  quran?: QuranNavigationParams;
  qassidaId?: number;
}

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const [lastScreen, setLastScreen] = useState<Screen>("home");

  // États pour stocker les paramètres de navigation
  const [navigationParams, setNavigationParams] = useState<AppNavigationParams>({});

  useEffect(() => {
    // Meta tags for SEO
    document.title = "Al Moutahabbina Fillahi - Dahira des Étudiants Tidianes";
  }, []);

  // Fonction de navigation pour les écrans simples (BottomNavigation et FloatingMenu)
  const handleSimpleNavigate = (screen: Screen | string) => {
    if (activeScreen !== "quran") {
      setLastScreen(activeScreen);
    }

    setActiveScreen(screen as Screen);
    setNavigationParams({});
  };

  // Fonction de navigation complète avec paramètres (pour HomeScreen)
  const handleNavigateWithParams = (screen: string, surahId?: number, verseNumber?: number, qassidaId?: number) => {
    if (activeScreen !== "quran") {
      setLastScreen(activeScreen);
    }

    setActiveScreen(screen as Screen);

    // Paramètres de navigation ciblée
    if (screen === "quran" && surahId) {
      setNavigationParams({ quran: { surahId, verseNumber } });
    } else if (screen === "qassidas" && qassidaId) {
      setNavigationParams({ qassidaId });
    } else {
      setNavigationParams({});
    }
  };

  // Fonction pour revenir à l'écran précédent depuis le Coran
  const handleBackFromQuran = () => {
    setActiveScreen(lastScreen);
    setNavigationParams({});
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
            initialSurahId={navigationParams.quran?.surahId}
            initialVerseNumber={navigationParams.quran?.verseNumber}
            onBack={handleBackFromQuran}
          />
        );
      case "qassidas":
        return <QassidasScreen initialQassidaId={navigationParams.qassidaId} />;
      case "fiqh":
        return <FiqhScreen />;
      case "calendar":
        return <CalendarScreen />;
      case "news":
        return <NewsScreen />;
      case "community":
        return <CommunityScreen />;
      case "admin-xassidas":
        return <AdminXassidaScreen />;
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