// src/components/home/NotificationsPreview.tsx
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Notification } from "@/hooks/useNotifications";

interface NotificationsPreviewProps {
    notifications: Notification[];
    unreadCount: number;
    onShowAll: () => void;
    onNotificationClick: (notification: Notification) => void;
    getNotificationIcon: (type: string) => JSX.Element;
    getNotificationColor: (type: string) => string;
    itemVariants: any;
}

const NotificationsPreview = ({
    notifications,
    unreadCount,
    onShowAll,
    onNotificationClick,
    getNotificationIcon,
    getNotificationColor,
    itemVariants,
}: NotificationsPreviewProps) => {
    const unreadNotifications = notifications.filter(n => !n.read);

    if (unreadNotifications.length === 0) return null;

    return (
        <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Non lues ({unreadCount})
                </h3>
                <button
                    onClick={onShowAll}
                    className="text-xs text-secondary font-medium flex items-center gap-1"
                >
                    Voir tout <ChevronRight className="w-3 h-3" />
                </button>
            </div>
            <div className="space-y-3">
                {unreadNotifications.slice(0, 2).map((notif, index) => (
                    <motion.div
                        key={notif.id}
                        className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onNotificationClick(notif)}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notif.type)}`}>
                            {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{notif.title}</p>
                            {notif.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
};

export default NotificationsPreview;