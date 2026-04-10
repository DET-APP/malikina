#!/usr/bin/env node

/**
 * Script to scrape xassidas from xassida.sn
 * Downloads xassida data (111-165) and generates qassidas-extended.ts
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.xassida.sn/api/xassida';
const START_ID = 111;
const END_ID = 165;
const OUTPUT_FILE = path.join(__dirname, '../src/data/qassidas-extended.ts');

// Configuration mapping for authors from xassida.sn API
const authorMapping = {
  "Seydi El Hadji Malick Sy": "Seydi El Hadji Malick Sy",
  "Serigne Cheikh Anta Diop": "Serigne Cheikh Anta Diop",
  "Serigne Cheikh Tidiane Sy": "Serigne Cheikh Tidiane Sy",
  "Serigne Abdou Aziz Sy Dabakh": "Serigne Abdou Aziz Sy Dabakh",
  "Serigne Babacar Sy": "Serigne Babacar Sy",
  "Mansour Sy Malick": "Mansour Sy Malick",
  "Shaykh Ibrahim Niasse": "Shaykh Ibrahim Niasse",
};

const confraternityMapping = {
  "Tidjane": "Tidjane",
  "Qa­diriyya": "Qa­diriyya",
  "Mouride": "Mouride",
  "Layene": "Layene",
};

/**
 * Fetch xassida from API
 */
async function fetchXassida(id) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL}/${id}/`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          console.error(`Error parsing xassida ${id}:`, e.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`Error fetching xassida ${id}:`, err.message);
      resolve(null);
    });
  });
}

/**
 * Transform API response to app format
 */
function transformXassida(apiData, localId) {
  if (!apiData) return null;

  return {
    id: localId,
    title: apiData.title || '',
    arabic: apiData.arabic_title || apiData.title || '',
    author: apiData.author?.name || 'Unknown',
    confraternity: apiData.author?.confraternity || 'Tidjane',
    isFavorite: false,
    fullText: apiData.full_text || '',
    transliteration: apiData.transliteration || '',
    audioUrl: apiData.audio_url || null,
    pdfUrl: apiData.pdf_url || null,
    externalId: apiData.id,
  };
}

/**
 * Generate TypeScript code
 */
function generateTypeScriptCode(xassidas) {
  const validData = xassidas.filter(x => x !== null);
  
  const code = `/**
 * Extended Xassidas Data
 * Generated from xassida.sn API
 * IDs: 111-165
 */

import type { Qassida } from './qassidasData';

export const qassidas111to165: Qassida[] = ${JSON.stringify(validData, null, 2)};

/**
 * Combined qassidas (original + extended)
 */
export function getAllQassidas(originalQassidas: Qassida[]): Qassida[] {
  // Merge and handle duplicates (by external ID)
  const seenExternalIds = new Set();
  const merged = [
    ...originalQassidas,
    ...qassidas111to165.filter(q => {
      if (seenExternalIds.has(q.id)) return false;
      seenExternalIds.add(q.id);
      return true;
    })
  ];
  
  return merged.sort((a, b) => a.id - b.id);
}
`;

  return code;
}

/**
 * Main execution
 */
async function main() {
  console.log(`📥 Scraping xassidas from ${START_ID} to ${END_ID}...`);
  
  const xassidas = [];
  const errors = [];
  
  for (let i = START_ID; i <= END_ID; i++) {
    process.stdout.write(`\r   Progress: ${i - START_ID + 1}/${END_ID - START_ID + 1}`);
    
    const apiData = await fetchXassida(i);
    const transformed = transformXassida(apiData, i);
    
    if (transformed) {
      xassidas.push(transformed);
    } else {
      errors.push(i);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✅ Scraped ${xassidas.length} xassidas`);
  
  if (errors.length > 0) {
    console.warn(`⚠️  Failed to fetch ${errors.length} xassidas: ${errors.join(', ')}`);
  }
  
  // Generate and save file
  const code = generateTypeScriptCode(xassidas);
  
  fs.writeFileSync(OUTPUT_FILE, code);
  console.log(`\n📄 Saved to: ${OUTPUT_FILE}`);
  console.log(`\n✨ Done! Generated ${xassidas.length} xassidas.`);
}

// Run
main().catch(console.error);
