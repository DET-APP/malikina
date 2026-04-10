import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultLocalDbPath = path.join(__dirname, '../xassidas.db');
let dbPath = process.env.DATABASE_PATH ||
  (process.env.NODE_ENV === 'production'
    ? '/var/data/xassidas.db'
    : defaultLocalDbPath);

let db: sqlite3.Database;

async function ensureDatabaseDirectory() {
  try {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
  } catch (error) {
    // Fallback to local path when persistent disk path is unavailable.
    if (dbPath !== defaultLocalDbPath) {
      console.warn(`⚠️  Cannot use DB path ${dbPath}. Falling back to ${defaultLocalDbPath}`);
      dbPath = defaultLocalDbPath;
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      return;
    }
    throw error;
  }
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
          arabic_name TEXT,
          categorie TEXT DEFAULT 'Autre',
          author_id TEXT NOT NULL,
          description TEXT,
          audio_url TEXT,
          youtube_id TEXT,
          verse_count INTEGER DEFAULT 0,
          chapter_count INTEGER DEFAULT 1,
          language TEXT DEFAULT 'ar',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES authors(id)
        )
      `);

      // Add youtube_id column if it doesn't exist (migration for existing tables)
      database.run(`
        PRAGMA table_info(xassidas)
      `, (err, rows: any) => {
        if (!err && rows) {
          const hasYoutubeId = rows.some((row: any) => row.name === 'youtube_id');
          if (!hasYoutubeId) {
            database.run(`ALTER TABLE xassidas ADD COLUMN youtube_id TEXT`, (alterErr) => {
              if (!alterErr) {
                console.log('✅ Migration: Added youtube_id column to xassidas table');
              } else if (!alterErr.message.includes('duplicate column')) {
                console.warn('⚠️  Could not add youtube_id column:', alterErr.message);
              }
            });
          }
          
          // Add arabic_name column if it doesn't exist (migration for existing tables)
          const hasArabicName = rows.some((row: any) => row.name === 'arabic_name');
          if (!hasArabicName) {
            database.run(`ALTER TABLE xassidas ADD COLUMN arabic_name TEXT`, (alterErr) => {
              if (!alterErr) {
                console.log('✅ Migration: Added arabic_name column to xassidas table');
              } else if (!alterErr.message.includes('duplicate column')) {
                console.warn('⚠️  Could not add arabic_name column:', alterErr.message);
              }
            });
          }
          
          // Add categorie column if it doesn't exist (migration for existing tables)
          const hasCategorie = rows.some((row: any) => row.name === 'categorie');
          if (!hasCategorie) {
            database.run(`ALTER TABLE xassidas ADD COLUMN categorie TEXT DEFAULT 'Autre'`, (alterErr) => {
              if (!alterErr) {
                console.log('✅ Migration: Added categorie column to xassidas table');
              } else if (!alterErr.message.includes('duplicate column')) {
                console.warn('⚠️  Could not add categorie column:', alterErr.message);
              }
            });
          }

          // Add audio_url column if it doesn't exist (migration for existing tables)
          const hasAudioUrl = rows.some((row: any) => row.name === 'audio_url');
          if (!hasAudioUrl) {
            database.run(`ALTER TABLE xassidas ADD COLUMN audio_url TEXT`, (alterErr) => {
              if (!alterErr) {
                console.log('✅ Migration: Added audio_url column to xassidas table');
              } else if (!alterErr.message.includes('duplicate column')) {
                console.warn('⚠️  Could not add audio_url column:', alterErr.message);
              }
            });
          }
        }
      });

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
      database.run(`CREATE INDEX IF NOT EXISTS idx_xassidas_author ON xassidas(author_id)`, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✅ Database tables initialized');
        console.log(`🗄️  Database path: ${dbPath}`);
        resolve();
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

export async function seedDatabase() {
  try {
    console.log('🌱 seedDatabase() started');

    // Check if database is already populated
    console.log('📊 Counting existing xassidas...');
    const count = await get('SELECT COUNT(*) as cnt FROM xassidas', []);
    const existingXassidas = (count as any)?.cnt ?? 0;
    console.log(`✅ Count result: ${existingXassidas} xassidas`);
    
    // Only seed if database is empty
    if (existingXassidas > 0) {
      console.log(`📚 Base déjà peuplée (${existingXassidas} xassidas) — seed ignoré.`);
      return;
    }

    console.log('🌱 Seeding database avec données de test...');
    
    // Import UUID
    console.log('📦 Importing uuid...');
    const { v4: uuid } = await import('uuid');
    console.log('✅ UUID imported');
    
    // Create a test author
    console.log('👤 Creating test author...');
    const authorId = uuid();
    await run(
      `INSERT INTO authors (id, name, description, tradition, birth_year, death_year) VALUES (?, ?, ?, ?, ?, ?)`,
      [authorId, 'Seydina Cheikh', 'Fondateur de la brotherhood mouride', 'Mouride', 1853, 1927]
    );
    console.log('✅ Author créé');

    // Create a test xassida with minimal data
    console.log('📖 Creating test xassida...');
    const xassidaId = uuid();
    await run(
      `INSERT INTO xassidas (id, title, arabic_name, categorie, author_id, description, chapter_count, verse_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        xassidaId, 
        'Khilāṣ al-Dhahab', 
        'خلاصة الذهب',
        'Eloge du Prophéte',
        authorId, 
        'Xassida de Seydina Cheikh', 
        1, 
        0
      ]
    );
    console.log('✅ Xassida créée');

    // Add a few test verses
    console.log('📝 Creating 3 test verses...');
    for (let i = 1; i <= 3; i++) {
      console.log(`   Verse ${i}...`);
      await run(
        `INSERT INTO verses (id, xassida_id, chapter_number, verse_number, verse_key, text_arabic, transcription) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          xassidaId,
          1,
          i,
          `khilash:1:${i}`,
          `الآية ${i}`,
          `Transcription of verse ${i}`
        ]
      );
    }
    console.log('✅ 3 verses créés');

    // Update verse count
    console.log('🔄 Updating verse count...');
    await run(`UPDATE xassidas SET verse_count = 3 WHERE id = ?`, [xassidaId]);

    console.log('✅ Database seeded successfully with minimal test data');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    // Don't throw - allow server to continue
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
