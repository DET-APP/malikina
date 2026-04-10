/**
 * Scraper Xassidas → SQLite  (v2 — Legacy Supabase API)
 * Récupère les xassidas 111→165 avec leurs versets depuis l'API
 * et les importe dans la base de données locale.
 *
 * Usage: cd api && npm run scrape
 */

import { initDatabase, run, get, all } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

// ── Config ────────────────────────────────────────────────────────────────────

const START_ID  = 111;
const END_ID    = 165;
const DELAY_MS  = 200; // délai poli entre requêtes

const SUPABASE_URL = 'https://api.xassida.sn';
// Legacy API configuration - Anon public key
const SUPABASE_ANON_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTcyNjUzMjUyMCwiZXhwIjo0ODgyMjA2MTIwLCJyb2xlIjoiYW5vbiJ9.' +
  'IbM1B5YYZOXq47F8lPxuNvKtQiMMaYCKQBJTonYq8aQ';

const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Accept': 'application/json',
};

// ── Interfaces ────────────────────────────────────────────────────────────────

interface RemoteAuthor {
  id: number;
  name: string;   // slug: "cheikh_tidiane_sy"
  tariha: string; // "tidjan", "mouride"…
  picture: string;
}

interface RemoteXassida {
  id: number;
  name: string;   // slug
  slug: string;
  author_id: number;
  author: RemoteAuthor;
}

interface RemoteChapter {
  id: number;
  number: number;
  name: string;
  xassida_id: number;
}

interface RemoteVerse {
  id: number;
  number: number;
  key: string;
  text: string;           // Arabic script
  transcription: string;  // Latin transliteration
  chapter_id: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return slug
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function tarihaToConfraternity(tariha: string): string {
  const map: Record<string, string> = {
    tidjan:     'Tidjane',
    mouride:    'Mouride',
    niassene:   'Niassène',
    layene:     'Layène',
    khadre:     'Qadiriyya',
    toucouleur: 'Toucouleur',
  };
  return map[tariha.toLowerCase()] ?? (tariha.charAt(0).toUpperCase() + tariha.slice(1));
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Supabase REST helpers ────────────────────────────────────────────────────

async function supabaseGet<T>(path: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${path}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ── DB Upserts ────────────────────────────────────────────────────────────────

async function upsertAuthor(remote: RemoteAuthor): Promise<string> {
  const name          = slugToTitle(remote.name);
  const confraternity = tarihaToConfraternity(remote.tariha);
  const photoUrl      = remote.picture
    ? `${SUPABASE_URL}/storage/v1/object/public/images/${remote.picture}`
    : null;

  const existing = await get('SELECT id FROM authors WHERE name = ?', [name]);
  if (existing) return existing.id as string;

  const id = uuid();
  await run(
    `INSERT INTO authors (id, name, description, tradition, photo_url)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, `Auteur de la confrérie ${confraternity}`, confraternity, photoUrl],
  );
  return id;
}

async function upsertXassida(
  remote: RemoteXassida,
  authorDbId: string,
  chapterCount: number,
): Promise<{ dbId: string; inserted: boolean }> {
  const title = slugToTitle(remote.name);

  const existing = await get('SELECT id FROM xassidas WHERE title = ?', [title]);
  if (existing) return { dbId: existing.id as string, inserted: false };

  const dbId = uuid();
  await run(
    `INSERT INTO xassidas (id, title, author_id, description, chapter_count, verse_count)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [
      dbId,
      title,
      authorDbId,
      `Xassida • ${tarihaToConfraternity(remote.author.tariha)}`,
      chapterCount,
    ],
  );
  return { dbId, inserted: true };
}

async function insertVerses(
  xassidaDbId: string,
  chapterNumber: number,
  verses: RemoteVerse[],
): Promise<number> {
  let count = 0;
  for (const verse of verses) {
    const existing = await get(
      'SELECT id FROM verses WHERE xassida_id = ? AND chapter_number = ? AND verse_number = ?',
      [xassidaDbId, chapterNumber, verse.number],
    );
    if (existing) continue;

    await run(
      `INSERT INTO verses (id, xassida_id, chapter_number, verse_number, verse_key, text_arabic, transcription)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), xassidaDbId, chapterNumber, verse.number, verse.key, verse.text, verse.transcription],
    );
    count++;
  }
  return count;
}

async function updateVerseCount(xassidaDbId: string) {
  const row = await get(
    'SELECT COUNT(*) as cnt FROM verses WHERE xassida_id = ?',
    [xassidaDbId],
  );
  const cnt = (row as any)?.cnt ?? 0;
  await run('UPDATE xassidas SET verse_count = ? WHERE id = ?', [cnt, xassidaDbId]);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🗄️  Initialisation de la base de données...');
  await initDatabase();
  console.log('');

  // 1. Fetch all xassidas 111–165 with their author in one query
  console.log(`📡 Récupération des xassidas ${START_ID}–${END_ID}...`);
  const xassidas = await supabaseGet<RemoteXassida>(
    `xassida?id=gte.${START_ID}&id=lte.${END_ID}&select=id,name,slug,author_id,author(id,name,tariha,picture)&order=id`,
  );
  console.log(`   → ${xassidas.length} xassidas trouvées`);
  console.log('');

  let insertedX = 0, skippedX = 0, totalVerses = 0;

  for (const xassida of xassidas) {
    const title  = slugToTitle(xassida.name);
    const author = xassida.author;

    process.stdout.write(`[${xassida.id}] "${title}" ... `);

    if (!author) {
      console.log('⚠️  auteur manquant, skip');
      continue;
    }

    // Upsert author
    const authorDbId = await upsertAuthor(author);

    // 2. Fetch chapters for this xassida
    const chapters = await supabaseGet<RemoteChapter>(
      `chapter?xassida_id=eq.${xassida.id}&select=id,number,name&order=number`,
    );

    // Upsert xassida
    const { dbId, inserted } = await upsertXassida(xassida, authorDbId, chapters.length);

    let versesThisX = 0;

    // 3. Fetch verses for each chapter
    for (const chapter of chapters) {
      const verses = await supabaseGet<RemoteVerse>(
        `verse?chapter_id=eq.${chapter.id}&select=id,number,key,text,transcription&order=number`,
      );
      versesThisX += await insertVerses(dbId, chapter.number, verses);
      await sleep(50); // micro-pause entre chapitres
    }

    await updateVerseCount(dbId);

    if (inserted) {
      console.log(`✅ importée (${chapters.length} ch., ${versesThisX} versets)`);
      insertedX++;
    } else {
      console.log(`⏭️  déjà présente (${versesThisX} versets ajoutés)`);
      skippedX++;
    }

    totalVerses += versesThisX;
    await sleep(DELAY_MS);
  }

  console.log('');
  console.log('─'.repeat(55));
  console.log(`✅ Xassidas importées : ${insertedX}`);
  console.log(`⏭️  Déjà présentes    : ${skippedX}`);
  console.log(`📜 Versets importés   : ${totalVerses}`);
  console.log('─'.repeat(55));

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
