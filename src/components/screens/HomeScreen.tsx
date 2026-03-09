// src/components/screens/HomeScreen.tsx
import { motion } from "framer-motion";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import HomeHeader from "@/components/home/HomeHeader";
import QuickActions from "@/components/home/QuickActions";
import NotificationsPreview from "@/components/home/NotificationsPreview";
import PrayerPreview from "@/components/home/PrayerPreview";
import VerseOfTheDay from "@/components/home/VerseOfTheDay";
import { useNotifications } from "@/hooks/useNotifications";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useVerseOfTheDay } from "@/hooks/useVerseOfTheDay";

interface HomeScreenProps {
  onNavigate: (screen: string, surahId?: number, verseNumber?: number) => void; // Modifié
}

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    showNotifications,
    setShowNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    getNotificationIcon,
    getNotificationColor
  } = useNotifications(onNavigate);

  const { nextPrayer, loading: prayerLoading } = usePrayerTimes(toast);
  const { verse, loading: verseLoading, refreshVerse } = useVerseOfTheDay();

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
        onViewAll={() => onNavigate("news")}
        getNotificationIcon={getNotificationIcon}
        getNotificationColor={getNotificationColor}
      />

      <div className="mt-20 px-6 space-y-6">
        <QuickActions onNavigate={onNavigate} itemVariants={itemVariants} />

        <NotificationsPreview
          notifications={notifications}
          unreadCount={unreadCount}
          onShowAll={() => setShowNotifications(true)}
          onNotificationClick={handleNotificationClick}
          getNotificationIcon={getNotificationIcon}
          getNotificationColor={getNotificationColor}
          itemVariants={itemVariants}
        />

        {/* Verset du Jour */}
        <VerseOfTheDay
          verse={verse}
          loading={verseLoading}
          onRefresh={refreshVerse}
          onNavigate={onNavigate}
          itemVariants={itemVariants}
        />

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