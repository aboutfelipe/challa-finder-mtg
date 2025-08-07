import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";

export interface CardResult {
  store: string;
  storeUrl: string;
  cardName: string;
  price?: string;
  inStock: boolean;
  productUrl?: string;
  imageUrl?: string;
  condition?: string;
  set?: string;
}

interface SearchResultsProps {
  results: CardResult[];
  searchTerm: string;
}

export const SearchResults = ({ results, searchTerm }: SearchResultsProps) => {
  if (results.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-card/90 backdrop-blur-md border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No se encontraron resultados</h3>
          <p className="text-muted-foreground">
            No se encontró "{searchTerm}" en ninguna de las tiendas consultadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const inStockResults = results.filter(result => result.inStock);
  const outOfStockResults = results.filter(result => !result.inStock);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Resultados para "{searchTerm}"</h2>
        <p className="text-muted-foreground">
          {inStockResults.length} tienda(s) con stock de {results.length} consultadas
        </p>
      </div>

      {/* Results with stock */}
      {inStockResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-success flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Disponible ({inStockResults.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inStockResults.map((result, index) => (
              <StoreCard key={index} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* Results without stock */}
      {outOfStockResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Sin Stock ({outOfStockResults.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {outOfStockResults.map((result, index) => (
              <StoreCard key={index} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StoreCard = ({ result }: { result: CardResult }) => {
  return (
    <Card className={`bg-card/90 backdrop-blur-md border-border/50 transition-all duration-300 hover:shadow-ethereal ${
      result.inStock ? 'border-success/30 shadow-success/10' : 'border-muted/30'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{result.store}</CardTitle>
          <Badge 
            variant={result.inStock ? "default" : "secondary"}
            className={result.inStock ? "bg-success text-success-foreground" : ""}
          >
            {result.inStock ? "En Stock" : "Sin Stock"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.imageUrl && (
          <div className="relative w-full h-32 bg-muted/30 rounded-lg overflow-hidden">
            <img
              src={result.imageUrl}
              alt={result.cardName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm line-clamp-2">{result.cardName}</h4>
          {result.set && (
            <p className="text-xs text-muted-foreground">Set: {result.set}</p>
          )}
          {result.condition && (
            <p className="text-xs text-muted-foreground">Condición: {result.condition}</p>
          )}
          {result.price && (
            <p className="text-lg font-bold text-accent">{result.price}</p>
          )}
        </div>

        <div className="flex gap-2">
          {result.productUrl && (
            <Button
              size="sm"
              className="flex-1 bg-magic-gradient hover:shadow-glow"
              asChild
            >
              <a href={result.productUrl} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Ver Carta
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="border-border/50 hover:bg-muted/50"
            asChild
          >
            <a href={result.storeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};