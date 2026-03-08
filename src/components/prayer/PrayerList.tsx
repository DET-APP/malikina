// src/components/prayer/PrayerList.tsx
import { Prayer } from "./types";
import { PrayerListItem } from "./PrayerListItem";

interface PrayerListProps {
  prayers: Prayer[];
  currentPrayerName?: string;
  notifications: { [key: string]: boolean };
  onToggleNotification: (prayerName: string) => void;
}

export const PrayerList = ({
  prayers,
  currentPrayerName,
  notifications,
  onToggleNotification
}: PrayerListProps) => {
  return (
    <div className="px-6 mt-6 space-y-3">
      {prayers.map((prayer, index) => (
        <PrayerListItem
          key={prayer.name}
          prayer={prayer}
          isCurrentPrayer={prayer.name === currentPrayerName}
          isNotificationEnabled={notifications[prayer.name] || false}
          onToggleNotification={onToggleNotification}
          index={index}
        />
      ))}
    </div>
  );
};