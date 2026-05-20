// src/components/screens/HomeScreen.tsx
import { motion } from "framer-motion";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import HomeHeader from "@/components/home/HomeHeader";
import RecentQassidas from "@/components/home/RecentQassidas";
import PrayerPreview from "@/components/home/PrayerPreview";
import VerseOfTheDay from "@/components/home/VerseOfTheDay";
import { useNotifications } from "@/hooks/useNotifications";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useVerseOfTheDay } from "@/hooks/useVerseOfTheDay";
import { qassidasData } from "@/data/qassidasData";
import type { QassidasHistoryItem } from "@/hooks/useQassidasHistory";

interface HomeScreenProps {
  onNavigate: (screen: string, surahId?: number, verseNumber?: number, qassidaId?: number) => void;
}

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    showNotifications,
    setShowNotifications,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    getNotificationIcon,
    getNotificationColor
  } = useNotifications(onNavigate);

  const { nextPrayer, loading: prayerLoading } = usePrayerTimes(toast);
  // Hook du verset du jour temporairement désactivé (Coran masqué)
  // const { verse, loading: verseLoading, refreshVerse } = useVerseOfTheDay();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Convertir les données Qassida en QassidasHistoryItem
  const qassidasWithHistory: QassidasHistoryItem[] = qassidasData.map(qassida => ({
    ...qassida,
    lastViewed: 0 // Valeur par défaut pour les qassidas sans historique
  }));

  return (
    <motion.div
      className="min-h-screen pb-24 bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Toaster />

      <HomeHeader
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onViewAll={() => { }}
        getNotificationIcon={getNotificationIcon}
        getNotificationColor={getNotificationColor}
      />

      <div className="mt-20 px-6 space-y-6">
        {/* Xassidas récemment écoutées */}
        <RecentQassidas
          onNavigate={onNavigate}
          itemVariants={itemVariants}
          allQassidas={qassidasWithHistory}
        />

        {/* Verset du Jour - TEMPORAIREMENT MASQUÉ (Coran désactivé) */}
        {/* <VerseOfTheDay
          verse={verse}
          loading={verseLoading}
          onRefresh={refreshVerse}
          onNavigate={onNavigate}
          itemVariants={itemVariants}
        /> */}

        <PrayerPreview
          nextPrayer={nextPrayer}
          loading={prayerLoading}
          onNavigate={onNavigate}
          itemVariants={itemVariants}
        />
      </div>
    </motion.div>
  );
};

export default HomeScreen;