import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Réunion hebdomadaire",
    type: "recurring",
    date: "2024-01-15",
    time: "15:00",
    location: "Mosquée Centrale",
    attendees: 45,
  },
  {
    id: 2,
    title: "Lecture Matlaboul Fawzeyni",
    type: "religious",
    date: "2024-01-15",
    time: "20:30",
    location: "Salle de conférence",
    attendees: 30,
  },
  {
    id: 3,
    title: "Gamou Annuel",
    type: "major",
    date: "2024-01-20",
    time: "09:00",
    location: "Grande Mosquée",
    attendees: 500,
  },
  {
    id: 4,
    title: "Cours de Fiqh",
    type: "education",
    date: "2024-01-18",
    time: "18:00",
    location: "Centre Islamique",
    attendees: 25,
  },
];

const eventTypeColors: { [key: string]: string } = {
  recurring: "bg-primary",
  religious: "bg-secondary",
  major: "bg-gold-light",
  education: "bg-green-dark",
};

const CalendarScreen = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const selectedDateEvents = events.filter(
    e => selectedDate && e.date === selectedDate.toISOString().split("T")[0]
  );

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
          <h1 className="text-2xl font-bold text-primary-foreground">Calendrier</h1>
          <p className="text-3xl font-arabic text-secondary mt-1">التقويم</p>
        </motion.div>

        {/* Month Navigator */}
        <motion.div
          className="mt-6 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            className="w-10 h-10 rounded-full bg-card/20 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-5 h-5 text-primary-foreground" />
          </motion.button>
          <h2 className="text-xl font-semibold text-primary-foreground">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <motion.button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            className="w-10 h-10 rounded-full bg-card/20 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </motion.div>
      </header>

      {/* Calendar Grid */}
      <div className="px-6 -mt-4">
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const isToday = new Date().toDateString() === date.toDateString();
              const hasEvent = events.some(e => e.date === date.toISOString().split("T")[0]);

              return (
                <motion.button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "bg-secondary/20 text-secondary"
                      : "text-foreground hover:bg-muted"
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  {day}
                  {hasEvent && !isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-secondary" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Events List */}
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Événements du jour
        </h3>
        <div className="space-y-3">
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event, index) => (
              <motion.div
                key={event.id}
                className="bg-card rounded-xl p-4 shadow-soft"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-full rounded-full ${eventTypeColors[event.type]}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{event.title}</h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{event.attendees} participants</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="text-center py-8 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>Aucun événement pour cette date</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarScreen;
