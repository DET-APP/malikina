// src/services/quranApi.ts
const BASE_URL = 'https://api.quran.com/api/v4';

// Interfaces pour typer les réponses
export interface Chapter {
    id: number;
    revelation_place: string;
    revelation_order: number;
    bismillah_pre: boolean;
    name_simple: string;
    name_complex: string;
    name_arabic: string;
    verses_count: number;
    pages: [number, number];
    translated_name: {
        language_name: string;
        name: string;
    };
}

export interface Verse {
    id: number;
    verse_number: number;
    verse_key: string;
    text_uthmani: string;
    text_uthmani_simple?: string;
    translations?: Array<{
        text: string;
        language_name: string;
        resource_name?: string;
    }>;
}

// Service pour récupérer toutes les sourates
export const getAllChapters = async (language: string = 'fr'): Promise<Chapter[]> => {
    try {
        const response = await fetch(`${BASE_URL}/chapters?language=${language}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des sourates');
        const data = await response.json();
        return data.chapters;
    } catch (error) {
        console.error('Erreur API Quran.com:', error);
        throw error;
    }
};

// Service pour récupérer les versets d'un Juz
export const getVersesByJuz = async (
    juzNumber: number,
    translations: number | string = 83 // 83 = français (Montada)
): Promise<Verse[]> => {
    try {
        const response = await fetch(
            `${BASE_URL}/verses/by_juz/${juzNumber}?translations=${translations}&per_page=300`
        );
        if (!response.ok) throw new Error(`Erreur lors du chargement du Juz ${juzNumber}`);
        const data = await response.json();
        return data.verses;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
};

// Service pour récupérer une sourate spécifique
export const getChapterById = async (chapterId: number, language: string = 'fr'): Promise<Chapter> => {
    try {
        const response = await fetch(`${BASE_URL}/chapters/${chapterId}?language=${language}`);
        if (!response.ok) throw new Error('Erreur lors du chargement de la sourate');
        const data = await response.json();
        return data.chapter;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
};