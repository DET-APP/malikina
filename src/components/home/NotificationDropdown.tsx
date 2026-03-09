// src/components/home/NotificationDropdown.tsx
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Notification } from "@/hooks/useNotifications";

interface NotificationDropdownProps {
    notifications: Notification[];
    onClose: () => void;
    onNotificationClick: (notification: Notification) => void;
    onMarkAllAsRead: () => void;
    onDeleteNotification: (id: number, e: React.MouseEvent) => void;
    onViewAll: () => void;
    getNotificationIcon: (type: string) => JSX.Element;
    getNotificationColor: (type: string) => string;
}

const NotificationDropdown = ({
    notifications,
    onClose,
    onNotificationClick,
    onMarkAllAsRead,
    onDeleteNotification,
    onViewAll,
    getNotificationIcon,
    getNotificationColor,
}: NotificationDropdownProps) => {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-2xl border border-border z-50"
        >
            <div className="p-3 border-b border-border flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Notifications</h4>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-xs text-secondary hover:underline"
                        >
                            Tout marquer lu
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune notification</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <motion.div
                            key={notif.id}
                            className={`p-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.read ? 'bg-primary/5' : ''
                                }`}
                            onClick={() => onNotificationClick(notif)}
                            whileHover={{ x: 2 }}
                        >
                            <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notif.type)}`}>
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-medium ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notif.title}
                                        </p>
                                        <button
                                            onClick={(e) => onDeleteNotification(notif.id, e)}
                                            className="text-muted-foreground hover:text-destructive text-xs"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {notif.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {notif.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {notif.time}
                                    </p>
                                </div>
                                {!notif.read && (
                                    <span className="w-2 h-2 bg-secondary rounded-full mt-2"></span>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-2 border-t border-border">
                    <button
                        onClick={onViewAll}
                        className="w-full text-center text-xs text-secondary hover:underline py-1"
                    >
                        Voir toutes les notifications
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default NotificationDropdown;