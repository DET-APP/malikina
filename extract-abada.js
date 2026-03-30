// Convert Abada verses to enriched text format
// Reads maodoXassidas.ts and outputs full text for enrichedQassidasData

const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'src/data/maodoXassidas.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Extract the abada export using regex
const abadaregex = /export const abada: MaodoXassida = ({[\s\S]*?});/;
const match = content.match(abadaregex);

if (!match) {
  console.error('Could not find abada export');
  process.exit(1);
}

// Extract verses from the matched content
const abadaContent = match[1];

// Find all verses using a regex pattern
const verseRegex = /{ number: (\d+), key: "[^"]*", text: "([^"]*)", transcription: "([^"]*)"[^}]*}/g;
let verse;
const verses = [];

while ((verse = verseRegex.exec(abadaContent)) !== null) {
  verses.push({
    number: parseInt(verse[1]),
    text: verse[2],
    transcription: verse[3]
  });
}

console.log(`Found ${verses.length} verses`);

// Generate formatted text with all verses
let fullText = '';
verses.forEach((v, index) => {
  if (v.number === 0) {
    fullText += `بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ\nSmi l-lahi r-raḥmani r-raḥīmi\n\n`;
  } else {
    fullText += `${v.text} - ${v.transcription}`;
    if ((index + 1) % 2 === 0) {
      fullText += '\n\n';
    } else {
      fullText += '\n';
    }
  }
});

// Output the fullText as a string that can be used in enrichedQassidasData
console.log('\n========== FULL TEXT FOR enrichedQassidasData ==========\n');
console.log('fullText: `' + fullText + '`');

// Also save to a temp file for inspection
fs.writeFileSync(path.join(__dirname, 'abada-full-text.txt'), fullText);
console.log('\n\nFull text saved to abada-full-text.txt');
