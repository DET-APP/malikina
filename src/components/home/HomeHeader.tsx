// src/components/home/HomeHeader.tsx
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import logo from "@/assets/logo.png";
import NotificationDropdown from "@/components/home/NotificationDropdown";
import { Notification } from "@/hooks/useNotifications";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

interface HomeHeaderProps {
    unreadCount: number;
    showNotifications: boolean;
    onToggleNotifications: () => void;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onMarkAllAsRead: () => void;
    onDeleteNotification: (id: number, e: React.MouseEvent) => void;
    onViewAll: () => void;
    getNotificationIcon: (type: string) => JSX.Element;
    getNotificationColor: (type: string) => string;
}

const HomeHeader = ({
    unreadCount,
    showNotifications,
    onToggleNotifications,
    notifications,
    onNotificationClick,
    onMarkAllAsRead,
    onDeleteNotification,
    onViewAll,
    getNotificationIcon,
    getNotificationColor,
}: HomeHeaderProps) => {
    const { t } = useLanguage();
    return (
        <motion.header
            className="relative bg-gradient-to-br from-primary via-primary to-green-dark pt-12 pb-20 px-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 20L20 0h20v20L20 40H0V20z'/%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <p className="text-primary-foreground/70 text-sm">{t("welcome")}</p>
                    <h1 className="text-2xl font-bold text-primary-foreground mt-1">
                        {t("greeting")}
                    </h1>
                </div>

                {/* Language switcher + notifications */}
                <div className="flex items-center gap-2">
                    <LanguageSwitcher variant="light" />
                    <div className="relative">
                        <motion.button
                            onClick={onToggleNotifications}
                            className="relative w-10 h-10 bg-card/20 rounded-full flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Bell className="w-5 h-5 text-primary-foreground" />
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full text-xs flex items-center justify-center text-secondary-foreground font-bold"
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </motion.span>
                            )}
                        </motion.button>

                        {/* Dropdown notifications */}
                        {showNotifications && (
                            <NotificationDropdown
                                notifications={notifications}
                                onClose={() => onToggleNotifications()}
                                onNotificationClick={onNotificationClick}
                                onMarkAllAsRead={onMarkAllAsRead}
                                onDeleteNotification={onDeleteNotification}
                                onViewAll={onViewAll}
                                getNotificationIcon={getNotificationIcon}
                                getNotificationColor={getNotificationColor}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Logo Card */}
            <motion.div
                className="absolute -bottom-16 left-6 right-6 bg-card rounded-2xl p-6 shadow-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center shadow-soft overflow-hidden">
                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 text-center">
                        <h2 className="font-bold text-foreground text-lg">Al Moutahabbina Fillahi</h2>
                        <p className="text-xl font-arabic text-secondary mt-1">الْمُتَحَابِّينَ فِي اللَّهِ</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("dahira")}</p>
                    </div>
                </div>
            </motion.div>
        </motion.header>
    );
};

export default HomeHeader;