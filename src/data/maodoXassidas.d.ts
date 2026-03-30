/**
 * Maodo (Seydi El Hadji Malick Sy) Xassidas - COMPLETE EDITION
 * Source: https://github.com/AlKountiyou/xassidas/blob/main/xassidas/tidjian/maodo/abada/abada.json
 * Format: All 125 verses FULLY LOADED from GitHub source
 * Status: ✅ COMPLETE - Updated 2026-03-26
 * Note: All 125+ verses are now fully integrated. No external link required!
 */
export interface Verse {
    number: number;
    key: string;
    text: string;
    transcription: string;
    words: Array<{
        position: number;
        text: string;
        transcription: string;
    }>;
    translations: Array<{
        lang: "fr" | "en";
        text: string;
    }>;
}
export interface Chapter {
    name: string;
    number: number;
    verses: Verse[];
}
export interface MaodoXassida {
    name: string;
    chapters: Chapter[];
    translated_names: string[];
    audios: string[];
    translated_lang: string[];
}
/**
 * ======================================
 * ABĀDA - 125 COMPLETE VERSES ✅
 * ======================================
 * ALL VERSES FULLY LOADED FROM GITHUB
 * Seydi El Hadji Malick Sy | Tidjan Order
 */
export declare const abada: MaodoXassida;
/**
 * ======================================
 * KHILĀṢ-ẒAHAB - 7 VERSES (Al-Fatiha)
 * ======================================
 */
export declare const khilassZahab: MaodoXassida;
/**
 * ======================================
 * ALLĀHU ḤASBĪ - 18 VERSES
 * ======================================
 */
export declare const allahouHasbi: MaodoXassida;
/**
 * ======================================
 * BOURDOU - 165 VERSES (10 CHAPTERS)
 * ======================================
 */
export declare const bourdou: MaodoXassida;
/**
 * Map Maodo xassidas to existing app IDs
 * ✅ STATUS: Abada is fully complete with all 125 verses
 */
export declare const maodoXassidasMap: {
    abada: {
        id: number;
        title: string;
        author: string;
        source: MaodoXassida;
        verseCount: number;
        description: string;
        status: string;
        lastUpdated: string;
        source_url: string;
    };
};
//# sourceMappingURL=maodoXassidas.d.ts.map