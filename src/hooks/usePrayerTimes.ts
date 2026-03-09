// src/hooks/usePrayerTimes.ts
import { useState, useEffect } from "react";

export interface NextPrayer {
    name: string;
    time: string;
    remaining: string;
}

export const usePrayerTimes = (toast: any) => {
    const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
    const [loading, setLoading] = useState(true);

    // Coordonnées par défaut (Dakar)
    const defaultLat = 14.7167;
    const defaultLon = -17.4677;

    const fetchPrayerTimes = async (lat: number, lon: number) => {
        try {
            setLoading(true);
            const method = 3;
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

            const response = await fetch(
                `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=${method}`
            );

            if (!response.ok) throw new Error("Erreur lors du chargement");

            const data = await response.json();
            const timings = data.data.timings;

            calculateNextPrayer(timings);

        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de charger les horaires de prière",
                variant: "destructive",
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateNextPrayer = (timings: any) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const prayers = [
            { name: "Fajr", time: timings.Fajr },
            { name: "Dhuhr", time: timings.Dhuhr },
            { name: "Asr", time: timings.Asr },
            { name: "Maghrib", time: timings.Maghrib },
            { name: "Isha", time: timings.Isha },
        ];

        const prayerTimesInMinutes = prayers.map(p => {
            const [hours, minutes] = p.time.split(':').map(Number);
            return { ...p, totalMinutes: hours * 60 + minutes };
        });

        let next = prayerTimesInMinutes.find(p => p.totalMinutes > currentTime);

        if (!next) {
            next = prayerTimesInMinutes[0];
            const remaining = (24 * 60 - currentTime) + next.totalMinutes;
            const hours = Math.floor(remaining / 60);
            const mins = remaining % 60;
            setNextPrayer({
                name: next.name === "Maghrib" ? "Maghreb" : next.name,
                time: next.time,
                remaining: `${hours}h ${mins}`
            });
        } else {
            const remaining = next.totalMinutes - currentTime;
            const hours = Math.floor(remaining / 60);
            const mins = remaining % 60;
            setNextPrayer({
                name: next.name === "Maghrib" ? "Maghreb" : next.name,
                time: next.time,
                remaining: `${hours}h ${mins}`
            });
        }
    };

    useEffect(() => {
        fetchPrayerTimes(defaultLat, defaultLon);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (nextPrayer) {
                fetchPrayerTimes(defaultLat, defaultLon);
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [nextPrayer]);

    return { nextPrayer, loading };
};