// src/components/prayer/types.ts
import { LucideIcon } from "lucide-react";

export interface Prayer {
  name: string;
  arabic: string;
  time: string;
  icon: LucideIcon;
}

export interface City {
  name: string;
  lat: number;
  lon: number;
  school?: number;  // 0 = Shafi'i (défaut), 1 = Hanafi (Asr tardif)
  tune?: string;    // offsets en minutes: Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight
}

export interface NextPrayer {
  name: string;
  time: string;
  remaining: string;
}

export interface PrayerNotifications {
  [key: string]: boolean;
}

export const prayerNamesArabic = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء"
} as const;

export const prayerDisplayNames = {
  Fajr: "Fajr",
  Sunrise: "Chourouq",
  Dhuhr: "Dhuhr",
  Asr: "Asr",
  Maghrib: "Maghrib",
  Isha: "Isha"
} as const;