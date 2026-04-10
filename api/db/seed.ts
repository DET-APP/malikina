import { query } from './config.js';

// Sample data for seeding
const authors = [
  {
    name: 'cheikh-anta-diop',
    fullName: 'Cheikh Anta Diop',
    arabic: 'الشيخ انطا ديوب',
    description: 'Savant sénégalais et auteur de xassidas spirituelles',
    tradition: 'Tidjiane',
    birthYear: 1923,
    deathYear: 2007
  },
  {
    name: 'babacar-sy',
    fullName: 'Babacar Sy',
    arabic: 'بابا كار سي',
    description: 'Auteur de xassidas célèbres',
    tradition: 'Tidjiane',
    birthYear: 1915,
    deathYear: 1995
  },
  {
    name: 'maodo',
    fullName: 'Maodo',
    arabic: 'معوض',
    description: 'Grand saint musulman tidjiane',
    tradition: 'Tidjiane',
    birthYear: 1883,
    deathYear: 1968
  }
];

export async function seedDatabase() {
  try {
    console.log('Starting database seed...');
    
    // Check if authors exist
    const result = await query('SELECT COUNT(*) as count FROM authors');
    if (result.rows[0].count > 0) {
      console.log('✓ Database already seeded, skipping...');
      return;
    }

    // Insert sample authors
    for (const author of authors) {
      await query(
        'INSERT INTO authors (name, full_name, arabic, description, tradition, birth_year, death_year) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [author.name, author.fullName, author.arabic, author.description, author.tradition, author.birthYear, author.deathYear]
      );
      console.log(`✓ Author created: ${author.fullName}`);
    }

    // Insert sample xassida
    const diop = await query('SELECT id FROM authors WHERE name = $1', ['cheikh-anta-diop']);
    if (diop.rows.length > 0) {
      await query(
        'INSERT INTO xassidas (title, author_id, description, verse_count, categorie) VALUES ($1, $2, $3, $4, $5)',
        [
          'Tamurul Layali',
          diop.rows[0].id,
          'Une célèbre xassida tidjiane',
          10,
          'spirituelle'
        ]
      );
      console.log('✓ Sample xassida created');
    }

    console.log('✅ Database seed completed');
  } catch (error) {
    console.error('❌ Seed error:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Tables already exist, continuing...');
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch(console.error);
}
