// src/components/shared/HeaderWithArabic.tsx
import { motion } from "framer-motion";

interface HeaderWithArabicProps {
  title: string;
  arabicText: string;
}

export const HeaderWithArabic = ({ title, arabicText }: HeaderWithArabicProps) => {
  return (
    <header className="relative bg-gradient-to-br from-primary via-primary to-green-dark pt-12 pb-8 px-6">
      {/* Pattern Overlay - Exactement comme dans HomeScreen */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 20L20 0h20v20L20 40H0V20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} 
        />
      </div>

      {/* Contenu avec z-index pour être au-dessus du motif */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-primary-foreground">{title}</h1>
        <p className="text-3xl font-arabic text-secondary mt-1">{arabicText}</p>
      </motion.div>
    </header>
  );
};