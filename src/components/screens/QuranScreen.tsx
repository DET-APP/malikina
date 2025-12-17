import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Play, BookOpen, CheckCircle } from "lucide-react";

const juzzList = Array.from({ length: 30 }, (_, i) => ({
  number: i + 1,
  arabicName: `الجزء ${i + 1}`,
  progress: Math.floor(Math.random() * 100),
  completed: i < 5,
}));

const QuranScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJuzz = juzzList.filter(juzz =>
    juzz.number.toString().includes(searchQuery) ||
    juzz.arabicName.includes(searchQuery)
  );

  const completedCount = juzzList.filter(j => j.completed).length;

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
          <h1 className="text-2xl font-bold text-primary-foreground">Le Saint Coran</h1>
          <p className="text-3xl font-arabic text-secondary mt-1">القرآن الكريم</p>
        </motion.div>

        {/* Progress */}
        <motion.div
          className="mt-6 bg-card/20 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-primary-foreground/80 text-sm">Progression</span>
            <span className="text-secondary font-bold">{completedCount}/30 Juzz</span>
          </div>
          <div className="h-2 bg-card/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / 30) * 100}%` }}
              transition={{ delay: 0.4, duration: 0.8 }}
            />
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          className="mt-4 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un Juzz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </motion.div>
      </header>

      {/* Juzz Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-3 gap-3">
          {filteredJuzz.map((juzz, index) => (
            <motion.button
              key={juzz.number}
              className="relative bg-card rounded-2xl p-4 shadow-soft text-left overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.02 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                <div
                  className="h-full bg-secondary"
                  style={{ width: `${juzz.progress}%` }}
                />
              </div>

              {/* Completed Badge */}
              {juzz.completed && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                </div>
              )}

              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">{juzz.number}</span>
                <span className="text-xs font-arabic text-muted-foreground mt-1">
                  {juzz.arabicName}
                </span>
              </div>

              {/* Play Button on Hover */}
              <motion.div
                className="absolute inset-0 bg-primary/90 flex items-center justify-center opacity-0"
                whileHover={{ opacity: 1 }}
              >
                <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary ml-0.5" />
                </div>
              </motion.div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Continue Reading Card */}
      <div className="px-6 pb-6">
        <motion.div
          className="bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Continuer la lecture</h3>
              <p className="text-sm text-muted-foreground">Juzz 6 - Sourate Al-Ma'idah</p>
            </div>
            <motion.button
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default QuranScreen;
