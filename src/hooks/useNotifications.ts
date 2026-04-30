// src/hooks/useNotifications.ts
import { useState, useEffect } from "react";
import { Calendar, Bell, Clock, Users, Newspaper } from "lucide-react";
import React from "react";

// Interface pour les notifications
export interface Notification {
    id: number;
    type: "event" | "news" | "prayer" | "community";
    title: string;
    description?: string;
    time: string;
    timestamp: Date;
    read: boolean;
    screen?: string;
    actionUrl?: string;
}

// Type pour le retour du hook
export interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    handleNotificationClick: (notification: Notification) => void;
    deleteNotification: (id: number, e: React.MouseEvent) => void;
    getNotificationIcon: (type: string) => React.ReactElement;
    getNotificationColor: (type: string) => string;
}

// Constante pour les icônes
const ICONS = {
    event: Calendar,
    news: Newspaper,
    prayer: Clock,
    community: Users,
    default: Bell
};

// Constante pour les couleurs
const COLORS = {
    event: "bg-secondary/10 text-secondary",
    news: "bg-blue-500/10 text-blue-500",
    prayer: "bg-primary/10 text-primary",
    community: "bg-green-500/10 text-green-500",
    default: "bg-muted text-muted-foreground"
};

export const useNotifications = (onNavigate: (screen: string) => void): UseNotificationsReturn => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const updateUnreadCount = (notifs: Notification[]) => {
        const count = notifs.filter(n => !n.read).length;
        setUnreadCount(count);
    };

    const markAsRead = (notificationId: number) => {
        setNotifications(prev => {
            const updated = prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            );
            updateUnreadCount(updated);
            return updated;
        });
    };

    const markAllAsRead = () => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            setUnreadCount(0);
            return updated;
        });
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);

        if (notification.screen) {
            onNavigate(notification.screen);
        } else if (notification.actionUrl) {
            window.open(notification.actionUrl, '_blank');
        }

        setShowNotifications(false);
    };

    const deleteNotification = (notificationId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== notificationId);
            updateUnreadCount(updated);
            return updated;
        });
    };

    const getNotificationIcon = (type: string): React.ReactElement => {
        // Utiliser une variable en minuscules pour éviter les conflits de types
        const iconComponent = ICONS[type as keyof typeof ICONS] || ICONS.default;
        // Créer l'élément avec une fonction de création
        return React.createElement(iconComponent, { className: "w-5 h-5" });
    };

    const getNotificationColor = (type: string): string => {
        return COLORS[type as keyof typeof COLORS] || COLORS.default;
    };

    return {
        notifications,
        unreadCount,
        showNotifications,
        setShowNotifications,
        markAsRead,
        markAllAsRead,
        handleNotificationClick,
        deleteNotification,
        getNotificationIcon,
        getNotificationColor,
    };
};