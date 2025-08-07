import { useState } from "react";
import { CardSearchForm } from "@/components/CardSearchForm";
import { SearchResults, CardResult } from "@/components/SearchResults";
import { searchCardInAllStores, checkScraperHealth, SearchResponse } from "@/services/cardScraper";
import { useToast } from "@/hooks/use-toast";
import heroBackground from "@/assets/mtg-hero-bg.jpg";

const Index = () => {
  const [searchResults, setSearchResults] = useState<CardResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [isRealScraping, setIsRealScraping] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleSearch = async (cardName: string) => {
    setIsLoading(true);
    setLastSearchTerm(cardName);
    setSearchResults([]);
    setIsRealScraping(null);
    
    try {
      // First check if scraper server is available
      const isServerAvailable = await checkScraperHealth();
      
      if (!isServerAvailable) {
        toast({
          title: "⚠️ Servidor no disponible",
          description: "El servidor de scraping no está corriendo. Ejecuta 'npm run server' en una terminal separada.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "🔍 Scraping iniciado",
        description: `Realizando scraping real en las tiendas para "${cardName}"...`,
      });
      
      const searchResponse: SearchResponse = await searchCardInAllStores(cardName);
      setSearchResults(searchResponse.results);
      setIsRealScraping(searchResponse.isRealScraping);
      
      const inStockCount = searchResponse.results.filter(r => r.inStock).length;
      toast({
        title: "✅ Scraping completado",
        description: `Scraping real exitoso: ${inStockCount} productos con stock de ${searchResponse.results.length} resultados encontrados.`,
      });
    } catch (error) {
      console.error("Search error:", error);
      setIsRealScraping(false);
      toast({
        title: "❌ Error en el scraping",
        description: error instanceof Error ? error.message : "Error desconocido en el scraping.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-12 space-y-12">
          {/* Hero Title */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-7xl font-bold bg-magic-gradient bg-clip-text text-transparent leading-tight">
              Carta Finder CL
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Encuentra las mejores cartas de Magic The Gathering en las principales tiendas de Chile. 
              Un solo buscador, múltiples tiendas, mejores precios.
            </p>
          </div>

          {/* Search Form */}
          <CardSearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Search Results */}
          {(searchResults.length > 0 || (!isLoading && lastSearchTerm)) && (
            <div className="mt-16">
              {/* Status indicator */}
              {isRealScraping !== null && (
                <div className="mb-4 text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    isRealScraping 
                      ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-900/20 text-red-400 border border-red-500/30'
                  }`}>
                    {isRealScraping ? '🟢 Scraping Real Activo' : '🔴 Usando Datos Simulados'}
                  </div>
                </div>
              )}
              <SearchResults results={searchResults} searchTerm={lastSearchTerm} />
            </div>
          )}

          {/* Store Information */}
          {!isLoading && searchResults.length === 0 && !lastSearchTerm && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Tiendas Consultadas</h2>
                <p className="text-muted-foreground">
                  Buscamos en las mejores tiendas de Chile especializadas en Magic The Gathering
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {[
                  { name: "Catlotus", url: "https://catlotus.cl" },
                  { name: "Pay2Win", url: "https://www.paytowin.cl" },
                  { name: "La Cripta", url: "https://lacripta.cl" },
                  { name: "TCGMatch", url: "https://tcgmatch.cl" }
                ].map((store) => (
                  <div 
                    key={store.name}
                    className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-lg p-4 text-center hover:bg-card/70 transition-all duration-300"
                  >
                    <h3 className="font-semibold text-foreground">{store.name}</h3>
                    <a 
                      href={store.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-glow transition-colors"
                    >
                      {store.url.replace('https://', '')}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
