import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ChevronRight, GraduationCap, ChevronLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { API_BASE_URL } from "@/lib/apiUrl";

interface FiqhBook {
  id: string;
  title: string;
  arabic_name: string;
  description: string;
  actual_verse_count: number;
  author_name: string;
}

interface FiqhVerse {
  id: number;
  verse_number: number;
  chapter_number: number;
  text_arabic: string;
  transcription: string;
  translation_fr: string | null;
}

interface Chapter {
  number: number;
  verseCount: number;
  verses: FiqhVerse[];
}

const STATIC_SOURCES = [
  { id: "lakhdari", title: "Al-Lakhdari", arabic_name: "الأخضري", description: "Fiqh Malékite simplifié", actual_verse_count: 0, author_name: "" },
  { id: "fakiha", title: "Fakihatou Toulab", arabic_name: "فاكهة الطلاب", description: "Fruit des étudiants", actual_verse_count: 0, author_name: "" },
];

// ── Chapter detail view ─────────────────────────────────────────────────
const ChapterView = ({ chapter, bookTitle, onBack }: { chapter: Chapter; bookTitle: string; onBack: () => void }) => (
  <motion.div className="min-h-screen pb-24 bg-background" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
    <header className="bg-gradient-to-br from-primary via-primary to-green-dark pt-12 pb-6 px-6">
      <div className="flex items-center gap-3">
        <motion.button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <div>
          <h1 className="text-lg font-bold text-white">Chapitre {chapter.number}</h1>
          <p className="text-sm text-white/70">{bookTitle} · {chapter.verseCount} vers</p>
        </div>
      </div>
    </header>
    <div className="divide-y divide-border">
      {chapter.verses.map((verse) => (
        <div key={verse.id} className="px-6 py-5 space-y-2">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Vers {verse.verse_number}
          </span>
          <p className="text-right font-arabic text-xl leading-loose">{verse.text_arabic}</p>
          {verse.transcription && (
            <p className="text-sm text-muted-foreground italic">{verse.transcription}</p>
          )}
          {verse.translation_fr && (
            <p className="text-sm text-foreground">"{verse.translation_fr}"</p>
          )}
        </div>
      ))}
    </div>
  </motion.div>
);

// ── Main FiqhScreen ─────────────────────────────────────────────────────
const FiqhScreen = () => {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiBooks = [], isLoading: booksLoading } = useQuery<FiqhBook[]>({
    queryKey: ["fiqh-books"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/xassidas?fiqh=true`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const sources: FiqhBook[] = apiBooks.length > 0 ? apiBooks : STATIC_SOURCES;
  const activeBook = sources.find(b => b.id === selectedBookId) ?? sources[0] ?? null;

  const { data: verses = [], isLoading: versesLoading } = useQuery<FiqhVerse[]>({
    queryKey: ["fiqh-verses", activeBook?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/xassidas/${activeBook!.id}/verses`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!activeBook && apiBooks.length > 0,
  });

  const chapters = useMemo<Chapter[]>(() => {
    const map = new Map<number, FiqhVerse[]>();
    verses.forEach(v => {
      const ch = v.chapter_number || 1;
      if (!map.has(ch)) map.set(ch, []);
      map.get(ch)!.push(v);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([number, vs]) => ({ number, verseCount: vs.length, verses: vs }));
  }, [verses]);

  const filteredChapters = chapters.filter(ch =>
    `chapitre ${ch.number}`.includes(searchQuery.toLowerCase()) ||
    ch.verses.some(v => v.translation_fr?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Static categories shown when no API data loaded yet
  const staticCategories = [
    { id: 1, name: "Purification", arabic: "الطهارة", icon: "💧", count: 25 },
    { id: 2, name: "Prière", arabic: "الصلاة", icon: "🕌", count: 45 },
    { id: 3, name: "Jeûne", arabic: "الصيام", icon: "🌙", count: 20 },
    { id: 4, name: "Zakat", arabic: "الزكاة", icon: "💰", count: 15 },
    { id: 5, name: "Pèlerinage", arabic: "الحج", icon: "🕋", count: 30 },
    { id: 6, name: "Transactions", arabic: "المعاملات", icon: "🤝", count: 35 },
  ];

  // Chapter detail view
  if (selectedChapter) {
    return (
      <ChapterView
        chapter={selectedChapter}
        bookTitle={activeBook?.title ?? ""}
        onBack={() => setSelectedChapter(null)}
      />
    );
  }

  const showChapters = apiBooks.length > 0 && chapters.length > 0;
  const displayCategories = showChapters
    ? filteredChapters.map(ch => ({
        id: ch.number,
        name: `Chapitre ${ch.number}`,
        arabic: "",
        icon: "📖",
        count: ch.verseCount,
        chapter: ch,
      }))
    : staticCategories.map(c => ({ ...c, chapter: undefined as unknown as Chapter }));

  return (
    <motion.div className="min-h-screen pb-24 bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <header className="bg-gradient-to-br from-primary via-primary to-green-dark pt-12 pb-8 px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">Fiqh</h1>
            <p className="text-3xl font-arabic text-secondary mt-1">الفقه الإسلامي</p>
          </div>
          <LanguageSwitcher variant="light" />
        </motion.div>

        {/* Source Selector */}
        <motion.div className="mt-6 flex gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {booksLoading ? (
            <div className="flex-1 flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-white/60" />
            </div>
          ) : sources.map((source) => (
            <motion.button
              key={source.id}
              onClick={() => { setSelectedBookId(source.id); setSelectedChapter(null); }}
              className={`flex-1 p-4 rounded-xl transition-all ${
                (selectedBookId ?? sources[0]?.id) === source.id
                  ? "bg-card text-foreground shadow-soft"
                  : "bg-card/20 text-primary-foreground"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <p className="font-semibold text-sm">{source.title}</p>
              {source.arabic_name && (
                <p className="text-lg font-arabic mt-1 opacity-80">{source.arabic_name}</p>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div className="mt-4 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </motion.div>
      </header>

      {/* Source Info */}
      <div className="px-6 -mt-4">
        <motion.div className="bg-card rounded-2xl p-5 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{activeBook?.title ?? "Fiqh"}</h3>
              <p className="text-sm text-muted-foreground">
                {activeBook?.description || "Jurisprudence islamique"}
                {activeBook?.actual_verse_count ? ` · ${activeBook.actual_verse_count} vers` : ""}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Categories / Chapters */}
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {showChapters ? "Chapitres" : "Catégories"}
        </h3>

        {versesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayCategories.map((category, index) => (
              <motion.button
                key={category.id}
                className="bg-card rounded-2xl p-5 shadow-soft text-left"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => category.chapter && setSelectedChapter(category.chapter)}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{category.icon}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {category.count} {showChapters ? "vers" : "règles"}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground mt-3">{category.name}</h4>
                {category.arabic && (
                  <p className="text-xl font-arabic text-muted-foreground mt-1">{category.arabic}</p>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Recent / CTA */}
      {!showChapters && (
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
      )}
    </motion.div>
  );
};

export default FiqhScreen;
