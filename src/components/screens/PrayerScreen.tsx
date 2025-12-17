import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Bell, BellOff, Sun, Sunrise, Moon, CloudSun } from "lucide-react";

const cities = ["Dakar", "Bambey"];

const prayerTimes = {
  Dakar: [
    { name: "Fajr", arabic: "الفجر", time: "05:45", icon: Sunrise },
    { name: "Dhuhr", arabic: "الظهر", time: "13:15", icon: Sun },
    { name: "Asr", arabic: "العصر", time: "16:30", icon: CloudSun },
    { name: "Maghreb", arabic: "المغرب", time: "18:45", icon: Sunrise },
    { name: "Isha", arabic: "العشاء", time: "20:00", icon: Moon },
  ],
  Bambey: [
    { name: "Fajr", arabic: "الفجر", time: "05:40", icon: Sunrise },
    { name: "Dhuhr", arabic: "الظهر", time: "13:10", icon: Sun },
    { name: "Asr", arabic: "العصر", time: "16:25", icon: CloudSun },
    { name: "Maghreb", arabic: "المغرب", time: "18:40", icon: Sunrise },
    { name: "Isha", arabic: "العشاء", time: "19:55", icon: Moon },
  ],
};

const PrayerScreen = () => {
  const [selectedCity, setSelectedCity] = useState<"Dakar" | "Bambey">("Dakar");
  const [notifications, setNotifications] = useState<{ [key: string]: boolean }>({
    Fajr: true, Dhuhr: true, Asr: true, Maghreb: true, Isha: true
  });

  const currentPrayer = "Maghreb";

  const toggleNotification = (prayer: string) => {
    setNotifications(prev => ({ ...prev, [prayer]: !prev[prayer] }));
  };

  return (
    <motion.div
      className="min-h-screen pb-24 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="bg-gradient-to-br from-primary via-primary to-green-dark pt-12 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-primary-foreground">Horaires de Prière</h1>
          <p className="text-3xl font-arabic text-secondary mt-1">أوقات الصلاة</p>
        </motion.div>

        {/* City Selector */}
        <motion.div
          className="flex gap-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {cities.map((city) => (
            <motion.button
              key={city}
              onClick={() => setSelectedCity(city as "Dakar" | "Bambey")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                selectedCity === city
                  ? "bg-card text-foreground shadow-soft"
                  : "bg-card/20 text-primary-foreground"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{city}</span>
            </motion.button>
          ))}
        </motion.div>
      </header>

      {/* Current Prayer Highlight */}
      <div className="px-6 -mt-4">
        <motion.div
          className="bg-card rounded-2xl p-6 shadow-card border-2 border-secondary"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-medium text-secondary uppercase tracking-wider">
              Prochaine prière
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{currentPrayer}</h2>
              <p className="text-xl font-arabic text-muted-foreground">المغرب</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">
                {prayerTimes[selectedCity].find(p => p.name === currentPrayer)?.time}
              </p>
              <p className="text-sm text-muted-foreground">dans 32 minutes</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Prayer Times List */}
      <div className="px-6 mt-6 space-y-3">
        {prayerTimes[selectedCity].map((prayer, index) => {
          const isCurrentPrayer = prayer.name === currentPrayer;
          const Icon = prayer.icon;

          return (
            <motion.div
              key={prayer.name}
              className={`bg-card rounded-xl p-4 shadow-soft flex items-center ${
                isCurrentPrayer ? "ring-2 ring-secondary" : ""
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isCurrentPrayer ? "bg-secondary" : "bg-primary/10"
              }`}>
                <Icon className={`w-6 h-6 ${isCurrentPrayer ? "text-secondary-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1 ml-4">
                <h3 className={`font-semibold ${isCurrentPrayer ? "text-primary" : "text-foreground"}`}>
                  {prayer.name}
                </h3>
                <p className="text-lg font-arabic text-muted-foreground">{prayer.arabic}</p>
              </div>
              <p className={`text-xl font-bold mr-4 ${isCurrentPrayer ? "text-primary" : "text-foreground"}`}>
                {prayer.time}
              </p>
              <motion.button
                onClick={() => toggleNotification(prayer.name)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  notifications[prayer.name]
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {notifications[prayer.name] ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Athan Settings */}
      <div className="px-6 mt-6">
        <motion.div
          className="bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="font-semibold text-foreground mb-2">Notifications Athan</h3>
          <p className="text-sm text-muted-foreground">
            Recevez une notification avant chaque prière pour ne jamais manquer l'heure.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PrayerScreen;
