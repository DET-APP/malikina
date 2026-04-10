import { query as pool } from '../db/config.js';
import { v4 as uuidv4 } from 'uuid';

const abadaVerses = [
  { num: 1, ar: "أَبَدَا بُرُوقٌ تَحْتَ جُنْحِ ظَلَامِ", translit: "abada burūqu taḥta junḥi ẓalām", fr: "Éternellement des éclairs sous l'aile de l'obscurité" },
  { num: 2, ar: "أَمْ وَجْهُ مَيَّةَ أَمْ رُبُوعُ شَمَامِ", translit: "am wajhu mayyah am rubū' shamām", fr: "Est-ce le visage de Mayyah ou les dunes du parfum?" },
  { num: 3, ar: "إِنَّ الرُّبُوعَ بِشَارَتِي وَأَمَانَتِي", translit: "inna r-rubū' bishāratī wa amānatī", fr: "Les dunes sont ma bonne nouvelle et mon dépôt" },
  { num: 4, ar: "وَرَبِيعُ قَلْبِي وَهْيَ خَيْرُ شِيَامِ", translit: "wa rabī' qalbī wa-hyya khayru shiyām", fr: "Et le printemps de mon cœur, c'est le meilleur des mois" },
  { num: 5, ar: "وَالدَّمْعُ إِذْ بَعُدَتْ رُبُوعُ رُبُوعِنَا", translit: "wa d-dam' idh ba'udat rubū' rubū'inā", fr: "Et les larmes ne cessent de couler quand les dunes s'éloignent" },
  { num: 6, ar: "جَارٌ وَجَارِحُ مَنْحَرٌ بِسِهَامِ", translit: "jārun wa jāriḥu manḥarun bi-sihām", fr: "Coulant et sillonnant le cou percé de flèches" },
  { num: 7, ar: "مَهِ عَاذِلِي لَوْ حُزِتَ عِلْمًا لَمْ تَلُم", translit: "mah 'ādhilī law ḥuzta 'ilman lam talum", fr: "Ô ma raison critique! Si tu avais compris le mystère" },
  { num: 8, ar: "هَلْ عَذَلُ مِثْلِي لَمْ يَكُنْ بِحَرَامِ", translit: "hal 'adhal mithlī lam yakun bi-ḥarām", fr: "Le blâme de quelqu'un comme moi n'était-il pas interdit" },
  { num: 9, ar: "مَلَأَ الفُؤَادَ قَضَاءُ شَوْقِي وَالهَوَى", translit: "mala' al-fu'ād qaḍā'u shawqī wa-l-hawā", fr: "Les juges du désir et de la passion remplissent mon cœur" },
  { num: 10, ar: "أَلَمًا وَوَجْدًا يَا لَطُولَ هُيَامِ", translit: "'alaman wa wajdan yā laṭūla huyām", fr: "De douleur et d'amour - que ce délire persiste!" },
  { num: 11, ar: "فَيَا هَنْيًا بِمَا خَطَّتْ يَداي", translit: "fayā hanyan bimā khaṭṭat yadāya", fr: "Que je sois heureux de ce que mes mains ont écrit" },
  { num: 12, ar: "وَإِنْجِيلِ وَعْدِ تَحْتَ ظِلِّ الزِّيَامِ", translit: "wa injīl wa'd taḥta ẓill az-ziyām", fr: "L'évangile de la promesse sous l'ombre des étendards" },
  { num: 13, ar: "فَكَيْفَ لَا أثْمَرُ الأَرْضُ بِنَسْتَي", translit: "fakayf lā 'athmar al-'arḍ bi-nastī", fr: "Comment la terre ne porterait-elle pas fruit de mon essence" },
  { num: 14, ar: "وَفِيَّ مِن الرَّحْمَنِ أَعْظَمُ رِيَامِ", translit: "wa fīya min ar-raḥmān a'ẓam riyām", fr: "Et en moi du Miséricordieux les plus grands courants" },
  { num: 15, ar: "مَا مِنْ إِلَهٍ إِلاَّ الَّذِي وَسِمْتُ", translit: "mā min ilāh illā alladhī wasimt", fr: "Il n'y a de dieu que Celui que j'ai marqué" },
  { num: 16, ar: "بِتَوْحِيدِ قَلْبٍ خَالِصِ التِّيَامِ", translit: "bi-tawḥīd qalb khāliṣ at-tiyām", fr: "Du tawhid d'un cœur pur d'intentions" }
];

async function seedAbadaVerses() {
  try {
    console.log('🔄 Seeding Abada verses with correct format...\n');

    // Delete existing verses for xassida_id = 1
    await pool('DELETE FROM verses WHERE xassida_id = 1');
    console.log('✅ Cleared existing verses for Abada');

    // Insert new verses
    let insertedCount = 0;
    for (const verse of abadaVerses) {
      const chapterNumber = 1;
      const verseKey = `${chapterNumber}:${verse.num}`;

      await pool(
        `INSERT INTO verses 
        (xassida_id, verse_number, chapter_number, verse_key, content, content_ar, translation_fr, transcription, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          1,                    // xassida_id
          verse.num,            // verse_number
          chapterNumber,        // chapter_number
          verseKey,             // verse_key
          verse.fr,             // content (French as main content)
          verse.ar,             // content_ar (Arabic)
          verse.fr,             // translation_fr
          verse.translit        // transcription (Latin transliteration)
        ]
      );
      insertedCount++;
    }

    console.log(`✅ ${insertedCount} verses seeded for Abada (xassida_id=1)`);
    console.log('📊 Columns populated: content, content_ar, translation_fr, transcription, chapter_number, verse_key\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding verses:', error.message);
    process.exit(1);
  }
}

seedAbadaVerses();
