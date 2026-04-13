import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { useLanguage, languages } from "@/contexts/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "light" | "dark";
}

const LanguageSwitcher = ({ variant = "dark" }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languages.find((l) => l.code === language)!;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLight = variant === "light";

  return (
    <div ref={ref} className="relative z-50">
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-all ${
          isLight
            ? "bg-card/20 text-primary-foreground hover:bg-card/30"
            : "bg-muted text-foreground hover:bg-muted/80"
        }`}
      >
        <span className="text-base">{current.flag}</span>
        <Globe className="w-3.5 h-3.5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden min-w-[140px]"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  language === lang.code
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
