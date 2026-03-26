import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../xassidas.db');

let db: sqlite3.Database;

export function getDb(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
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
      database.run(`CREATE INDEX IF NOT EXISTS idx_xassidas_author ON xassidas(author_id)`, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ Database initialized');
          resolve();
        }
      });
    });
  });
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
