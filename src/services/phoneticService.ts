// src/services/phoneticService.ts
// Service pour ajouter des transcriptions phonétiques aux versets

// Dictionnaire de base pour la transcription phonétique
const arabicToPhoneticMap: Record<string, string> = {
    // Lettres arabes
    'ا': 'a',
    'ب': 'b',
    'ت': 't',
    'ث': 'th',
    'ج': 'j',
    'ح': 'ḥ',
    'خ': 'kh',
    'د': 'd',
    'ذ': 'dh',
    'ر': 'r',
    'ز': 'z',
    'س': 's',
    'ش': 'sh',
    'ص': 'ṣ',
    'ض': 'ḍ',
    'ط': 'ṭ',
    'ظ': 'ẓ',
    'ع': 'ʿ',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'q',
    'ك': 'k',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'ه': 'h',
    'و': 'w',
    'ي': 'y',

    // Voyelles et signes
    'َ': 'a',
    'ِ': 'i',
    'ُ': 'u',
    'ْ': '',
    'ً': 'an',
    'ٍ': 'in',
    'ٌ': 'un',
    'ّ': '',
    'آ': 'ā',
    'ة': 'h',
    'ى': 'ā',
};

// Base de données de transcriptions pour les versets célèbres
const famousVerses: Record<string, string> = {
    // Sourate Al-Fatiha (1-7)
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ': 'Bismillāhi r-raḥmāni r-raḥīm',
    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ': 'Al-ḥamdu lillāhi rabbi l-ʿālamīn',
    'الرَّحْمَٰنِ الرَّحِيمِ': 'Ar-raḥmāni r-raḥīm',
    'مَالِكِ يَوْمِ الدِّينِ': 'Māliki yawmi d-dīn',
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ': 'Iyyāka naʿbudu wa iyyāka nastaʿīn',
    'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ': 'Ihdinā ṣ-ṣirāṭa l-mustaqīm',
    'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ': 'Ṣirāṭa l-laḏīna anʿamta ʿalayhim ġayri l-maġḍūbi ʿalayhim wa la ḍ-ḍāllīn',

    // Ayat al-Kursi (Sourate 2:255)
    'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ': 'Allāhu lā ilāha illā hū l-ḥayyu l-qayyūm',

    // Sourate Al-Ikhlas (112)
    'قُلْ هُوَ اللَّهُ أَحَدٌ': 'Qul huwa llāhu aḥad',
    'اللَّهُ الصَّمَدُ': 'Allāhu ṣ-ṣamad',
    'لَمْ يَلِدْ وَلَمْ يُولَدْ': 'Lam yalid wa lam yūlad',
    'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ': 'Wa lam yakun lahū kufuwan aḥad',

    // Sourate Al-Falaq (113)
    'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ': 'Qul aʿūḏu bi-rabbi l-falaq',
    'مِنْ شَرِّ مَا خَلَقَ': 'Min sharri mā khalaq',
    'وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ': 'Wa min sharri ġāsiqin iḏā waqab',
    'وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ': 'Wa min sharri n-naffāṯāti fī l-ʿuqad',
    'وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ': 'Wa min sharri ḥāsidin iḏā ḥasad',

    // Sourate An-Nas (114)
    'قُلْ أَعُوذُ بِرَبِّ النَّاسِ': 'Qul aʿūḏu bi-rabbi n-nās',
    'مَلِكِ النَّاسِ': 'Maliki n-nās',
    'إِلَٰهِ النَّاسِ': 'Ilāhi n-nās',
    'مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ': 'Min sharri l-waswāsi l-khannās',
    'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ': 'Allaḏī yuwaswisu fī ṣudūri n-nās',
    'مِنَ الْجِنَّةِ وَالنَّاسِ': 'Mina l-jinnati wa n-nās',
};

// Fonction pour nettoyer le texte arabe
const cleanArabicText = (text: string): string => {
    return text
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, '') // Enlever les chiffres arabes
        .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, '') // Enlever les diacritiques
        .trim();
};

// Fonction pour générer une transcription phonétique simple
export const generatePhoneticText = (arabicText: string): string => {
    // Vérifier si c'est un verset célèbre
    const cleanedText = cleanArabicText(arabicText);
    for (const [verse, transcription] of Object.entries(famousVerses)) {
        if (cleanedText.includes(cleanArabicText(verse))) {
            return transcription;
        }
    }

    // Sinon, générer une transcription basique
    let phonetic = '';
    const words = arabicText.split(' ');

    for (const word of words) {
        let wordPhonetic = '';
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (arabicToPhoneticMap[char]) {
                wordPhonetic += arabicToPhoneticMap[char];
            }
        }
        phonetic += wordPhonetic + ' ';
    }

    return phonetic.trim();
};

// Fonction principale pour obtenir la transcription
export const getPhoneticTranscription = (verseText: string): string => {
    // Nettoyer le texte pour la recherche
    const cleanedVerse = cleanArabicText(verseText);

    // Chercher dans les versets célèbres
    for (const [verse, transcription] of Object.entries(famousVerses)) {
        if (cleanedVerse.includes(cleanArabicText(verse))) {
            return transcription;
        }
    }

    // Générer une transcription basique
    return generatePhoneticText(verseText);
};