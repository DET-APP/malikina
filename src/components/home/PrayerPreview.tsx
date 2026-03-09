// src/components/home/PrayerPreview.tsx
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { NextPrayer } from "@/hooks/usePrayerTimes";

interface PrayerPreviewProps {
    nextPrayer: NextPrayer | null;
    loading: boolean;
    onNavigate: (screen: string) => void;
    itemVariants: any;
}

const PrayerPreview = ({ nextPrayer, loading, onNavigate, itemVariants }: PrayerPreviewProps) => {
    return (
        <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-br from-primary to-green-dark rounded-2xl p-6 shadow-card">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <LoadingSpinner message="Chargement..." />
                    </div>
                ) : nextPrayer ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-primary-foreground/70 text-sm">Prochaine prière</p>
                                <h3 className="text-2xl font-bold text-primary-foreground">{nextPrayer.name}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-secondary">{nextPrayer.time}</p>
                                <p className="text-xs text-primary-foreground/70">dans {nextPrayer.remaining}</p>
                            </div>
                        </div>
                        <motion.button
                            onClick={() => onNavigate("prayer")}
                            className="w-full bg-card/20 text-primary-foreground py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                            whileHover={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Voir toutes les prières <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </>
                ) : (
                    <p className="text-center text-primary-foreground">
                        Impossible de charger les horaires
                    </p>
                )}
            </div>
        </motion.section>
    );
};

export default PrayerPreview;