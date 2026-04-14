/**
 * Scraper Xassidas → PostgreSQL
 * Récupère les xassidas 111→165 depuis l'API xassida.sn
 * et les importe dans PostgreSQL
 */

import { query } from '../db/config.js';

const START_ID = 111;
const END_ID = 165;
const DELAY_MS = 300; // Increased from 200ms
const API_TIMEOUT_MS = 15000; // 15 second timeout per request
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const SUPABASE_URL = 'https://api.xassida.sn';
const SUPABASE_ANON_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTcyNjUzMjUyMCwiZXhwIjo0ODgyMjA2MTIwLCJyb2xlIjoiYW5vbiJ9.' +
  'IbM1B5YYZOXq47F8lPxuNvKtQiMMaYCKQBJTonYq8aQ';

const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Accept': 'application/json',
};

interface RemoteAuthor {
  id: number;
  name: string;
  tariha: string;
  picture: string;
}

interface RemoteXassida {
  id: number;
  name: string;
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
  text: string;
  transcription: string;
  chapter_id: number;
}

function slugToTitle(slug: string): string {
  return slug
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function supabaseGet<T>(path: string): Promise<T[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      
      const res = await fetch(url, { 
        headers: HEADERS,
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Supabase ${res.status}: ${path}`);
      }
      
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      lastError = error as Error;
      console.error(`   ⚠️  Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`);
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
      }
    }
  }
  
  throw new Error(`Failed to fetch ${path} after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

async function upsertAuthor(remote: RemoteAuthor): Promise<number> {
  const name = slugToTitle(remote.name);
  const tradition = remote.tariha.charAt(0).toUpperCase() + remote.tariha.slice(1);
  const photoUrl = remote.picture
    ? `${SUPABASE_URL}/storage/v1/object/public/images/${remote.picture}`
    : null;

  // Check if exists
  const existing = await query('SELECT id FROM authors WHERE name = $1', [name]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Insert
  const result = await query(
    'INSERT INTO authors (name, full_name, tradition, photo_url) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, name, tradition, photoUrl]
  );
  return result.rows[0].id;
}

async function upsertXassida(
  remote: RemoteXassida,
  authorId: number,
  verseCount: number
): Promise<{ id: number; inserted: boolean }> {
  const title = slugToTitle(remote.name);

  // Check if exists
  const existing = await query('SELECT id FROM xassidas WHERE title = $1', [title]);
  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, inserted: false };
  }

  // Insert
  const result = await query(
    'INSERT INTO xassidas (title, author_id, verse_count) VALUES ($1, $2, $3) RETURNING id',
    [title, authorId, verseCount]
  );
  return { id: result.rows[0].id, inserted: true };
}

async function insertVerses(
  xassidaId: number,
  chapterNumber: number,
  verses: RemoteVerse[]
): Promise<number> {
  let count = 0;
  for (const verse of verses) {
    // Build verse key: chapter:verse_number
    const verseKey = `${chapterNumber}:${verse.number}`;

    // Check if exists (use verse_key which includes chapter number)
    const existing = await query(
      'SELECT id FROM verses WHERE xassida_id = $1 AND verse_key = $2',
      [xassidaId, verseKey]
    );
    if (existing.rows.length > 0) continue;

    await query(
      `INSERT INTO verses 
        (xassida_id, verse_number, chapter_number, verse_key, text_arabic, transcription, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        xassidaId,
        verse.number,
        chapterNumber,
        verseKey,
        verse.text,
        verse.transcription || null,
        verse.text
      ]
    );
    count++;
  }
  return count;
}

async function main() {
  try {
    await query('SELECT 1');

    const xassidas = await supabaseGet<RemoteXassida>(
      `xassida?id=gte.${START_ID}&id=lte.${END_ID}&select=id,name,slug,author_id,author(id,name,tariha,picture)&order=id`
    );

    let insertedX = 0, skippedX = 0, failedX = 0, totalVerses = 0;
    const errors: { name: string; error: string }[] = [];

    for (const xassida of xassidas) {
      const title = slugToTitle(xassida.name);

      try {
        if (!xassida.author) {
          failedX++;
          continue;
        }

        const authorId = await upsertAuthor(xassida.author);

        // Fetch chapters - tolerate failures
        let chapters: RemoteChapter[] = [];
        try {
          chapters = await supabaseGet<RemoteChapter>(
            `chapter?xassida_id=eq.${xassida.id}&select=id,number,name&order=number`
          );
        } catch (err) {
          // Continue anyway - xassida may exist without chapters in API
        }

        // Upsert xassida (work even with 0 chapters)
        const { id: xassidaId, inserted } = await upsertXassida(
          xassida,
          authorId,
          Math.max(chapters.length, 1)
        );

        let versesThisX = 0;

        // Fetch and insert verses from all chapters
        for (const chapter of chapters) {
          try {
            const verses = await supabaseGet<RemoteVerse>(
              `verse?chapter_id=eq.${chapter.id}&select=id,number,key,text,transcription&order=number`
            );
            versesThisX += await insertVerses(xassidaId, chapter.number, verses);
          } catch (err) {
            // Skip failed chapters, continue with others
          }
          await sleep(50);
        }

        if (inserted) {
          console.log(`[${xassida.id}] ${versesThisX} verses`);
          insertedX++;
        } else {
          skippedX++;
        }

        totalVerses += versesThisX;
      } catch (err) {
        errors.push({ name: title, error: (err as Error).message });
        failedX++;
      }

      await sleep(DELAY_MS);
    }

    console.log('');
    console.log(`✅ ${insertedX} imported | ⏭️  ${skippedX} existing | ❌ ${failedX} failed | 📜 ${totalVerses} verses`);

    process.exit(errors.length > 0 && failedX > 5 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  }
}

main();
