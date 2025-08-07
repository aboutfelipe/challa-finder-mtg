import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CardSearchFormProps {
  onSearch: (cardName: string) => void;
  isLoading: boolean;
}

export const CardSearchForm = ({ onSearch, isLoading }: CardSearchFormProps) => {
  const [cardName, setCardName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre de una carta",
        variant: "destructive",
      });
      return;
    }
    onSearch(cardName.trim());
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/90 backdrop-blur-md border-border/50 shadow-magical">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary-glow" />
          <CardTitle className="text-3xl font-bold bg-magic-gradient bg-clip-text text-transparent">
            Buscador de Cartas MTG
          </CardTitle>
          <Sparkles className="h-8 w-8 text-primary-glow" />
        </div>
        <p className="text-muted-foreground text-lg">
          Encuentra cartas disponibles en las mejores tiendas de Chile
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Ejemplo: Lightning Bolt, Jace the Mind Sculptor..."
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="pl-12 h-14 text-lg bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary focus:shadow-glow transition-all duration-300"
              disabled={isLoading}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !cardName.trim()}
            className="w-full h-14 text-lg font-semibold bg-magic-gradient hover:shadow-glow transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Buscando en tiendas...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Carta
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};