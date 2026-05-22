// src/components/home/PrayerPreview.tsx
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { NextPrayer } from "@/hooks/usePrayerTimes";

interface PrayerPreviewProps {
    nextPrayer: NextPrayer | null;
    loading: boolean;
    onNavigate: (screen: string) => void;
    itemVariants: any;
}

const PrayerPreview = ({ nextPrayer, loading, onNavigate, itemVariants }: PrayerPreviewProps) => {
    const [hijriDate, setHijriDate] = useState<string>("");

    useEffect(() => {
        const fetchHijriDate = async () => {
            try {
                const response = await fetch(`https://api.aladhan.com/v1/gToH/${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`);
                const data = await response.json();
                if (data.code === 200) {
                    const hijri = data.data.hijri;
                    setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year}`);
                }
            } catch (error) {
                console.error("Erreur chargement date hijri:", error);
                setHijriDate("Date non disponible");
            }
        };
        fetchHijriDate();
    }, []);

    // Couleurs selon le statut
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Moukhtar":
                return "bg-green-500";
            case "Darouri":
                return "bg-orange-500";
            case "Qada":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case "Moukhtar":
                return "bg-green-500/20";
            case "Darouri":
                return "bg-orange-500/20";
            case "Qada":
                return "bg-red-500/20";
            default:
                return "bg-gray-500/20";
        }
    };

    return (
        <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-br from-primary to-green-dark rounded-2xl p-5 shadow-card">
                {loading ? (
                    <div className="flex justify-center items-center h-28">
                        <LoadingSpinner message="Chargement..." />
                    </div>
                ) : nextPrayer ? (
                    <>
                        {/* Date hijri centrée */}
                        <div className="text-center mb-4">
                            <p className="text-primary-foreground/80 text-base font-bold">{hijriDate || "Chargement..."}</p>
                        </div>

                        {/* Prière en cours avec son statut */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-bold text-primary-foreground">{nextPrayer.name}</h3>
                                {nextPrayer.currentPrayerStatus && (
                                    <div className={`flex items-center gap-1.5 ${getStatusBgColor(nextPrayer.currentPrayerStatus)} rounded-md px-2 py-0.5`}>
                                        <span className="text-xs text-primary-foreground font-medium">
                                            {nextPrayer.currentPrayerStatus}
                                        </span>
                                        <div className={`w-1.5 h-1.5 ${getStatusColor(nextPrayer.currentPrayerStatus)} rounded-full ${nextPrayer.currentPrayerStatus === "Moukhtar" ? "animate-pulse" : ""
                                            }`} />
                                    </div>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-secondary">{nextPrayer.time}</p>
                        </div>

                        {/* Prochaines prières avec leurs statuts */}
                        {nextPrayer.upcomingPrayers && nextPrayer.upcomingPrayers.length > 0 && (
                            <div className="mb-4 p-3 bg-primary-foreground/10 rounded-xl">
                                <p className="text-xs text-primary-foreground/70 mb-2">Prochaines prières</p>
                                <div className="flex justify-between">
                                    {nextPrayer.upcomingPrayers.slice(0, 3).map((prayer, idx) => (
                                        <div key={idx} className="text-center flex-1">
                                            <p className="text-primary-foreground/60 text-xs">{prayer.name}</p>
                                            <p className="text-primary-foreground font-medium text-sm">{prayer.time}</p>
                                            {/* Afficher le statut seulement s'il n'est pas vide */}
                                            {prayer.statusText && prayer.statusText !== "À venir" && (
                                                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${getStatusBgColor(prayer.statusText)} mt-1`}>
                                                    <span className={`w-1 h-1 ${getStatusColor(prayer.statusText)} rounded-full`} />
                                                    <span className="text-[10px] text-primary-foreground/80">{prayer.statusText}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bouton voir toutes les prières */}
                        <motion.button
                            onClick={() => onNavigate("prayer")}
                            className="w-full bg-card/20 hover:bg-card/30 text-primary-foreground py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Voir toutes les prières <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-primary-foreground text-sm">Horaires non disponibles</p>
                    </div>
                )}
            </div>
        </motion.section>
    );
};

export default PrayerPreview;