import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const sources = [
  { id: "lakhdari", name: "Al-Lakhdari", arabic: "الأخضري", description: "Fiqh Malékite simplifié" },
  { id: "fakiha", name: "Fakihatou Toulab", arabic: "فاكهة الطلاب", description: "Fruit des étudiants" },
];

const categories = [
  { id: 1, name: "Purification", arabic: "الطهارة", icon: "💧", count: 25 },
  { id: 2, name: "Prière", arabic: "الصلاة", icon: "🕌", count: 45 },
  { id: 3, name: "Jeûne", arabic: "الصيام", icon: "🌙", count: 20 },
  { id: 4, name: "Zakat", arabic: "الزكاة", icon: "💰", count: 15 },
  { id: 5, name: "Pèlerinage", arabic: "الحج", icon: "🕋", count: 30 },
  { id: 6, name: "Transactions", arabic: "المعاملات", icon: "🤝", count: 35 },
];

const FiqhScreen = () => {
  const [selectedSource, setSelectedSource] = useState<string>("lakhdari");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.arabic.includes(searchQuery)
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
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">Fiqh</h1>
            <p className="text-3xl font-arabic text-secondary mt-1">الفقه الإسلامي</p>
          </div>
          <LanguageSwitcher variant="light" />
        </motion.div>

        {/* Source Selector */}
        <motion.div
          className="mt-6 flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {sources.map((source) => (
            <motion.button
              key={source.id}
              onClick={() => setSelectedSource(source.id)}
              className={`flex-1 p-4 rounded-xl transition-all ${
                selectedSource === source.id
                  ? "bg-card text-foreground shadow-soft"
                  : "bg-card/20 text-primary-foreground"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <p className="font-semibold text-sm">{source.name}</p>
              <p className="text-lg font-arabic mt-1 opacity-80">{source.arabic}</p>
            </motion.button>
          ))}
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
            placeholder="Rechercher une règle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </motion.div>
      </header>

      {/* Source Info */}
      <div className="px-6 -mt-4">
        <motion.div
          className="bg-card rounded-2xl p-5 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">
                {sources.find(s => s.id === selectedSource)?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {sources.find(s => s.id === selectedSource)?.description}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Categories Grid */}
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Catégories
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {filteredCategories.map((category, index) => (
            <motion.button
              key={category.id}
              className="bg-card rounded-2xl p-5 shadow-soft text-left"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{category.icon}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {category.count} règles
                </span>
              </div>
              <h4 className="font-semibold text-foreground mt-3">{category.name}</h4>
              <p className="text-xl font-arabic text-muted-foreground mt-1">{category.arabic}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Lessons */}
      <div className="px-6 pb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Dernières leçons consultées
        </h3>
        <motion.div
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Les ablutions (Woudhou)</h4>
              <p className="text-sm text-muted-foreground">Chapitre 2 - Purification</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FiqhScreen;
