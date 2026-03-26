import { run, getDb } from './db/schema.js';
import { v4 as uuid } from 'uuid';

// Import depuis le fichier existant
import { abada, khilassZahab, abouna } from '../src/data/maodoXassidas.js';

const xassidas = [
  {
    data: abada,
    authorName: 'Maodo',
    authorDesc: 'Grand saint musulman tidjiane',
    tradition: 'Tidjiane',
    birthYear: 1883,
    deathYear: 1968
  },
  {
    data: khilassZahab,
    authorName: 'Maodo',
    authorDesc: 'Même période que Abāda',
    tradition: 'Tidjiane',
    birthYear: 1883,
    deathYear: 1968
  },
  {
    data: abouna,
    authorName: 'Serigne Cheikh',
    authorDesc: 'Fondateur de la tradition tidjiane en Afrique de l\'Ouest',
    tradition: 'Tidjiane',
    birthYear: 1838,
    deathYear: 1914
  }
];

async function importData() {
  console.log('🔄 Import des xassidas existantes...');

  for (const item of xassidas) {
    try {
      // Créer ou récupérer l'auteur
      const authorId = uuid();
      await run(
        `INSERT INTO authors (id, name, description, tradition, birth_year, death_year)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [authorId, item.authorName, item.authorDesc, item.tradition, item.birthYear, item.deathYear]
      );
      console.log(`✅ Auteur créé: ${item.authorName}`);

      // Créer la xassida
      const xassidaId = uuid();
      const title = item.data.name || 'Xassida';
      await run(
        `INSERT INTO xassidas (id, title, author_id, description, chapter_count)
         VALUES (?, ?, ?, ?, ?)`,
        [xassidaId, title, authorId, `Xassida by ${item.authorName}`, item.data.chapters.length]
      );
      console.log(`✅ Xassida créée: ${title}`);

      // Ajouter les versets
      let verseCount = 0;
      for (const chapter of item.data.chapters) {
        for (const verse of chapter.verses) {
          const verseId = uuid();
          const translations = verse.translations || [];
          let translationFr = '';
          let translationEn = '';

          for (const trans of translations) {
            if (trans.lang === 'fr') translationFr = trans.text;
            if (trans.lang === 'en') translationEn = trans.text;
          }

          const words = verse.words ? JSON.stringify(verse.words) : '[]';

          await run(
            `INSERT INTO verses (id, xassida_id, chapter_number, verse_number, verse_key, text_arabic, transcription, translation_fr, translation_en, words)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              verseId,
              xassidaId,
              chapter.number,
              verse.number,
              verse.key,
              verse.text,
              verse.transcription || '',
              translationFr,
              translationEn,
              words
            ]
          );
          verseCount++;
        }
      }

      // Mettre à jour le compteur de versets
      await run(
        `UPDATE xassidas SET verse_count = ? WHERE id = ?`,
        [verseCount, xassidaId]
      );

      console.log(`✅ ${verseCount} versets importés`);
      console.log('');
    } catch (error) {
      console.error(`❌ Erreur pour ${item.data.name}:`, error);
    }
  }

  console.log('✅ Import terminé!');
  process.exit(0);
}

importData().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});
