/**
 * Import translations for verses from local hardcoded data
 * Matches verses by text_arabic and updates with translation_fr + transcription
 */

import { query } from '../db/config.js';

// Abada full data with translations
const abadaVersesData = [
  { ar: "أَبَدَا بُرُوقٌ تَحْتَ جُنْحِ ظَلَامِ", tr: "abada burūqu taḥta junḥi ẓalām", fr: "Éternellement des éclairs sous l'aile de l'obscurité" },
  { ar: "أَمْ وَجْهُ مَيَّةَ أَمْ رُبُوعُ شَمَامِ", tr: "am wajhu mayyah am rubū' shamām", fr: "Est-ce le visage de Mayyah ou les dunes du parfum?" },
  { ar: "إِنَّ الرُّبُوعَ بِشَارَتِي وَأَمَانَتِي", tr: "inna r-rubū' bishāratī wa amānatī", fr: "Les dunes sont ma bonne nouvelle et mon dépôt" },
  { ar: "وَرَبِيعُ قَلْبِي وَهْيَ خَيْرُ شِيَامِ", tr: "wa rabī' qalbī wa-hyya khayru shiyām", fr: "Et le printemps de mon cœur, c'est le meilleur des mois" },
  { ar: "وَالدَّمْعُ إِذْ بَعُدَتْ رُبُوعُ رُبُوعِنَا", tr: "wa d-dam' idh ba'udat rubū' rubū'inā", fr: "Et les larmes ne cessent de couler quand les dunes s'éloignent" },
];

async function importTranslations() {
  try {
    console.log('🔄 Importing translations from enriched data...\n');

    // Get xassida_id for "Abada"
    const xassidaResult = await query(
      'SELECT id FROM xassidas WHERE title = $1',
      ['Abada']
    );

    if (xassidaResult.rows.length === 0) {
      console.log('❌ Xassida "Abada" not found');
      process.exit(1);
    }

    const xassidaId = xassidaResult.rows[0].id;
    console.log(`✅ Found Abada (ID: ${xassidaId})\n`);

    // Process verses data
    let updatedCount = 0;
    let notFoundCount = 0;

    console.log(`📄 Processing ${abadaVersesData.length} verses...\n`);

    for (const verseData of abadaVersesData) {
      try {
        // Find verse by text_arabic match
        const searchResult = await query(
          'SELECT id FROM verses WHERE xassida_id = $1 AND text_arabic = $2',
          [xassidaId, verseData.ar]
        );

        if (searchResult.rows.length === 0) {
          console.log(`   ⚠️  Verse not found: "${verseData.ar.substring(0,40)}..."`);
          notFoundCount++;
          continue;
        }

        const verseId = searchResult.rows[0].id;

        // Update with translation and transcription
        await query(
          `UPDATE verses 
           SET translation_fr = $1, transcription = $2, updated_at = NOW()
           WHERE id = $3`,
          [verseData.fr || null, verseData.tr || null, verseId]
        );

        console.log(`   ✅ Updated verse: ${verseData.ar.substring(0,50)}...`);
        updatedCount++;
      } catch (err: any) {
        console.error(`   ❌ Error processing verse:`, err.message);
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⚠️  Not found: ${notFoundCount}`);

    // Verify
    const verifyResult = await query(
      'SELECT COUNT(*) as total, COUNT(translation_fr) as with_translation FROM verses WHERE xassida_id = $1',
      [xassidaId]
    );

    const stats = verifyResult.rows[0];
    console.log(`   📈 Total verses: ${stats.total}`);
    console.log(`   📈 With translation_fr: ${stats.with_translation}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importTranslations();
