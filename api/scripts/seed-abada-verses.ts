import { pool } from '../db/config.js';

async function seedVerses() {
  const verses = [
    { num: 1, ar: 'أَبَدَا بُرُوقٌ تَحْتَ جُنْحِ ظَلَامِ', fr: 'Éternellement des éclairs sous l\'aile de l\'obscurité' },
    { num: 2, ar: 'أَمْ وَجْهُ مَيَّةَ أَمْ رُبُوعُ شَمَامِ', fr: 'Est-ce le visage de Mayyah ou les dunes du parfum?' },
    { num: 3, ar: 'إِنَّ الرُّبُوعَ بِشَارَتِي وَأَمَانَتِي', fr: 'Les dunes sont ma bonne nouvelle et mon dépôt' },
    { num: 4, ar: 'وَرَبِيعُ قَلْبِي وَهْيَ خَيْرُ شِيَامِ', fr: 'Et le printemps de mon cœur, c\'est le meilleur des mois' },
    { num: 5, ar: 'وَالَّدَمْعُ إِذْ بَعُدَتْ رُبُوعُ رُبُوعِنَا', fr: 'Et les larmes ne cessent de couler quand les dunes s\'éloignent' },
    { num: 6, ar: 'جَارٍ وَجَارِحُ مَنْحَرٍ بِسِهَامِ', fr: 'Coulant et sillonnant le cou percé de flèches' },
    { num: 7, ar: 'مَهْ عَاذِلِي لَوْ حُزْتَ عِلْمًا لَمْ تَلُمْ', fr: 'Ô ma raison critique! Si tu avais compris le mystère' },
    { num: 8, ar: 'هَلْ عَذْلُ مِثْلِي لَمْ يَكُنْ بِحَرَامِ', fr: 'Le blâme de quelqu\'un comme moi n\'était-il pas forbidden' },
    { num: 9, ar: 'مَلَأَ الْفُؤَادَ قُضَاةُ شَوْقِي وَالْهَوَى', fr: 'Les juges du désir et de la passion remplissent mon cœur' },
    { num: 10, ar: 'أَلَمًا وَوَجْدًا يَا لَطُولَ هُيَامِ', fr: 'De douleur et d\'amour - que ce délire persiste!' },
    { num: 11, ar: 'يَا عَادِيًا يَعْلُو السِّنَادَ فَبَلِّغَنْ', fr: 'Ô caravane qui monte au-dessus du relief!' },
    { num: 12, ar: 'سَلْعًا وَسَلْ عَنْ جِيرَتِي بِسَلَامِ', fr: 'Salue mes voisins d\'une salutation de paix!' },
    { num: 13, ar: 'فَارْبَعْ عَلَى مَجْنُونِ لَيْلَى إِنَّ لِي', fr: 'Sois indulgent envers le fou d\'amour de Layla' },
    { num: 14, ar: 'دَاءً دَوِيًّا مَا أَبَلَّ سَقَامِ', fr: 'Une maladie cruelle que nulle guérison n\'effacera' },
    { num: 15, ar: 'وَاقْرَأْ سَلَامًا طَيِّبًا تُفْشِيهِ مِنْ', fr: 'Lis une salutation pure que tu envoies' },
    { num: 16, ar: 'حِبٍّ إِلَى نَاسٍ هُدِيتَ هُمَامِ', fr: 'De l\'amour à des gens en qui j\'ai mis mon espoir' }
  ];

  try {
    console.log('🔄 Seeding verses for Abada...');
    
    // Delete existing
    await pool.query('DELETE FROM verses WHERE xassida_id = 1');
    
    // Insert all verses
    for (const v of verses) {
      await pool.query(
        'INSERT INTO verses(xassida_id, verse_number, content, content_ar, translation_fr, created_at, updated_at) VALUES($1, $2, $3, $4, $5, NOW(), NOW())',
        [1, v.num, v.ar, v.ar, v.fr]
      );
    }
    
    const result = await pool.query('SELECT COUNT(*) FROM verses WHERE xassida_id = 1');
    console.log(`✅ ${result.rows[0].count} verses seeded for Abada (xassida_id=1)`);
    
    process.exit(0);
  } catch(error) {
    console.error('❌ Error seeding verses:', error.message);
    process.exit(1);
  }
}

seedVerses();
