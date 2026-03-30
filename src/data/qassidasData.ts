export interface Qassida {
  id: number;
  title: string;
  arabic: string;
  author: string;
  confraternity?: string;
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
    imageUrl: "https://api.xassida.sn/storage/v1/object/public/images/authors/el_hadj_malick_sy_profile.png",
    confraternity: "Tidjane",
    bio: "Fondateur de la Tidjaniyya au Sénégal"
  },
  {
    id: 2,
    fullName: "Serigne Cheikh Anta Diop",
    shortName: "Cheikh Anta Diop",
    arabic: "سِرِينْ الشَّيْخُ أَنْتَا",
    imageUrl: "https://api.xassida.sn/storage/v1/object/public/images/authors/babacar_sy_profile.png",
    confraternity: "Tidjane",
    bio: "Disciple et successeur"
  },
  {
    id: 3,
    fullName: "Serigne Cheikh Tidiane Sy",
    shortName: "Cheikh Tidiane Sy",
    arabic: "سِرِينْ الشَّيْخُ تِيْجَانِي سِي",
    imageUrl: "https://api.xassida.sn/storage/v1/object/public/images/authors/cheikh_tidiane_sy_profile.png",
    confraternity: "Tidjane",
    bio: "Héritier de la tradition"
  },
  {
    id: 4,
    fullName: "Serigne Abdou Aziz Sy Dabakh",
    shortName: "Abdou Aziz Sy",
    arabic: "سِرِينْ عَبْدُو الْعَزِيزِ سِي دَبَّاخْ",
    imageUrl: "https://api.xassida.sn/storage/v1/object/public/images/authors/abdou_aziz_sy_profile.png",
    confraternity: "Tidjane",
    bio: "Grand savant et poète"
  },
  {
    id: 5,
    fullName: "Serigne Babacar Sy",
    shortName: "Babacar Sy",
    arabic: "سِرِينْ بَابَاكَرْ سِي",
    imageUrl: "https://api.xassida.sn/storage/v1/object/public/images/authors/babacar_sy_profile.png",
    confraternity: "Tidjane",
    bio: "Compilateur et conservateur"
  },
  {
    id: 6,
    fullName: "Mansour Sy Malick",
    shortName: "Mansour Sy",
    arabic: "مَنْصُورْ سِي مَالِكْ",
    imageUrl: "https://api.xassida.sn/storage/v1/object/public/images/authors/mansour_sy_malick_profile.png",
    confraternity: "Tidjane",
    bio: "Poète spirituel"
  },
  {
    id: 7,
    fullName: "Shaykh Ibrahim Niasse",
    shortName: "Ibrahim Niasse",
    arabic: "شَيْخُ إِبْرَاهِيمُ نِيَاسْ",
    imageUrl: "https://api.xassida.sn/storage/v1/object/public/images/authors/ibrahim_niasse_profile.png",
    confraternity: "Tidjane",
    bio: "Maître spirituel et enseignant du Coran"
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
import { qassidas111to174 } from './qassidas-extended';

/**
 * Get all qassidas (original + extended from 111-174)
 * @returns Combined array of all qassidas sorted by ID
 */
export function getAllQassidas(): Qassida[] {
  const all = [...qassidasData, ...qassidas111to174];
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
