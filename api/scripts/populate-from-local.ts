/**
 * Populate PostgreSQL from Authentic Local Xassidas Data
 * Uses enriched data with complete Arabic text, transliteration, and French translations
 */

import { pool } from '../db/config.js';

interface VerseData {
  number: number;
  text_ar: string;
  transliteration?: string;
  text_fr?: string;
}

interface XassidasData {
  id: number;
  title: string;
  arabicName: string;
  authorName: string;
  description: string;
  verses: VerseData[];
}

// Authentic data from enrichedQassidasData with complete verses
const xassidasDatabase: XassidasData[] = [
  {
    id: 35,
    title: "Abada",
    arabicName: "أَبَدَا",
    authorName: "El Hadj Malick Sy",
    description: "O eternité! Une des plus célèbres xassidas du Saint-Patron Seydi El Hadji Malick Sy",
    verses: [
      { number: 1, text_ar: "أَبَدَا بُرُوقٌ تَحْتَ جُنْحِ ظَلَامِ", transliteration: "Abadā burūqun taḥta junḥi ẓalāmi", text_fr: "Éternellement des éclairs sous l'aile de l'obscurité" },
      { number: 2, text_ar: "أَمْ وَجْهُ مَيَّةَ أَمْ رُبُوعُ شَمَامِ", transliteration: "Am wajhu mayyata am rubūʿu shamāmi", text_fr: "Est-ce le visage de Mayyah ou les dunes du parfum?" },
      { number: 3, text_ar: "إِنَّ الرُّبُوعَ بِشَارَتِي وَأَمَانَتِي", transliteration: "Inna r-rubūʿa bishāratī wa'amānatī", text_fr: "Les dunes sont ma bonne nouvelle et mon dépôt" },
      { number: 4, text_ar: "وَرَبِيعُ قَلْبِي وَهْيَ خَيْرُ شِيَامِ", transliteration: "Warabīʿu qalbī wahya khayru shīāmi", text_fr: "Et le printemps de mon cœur, c'est le meilleur des mois" },
      { number: 5, text_ar: "وَالَّدَمْعُ إِذْ بَعُدَتْ رُبُوعُ رُبُوعِنَا", transliteration: "Wālladamʿu idh baʿudat rubūʿu rubūʿinā", text_fr: "Et les larmes ne cessent de couler quand les dunes s'éloignent" },
      { number: 6, text_ar: "جَارٍ وَجَارِحُ مَنْحَرٍ بِسِهَامِ", transliteration: "Jārin wajāriḥu manḥarin bisihāmi", text_fr: "Coulant et sillonnant le cou percé de flèches" },
      { number: 7, text_ar: "مَهْ عَاذِلِي لَوْ حُزْتَ عِلْمًا لَمْ تَلُمْ", transliteration: "Mah ʿādhilī law ḥuzta ʿilman lam talum", text_fr: "Ô ma raison critique! Si tu avais compris le mystère" },
      { number: 8, text_ar: "هَلْ عَذْلُ مِثْلِي لَمْ يَكُنْ بِحَرَامِ", transliteration: "Hal ʿadhlu mithlī lam yakun biḥarāmi", text_fr: "Le blâme de quelqu'un comme moi n'était-il pas forbidden" },
      { number: 9, text_ar: "مَلَأَ الْفُؤَادَ قُضَاةُ شَوْقِي وَالْهَوَى", transliteration: "Mala'a l-fuāda quḍātu shawqī wālhawá", text_fr: "Les juges du désir et de la passion remplissent mon cœur" },
      { number: 10, text_ar: "أَلَمًا وَوَجْدًا يَا لَطُولَ هُيَامِ", transliteration: "Alaman wawajdan yā laṭūla huyāmi", text_fr: "De douleur et d'amour - que ce délire persiste!" },
      { number: 11, text_ar: "يَا عَادِيًا يَعْلُو السِّنَادَ فَبَلِّغَنْ", transliteration: "Yā ʿādīan yaʿlū s-sināda faballighan", text_fr: "Ô caravane qui monte au-dessus du relief!" },
      { number: 12, text_ar: "سَلْعًا وَسَلْ عَنْ جِيرَتِي بِسَلَامِ", transliteration: "Salʿan wasal ʿan jīratī bisalāmi", text_fr: "Salue mes voisins d'une salutation de paix!" },
      { number: 13, text_ar: "فَارْبَعْ عَلَى مَجْنُونِ لَيْلَى إِنَّ لِي", transliteration: "Fārbaʿ ʿalá majnūni laylá inna lī", text_fr: "Sois indulgent envers le fou d'amour de Layla" },
      { number: 14, text_ar: "دَاءً دَوِيًّا مَا أَبَلَّ سَقَامِ", transliteration: "Dā'an dawīyan mā aballa saqāmi", text_fr: "Une maladie cruelle que nulle guérison n'effacera" },
      { number: 15, text_ar: "وَاقْرَأْ سَلَامًا طَيِّبًا تُفْشِيهِ مِنْ", transliteration: "Wāqra' salāman ṭayyiban tufshīhi min", text_fr: "Lis une salutation pure que tu envoies" },
      { number: 16, text_ar: "حِبٍّ إِلَى نَاسٍ هُدِيتَ هُمَامِ", transliteration: "Ḥibbin ilá nāsin hudīta humāmi", text_fr: "De l'amour à des gens en qui j'ai mis mon espoir" },
    ]
  }
];

async function populateFromLocal() {
  try {
    console.log('🔄 Populating PostgreSQL from local enriched data...');

    // Get or create author
    let author = await pool.query(
      `SELECT id FROM authors WHERE name ILIKE 'Malick' OR name ILIKE 'mal' LIMIT 1`
    );
    
    let authorId: number;
    if (author.rows.length === 0) {
      const newAuthor = await pool.query(
        `INSERT INTO authors (name, description, tradition) 
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['El Hadj Malick Sy', 'Saint-Patron Tidjane', 'Tidjiane']
      );
      authorId = newAuthor.rows[0].id;
      console.log(`✅ Author created: ${authorId}`);
    } else {
      authorId = author.rows[0].id;
      console.log(`✅ Author found: ${authorId}`);
    }

    // Process each xassida
    for (const xassida of xassidasDatabase) {
      // Check if xassida exists
      const existing = await pool.query(
        `SELECT id FROM xassidas WHERE title = $1`,
        [xassida.title]
      );

      let xassidaId: number;
      if (existing.rows.length === 0) {
        // Insert xassida
        const result = await pool.query(
          `INSERT INTO xassidas (
            title, author_id, arabic_name, description, 
            verse_count, categorie, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id`,
          [
            xassida.title,
            authorId,
            xassida.arabicName,
            xassida.description,
            xassida.verses.length,
            'Louange'
          ]
        );
        xassidaId = result.rows[0].id;
        console.log(`✅ Xassida inserted: ${xassida.title} (ID: ${xassidaId})`);
      } else {
        xassidaId = existing.rows[0].id;
        // Delete existing verses
        await pool.query(`DELETE FROM verses WHERE xassida_id = $1`, [xassidaId]);
        console.log(`♻️  Xassida exists, updating verses: ${xassida.title}`);
      }

      // Insert verses
      let insertedCount = 0;
      for (const verse of xassida.verses) {
        try {
          await pool.query(
            `INSERT INTO verses (
              xassida_id, verse_number, content_ar, 
              translation_fr, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT DO NOTHING`,
            [
              xassidaId,
              verse.number,
              verse.text_ar,
              verse.text_fr || ''
            ]
          );
          insertedCount++;
        } catch (err: any) {
          console.warn(`⚠️  Verse ${verse.number} skipped:`, err.message);
        }
      }
      console.log(`✅ ${insertedCount}/${xassida.verses.length} verses inserted`);
    }

    console.log('✅ Database population complete!');
    
    // Verify
    const count = await pool.query('SELECT COUNT(*) as cnt FROM verses');
    console.log(`📊 Total verses in database: ${count.rows[0].cnt}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

populateFromLocal();
