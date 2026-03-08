// src/components/shared/LoadingSpinner.tsx
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Chargement des horaires..." }: LoadingSpinnerProps) => {
  return (
    <Card className="mx-6 mt-6">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
};