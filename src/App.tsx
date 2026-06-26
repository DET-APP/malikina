// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PWAInstallPrompt, PWAUpdatePrompt } from "@/components/PWAPrompt";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { useOfflineInit, useOfflineSync } from "@/hooks/useOfflineSync";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { cacheData, getCachedData } from "@/lib/offlineDb";
import { qassidasData } from "@/data/qassidasData";
import { authorsData } from "@/data/qassidasData";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  }
});

const AppContent = () => {
  const offlineReady = useOfflineInit();
  const { isOnline } = useOfflineSync();

  // Pré‑remplir le cache IndexedDB au démarrage (si vide)
  useEffect(() => {
    const prefillCache = async () => {
      if (!offlineReady) return;
      try {
        // Vérifier si le cache existe déjà
        const cached = await getCachedData('xassida', 'all-xassidas');
        if (!cached) {
          console.log('[App] Pré‑remplissage du cache IndexedDB...');
          await cacheData('xassida', 'all-xassidas', qassidasData, 7 * 24 * 60 * 60 * 1000);
          await cacheData('authors', 'all-authors', authorsData, 7 * 24 * 60 * 60 * 1000);
          console.log('[App] Cache pré‑rempli avec succès');
        } else {
          console.log('[App] Cache déjà existant');
        }
      } catch (error) {
        console.warn('[App] Erreur lors du pré‑remplissage du cache:', error);
      }
    };
    prefillCache();
  }, [offlineReady]);

  useEffect(() => {
    if (offlineReady) {
      console.log('[App] Offline support initialized');
    }
  }, [offlineReady]);

  return (
    <>
      <Toaster />
      <Sonner />
      <OfflineIndicator isOnline={isOnline} />
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;