import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect the beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Detect successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('[PWA] App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] Installation accepted');
        setIsInstalled(true);
      } else {
        console.log('[PWA] Installation dismissed');
      }

      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Installation error:', error);
    }
  };

  return {
    installPrompt,
    isInstallable,
    isInstalled,
    installApp,
  };
};

// Hook for checking PWA update availability
export const usePWAUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      setUpdatePending(false);
      console.log('[PWA] Update installed, page will reload');
      // The app will reload automatically on next navigation
    };

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        const newRegistration = await registration.update();
        
        // Check if waiting service worker is available
        if (newRegistration.waiting) {
          setUpdateAvailable(true);
          setUpdatePending(true);
        }
      } catch (error) {
        console.error('[PWA] Update check error:', error);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for updates on mount
    checkForUpdates();

    // Check for updates periodically (every 5 minutes)
    const updateInterval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => {
      clearInterval(updateInterval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const skipWaiting = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('[PWA] Skip waiting signal sent');
      }
    } catch (error) {
      console.error('[PWA] Skip waiting error:', error);
    }
  };

  return {
    updateAvailable,
    updatePending,
    skipWaiting,
  };
};

// Hook for PWA capabilities
export const usePWA = () => {
  const installProps = usePWAInstall();
  const updateProps = usePWAUpdate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...installProps,
    ...updateProps,
    isOnline,
    isPWA: window.matchMedia('(display-mode: standalone)').matches,
  };
};
