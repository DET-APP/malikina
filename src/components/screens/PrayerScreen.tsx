// src/components/screens/PrayerScreen.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sunrise, Sun, CloudSun, Moon } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

// Vos composants UI
import { Button } from "@/components/ui/button";

// Composants personnalisés
import { HeaderWithArabic } from "@/components/shared/HeaderWithArabic";
import { CitySelector } from "@/components/prayer/CitySelector";
import { CurrentPrayerCard } from "@/components/prayer/CurrentPrayerCard";
import { PrayerList } from "@/components/prayer/PrayerList";
import { AthanSettingsCard } from "@/components/prayer/AthanSettingsCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";

// Types et constantes
import { City, Prayer, NextPrayer, prayerNamesArabic } from "@/components/prayer/types";

const cities: City[] = [
  { name: "Dakar", lat: 14.7167, lon: -17.4677 },
  { name: "Bambey", lat: 14.7000, lon: -16.4500 }
];

const PrayerScreen = () => {
  const [selectedCity, setSelectedCity] = useState<City>(cities[0]);
  const [prayerTimes, setPrayerTimes] = useState<Prayer[]>([]);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ [key: string]: boolean }>({
    Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true
  });
  const { toast } = useToast();

  const fetchPrayerTimes = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const method = 3;
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=${method}`
      );
      
      if (!response.ok) throw new Error("Erreur lors du chargement");
      
      const data = await response.json();
      const timings = data.data.timings;
      
      const prayersList: Prayer[] = [
        { name: "Fajr", arabic: prayerNamesArabic.Fajr, time: timings.Fajr, icon: Sunrise },
        { name: "Sunrise", arabic: prayerNamesArabic.Sunrise, time: timings.Sunrise, icon: Sun },
        { name: "Dhuhr", arabic: prayerNamesArabic.Dhuhr, time: timings.Dhuhr, icon: Sun },
        { name: "Asr", arabic: prayerNamesArabic.Asr, time: timings.Asr, icon: CloudSun },
        { name: "Maghrib", arabic: prayerNamesArabic.Maghrib, time: timings.Maghrib, icon: Sunrise },
        { name: "Isha", arabic: prayerNamesArabic.Isha, time: timings.Isha, icon: Moon },
      ];
      
      setPrayerTimes(prayersList);
      calculateNextPrayer(prayersList);
      
      // TOAST SUPPRIMÉ ICI - Plus de notification à l'entrée
      
    } catch (error) {
      setError("Impossible de charger les horaires");
      toast({
        title: "Erreur",
        description: "Impossible de charger les horaires de prière",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNextPrayer = (prayers: Prayer[]) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayerTimesInMinutes = prayers.map(p => {
      const [hours, minutes] = p.time.split(':').map(Number);
      return { ...p, totalMinutes: hours * 60 + minutes };
    });
    
    let next = prayerTimesInMinutes.find(p => p.totalMinutes > currentTime);
    
    if (!next) {
      next = prayerTimesInMinutes[0];
      const remaining = (24 * 60 - currentTime) + next.totalMinutes;
      const hours = Math.floor(remaining / 60);
      const mins = remaining % 60;
      setNextPrayer({ name: next.name, time: next.time, remaining: `${hours}h ${mins}` });
    } else {
      const remaining = next.totalMinutes - currentTime;
      const hours = Math.floor(remaining / 60);
      const mins = remaining % 60;
      setNextPrayer({ name: next.name, time: next.time, remaining: `${hours}h ${mins}` });
    }
  };

  useEffect(() => {
    fetchPrayerTimes(selectedCity.lat, selectedCity.lon);
  }, [selectedCity]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (prayerTimes.length > 0) calculateNextPrayer(prayerTimes);
    }, 60000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const toggleNotification = (prayer: string) => {
    setNotifications(prev => {
      const newState = { ...prev, [prayer]: !prev[prayer] };
      toast({
        title: newState[prayer] ? "Notification activée" : "Notification désactivée",
        description: `Vous serez ${newState[prayer] ? "notifié" : "plus notifié"} pour ${prayer}`,
        duration: 2000,
      });
      return newState;
    });
  };

  return (
    <motion.div
      className="min-h-screen pb-24 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Toaster />
      
      <HeaderWithArabic 
        title="Horaires de Prière" 
        arabicText="أوقات الصلاة" 
      />

      <CitySelector 
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
      />

      {loading && <LoadingSpinner />}
      
      {error && !loading && (
        <ErrorState 
          error={error} 
          onRetry={() => fetchPrayerTimes(selectedCity.lat, selectedCity.lon)} 
        />
      )}

      {!loading && !error && nextPrayer && (
        <>
          <CurrentPrayerCard nextPrayer={nextPrayer} />
          
          <PrayerList 
            prayers={prayerTimes}
            currentPrayerName={nextPrayer.name}
            notifications={notifications}
            onToggleNotification={toggleNotification}
          />

          <AthanSettingsCard />
        </>
      )}
    </motion.div>
  );
};

export default PrayerScreen;