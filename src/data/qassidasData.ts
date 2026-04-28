export interface Qassida {
  id: number;
  apiId?: string;
  title: string;
  arabic: string;
  author: string;
  confraternity?: string;
  categorie?: string;
  verseCount?: number;
  isFavorite: boolean;
  fullText?: string;
  transliteration?: string;
  audioUrl?: string;
  pdfUrl?: string;
}

export interface Author {
  id: number;
  fullName: string;
  shortName: string;
  arabic: string;
  imageUrl: string;
  confraternity: string;
  bio?: string;
}

export const authorsData: Author[] = [
  {
    id: 1,
    fullName: "Seydi El Hadji Malick Sy",
    shortName: "El Hadj Malick Sy",
    arabic: "سَيِّدِي الْحَاجُّ مَالِكْ سِي",
    imageUrl: "",
    confraternity: "Tidjane",
    bio: "Né en 1855 à Dagana (Saint-Louis), Seydi El Hadji Malick Sy est le grand réformateur de l'Islam au Sénégal. Érudit accompli en Coran, Hadith, Fiqh et littérature arabe, il s'établit à Tivaouane en 1902, qui devint le cœur rayonnant de la Tijaniyya au Sénégal. Poète exceptionnel, il est l'auteur de xassidas majeures : Khilâssou Dhahab, Abada, Kifayatou Raghibina... Il consacra sa vie à l'éducation et à l'unité des musulmans. Il rejoignit la miséricorde divine en 1922 à Tivaouane."
  },
  {
    id: 2,
    fullName: "Serigne Cheikh Anta Diop",
    shortName: "Cheikh Anta Diop",
    arabic: "سِرِينْ الشَّيْخُ أَنْتَا",
    imageUrl: "",
    confraternity: "Tidjane",
    bio: "Grand érudit et disciple dévoué de la voie Tijaniyya, Serigne Cheikh Anta Diop a marqué son époque par sa profonde maîtrise des sciences islamiques. Auteur de xassidas comme Djawarihoul Maarifah et Tanwîrou Soukouk, il a contribué à la transmission du patrimoine spirituel Tidjane au Sénégal et en Afrique de l'Ouest."
  },
  {
    id: 3,
    fullName: "Serigne Cheikh Tidiane Sy",
    shortName: "Cheikh Tidiane Sy",
    arabic: "سِرِينْ الشَّيْخُ تِيْجَانِي سِي",
    imageUrl: "",
    confraternity: "Tidjane",
    bio: "Né à Tivaouane, Serigne Cheikh Tidiane Sy est l'un des grands héritiers de la tradition spirituelle fondée par Seydi El Hadji Malick Sy. Grand érudit et poète, il est l'auteur de la célèbre xassida Abuna. Il a consacré sa vie à consolider l'enseignement islamique et l'organisation de la confrérie Tijaniyya, perpétuant le message de paix, de savoir et de dévotion."
  },
  {
    id: 4,
    fullName: "Serigne Abdou Aziz Sy Dabakh",
    shortName: "Abdou Aziz Sy",
    arabic: "سِرِينْ عَبْدُو الْعَزِيزِ سِي دَبَّاخْ",
    imageUrl: "",
    confraternity: "Tidjane",
    bio: "Né à Tivaouane en 1904, Serigne Abdou Aziz Sy Dabakh est un fils de Seydi El Hadji Malick Sy et l'un des plus grands savants de la Tijaniyya sénégalaise. Khalife général, auteur des xassidas Bushrakum et Miftahoul Janna, il fut un ardent défenseur de la paix, du dialogue interreligieux et de l'unité nationale. Il est décédé en 1997, laissant un héritage spirituel et littéraire inestimable."
  },
  {
    id: 5,
    fullName: "Serigne Babacar Sy",
    shortName: "Babacar Sy",
    arabic: "سِرِينْ بَابَاكَرْ سِي",
    imageUrl: "",
    confraternity: "Tidjane",
    bio: "Né en 1867 à Tivaouane, Serigne Babacar Sy est le fils aîné de Seydi El Hadji Malick Sy et le premier Khalife Général de la Tijaniyya au Sénégal. Il a porté l'héritage de son père avec une sagesse et une dévotion exemplaires, compilant et préservant les œuvres spirituelles et littéraires de la confrérie. Il est décédé en 1957, ayant guidé la communauté pendant plus de trois décennies."
  },
  {
    id: 6,
    fullName: "Mansour Sy Malick",
    shortName: "Mansour Sy",
    arabic: "مَنْصُورْ سِي مَالِكْ",
    imageUrl: "",
    confraternity: "Tidjane",
    bio: "Mansour Sy Malick est un illustre poète spirituel de la lignée Tijaniyya, héritier de la tradition poétique fondée par Seydi El Hadji Malick Sy. Ses xassidas, dont Araftu Li Salma et Chakwa, témoignent d'une sensibilité artistique profonde et d'un attachement sincère à la voie soufie. Son œuvre continue d'inspirer les fidèles par sa beauté littéraire et sa profondeur spirituelle."
  },
  {
    id: 7,
    fullName: "Shaykh Ibrahim Niasse",
    shortName: "Ibrahim Niasse",
    arabic: "شَيْخُ إِبْرَاهِيمُ نِيَاسْ",
    imageUrl: "",
    confraternity: "Tidjane",
    bio: "Né en 1900 à Kaolack, Shaykh Ibrahim Niasse est l'un des plus grands maîtres spirituels du XXe siècle. Surnommé porteur de la 'Fayda' (inondation de grâce divine), il a propagé la Tijaniyya dans toute l'Afrique de l'Ouest et au-delà. Fondateur de la Médina Baye à Kaolack, il a mémorisé le Coran en entier et est l'auteur de nombreux traités spirituels. Il rejoignit la miséricorde divine en 1975, laissant des millions de disciples à travers le monde."
  },
];

export const qassidasData: Qassida[] = [
  // Seydi El Hadji Malick Sy
  { id: 1, title: "Abada", arabic: "أَبَادَا", author: "Seydi El Hadji Malick Sy", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/abada.mp3" },
  { id: 2, title: "Adabul Masjid", arabic: "أَدَابُ الْمَسْجِدِ", author: "Seydi El Hadji Malick Sy", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/adabul_masjid.mp3" },
  { id: 3, title: "Allahu Hasbi", arabic: "اللَّهُ حَسْبِي", author: "Seydi El Hadji Malick Sy", confraternity: "Tidjane", isFavorite: false, audioUrl: "https://example.com/audio/allahu_hasbi.mp3" },
  { id: 4, title: "Astawdiul Laha", arabic: "أَسْتَوْدِعُ اللَّهَ", author: "Seydi El Hadji Malick Sy", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/astawdiul_laha.mp3" },
  { id: 5, title: "Kifâyatou Râghibîna", arabic: "كِفَايَةُ الرَّاغِبِينَ", author: "Seydi El Hadji Malick Sy", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/kifayatou.mp3" },
  { id: 6, title: "Khilâsou Dhahab", arabic: "خِلَاصُ الذَّهَبِ", author: "Seydi El Hadji Malick Sy", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/khilasou.mp3" },
  
  // Serigne Cheikh Anta Diop (remplace Babacar Sy)
  { id: 7, title: "Djawarihoul Maarifah", arabic: "جَوَاهِرُ الْمَعَارِفِ", author: "Serigne Cheikh Anta Diop", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/djawarih.mp3" },
  { id: 8, title: "Sakku Minal Hamd", arabic: "سَاكُّ مِنَ الْحَمْدِ", author: "Serigne Cheikh Anta Diop", confraternity: "Tidjane", isFavorite: false, audioUrl: "https://example.com/audio/sakku.mp3" },
  { id: 9, title: "Tanwîrou Soukouk", arabic: "تَنْوِيرُ الصُّكُوكِ", author: "Serigne Cheikh Anta Diop", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/tanwir.mp3" },
  
  // Serigne Cheikh Tidiane Sy
  { id: 10, title: "Abuna", arabic: "أَبُونَا", author: "Serigne Cheikh Tidiane Sy", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/abuna.mp3" },
  
  // Serigne Abdou Aziz Sy Dabakh
  { id: 11, title: "Bushrakum", arabic: "بُشْرَاكُمْ", author: "Serigne Abdou Aziz Sy Dabakh", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/bushrakum.mp3" },
  { id: 12, title: "Miftâhoul Janna", arabic: "مِفْتَاحُ الْجَنَّةِ", author: "Serigne Abdou Aziz Sy Dabakh", confraternity: "Tidjane", isFavorite: false, audioUrl: "https://example.com/audio/miftah.mp3" },
  
  // Mansour Sy Malick
  { id: 13, title: "Araftu Li Salma", arabic: "عَرَفْتُ لِسَلْمَى", author: "Mansour Sy Malick", confraternity: "Tidjane", isFavorite: false, audioUrl: "https://example.com/audio/araftu.mp3" },
  { id: 14, title: "Chakwa", arabic: "شَكْوَى", author: "Mansour Sy Malick", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/chakwa.mp3" },
  
  // Serigne Babacar Sy
  { id: 15, title: "Nawazil Shara", arabic: "النَّوَازِلُ الشَّرَعِيَّة", author: "Serigne Babacar Sy", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/nawazil.mp3" },
  { id: 16, title: "Masalikul Jinan", arabic: "مَسَالِكُ الْجِنَانِ", author: "Serigne Babacar Sy", confraternity: "Tidjane", isFavorite: true, audioUrl: "https://example.com/audio/masalik.mp3" },
  { id: 17, title: "Hizboul Baraka", arabic: "حِزْبُ الْبَرَكَةِ", author: "Serigne Babacar Sy", confraternity: "Tidjane", isFavorite: false, audioUrl: "https://example.com/audio/hizbul.mp3" },
];

// Import extended xassidas
import { qassidas111to165 } from './qassidas-extended';

/**
 * Get all qassidas (original + extended from 111-165)
 * @returns Combined array of all qassidas sorted by ID
 */
export function getAllQassidas(): Qassida[] {
  const all = [...qassidasData, ...qassidas111to165];
  // Remove duplicates based on ID
  const seen = new Set<number>();
  return all.filter(q => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  }).sort((a, b) => a.id - b.id);
}

// Export combined data as default
export const qassidasDataWithExtended = getAllQassidas();
