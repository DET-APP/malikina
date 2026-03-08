// src/components/prayer/CitySelector.tsx
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { City } from "./types";
import { cn } from "@/lib/utils";

interface CitySelectorProps {
  cities: City[];
  selectedCity: City;
  onSelectCity: (city: City) => void;
}

export const CitySelector = ({ cities, selectedCity, onSelectCity }: CitySelectorProps) => {
  return (
    <motion.div
      className="flex gap-3 mt-6 px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {cities.map((city) => {
        const isSelected = selectedCity.name === city.name;
        
        return (
          <Button
            key={city.name}
            onClick={() => onSelectCity(city)}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "flex items-center gap-2 transition-all",
              isSelected && "ring-2 ring-secondary ring-offset-2 ring-offset-background font-medium"
            )}
            size="sm"
          >
            <MapPin className={cn("w-4 h-4", isSelected && "text-secondary-foreground")} />
            <span>{city.name}</span>
          </Button>
        );
      })}
    </motion.div>
  );
};