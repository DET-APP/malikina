import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ChevronLeft, Loader2, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { API_BASE_URL } from "@/lib/apiUrl";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChapterMeta {
  name: string;
  icon: string;
  arabic?: string;
}

interface FiqhBook {
  id: string;
  title: string;
  arabic_name: string;
  description: string;
  categorie: string;        // icon emoji for the book card
  actual_verse_count: number;
  author_name: string;
  chapters_json: Record<string, ChapterMeta>;
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
  meta: ChapterMeta;
  verseCount: number;
  verses: FiqhVerse[];
}

// ── Default chapter meta ─────────────────────────────────────────────────────

const DEFAULT_CHAPTER_ICONS = ["📖","✅","🔧","↩️","⚠️","👥","📚","🌙","💧","🕌"];

function getChapterMeta(chapterMetas: Record<string, ChapterMeta>, num: number, fallbackIndex: number): ChapterMeta {
  return chapterMetas[String(num)] ?? {
    name: `Chapitre ${num}`,
    icon: DEFAULT_CHAPTER_ICONS[fallbackIndex % DEFAULT_CHAPTER_ICONS.length],
    arabic: "",
  };
}

// ── Level 3 — Verse detail ──────────────────────────────────────────────────

const VerseView = ({ chapter, bookTitle, onBack }: { chapter: Chapter; bookTitle: string; onBack: () => void }) => (
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
          <h1 className="text-lg font-bold text-white">
            {chapter.meta.icon} {chapter.meta.name}
          </h1>
          <p className="text-sm text-white/70">{bookTitle} · {chapter.verseCount} règles</p>
        </div>
      </div>
    </header>
    <div className="divide-y divide-border">
      {chapter.verses.map((verse) => (
        <div key={verse.id} className="px-6 py-5 space-y-2">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {verse.verse_number}
          </span>
          <p className="text-right font-arabic text-xl leading-loose">{verse.text_arabic}</p>
          {verse.transcription && (
            <p className="text-sm text-muted-foreground italic">{verse.transcription}</p>
          )}
          {verse.translation_fr && (
            <p className="text-sm text-foreground">{verse.translation_fr}</p>
          )}
        </div>
      ))}
    </div>
  </motion.div>
);

// ── Level 2 — Chapter list ──────────────────────────────────────────────────

const ChapterListView = ({
  book,
  chapters,
  searchQuery,
  onSelectChapter,
  onBack,
}: {
  book: FiqhBook;
  chapters: Chapter[];
  searchQuery: string;
  onSelectChapter: (ch: Chapter) => void;
  onBack: () => void;
}) => {
  const filtered = chapters.filter(ch =>
    ch.meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.verses.some(v => v.translation_fr?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div className="min-h-screen pb-24 bg-background" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
      <header className="bg-gradient-to-br from-primary via-primary to-green-dark pt-12 pb-6 px-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white">{book.categorie} {book.title}</h1>
            {book.arabic_name && (
              <p className="text-base font-arabic text-secondary">{book.arabic_name}</p>
            )}
          </div>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="flex justify-center py-16 text-muted-foreground">Aucun chapitre trouvé</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-6 pt-6">
          {filtered.map((chapter, index) => (
            <motion.button
              key={chapter.number}
              className="bg-card rounded-2xl p-5 shadow-soft text-left"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectChapter(chapter)}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{chapter.meta.icon}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {chapter.verseCount} règles
                </span>
              </div>
              <h4 className="font-semibold text-foreground mt-3 text-sm leading-tight">
                {chapter.meta.name}
              </h4>
              {chapter.meta.arabic && (
                <p className="text-lg font-arabic text-muted-foreground mt-1">{chapter.meta.arabic}</p>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ── Level 1 — Book / category grid ──────────────────────────────────────────

const STATIC_BOOKS: FiqhBook[] = [
  { id: "purification", title: "Purification", arabic_name: "الطهارة", description: "Règles de purification", categorie: "💧", actual_verse_count: 0, author_name: "", chapters_json: {} },
  { id: "priere",       title: "Prière",        arabic_name: "الصلاة", description: "Pilier de l'Islam",    categorie: "🕌", actual_verse_count: 0, author_name: "", chapters_json: {} },
  { id: "jeune",        title: "Jeûne",          arabic_name: "الصيام", description: "Ramadan et jeûne",     categorie: "🌙", actual_verse_count: 0, author_name: "", chapters_json: {} },
  { id: "zakat",        title: "Zakat",          arabic_name: "الزكاة", description: "Aumône légale",        categorie: "💰", actual_verse_count: 0, author_name: "", chapters_json: {} },
  { id: "hajj",         title: "Pèlerinage",     arabic_name: "الحج",  description: "Le cinquième pilier",   categorie: "🕋", actual_verse_count: 0, author_name: "", chapters_json: {} },
  { id: "transactions", title: "Transactions",   arabic_name: "المعاملات", description: "Commerce licite",   categorie: "🤝", actual_verse_count: 0, author_name: "", chapters_json: {} },
];

// ── Main FiqhScreen ─────────────────────────────────────────────────────────

const FiqhScreen = () => {
  const [selectedBook, setSelectedBook] = useState<FiqhBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch books ──────────────────────────────────────────────────────────
  const { data: apiBooks = [], isLoading: booksLoading } = useQuery<FiqhBook[]>({
    queryKey: ["fiqh-books"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/xassidas?fiqh=true`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const books = apiBooks.length > 0 ? apiBooks : STATIC_BOOKS;

  // ── Fetch verses for selected book ───────────────────────────────────────
  const { data: verses = [], isLoading: versesLoading } = useQuery<FiqhVerse[]>({
    queryKey: ["fiqh-verses", selectedBook?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/xassidas/${selectedBook!.id}/verses`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedBook,
  });

  // ── Build chapters from verses ──────────────────────────────────────────
  const chapters = useMemo<Chapter[]>(() => {
    const map = new Map<number, FiqhVerse[]>();
    verses.forEach(v => {
      const ch = v.chapter_number || 1;
      if (!map.has(ch)) map.set(ch, []);
      map.get(ch)!.push(v);
    });
    const metas = selectedBook?.chapters_json ?? {};
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([number, vs], i) => ({
        number,
        meta: getChapterMeta(metas, number, i),
        verseCount: vs.length,
        verses: vs,
      }));
  }, [verses, selectedBook]);

  // ── Level 3: verse detail ────────────────────────────────────────────────
  if (selectedChapter) {
    return (
      <VerseView
        chapter={selectedChapter}
        bookTitle={selectedBook?.title ?? ""}
        onBack={() => setSelectedChapter(null)}
      />
    );
  }

  // ── Level 2: chapter list ────────────────────────────────────────────────
  if (selectedBook) {
    return (
      <div className="min-h-screen pb-24 bg-background">
        {versesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <ChapterListView
            book={selectedBook}
            chapters={chapters}
            searchQuery={searchQuery}
            onSelectChapter={setSelectedChapter}
            onBack={() => { setSelectedBook(null); setSearchQuery(""); }}
          />
        )}
      </div>
    );
  }

  // ── Level 1: book/category grid ──────────────────────────────────────────
  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.arabic_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div className="min-h-screen pb-24 bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* Header */}
      <header className="bg-gradient-to-br from-primary via-primary to-green-dark pt-12 pb-8 px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">Fiqh</h1>
            <p className="text-3xl font-arabic text-secondary mt-1">الفقه الإسلامي</p>
          </div>
          <LanguageSwitcher variant="light" />
        </motion.div>

        {/* Search */}
        <motion.div className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un thème..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </motion.div>
      </header>

      {/* Book card — floats over header */}
      <div className="px-6 -mt-4">
        <motion.div className="bg-card rounded-2xl p-5 shadow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Al-Akhdarî — Fiqh Malékite</h3>
              <p className="text-sm text-muted-foreground">
                {booksLoading ? "Chargement…" : `${books.length} livre${books.length > 1 ? "s" : ""} · Jurisprudence islamique`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Categories grid */}
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Catégories
        </h3>

        {booksLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredBooks.map((book, index) => {
              const hasContent = book.actual_verse_count > 0;
              return (
                <motion.button
                  key={book.id}
                  className={`bg-card rounded-2xl p-5 shadow-soft text-left transition-opacity ${hasContent ? "" : "opacity-50 cursor-not-allowed"}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: hasContent ? 1 : 0.5, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={hasContent ? { scale: 1.03, y: -2 } : {}}
                  whileTap={hasContent ? { scale: 0.98 } : {}}
                  onClick={() => { if (hasContent) setSelectedBook(book); }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{book.categorie || "📚"}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {hasContent ? `${book.actual_verse_count} règles` : "Bientôt"}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground mt-3">{book.title}</h4>
                  {book.arabic_name && (
                    <p className="text-xl font-arabic text-muted-foreground mt-1">{book.arabic_name}</p>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Last consulted — placeholder */}
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
              <p className="text-sm text-muted-foreground">Chapitre 2 · Purification</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FiqhScreen;
