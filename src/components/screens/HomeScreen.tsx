import { motion } from "framer-motion";
import { Bell, ChevronRight, Clock, BookOpen, Calendar, Users } from "lucide-react";

const notifications = [
  { id: 1, type: "prayer", title: "Maghreb dans 30 min", time: "18:30" },
  { id: 2, type: "event", title: "Réunion hebdomadaire", time: "Demain 15h" },
  { id: 3, type: "news", title: "Nouvelle lecture disponible", time: "Il y a 2h" },
];

const quickActions = [
  { icon: Clock, label: "Prière", color: "bg-primary", screen: "prayer" },
  { icon: BookOpen, label: "Coran", color: "bg-secondary", screen: "quran" },
  { icon: Calendar, label: "Événements", color: "bg-primary", screen: "calendar" },
  { icon: Users, label: "Communauté", color: "bg-secondary", screen: "news" },
];

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
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
      {/* Header */}
      <motion.header
        className="relative bg-gradient-to-br from-primary via-primary to-green-dark pt-12 pb-20 px-6"
        variants={itemVariants}
      >
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 20L20 0h20v20L20 40H0V20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-sm">Bienvenue</p>
            <h1 className="text-2xl font-bold text-primary-foreground mt-1">
              Assalamou Alaikoum
            </h1>
          </div>
          <motion.button
            className="relative w-10 h-10 bg-card/20 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5 text-primary-foreground" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full text-xs flex items-center justify-center text-secondary-foreground font-bold">
              3
            </span>
          </motion.button>
        </div>

        {/* Logo Card */}
        <motion.div
          className="absolute -bottom-16 left-6 right-6 bg-card rounded-2xl p-6 shadow-card"
          variants={itemVariants}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-green-dark flex items-center justify-center shadow-soft">
              <span className="text-2xl font-arabic text-primary-foreground">الله</span>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground text-lg">Al Moutahabbina Fillahi</h2>
              <p className="text-xl font-arabic text-secondary mt-1">المتحابين في الله</p>
              <p className="text-xs text-muted-foreground mt-1">Dahira des Étudiants Tidianes</p>
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Content */}
      <div className="mt-20 px-6 space-y-6">
        {/* Quick Actions */}
        <motion.section variants={itemVariants}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Accès rapide
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                onClick={() => onNavigate(action.screen)}
                className="flex flex-col items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-soft`}>
                  <action.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Notifications
            </h3>
            <button className="text-xs text-secondary font-medium flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  notif.type === "prayer" ? "bg-primary/10 text-primary" :
                  notif.type === "event" ? "bg-secondary/10 text-secondary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {notif.type === "prayer" ? <Clock className="w-5 h-5" /> :
                   notif.type === "event" ? <Calendar className="w-5 h-5" /> :
                   <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Prayer Times Preview */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-br from-primary to-green-dark rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-primary-foreground/70 text-sm">Prochaine prière</p>
                <h3 className="text-2xl font-bold text-primary-foreground">Maghreb</h3>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-secondary">18:45</p>
                <p className="text-xs text-primary-foreground/70">dans 32 min</p>
              </div>
            </div>
            <motion.button
              onClick={() => onNavigate("prayer")}
              className="w-full bg-card/20 text-primary-foreground py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.25)" }}
              whileTap={{ scale: 0.98 }}
            >
              Voir toutes les prières <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default HomeScreen;
