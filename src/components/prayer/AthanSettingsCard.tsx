// src/components/prayer/AthanSettingsCard.tsx
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const AthanSettingsCard = () => {
  const [athanEnabled, setAthanEnabled] = useState(true);

  return (
    <div className="px-6 mt-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-lg">Notifications Athan</CardTitle>
            <CardDescription>
              Recevez une notification avant chaque prière pour ne jamais manquer l'heure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch 
                id="athan-mode" 
                checked={athanEnabled}
                onCheckedChange={setAthanEnabled}
              />
              <Label htmlFor="athan-mode">Activer les notifications</Label>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};