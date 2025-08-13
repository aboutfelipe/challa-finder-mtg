import { useState } from "react";
import { CardSearchForm } from "@/components/CardSearchForm";
import { SearchResults, CardResult } from "@/components/SearchResults";
import { searchAllStores, getStoreInfo } from "@/services/cloudflareApiSearch";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [searchResults, setSearchResults] = useState<CardResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const { toast } = useToast();

  const handleSearch = async (cardName: string) => {
    setIsLoading(true);
    setLastSearchTerm(cardName);
    setSearchResults([]);

    try {
      toast({
        title: "🚀 Iniciando búsqueda",
        description: `Buscando "${cardName}" en todas las tiendas disponibles`
      });

      const results = await searchAllStores(cardName);
      setSearchResults(results);

      const inStockCount = results.filter(r => r.inStock).length;
      toast({
        title: "✅ Búsqueda completada",
        description: `${inStockCount} tiendas con stock`
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "❌ Error en la búsqueda",
        description: error instanceof Error ? error.message : "Error desconocido en la búsqueda.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Fintech Layout */}
      <div className="min-h-screen flex flex-col items-center justify-start py-4 px-4">
        {/* Content Container */}
        <div className="w-full max-w-[38rem] mx-auto space-y-6">
          {/* Search Form */}
          <CardSearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Search Results */}
          {(searchResults.length > 0 || (!isLoading && lastSearchTerm)) && (
            <div className="mt-6">
              <SearchResults results={searchResults} searchTerm={lastSearchTerm} isLoading={isLoading} />
            </div>
          )}

          {/* Store Information - Only show when no search has been made */}
          {!isLoading && searchResults.length === 0 && !lastSearchTerm && (
            <div className="mt-8">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Tiendas Consultadas</h2>
                <p className="text-sm text-gray-600">
                  Buscamos en las mejores tiendas de Chile especializadas en Magic The Gathering
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {getStoreInfo().map(store => (
                  <div 
                    key={store.name} 
                    className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-sm transition-all duration-200"
                  >
                    <h3 className="font-semibold text-gray-900 text-sm">{store.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{store.status}</p>
                    <a 
                      href={store.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-gray-700 hover:text-gray-900 transition-colors"
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