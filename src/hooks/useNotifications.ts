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
        try {
            const mockNotifications: Notification[] = [
                {
                    id: 1,
                    type: "event",
                    title: "Réunion hebdomadaire du dahira",
                    description: "Salle 12 - Bâtiment A",
                    time: "Demain 15h",
                    timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    read: false,
                    screen: "calendar",
                },
                {
                    id: 2,
                    type: "news",
                    title: "Nouvelle lecture du Coran disponible",
                    description: "Sourate Al-Kahf - Version Warsh",
                    time: "Il y a 2h",
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    read: false,
                    screen: "news",
                },
                {
                    id: 3,
                    type: "prayer",
                    title: "Rappel: Prière de Dhuhr",
                    description: "Dans 30 minutes",
                    time: "Dans 30 min",
                    timestamp: new Date(Date.now() + 30 * 60 * 1000),
                    read: true,
                    screen: "prayer",
                },
                {
                    id: 4,
                    type: "community",
                    title: "Nouveau membre dans la communauté",
                    description: "Omar Diallo a rejoint le groupe",
                    time: "Il y a 5h",
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
                    read: false,
                    screen: "community",
                },
            ];

            const sorted = mockNotifications.sort((a, b) =>
                b.timestamp.getTime() - a.timestamp.getTime()
            );

            setNotifications(sorted);
            updateUnreadCount(sorted);
        } catch (error) {
            console.error("Erreur chargement notifications:", error);
        }
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