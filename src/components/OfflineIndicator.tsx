import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

export const OfflineIndicator = ({ isOnline }: OfflineIndicatorProps) => {
  return (
    <AnimatePresence>
      {!isOnline && (
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
      
      {isOnline && (
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
