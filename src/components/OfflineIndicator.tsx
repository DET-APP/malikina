// src/components/OfflineIndicator.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

export const OfflineIndicator = ({ isOnline }: OfflineIndicatorProps) => {
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (isOnline) {
      // Passer en ligne : afficher le message en ligne, cacher hors ligne
      setShowOfflineMessage(false);
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
      }, 5000); // 5 secondes
      return () => clearTimeout(timer);
    } else {
      // Passer hors ligne : afficher le message hors ligne, cacher en ligne
      setShowOnlineMessage(false);
      setShowOfflineMessage(true);
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000); // 5 secondes (ajustez selon vos besoins)
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {/* Message hors ligne - apparaît temporairement lors de la perte de connexion */}
      {!isOnline && showOfflineMessage && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 shadow-lg"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Mode hors ligne activé • Les données en cache sont utilisées
            </p>
          </div>
        </motion.div>
      )}

      {/* Message en ligne - apparaît temporairement lors du rétablissement de la connexion */}
      {isOnline && showOnlineMessage && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 shadow-lg"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <Wifi className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-medium">
              Connecté • Données synchronisées
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};