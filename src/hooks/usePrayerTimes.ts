// src/hooks/usePrayerTimes.ts
import { useState, useEffect } from "react";

export interface PrayerStatus {
    name: string;
    time: string;
    status: "moukhtar" | "darouri" | "qada";
    statusText: string;
}

export interface NextPrayer {
    name: string;
    time: string;
    remaining: string;
    remainingInSeconds?: number;
    upcomingPrayers?: PrayerStatus[];
    currentPrayerStatus?: string;
}

export const usePrayerTimes = (toast: any) => {
    const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
    const [loading, setLoading] = useState(true);

    // Bambey (UAD) — méthode locale Tijaniyya par défaut
    const defaultLat = 14.7000;
    const defaultLon = -16.4500;
    const defaultSchool = 0;
    const defaultTune = "0,5,0,72,46,10,0,0,0";

    // Durées en minutes pour chaque période
    const prayerDurations = {
        Fajr: { moukhtar: 30, darouri: 60 },     // Fajr: moukhtar 30min, darouri jusqu'à 60min
        Dhuhr: { moukhtar: 45, darouri: 90 },    // Dhuhr: moukhtar 45min, darouri jusqu'à 90min
        Asr: { moukhtar: 45, darouri: 90 },      // Asr: moukhtar 45min, darouri jusqu'à 90min
        Maghrib: { moukhtar: 30, darouri: 60 },  // Maghrib: moukhtar 30min, darouri jusqu'à 60min
        Isha: { moukhtar: 60, darouri: 120 }     // Isha: moukhtar 60min, darouri jusqu'à 120min
    };

    const fetchPrayerTimes = async (lat: number, lon: number) => {
        try {
            setLoading(true);
            const method = 3;
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

            const response = await fetch(
                `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=${method}&school=${defaultSchool}&tune=${defaultTune}&timezonestring=Africa%2FDakar`
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

    const getPrayerStatus = (prayerName: string, prayerTimeMinutes: number, currentTime: number, nextPrayerTimeMinutes: number): PrayerStatus => {
        const duration = prayerDurations[prayerName as keyof typeof prayerDurations];
        if (!duration) {
            return { name: prayerName, time: "", status: "qada", statusText: "" };
        }

        const moukhtarEnd = prayerTimeMinutes + duration.moukhtar;
        const darouriEnd = prayerTimeMinutes + duration.darouri;

        if (currentTime < prayerTimeMinutes) {
            // Pas encore l'heure - pas de texte affiché
            return { name: prayerName, time: "", status: "moukhtar", statusText: "" };
        } else if (currentTime >= prayerTimeMinutes && currentTime <= moukhtarEnd) {
            return { name: prayerName, time: "", status: "moukhtar", statusText: "Moukhtar" };
        } else if (currentTime > moukhtarEnd && currentTime <= darouriEnd) {
            return { name: prayerName, time: "", status: "darouri", statusText: "Darouri" };
        } else if (currentTime > darouriEnd) {
            return { name: prayerName, time: "", status: "qada", statusText: "Qada" };
        }

        return { name: prayerName, time: "", status: "qada", statusText: "" };
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

        // Trouver la prière en cours
        let currentPrayer = null;
        let currentIndex = -1;

        for (let i = 0; i < prayerTimesInMinutes.length; i++) {
            if (currentTime >= prayerTimesInMinutes[i].totalMinutes) {
                currentPrayer = prayerTimesInMinutes[i];
                currentIndex = i;
            }
        }

        // Si on est avant Fajr, la prière actuelle est Isha de la veille
        if (!currentPrayer) {
            currentPrayer = prayerTimesInMinutes[prayerTimesInMinutes.length - 1];
            currentIndex = prayerTimesInMinutes.length - 1;
        }

        // Préparer toutes les prières avec leur statut
        const allPrayersWithStatus: PrayerStatus[] = [];
        for (let i = 0; i < prayerTimesInMinutes.length; i++) {
            const prayer = prayerTimesInMinutes[i];
            const nextPrayerTime = prayerTimesInMinutes[(i + 1) % prayerTimesInMinutes.length].totalMinutes;
            const status = getPrayerStatus(prayer.name, prayer.totalMinutes, currentTime, nextPrayerTime);
            allPrayersWithStatus.push({
                name: prayer.name,
                time: prayer.time,
                status: status.status,
                statusText: status.statusText
            });
        }

        // Les prochaines prières à afficher (exclure la prière en cours)
        const upcomingPrayers = [];
        for (let i = 1; i <= 3; i++) {
            const nextIndex = (currentIndex + i) % prayerTimesInMinutes.length;
            upcomingPrayers.push(allPrayersWithStatus[nextIndex]);
        }

        // Déterminer le statut de la prière en cours
        let currentPrayerStatus = "";
        let currentStatusText = "";

        if (currentPrayer) {
            const nextPrayerTime = prayerTimesInMinutes[(currentIndex + 1) % prayerTimesInMinutes.length].totalMinutes;
            const status = getPrayerStatus(currentPrayer.name, currentPrayer.totalMinutes, currentTime, nextPrayerTime);
            currentPrayerStatus = status.status;
            currentStatusText = status.statusText;
        }

        setNextPrayer({
            name: currentPrayer.name === "Maghrib" ? "Maghreb" : currentPrayer.name,
            time: currentPrayer.time,
            remaining: "",
            upcomingPrayers: upcomingPrayers,
            currentPrayerStatus: currentStatusText
        });
    };

    useEffect(() => {
        fetchPrayerTimes(defaultLat, defaultLon);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchPrayerTimes(defaultLat, defaultLon);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return { nextPrayer, loading };
};