// src/hooks/useVerseOfTheDay.ts
import { useState, useEffect } from "react";

export interface VerseOfTheDay {
    id: number;
    surahNumber: number;
    surahName: string;
    surahNameArabic: string;
    verseNumber: number;
    text: string;
    translation: string;
}

export const useVerseOfTheDay = () => {
    const [verse, setVerse] = useState<VerseOfTheDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVerseOfTheDay();
    }, []);

    const fetchVerseOfTheDay = async () => {
        try {
            setLoading(true);

            // Récupérer un verset aléatoire (entre 1 et 6236)
            const randomAyah = Math.floor(Math.random() * 6236) + 1;

            // API pour récupérer un verset aléatoire avec sa traduction
            const response = await fetch(
                `https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,fr.hamidullah`
            );

            if (!response.ok) {
                throw new Error("Erreur lors du chargement du verset");
            }

            const data = await response.json();

            if (data.data && data.data.length >= 2) {
                const arabicData = data.data[0];
                const translationData = data.data[1];

                // Récupérer les infos de la sourate
                const surahResponse = await fetch(
                    `https://api.alquran.cloud/v1/surah/${arabicData.surah.number}`
                );
                const surahData = await surahResponse.json();

                setVerse({
                    id: randomAyah,
                    surahNumber: arabicData.surah.number,
                    surahName: arabicData.surah.englishName,
                    surahNameArabic: surahData.data.name,
                    verseNumber: arabicData.numberInSurah,
                    text: arabicData.text,
                    translation: translationData.text,
                });
            }
        } catch (err) {
            console.error("Erreur:", err);
            setError("Impossible de charger le verset du jour");

            // Fallback avec Ayat al-Kursi
            setVerse({
                id: 255,
                surahNumber: 2,
                surahName: "Al-Baqarah",
                surahNameArabic: "البقرة",
                verseNumber: 255,
                text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
                translation: "Allah! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. A Lui appartient tout ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission? Il connaît leur passé et leur futur. Et, de Sa science, ils n'embrassent que ce qu'Il veut. Son Trône déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très Haut, le Très Grand.",
            });
        } finally {
            setLoading(false);
        }
    };

    const refreshVerse = () => {
        fetchVerseOfTheDay();
    };

    return { verse, loading, error, refreshVerse };
};