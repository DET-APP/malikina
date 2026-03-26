import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calendar, Scale, Settings } from "lucide-react";

interface FloatingMenuProps {
  onNavigate: (screen: "calendar" | "fiqh" | "admin-xassidas") => void;
}

const FloatingMenu = ({ onNavigate }: FloatingMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "calendar" as const, icon: Calendar, label: "Calendrier", color: "bg-secondary" },
    { id: "fiqh" as const, icon: Scale, label: "Fiqh", color: "bg-primary" },
    { id: "admin-xassidas" as const, icon: Settings, label: "Admin Xassidas", color: "bg-amber-600" },
  ];

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 flex flex-col gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 ${item.color} text-primary-foreground rounded-full shadow-soft hover:shadow-card transition-shadow`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-card flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-card text-foreground"
            : "bg-gradient-to-br from-secondary to-gold-light text-secondary-foreground"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};

export default FloatingMenu;
