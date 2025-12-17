import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Tag, ChevronRight, MessageCircle, Heart, Share2 } from "lucide-react";

const categories = ["Tous", "Annonces", "Événements", "Enseignement", "Communauté"];

const newsItems = [
  {
    id: 1,
    title: "Préparation du Gamou Annuel 2024",
    excerpt: "Les préparatifs du grand événement annuel sont en cours. Rejoignez-nous pour cette célébration spirituelle.",
    category: "Événements",
    date: "Il y a 2 heures",
    image: "🕌",
    likes: 45,
    comments: 12,
  },
  {
    id: 2,
    title: "Nouvelle série de cours sur Al-Lakhdari",
    excerpt: "Inscrivez-vous à notre nouvelle série de cours sur le Fiqh Malékite basée sur Al-Lakhdari.",
    category: "Enseignement",
    date: "Il y a 5 heures",
    image: "📚",
    likes: 32,
    comments: 8,
  },
  {
    id: 3,
    title: "Réunion mensuelle des responsables",
    excerpt: "La réunion mensuelle aura lieu ce samedi à 15h au centre islamique. Tous les responsables sont priés d'être présents.",
    category: "Annonces",
    date: "Hier",
    image: "👥",
    likes: 18,
    comments: 3,
  },
  {
    id: 4,
    title: "Témoignage: Mon parcours spirituel",
    excerpt: "Un membre partage son expérience et son parcours au sein de la Dahira depuis 10 ans.",
    category: "Communauté",
    date: "Il y a 2 jours",
    image: "✨",
    likes: 67,
    comments: 24,
  },
];

const NewsScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const filteredNews = newsItems.filter(
    news => selectedCategory === "Tous" || news.category === selectedCategory
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
          <h1 className="text-2xl font-bold text-primary-foreground">Actualités</h1>
          <p className="text-3xl font-arabic text-secondary mt-1">الأخبار</p>
        </motion.div>

        {/* Categories */}
        <motion.div
          className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-2 px-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? "bg-card text-foreground shadow-soft"
                  : "bg-card/20 text-primary-foreground"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>
      </header>

      {/* Featured News */}
      {selectedCategory === "Tous" && (
        <div className="px-6 -mt-4">
          <motion.div
            className="bg-gradient-to-br from-secondary to-gold-light rounded-2xl p-6 shadow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary-foreground/80 bg-card/20 px-2 py-1 rounded-full">
              <Tag className="w-3 h-3" />
              À la une
            </span>
            <h2 className="text-xl font-bold text-secondary-foreground mt-3">
              {newsItems[0].title}
            </h2>
            <p className="text-sm text-secondary-foreground/80 mt-2 line-clamp-2">
              {newsItems[0].excerpt}
            </p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-secondary-foreground/70 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {newsItems[0].date}
              </span>
              <motion.button
                className="text-sm font-medium text-secondary-foreground flex items-center gap-1"
                whileHover={{ x: 5 }}
              >
                Lire plus <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* News List */}
      <div className="px-6 py-6 space-y-4">
        {filteredNews.slice(selectedCategory === "Tous" ? 1 : 0).map((news, index) => (
          <motion.article
            key={news.id}
            className="bg-card rounded-xl p-4 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-3xl flex-shrink-0">
                {news.image}
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary">
                  <Tag className="w-3 h-3" />
                  {news.category}
                </span>
                <h3 className="font-semibold text-foreground mt-1 line-clamp-2">{news.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {news.date}
                  </span>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>{news.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>{news.comments}</span>
                </button>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
};

export default NewsScreen;
