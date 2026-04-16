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
import { FavoritesProvider } from "@/hooks/useFavorites";
import { useOfflineInit, useOfflineSync } from "@/hooks/useOfflineSync";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  }
});

const AppContent = () => {
  const offlineReady = useOfflineInit();
  const { isOnline } = useOfflineSync();

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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <FavoritesProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </FavoritesProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
