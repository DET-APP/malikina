import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoritesListProps {
  onQassidasClick: (id: number) => void;
}

const FavoritesList = ({ onQassidasClick }: FavoritesListProps) => {
  const { favorites, removeFavorite } = useFavorites();

  if (favorites.length === 0) {
    return (
      <motion.div
        className="text-center py-16 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Pas de favoris</h3>
        <p className="text-sm text-muted-foreground">
          Ajoutez des xassidas aux favoris pour les retrouver ici rapidement
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {favorites.length > 0 && (
        <div className="text-xs text-muted-foreground px-6 py-2 bg-muted/30 rounded-lg">
          {favorites.length === 1 ? "1 favori" : `${favorites.length} favoris`}
        </div>
      )}
      
      {favorites.map((qassida, index) => (
        <motion.div
          key={qassida.id}
          onClick={() => onQassidasClick(qassida.id)}
          className="bg-card rounded-xl p-4 shadow-soft flex items-center cursor-pointer hover:shadow-md transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{qassida.title}</h4>
            <p className="text-lg font-arabic text-muted-foreground truncate">{qassida.arabic}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{qassida.author}</p>
          </div>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              removeFavorite(qassida.id);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="ml-4 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-500/60 hover:text-red-500" />
          </motion.button>
        </motion.div>
      ))}
    </div>
  );
};

export default FavoritesList;
