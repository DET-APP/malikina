/**
 * Scraper Xassidas Complet → PostgreSQL
 * Récupère xassidas 111→165 depuis l'API xassida.sn
 * Avec traductions, audio, et tous les champs disponibles
 */

import { query } from '../db/config.js';

const START_ID = 111;
const END_ID = 165;
const DELAY_MS = 400; // Respectueux rate limiting
const API_TIMEOUT_MS = 20000; // 20 sec timeout
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

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
  picture?: string;
  bio?: string;
  birth_year?: number;
  death_year?: number;
}

interface RemoteXassida {
  id: number;
  name: string;
  slug: string;
  author_id: number;
  description?: string;
  audio_url?: string;
  youtube_id?: string;
  created_at?: string;
}

interface RemoteChapter {
  id: number;
  number: number;
  name: string;
  xassida_id: number;
  created_at?: string;
}

interface RemoteVerse {
  id: number;
  number: number;
  key: string;
  text: string;           // Arabic text
  transcription?: string; // Latin transliteration
  translation?: string;   // French translation
  audio_url?: string;     // Audio URL
  chapter_id: number;
  created_at?: string;
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
      console.log(`   📡 [${attempt}/${MAX_RETRIES}] GET ${path.substring(0, 80)}...`);
      
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
      const result = Array.isArray(data) ? data : [];
      console.log(`   ✅ Retrieved ${result.length} items`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`   ⚠️  Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`);
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }
  
  console.error(`   ❌ Failed after ${MAX_RETRIES} attempts`);
  return [];
}

async function upsertAuthor(remote: RemoteAuthor): Promise<number> {
  const name = slugToTitle(remote.name);
  const tradition = remote.tariha?.charAt(0).toUpperCase() + (remote.tariha?.slice(1) || '');
  const photoUrl = remote.picture
    ? `${SUPABASE_URL}/storage/v1/object/public/images/${remote.picture}`
    : null;

  const existing = await query('SELECT id FROM authors WHERE name = $1', [name]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await query(
    'INSERT INTO authors (name, full_name, tradition, photo_url, birth_year, death_year) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [name, name, tradition, photoUrl, remote.birth_year || null, remote.death_year || null]
  );
  return result.rows[0].id;
}

async function upsertXassida(
  remote: RemoteXassida,
  authorId: number,
  verseCount: number
): Promise<{ id: number; inserted: boolean }> {
  const title = slugToTitle(remote.name);

  const existing = await query('SELECT id FROM xassidas WHERE title = $1', [title]);
  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, inserted: false };
  }

  const result = await query(
    `INSERT INTO xassidas (title, author_id, verse_count, audio_url, youtube_id, description) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      title,
      authorId,
      verseCount,
      remote.audio_url || null,
      remote.youtube_id || null,
      remote.description || null
    ]
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
    const verseKey = `${chapterNumber}:${verse.number}`;

    const existing = await query(
      'SELECT id FROM verses WHERE xassida_id = $1 AND verse_key = $2',
      [xassidaId, verseKey]
    );
    if (existing.rows.length > 0) continue;

    // Insert with ALL available fields
    await query(
      `INSERT INTO verses 
        (xassida_id, verse_number, chapter_number, verse_key, text_arabic, 
         transcription, translation_fr, audio_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        xassidaId,
        verse.number,
        chapterNumber,
        verseKey,
        verse.text || null,
        verse.transcription || null,
        verse.translation || null,
        verse.audio_url || null
      ]
    );
    count++;
  }
  return count;
}

async function fetchAuthor(id: number): Promise<RemoteAuthor | null> {
  try {
    const authors = await supabaseGet<RemoteAuthor>(`author?id=eq.${id}`);
    return authors && authors.length > 0 ? authors[0] : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('\n🚀 SCRAPER XASSIDAS COMPLET\n');
  
  try {
    // Test connection
    await query('SELECT 1');
    console.log('✅ PostgreSQL connected\n');

    // Fetch all xassidas (without nested relations - API doesn't support complex selects)
    console.log(`📥 Fetching xassidas (${START_ID}→${END_ID})...`);
    const xassidas = await supabaseGet<RemoteXassida>(
      `xassida?id=gte.${START_ID}&id=lte.${END_ID}&order=id`
    );

    if (!xassidas || xassidas.length === 0) {
      console.error('❌ No xassidas fetched!');
      process.exit(1);
    }

    console.log(`✅ ${xassidas.length} xassidas to process\n`);

    let insertedX = 0, skippedX = 0, failedX = 0, totalVerses = 0;
    const errors: { name: string; error: string }[] = [];

    // Process each xassida
    for (let i = 0; i < xassidas.length; i++) {
      const xassida = xassidas[i];
      const title = slugToTitle(xassida.name);
      const progress = `[${i + 1}/${xassidas.length}]`;

      try {
        // Fetch author separately (API doesn't support nested relations)
        const author = await fetchAuthor(xassida.author_id);
        if (!author) {
          console.log(`${progress} ⏭️  "${title}" - No author (ID: ${xassida.author_id})`);
          failedX++;
          continue;
        }

        // Upsert author
        const authorId = await upsertAuthor(author);

        // Fetch chapters with all fields
        console.log(`${progress} 📖 "${title}"`);
        let chapters: RemoteChapter[] = [];
        try {
          chapters = await supabaseGet<RemoteChapter>(
            `chapter?xassida_id=eq.${xassida.id}&order=number`
          );
        } catch (err) {
          console.warn(`   ⚠️  Could not fetch chapters`);
        }

        // Upsert xassida
        const { id: xassidaId, inserted } = await upsertXassida(
          xassida,
          authorId,
          Math.max(chapters.length, 1)
        );

        let versesThisX = 0;

        // Process each chapter's verses
        for (const chapter of chapters) {
          try {
            // Fetch verses - get all available fields
            const verses = await supabaseGet<RemoteVerse>(
              `verse?chapter_id=eq.${chapter.id}&order=number`
            );
            
            versesThisX += await insertVerses(xassidaId, chapter.number, verses);
          } catch (err) {
            console.warn(`   ⚠️  Could not fetch verses for chapter ${chapter.number}`);
          }
          
          // Small delay between chapter requests
          await sleep(50);
        }

        if (inserted) {
          console.log(`   ✅ Created | ${versesThisX} verses`);
          insertedX++;
        } else {
          console.log(`   ⏭️  Already exists | ${versesThisX} verses`);
          skippedX++;
        }

        totalVerses += versesThisX;
      } catch (err) {
        const error = err as Error;
        console.log(`   ❌ Error: ${error.message}`);
        errors.push({ name: title, error: error.message });
        failedX++;
      }

      // Rate limiting delay between xassidas
      await sleep(DELAY_MS);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`
📊 RÉSULTATS:
  ✅ Created:     ${insertedX} xassidas
  ⏭️  Existing:    ${skippedX} xassidas
  ❌ Failed:      ${failedX} xassidas
  📜 Total vers:  ${totalVerses} verses
    `);

    if (errors.length > 0) {
      console.log('❌ Errors encountered:');
      errors.forEach(e => console.log(`   - ${e.name}: ${e.error}`));
    }

    console.log('='.repeat(60) + '\n');
    process.exit(errors.length > 0 && failedX > 5 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  }
}

main();
