// src/components/prayer/PrayerListItem.tsx
import { motion } from "framer-motion";
import { Bell, BellOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Prayer } from "./types";
import { prayerDisplayNames } from "./types";
import { Badge } from "@/components/ui/badge";

interface PrayerListItemProps {
  prayer: Prayer;
  isCurrentPrayer: boolean;
  isNotificationEnabled: boolean;
  onToggleNotification: (prayerName: string) => void;
  index: number;
}

export const PrayerListItem = ({
  prayer,
  isCurrentPrayer,
  isNotificationEnabled,
  onToggleNotification,
  index
}: PrayerListItemProps) => {
  const Icon = prayer.icon;
  const displayName = prayerDisplayNames[prayer.name as keyof typeof prayerDisplayNames] || prayer.name;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
    >
      <Card className={`${isCurrentPrayer ? "ring-2 ring-secondary" : ""}`}>
        <CardContent className="p-4 flex items-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCurrentPrayer ? "bg-secondary" : "bg-primary/10"
          }`}>
            <Icon className={`w-6 h-6 ${isCurrentPrayer ? "text-secondary-foreground" : "text-primary"}`} />
          </div>
          
          <div className="flex-1 ml-4">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${isCurrentPrayer ? "text-primary" : "text-foreground"}`}>
                {displayName}
              </h3>
              {isCurrentPrayer && (
                <Badge variant="secondary" className="text-xs">En cours</Badge>
              )}
            </div>
            <p className="text-lg font-arabic text-muted-foreground">{prayer.arabic}</p>
          </div>
          
          <p className={`text-xl font-bold mr-4 ${isCurrentPrayer ? "text-primary" : "text-foreground"}`}>
            {prayer.time}
          </p>
          
          {prayer.name !== "Sunrise" && (
            <Button
              onClick={() => onToggleNotification(prayer.name)}
              variant="ghost"
              size="icon"
              className={isNotificationEnabled ? "text-primary" : "text-muted-foreground"}
            >
              {isNotificationEnabled ? (
                <Bell className="w-5 h-5" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};