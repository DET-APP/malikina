import { motion } from "framer-motion";
import { useEffect } from "react";
import logo from "@/assets/logo.png";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45 }}
    >
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <motion.img
        src={logo}
        alt="Univers Maodo Malick Sy"
        className="w-56 h-56 object-contain relative z-10"
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      <motion.div
        className="relative z-10 mt-8 text-center px-8"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.55 }}
      >
        <h1 className="text-2xl font-bold text-primary tracking-wide">
          Univers
          <br />
          Maodo Malick Sy
        </h1>
        <div className="h-0.5 w-16 bg-primary/30 rounded-full mx-auto mt-3"></div>
      </motion.div>

      <motion.div
        className="absolute bottom-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        <LoadingSpinner size="md" />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;