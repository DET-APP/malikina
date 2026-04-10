-- Migration: Populate verses with authentic data (Abада)
-- Source: https://github.com/AlKountiyou/xassidas/blob/main/xassidas/tidjian/maodo/abada/abada.json

-- First, ensure author exists
INSERT INTO authors (name, description, tradition, created_at, updated_at) 
VALUES ('El Hadj Malick Sy', 'Saint-Patron de la confrérie Tidjiane', 'Tidjiane', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Get the author ID
WITH author_id AS (
  SELECT id FROM authors 
  WHERE name = 'El Hadj Malick Sy' 
  LIMIT 1
)

-- Create or update Abađâ xassida
INSERT INTO xassidas (title, author_id, arabic_name, description, verse_count, categorie, created_at, updated_at)
SELECT 'Abada', id, 'أَبَدَا', 'O eternité! Une des plus célèbres xassidas du Saint-Patron', 16, 'Louange', NOW(), NOW()
FROM author_id
ON CONFLICT (title) DO UPDATE SET updated_at = NOW();

-- Get xassida ID for verse insertion
WITH xassida_id AS (
  SELECT id FROM xassidas WHERE title = 'Abada' LIMIT 1
)

-- Delete old empty verses
DELETE FROM verses 
WHERE xassida_id IN (SELECT id FROM xassidas WHERE title = 'Abada')
  AND (content_ar = '' OR content_ar IS NULL);

-- Insert authentic verses (first batch: 16 verses)
INSERT INTO verses (xassida_id, verse_number, content_ar, translation_fr, created_at, updated_at)
SELECT 
  (SELECT id FROM xassidas WHERE title = 'Abada' LIMIT 1),
  verse_number,
  content_ar,
  translation_fr,
  NOW(),
  NOW()
FROM (
  VALUES 
    (1, 'أَبَدَا بُرُوقٌ تَحْتَ جُنْحِ ظَلَامِ', 'Éternellement des éclairs sous l''aile de l''obscurité'),
    (2, 'أَمْ وَجْهُ مَيَّةَ أَمْ رُبُوعُ شَمَامِ', 'Est-ce le visage de Mayyah ou les dunes du parfum?'),
    (3, 'إِنَّ الرُّبُوعَ بِشَارَتِي وَأَمَانَتِي', 'Les dunes sont ma bonne nouvelle et mon dépôt'),
    (4, 'وَرَبِيعُ قَلْبِي وَهْيَ خَيْرُ شِيَامِ', 'Et le printemps de mon cœur, c''est le meilleur des mois'),
    (5, 'وَالَّدَمْعُ إِذْ بَعُدَتْ رُبُوعُ رُبُوعِنَا', 'Et les larmes ne cessent de couler quand les dunes s''éloignent'),
    (6, 'جَارٍ وَجَارِحُ مَنْحَرٍ بِسِهَامِ', 'Coulant et sillonnant le cou percé de flèches'),
    (7, 'مَهْ عَاذِلِي لَوْ حُزْتَ عِلْمًا لَمْ تَلُمْ', 'Ô ma raison critique! Si tu avais compris le mystère'),
    (8, 'هَلْ عَذْلُ مِثْلِي لَمْ يَكُنْ بِحَرَامِ', 'Le blâme de quelqu''un comme moi n''était-il pas forbidden'),
    (9, 'مَلَأَ الْفُؤَادَ قُضَاةُ شَوْقِي وَالْهَوَى', 'Les juges du désir et de la passion remplissent mon cœur'),
    (10, 'أَلَمًا وَوَجْدًا يَا لَطُولَ هُيَامِ', 'De douleur et d''amour - que ce délire persiste!'),
    (11, 'يَا عَادِيًا يَعْلُو السِّنَادَ فَبَلِّغَنْ', 'Ô caravane qui monte au-dessus du relief!'),
    (12, 'سَلْعًا وَسَلْ عَنْ جِيرَتِي بِسَلَامِ', 'Salue mes voisins d''une salutation de paix!'),
    (13, 'فَارْبَعْ عَلَى مَجْنُونِ لَيْلَى إِنَّ لِي', 'Sois indulgent envers le fou d''amour de Layla'),
    (14, 'دَاءً دَوِيًّا مَا أَبَلَّ سَقَامِ', 'Une maladie cruelle que nulle guérison n''effacera'),
    (15, 'وَاقْرَأْ سَلَامًا طَيِّبًا تُفْشِيهِ مِنْ', 'Lis une salutation pure que tu envoies'),
    (16, 'حِبٍّ إِلَى نَاسٍ هُدِيتَ هُمَامِ', 'De l''amour à des gens en qui j''ai mis mon espoir')
) AS verses(verse_number, content_ar, translation_fr)
ON CONFLICT DO NOTHING;
