// src/components/screens/CommunityScreen.tsx
import { motion } from "framer-motion";
import { Users, Calendar, MessageCircle, Heart, Share2, UserPlus, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Types
interface CommunityEvent {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    participants: number;
    image?: string;
}

interface CommunityPost {
    id: number;
    author: string;
    avatar?: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    isLiked: boolean;
}

interface CommunityMember {
    id: number;
    name: string;
    role: string;
    avatar?: string;
    isOnline: boolean;
}

const CommunityScreen = () => {
    const [activeTab, setActiveTab] = useState<"feed" | "events" | "members">("feed");

    // Données simulées
    const events: CommunityEvent[] = [
        {
            id: 1,
            title: "Cours hebdomadaire de Tafsir",
            description: "Étude du Coran avec Cheikh Ahmad",
            date: "Samedi 15 Mars",
            time: "10h00 - 12h00",
            location: "Mosquée de l'UAD",
            participants: 45,
        },
        {
            id: 2,
            title: "Zikr collectif",
            description: "Récitation du wird et méditation",
            date: "Dimanche 16 Mars",
            time: "18h30 - 20h00",
            location: "Dahira des Étudiants",
            participants: 32,
        },
        {
            id: 3,
            title: "Conférence sur la Tidianiya",
            description: "Les fondements de la voie tidiane",
            date: "Mercredi 19 Mars",
            time: "15h00 - 17h00",
            location: "Amphithéâtre UAD",
            participants: 78,
        },
    ];

    const posts: CommunityPost[] = [
        {
            id: 1,
            author: "Omar Diallo",
            content: "Assalamou Alaikoum à tous ! Qu'Allah accepte nos bonnes actions en ce mois béni. N'oublions pas notre récitation quotidienne du wird.",
            timestamp: "Il y a 2 heures",
            likes: 24,
            comments: 5,
            isLiked: false,
        },
        {
            id: 2,
            author: "Fatou Sy",
            content: "Partage de la lecture du jour : Sourate Al-Kahf. Qu'Allah nous illumine par Sa lumière.",
            timestamp: "Il y a 5 heures",
            likes: 18,
            comments: 3,
            isLiked: true,
        },
        {
            id: 3,
            author: "Ibrahima Ndiaye",
            content: "Rappel : La réunion du dahira est avancée à 18h aujourd'hui. Venez nombreux !",
            timestamp: "Hier",
            likes: 31,
            comments: 8,
            isLiked: false,
        },
    ];

    const members: CommunityMember[] = [
        { id: 1, name: "Cheikh Tidiane Sall", role: "Guide spirituel", isOnline: true },
        { id: 2, name: "Mariama Ba", role: "Responsable", isOnline: true },
        { id: 3, name: "Ismaila Souane", role: "Membre actif", isOnline: false },
        { id: 4, name: "Aïcha Fall", role: "Membre", isOnline: true },
        { id: 5, name: "Mamadou Wade", role: "Membre", isOnline: false },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            className="min-h-screen pb-24 bg-background"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div
                className="bg-gradient-to-b from-primary to-primary/90 pt-12 pb-8 px-6"
                variants={itemVariants}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Communauté</h1>
                        <p className="text-white/70 text-sm mt-1">
                            Al Moutahabbina Fillahi
                        </p>
                    </div>
                    <LanguageSwitcher variant="light" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <Users className="w-5 h-5 text-secondary mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">234</p>
                        <p className="text-xs text-white/70">Membres</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <Calendar className="w-5 h-5 text-secondary mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">12</p>
                        <p className="text-xs text-white/70">Événements</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <MessageCircle className="w-5 h-5 text-secondary mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">48</p>
                        <p className="text-xs text-white/70">Messages</p>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
                className="flex gap-2 px-6 mt-4"
                variants={itemVariants}
            >
                {[
                    { id: "feed", label: "Fil d'actualité" },
                    { id: "events", label: "Événements" },
                    { id: "members", label: "Membres" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Content */}
            <motion.div className="px-6 mt-6 space-y-4" variants={itemVariants}>
                {activeTab === "feed" && (
                    // Fil d'actualité
                    <div className="space-y-4">
                        {/* Publication rapide */}
                        <div className="bg-card rounded-xl p-4 shadow-soft flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <input
                                type="text"
                                placeholder="Partagez quelque chose..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                            />
                            <button className="text-secondary font-medium text-sm">Publier</button>
                        </div>

                        {/* Posts */}
                        {posts.map((post) => (
                            <motion.div
                                key={post.id}
                                className="bg-card rounded-xl p-4 shadow-soft"
                                whileHover={{ scale: 1.01 }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{post.author}</p>
                                        <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                                    </div>
                                </div>
                                <p className="text-foreground text-sm mb-4">{post.content}</p>
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1 text-muted-foreground hover:text-secondary transition-colors">
                                        <Heart className={`w-4 h-4 ${post.isLiked ? "fill-secondary text-secondary" : ""}`} />
                                        <span className="text-xs">{post.likes}</span>
                                    </button>
                                    <button className="flex items-center gap-1 text-muted-foreground hover:text-secondary transition-colors">
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="text-xs">{post.comments}</span>
                                    </button>
                                    <button className="flex items-center gap-1 text-muted-foreground hover:text-secondary transition-colors ml-auto">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeTab === "events" && (
                    // Événements
                    <div className="space-y-4">
                        {events.map((event) => (
                            <motion.div
                                key={event.id}
                                className="bg-card rounded-xl p-4 shadow-soft"
                                whileHover={{ scale: 1.01 }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                <span>{event.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span>{event.time}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                <span>{event.location}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-xs text-muted-foreground">
                                                {event.participants} participants
                                            </span>
                                            <button className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-medium hover:bg-secondary/20 transition-colors">
                                                Participer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeTab === "members" && (
                    // Membres
                    <div className="space-y-3">
                        {members.map((member) => (
                            <motion.div
                                key={member.id}
                                className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-3"
                                whileHover={{ scale: 1.01 }}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    {member.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.role}</p>
                                </div>
                                <button className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center hover:bg-secondary/20 transition-colors">
                                    <UserPlus className="w-4 h-4 text-secondary" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default CommunityScreen;