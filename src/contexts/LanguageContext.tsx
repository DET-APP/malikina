import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "fr" | "ar" | "en" | "wo";

interface LanguageFlag {
  code: Language;
  label: string;
  flag: string;
  nativeName: string;
}

export const languages: LanguageFlag[] = [
  { code: "fr", label: "Français",  flag: "🇫🇷", nativeName: "Français" },
  { code: "ar", label: "العربية",   flag: "🇸🇦", nativeName: "العربية" },
  { code: "en", label: "English",   flag: "🇬🇧", nativeName: "English" },
  { code: "wo", label: "Wolof",     flag: "🇸🇳", nativeName: "Wolof" },
];

const translations = {
  fr: {
    // Home
    welcome: "Bienvenue",
    greeting: "Assalamou Alaikoum",
    dahira: "Dahira des Étudiants Tidianes - UAD",

    // Navigation
    navHome: "Accueil",
    navXassidas: "Xassidas",
    navQuran: "Coran",
    navPrayer: "Prières",
    navCommunity: "Communauté",

    // Xassidas screen
    xassidasTitle: "Xassidas",
    xassidasCount: "xassidas",
    loading: "Chargement…",
    searchPlaceholder: "Rechercher une xassida...",
    gridView: "Grille",
    listView: "Liste",
    byAuthor: "Par auteur",
    byCategory: "Par catégorie",
    all: "Tous",
    allFem: "Toutes",
    serverUnavailable: "Serveur indisponible",
    serverError: "Le chargement des xassidas a échoué. Réessaie plus tard.",
    noXassida: "Aucune xassida",
    dbPopulating: "La base de données est en cours de peuplement sur le serveur.",
    noXassidaFound: "Aucune xassida trouvée",
    noResults: "Aucun résultat",

    // Favorites
    favorites: "Favoris",
    noFavorites: "Pas de favoris",
    noFavoritesDesc: "Ajoutez des xassidas aux favoris pour les retrouver ici rapidement",
    favoriteCount_one: "1 favori",
    favoriteCount_other: "favoris",

    // Search
    searchResults: "Résultats",
    seeAll: "Voir tout",
  },
  ar: {
    // Home
    welcome: "مرحبا",
    greeting: "السلام عليكم",
    dahira: "جمعية الطلاب التجانيين",

    // Navigation
    navHome: "الرئيسية",
    navXassidas: "القصائد",
    navQuran: "القرآن",
    navPrayer: "الصلوات",
    navCommunity: "المجتمع",

    // Xassidas screen
    xassidasTitle: "القصائد",
    xassidasCount: "قصيدة",
    loading: "جاري التحميل…",
    searchPlaceholder: "ابحث عن قصيدة...",
    gridView: "شبكة",
    listView: "قائمة",
    byAuthor: "حسب المؤلف",
    byCategory: "حسب الفئة",
    all: "الكل",
    allFem: "الكل",
    serverUnavailable: "الخادم غير متاح",
    serverError: "فشل تحميل القصائد. حاول لاحقاً.",
    noXassida: "لا توجد قصائد",
    dbPopulating: "قاعدة البيانات قيد الملء على الخادم.",
    noXassidaFound: "لم يتم العثور على قصائد",
    noResults: "لا نتائج",

    // Favorites
    favorites: "المفضلة",
    noFavorites: "لا مفضلات",
    noFavoritesDesc: "أضف قصائد إلى المفضلة للعثور عليها بسرعة هنا",
    favoriteCount_one: "١ مفضل",
    favoriteCount_other: "مفضلات",

    // Search
    searchResults: "النتائج",
    seeAll: "عرض الكل",
  },
  en: {
    // Home
    welcome: "Welcome",
    greeting: "Assalamou Alaikoum",
    dahira: "Tidiane Students Association - UAD",

    // Navigation
    navHome: "Home",
    navXassidas: "Xassidas",
    navQuran: "Quran",
    navPrayer: "Prayer",
    navCommunity: "Community",

    // Xassidas screen
    xassidasTitle: "Xassidas",
    xassidasCount: "xassidas",
    loading: "Loading…",
    searchPlaceholder: "Search a xassida...",
    gridView: "Grid",
    listView: "List",
    byAuthor: "By author",
    byCategory: "By category",
    all: "All",
    allFem: "All",
    serverUnavailable: "Server unavailable",
    serverError: "Failed to load xassidas. Try again later.",
    noXassida: "No xassida",
    dbPopulating: "The database is being populated on the server.",
    noXassidaFound: "No xassida found",
    noResults: "No results",

    // Favorites
    favorites: "Favorites",
    noFavorites: "No favorites",
    noFavoritesDesc: "Add xassidas to favorites to find them here quickly",
    favoriteCount_one: "1 favorite",
    favoriteCount_other: "favorites",

    // Search
    searchResults: "Results",
    seeAll: "See all",
  },
  wo: {
    // Home
    welcome: "Dalal ak jaama",
    greeting: "As-salamu alaykum",
    dahira: "Dahira yi ak Talibé Tijaane yi - UAD",

    // Navigation
    navHome: "Kër gi",
    navXassidas: "Kasid yi",
    navQuran: "Koran wi",
    navPrayer: "Jukël yi",
    navCommunity: "Ñi ñëw ci kaw",

    // Xassidas screen
    xassidasTitle: "Kasid yi",
    xassidasCount: "kasid",
    loading: "Dafa xëj…",
    searchPlaceholder: "Seet kasid bi…",
    gridView: "Laas",
    listView: "Liist",
    byAuthor: "Ci njariñ",
    byCategory: "Ci wàll",
    all: "Yépp",
    allFem: "Yépp",
    serverUnavailable: "Sërvër bi dafa nelaw",
    serverError: "Amul njariñ ci kasid yi. Jëf ci kanam.",
    noXassida: "Amul kasid",
    dbPopulating: "Base bi dafay jël ci sërvër bi.",
    noXassidaFound: "Amul kasid bu nekk",
    noResults: "Amul dëkk",

    // Favorites
    favorites: "Ci xol",
    noFavorites: "Amul ci xol",
    noFavoritesDesc: "Yokk kasid yi ci xol ngir gis leen fëkk fii",
    favoriteCount_one: "1 ci xol",
    favoriteCount_other: "ci xol",

    // Search
    searchResults: "Dëkk yi",
    seeAll: "Gis yépp",
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "malikina_language";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === "fr" || stored === "ar" || stored === "en" || stored === "wo")) {
        return stored as Language;
      }
    } catch {}
    return "fr";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  };

  const t = (key: TranslationKey): string => {
    const langDict = translations[language] as Record<string, string>;
    return langDict?.[key] || (translations.fr as Record<string, string>)[key] || key;
  };

  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
