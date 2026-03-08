// src/components/prayer/CurrentPrayerCard.tsx
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { NextPrayer } from "./types";
import { prayerNamesArabic, prayerDisplayNames } from "./types";

interface CurrentPrayerCardProps {
  nextPrayer: NextPrayer;
}

export const CurrentPrayerCard = ({ nextPrayer }: CurrentPrayerCardProps) => {
  const displayName = prayerDisplayNames[nextPrayer.name as keyof typeof prayerDisplayNames] || nextPrayer.name;
  const arabicName = prayerNamesArabic[nextPrayer.name as keyof typeof prayerNamesArabic] || "";

  return (
    <div className="px-6 -mt-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-2 border-secondary shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-medium text-secondary uppercase tracking-wider">
                Prochaine prière
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{displayName}</h2>
                <p className="text-xl font-arabic text-muted-foreground">{arabicName}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary">{nextPrayer.time}</p>
                <p className="text-sm text-muted-foreground">dans {nextPrayer.remaining}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};