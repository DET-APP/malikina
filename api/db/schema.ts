import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH ||
  (process.env.NODE_ENV === 'production'
    ? '/var/data/xassidas.db'
    : path.join(__dirname, '../xassidas.db'));

let db: sqlite3.Database;

async function ensureDatabaseDirectory() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
}

export function getDb(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const open = async () => {
      if (db) {
        resolve(db);
        return;
      }

      await ensureDatabaseDirectory();
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    };

    open().catch(reject);
  });
}

export async function initDatabase() {
  const database = await getDb();

  return new Promise<void>((resolve, reject) => {
    database.serialize(() => {
      // Authors table
      database.run(`
        CREATE TABLE IF NOT EXISTS authors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          photo_url TEXT,
          birth_year INTEGER,
          death_year INTEGER,
          tradition TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Xassidas table
      database.run(`
        CREATE TABLE IF NOT EXISTS xassidas (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          author_id TEXT NOT NULL,
          description TEXT,
          verse_count INTEGER DEFAULT 0,
          chapter_count INTEGER DEFAULT 1,
          language TEXT DEFAULT 'ar',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES authors(id)
        )
      `);

      // Verses table
      database.run(`
        CREATE TABLE IF NOT EXISTS verses (
          id TEXT PRIMARY KEY,
          xassida_id TEXT NOT NULL,
          chapter_number INTEGER DEFAULT 1,
          verse_number INTEGER NOT NULL,
          verse_key TEXT NOT NULL,
          text_arabic TEXT NOT NULL,
          transcription TEXT,
          translation_fr TEXT,
          translation_en TEXT,
          words TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (xassida_id) REFERENCES xassidas(id)
        )
      `);

      database.run(`CREATE INDEX IF NOT EXISTS idx_verses_xassida ON verses(xassida_id)`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_xassidas_author ON xassidas(author_id)`, async (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✅ Database tables initialized');
        console.log(`🗄️  Database path: ${dbPath}`);
        
        // Check if database is empty and seed if needed
        const count = await count_authors();
        const shouldAutoSeed = process.env.AUTO_SEED_DB === 'true' ||
          (process.env.NODE_ENV !== 'production' && process.env.AUTO_SEED_DB !== 'false');

        if (count === 0 && shouldAutoSeed) {
          console.log('📊 Database is empty, auto-seeding...');
          try {
            await seedDatabase();
            resolve();
          } catch (seedErr) {
            console.warn('⚠️  Could not auto-seed database:', seedErr);
            resolve(); // Don't fail if seed fails
          }
        } else {
          console.log(`📊 Database has ${count} authors${shouldAutoSeed ? '' : ' (auto-seed disabled)'}`);
          resolve();
        }
      });
    });
  });
}

async function count_authors(): Promise<number> {
  return new Promise(async (resolve) => {
    const database = await getDb();
    database.get('SELECT COUNT(*) as count FROM authors', (err, row: any) => {
      resolve(err ? 0 : row?.count || 0);
    });
  });
}

async function seedDatabase() {
  try {
    // Import sample data
    const { abada, khilassZahab } = await import('../../src/data/maodoXassidas.js');
    const { v4: uuid } = await import('uuid');

    const samples = [
      { data: abada, name: 'Maodo', desc: 'Grand saint musulman tidjiane', tradition: 'Tidjiane', birth: 1883, death: 1968 },
      { data: khilassZahab, name: 'Maodo', desc: 'Khilāṣ al-Dhahab', tradition: 'Tidjiane', birth: 1883, death: 1968 }
    ];

    for (const item of samples) {
      const authorId = uuid();
      await run(
        `INSERT INTO authors (id, name, description, tradition, birth_year, death_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [authorId, item.name, item.desc, item.tradition, item.birth, item.death]
      );

      const xassidaId = uuid();
      const title = item.data.name || 'Xassida';
      const chapterCount = item.data.chapters?.length || 1;
      
      await run(
        `INSERT INTO xassidas (id, title, author_id, description, chapter_count, verse_count) VALUES (?, ?, ?, ?, ?, ?)`,
        [xassidaId, title, authorId, `Xassida by ${item.name}`, chapterCount, 0]
      );

      // Add verses if available
      let verseCount = 0;
      if (item.data.chapters) {
        for (let chIdx = 0; chIdx < item.data.chapters.length; chIdx++) {
          const chapter = item.data.chapters[chIdx];
          if (chapter.verses) {
            for (let vIdx = 0; vIdx < chapter.verses.length; vIdx++) {
              const verse = chapter.verses[vIdx];
              await run(
                `INSERT INTO verses (id, xassida_id, chapter_number, verse_number, verse_key, text_arabic, transcription, translation_fr, translation_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuid(), xassidaId, chIdx + 1, vIdx + 1, `${title}:${chIdx + 1}:${vIdx + 1}`, verse.text || '', verse.transliteration || '', verse.translation_fr || '', verse.translation_en || '']
              );
              verseCount++;
            }
          }
        }
      }

      await run(`UPDATE xassidas SET verse_count = ? WHERE id = ?`, [verseCount, xassidaId]);
      console.log(`✅ Seeded: ${title} (${verseCount} verses)`);
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

export function run(sql: string, params: any[] = []): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const database = await getDb();
    database.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql: string, params: any[] = []): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const database = await getDb();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function all(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise(async (resolve, reject) => {
    const database = await getDb();
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
