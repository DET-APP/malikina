import { useEffect, useState } from 'react';
import { Download, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt after 5 seconds if app is installable
    if (isInstallable && !isInstalled) {
      const timeout = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isInstallable, isInstalled]);

  if (!isInstallable || isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-4 right-4 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg shadow-lg p-4 z-50"
      >
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-white flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">Installer l'application</h3>
            <p className="text-emerald-50 text-xs mt-1">
              Accédez à Al Moutahabbina depuis votre écran d'accueil
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="flex-shrink-0 text-white hover:text-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            onClick={installApp}
            className="bg-white text-emerald-600 hover:bg-emerald-50 flex-1"
            size="sm"
          >
            Installer
          </Button>
          <Button
            onClick={() => setShowPrompt(false)}
            variant="ghost"
            className="text-white hover:bg-white/20 flex-1"
            size="sm"
          >
            Plus tard
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PWAUpdatePrompt = () => {
  const { updateAvailable, updatePending, skipWaiting } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShowPrompt(true);
    }
  }, [updateAvailable]);

  if (!updateAvailable || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-4 right-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg shadow-lg p-4 z-50"
      >
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-white flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">Mise à jour disponible</h3>
            <p className="text-blue-50 text-xs mt-1">
              {updatePending
                ? 'Mise à jour en cours...'
                : 'Une nouvelle version est disponible'}
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="flex-shrink-0 text-white hover:text-blue-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            onClick={skipWaiting}
            disabled={updatePending}
            className="bg-white text-blue-600 hover:bg-blue-50 flex-1"
            size="sm"
          >
            {updatePending ? 'Installation...' : 'Mettre à jour'}
          </Button>
          <Button
            onClick={() => setShowPrompt(false)}
            variant="ghost"
            className="text-white hover:bg-white/20 flex-1"
            size="sm"
          >
            {updatePending ? 'Fermer' : 'Plus tard'}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
