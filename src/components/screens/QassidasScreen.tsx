import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Heart, Play, ChevronRight } from "lucide-react";

const authors = [
  { id: 1, name: "Seydi El Hadj Malick Sy", arabic: "سَيِّدِي الْحَاجُّ مَالِكْ سِي", count: 48, initials: "MS", bgColor: "bg-primary", textColor: "text-primary-foreground" },
  { id: 2, name: "Serigne Babacar Sy", arabic: "سِرِينْ بَابَاكَرْ سِي", count: 35, initials: "BS", bgColor: "bg-secondary", textColor: "text-secondary-foreground" },
  { id: 3, name: "Serigne Abdoul Aziz Sy Dabakh", arabic: "سِرِينْ عَبْدُ الْعَزِيزِ سِي دَبَّاخْ", count: 28, initials: "AD", bgColor: "bg-gold", textColor: "text-foreground" },
  { id: 4, name: "Serigne Moustapha Sy", arabic: "سِرِينْ مُصْطَفَى سِي", count: 22, initials: "MS", bgColor: "bg-primary/80", textColor: "text-primary-foreground" },
  { id: 5, name: "Serigne Mansour Sy", arabic: "سِرِينْ مَنْصُورْ سِي", count: 18, initials: "MS", bgColor: "bg-secondary/80", textColor: "text-secondary-foreground" },
];

const qassidas = [
  // Seydi El Hadj Malick Sy
  { id: 1, title: "Kifâyatou Râghibîna", arabic: "كِفَايَةُ الرَّاغِبِينَ", author: "Seydi El Hadj Malick Sy", isFavorite: true },
  { id: 2, title: "Khilâsou Dhahab", arabic: "خِلَاصُ الذَّهَبِ", author: "Seydi El Hadj Malick Sy", isFavorite: true },
  { id: 3, title: "Fayda Rabbânî", arabic: "فَيْضَةٌ رَبَّانِيَّةٌ", author: "Seydi El Hadj Malick Sy", isFavorite: false },
  { id: 4, title: "Nourou Darayni", arabic: "نُورُ الدَّارَيْنِ", author: "Seydi El Hadj Malick Sy", isFavorite: true },
  { id: 5, title: "Rimâhu Hizbi Rahîm", arabic: "رِمَاحُ حِزْبِ الرَّحِيمِ", author: "Seydi El Hadj Malick Sy", isFavorite: false },
  { id: 6, title: "Ifhâmou Munkir", arabic: "إِفْهَامُ الْمُنْكِرِ", author: "Seydi El Hadj Malick Sy", isFavorite: false },
  { id: 7, title: "Tayssîrou", arabic: "تَيْسِيرُ الْوُصُولِ", author: "Seydi El Hadj Malick Sy", isFavorite: true },
  { id: 8, title: "Housnou Maâb", arabic: "حُسْنُ الْمَآبِ", author: "Seydi El Hadj Malick Sy", isFavorite: false },
  // Serigne Babacar Sy
  { id: 9, title: "Djawarihoul Maarifah", arabic: "جَوَاهِرُ الْمَعَارِفِ", author: "Serigne Babacar Sy", isFavorite: true },
  { id: 10, title: "Sakku Minal Hamd", arabic: "سَاكُّ مِنَ الْحَمْدِ", author: "Serigne Babacar Sy", isFavorite: false },
  { id: 11, title: "Tanwîrou Soukouk", arabic: "تَنْوِيرُ الصُّكُوكِ", author: "Serigne Babacar Sy", isFavorite: true },
  // Serigne Abdoul Aziz Sy Dabakh
  { id: 12, title: "Miftâhoul Janna", arabic: "مِفْتَاحُ الْجَنَّةِ", author: "Serigne Abdoul Aziz Sy Dabakh", isFavorite: true },
  { id: 13, title: "Sabîlou Rachâd", arabic: "سَبِيلُ الرَّشَادِ", author: "Serigne Abdoul Aziz Sy Dabakh", isFavorite: false },
  { id: 14, title: "Tawassoul", arabic: "التَّوَسُّلُ", author: "Serigne Abdoul Aziz Sy Dabakh", isFavorite: true },
  // Serigne Moustapha Sy
  { id: 15, title: "Madâhil", arabic: "مَدَاحِلُ", author: "Serigne Moustapha Sy", isFavorite: false },
  { id: 16, title: "Burdatul Moukhtar", arabic: "بُرْدَةُ الْمُخْتَارِ", author: "Serigne Moustapha Sy", isFavorite: true },
  // Serigne Mansour Sy
  { id: 17, title: "Tuhfatoul Ahbâb", arabic: "تُحْفَةُ الْأَحْبَابِ", author: "Serigne Mansour Sy", isFavorite: true },
  { id: 18, title: "Hidâyatoul Moustafîd", arabic: "هِدَايَةُ الْمُسْتَفِيدِ", author: "Serigne Mansour Sy", isFavorite: false },
];

const QassidasScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<number | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const filteredQassidas = qassidas.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.arabic.includes(searchQuery);
    const matchesAuthor = selectedAuthor ? authors.find(a => a.id === selectedAuthor)?.name === q.author : true;
    const matchesFavorite = showFavorites ? q.isFavorite : true;
    return matchesSearch && matchesAuthor && matchesFavorite;
  });

  return (
    <motion.div
      className="min-h-screen pb-24 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="bg-gradient-to-br from-secondary via-secondary to-gold-light pt-12 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-secondary-foreground">Xassidas</h1>
          <p className="text-3xl font-arabic text-card mt-1">الْقَصَائِدُ</p>
        </motion.div>

        {/* Search */}
        <motion.div
          className="mt-6 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une xassida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          className="mt-4 flex gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              showFavorites
                ? "bg-card text-foreground"
                : "bg-card/20 text-secondary-foreground"
            }`}
          >
            <Heart className={`w-4 h-4 ${showFavorites ? "fill-secondary text-secondary" : ""}`} />
            <span className="text-sm font-medium">Favoris</span>
          </button>
        </motion.div>
      </header>

      {/* Authors */}
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Par Auteur
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
          {authors.map((author, index) => (
            <motion.button
              key={author.id}
              onClick={() => setSelectedAuthor(selectedAuthor === author.id ? null : author.id)}
              className={`flex-shrink-0 p-4 rounded-2xl transition-all ${
                selectedAuthor === author.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-card text-foreground shadow-soft"
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-14 h-14 rounded-full mb-3 flex items-center justify-center ${
                selectedAuthor === author.id ? "bg-card/20" : author.bgColor
              } shadow-md`}>
                <span className={`text-lg font-bold ${selectedAuthor === author.id ? "text-primary-foreground" : author.textColor}`}>
                  {author.initials}
                </span>
              </div>
              <p className="font-medium text-sm">{author.name}</p>
              <p className="text-sm font-arabic opacity-80 mt-0.5">{author.arabic}</p>
              <p className="text-xs opacity-70 mt-1">{author.count} xassidas</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Qassidas List */}
      <div className="px-6 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Bibliothèque
        </h3>
        {filteredQassidas.map((qassida, index) => (
          <motion.div
            key={qassida.id}
            className="bg-card rounded-xl p-4 shadow-soft flex items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.button
              className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="w-5 h-5 text-secondary-foreground ml-0.5" />
            </motion.button>
            <div className="flex-1 ml-4 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{qassida.title}</h4>
              <p className="text-lg font-arabic text-muted-foreground truncate">{qassida.arabic}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{qassida.author}</p>
            </div>
            <button className="ml-2">
              <Heart
                className={`w-5 h-5 transition-colors ${
                  qassida.isFavorite ? "fill-secondary text-secondary" : "text-muted-foreground"
                }`}
              />
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-2" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default QassidasScreen;
