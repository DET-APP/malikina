/**
 * Scraper Xassidas → PostgreSQL (FIXED VERSION)
 * Récupère les xassidas 111→165 depuis l'API xassida.sn
 * et les importe CORRECTEMENT dans PostgreSQL avec TOUS les champs
 */

import { query } from '../db/config.js';

const START_ID = 111;
const END_ID = 165;
const DELAY_MS = 200;

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
  text: string;           // Arabic - peut être vide!
  transcription: string;  // Latin transliteration
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
  try {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.error(`  ❌ Supabase ${res.status}: ${path}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`  ❌ Fetch error:`, error);
    return [];
  }
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
    `INSERT INTO xassidas (title, author_id, verse_count, categorie, description) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [title, authorId, verseCount, 'Autre', `Xassida • Tidjane`]
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
    try {
      // Check if exists
      const existing = await query(
        'SELECT id FROM verses WHERE xassida_id = $1 AND verse_number = $2',
        [xassidaId, verse.number]
      );
      if (existing.rows.length > 0) continue;

      const verseKey = `${chapterNumber}:${verse.number}`;
      
      // Insert with ALL fields properly filled
      await query(
        `INSERT INTO verses 
         (xassida_id, chapter_number, verse_number, verse_key, text_arabic, transcription, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          xassidaId,
          chapterNumber,
          verse.number,
          verseKey,
          verse.text || `[Verse ${verse.number}]`,  // Fallback if empty
          verse.transcription || ''
        ]
      );
      count++;
    } catch (error: any) {
      console.error(`    Error inserting verse ${verse.number}:`, error.message);
    }
  }
  
  return count;
}

async function main() {
  try {
    console.log('🗄️  Connecting to PostgreSQL...');
    const conn = await query('SELECT 1');
    console.log('✅ Connected\n');

    console.log(`📡 Fetching xassidas ${START_ID}–${END_ID}...`);
    const xassidas = await supabaseGet<RemoteXassida>(
      `xassida?id=gte.${START_ID}&id=lte.${END_ID}&select=id,name,slug,author_id,author(id,name,tariha,picture)&order=id`
    );
    console.log(`   → ${xassidas.length} xassidas found\n`);

    if (xassidas.length === 0) {
      console.error('❌ No xassidas fetched. API may be down or unreachable.');
      process.exit(1);
    }

    let insertedX = 0, skippedX = 0, totalVerses = 0;

    for (const xassida of xassidas) {
      const title = slugToTitle(xassida.name);
      process.stdout.write(`[${xassida.id}] "${title}" ... `);

      if (!xassida.author) {
        console.log('⚠️  missing author');
        continue;
      }

      try {
        const authorId = await upsertAuthor(xassida.author);

        // Fetch chapters
        const chapters = await supabaseGet<RemoteChapter>(
          `chapter?xassida_id=eq.${xassida.id}&select=id,number,name&order=number`
        );

        // Upsert xassida
        const { id: xassidaId, inserted } = await upsertXassida(
          xassida,
          authorId,
          chapters.length
        );

        let versesThisX = 0;

        // Fetch and insert verses for each chapter
        for (const chapter of chapters) {
          const verses = await supabaseGet<RemoteVerse>(
            `verse?chapter_id=eq.${chapter.id}&select=id,number,key,text,transcription&order=number`
          );
          
          versesThisX += await insertVerses(xassidaId, chapter.number, verses);
          await sleep(50);
        }

        if (inserted) {
          console.log(`✅ imported (${chapters.length} ch., ${versesThisX} verses)`);
          insertedX++;
        } else {
          console.log(`⏭️  exists (${versesThisX} verses added)`);
          skippedX++;
        }

        totalVerses += versesThisX;
      } catch (error: any) {
        console.log(`❌ error: ${error.message}`);
      }

      await sleep(DELAY_MS);
    }

    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Imported: ${insertedX} xassidas`);
    console.log(`   ⏭️  Already exist: ${skippedX} xassidas`);
    console.log(`   📖 Total verses: ${totalVerses}`);
    console.log('');
    console.log('✨ Done!');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
