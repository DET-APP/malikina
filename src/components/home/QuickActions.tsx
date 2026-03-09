// src/components/home/QuickActions.tsx
import { motion } from "framer-motion";
import { Clock, BookOpen, Newspaper, Users } from "lucide-react";

interface QuickActionsProps {
    onNavigate: (screen: string) => void;
    itemVariants: any;
}

const quickActions = [
    { icon: Clock, label: "Prière", color: "bg-primary", screen: "prayer" },
    { icon: BookOpen, label: "Coran", color: "bg-secondary", screen: "quran" },
    { icon: Newspaper, label: "Actus", color: "bg-primary", screen: "news" },
    { icon: Users, label: "Communauté", color: "bg-secondary", screen: "community" },
];

const QuickActions = ({ onNavigate, itemVariants }: QuickActionsProps) => {
    return (
        <motion.section variants={itemVariants}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Accès rapide
            </h3>
            <div className="grid grid-cols-4 gap-3">
                {quickActions.map((action, index) => (
                    <motion.button
                        key={action.label}
                        onClick={() => onNavigate(action.screen)}
                        className="flex flex-col items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                    >
                        <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-soft`}>
                            <action.icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="text-xs font-medium text-foreground">{action.label}</span>
                    </motion.button>
                ))}
            </div>
        </motion.section>
    );
};

export default QuickActions;