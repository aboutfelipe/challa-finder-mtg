import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CardSearchForm } from "@/components/CardSearchForm";
import { SearchResults, CardResult } from "@/components/SearchResults";
import { searchAllStores, getStoreInfo } from "@/services/cloudflareApiSearch";
 

const Index = () => {
  const [searchResults, setSearchResults] = useState<CardResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const isHero = !isLoading && searchResults.length === 0 && !lastSearchTerm;
  

  const handleSearch = async (cardName: string) => {
    setIsLoading(true);
    setLastSearchTerm(cardName);
    setSearchResults([]);

    try {
      const results = await searchAllStores(cardName);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white bg-radial-fintech">
      <style>{`
        /* Minimal fintech-style radial gradient background */
        .bg-radial-fintech {
          background:
            radial-gradient(70% 55% at 50% 0%, rgba(139, 92, 246, 0.28), rgba(255, 255, 255, 0) 72%),
            radial-gradient(48% 36% at 85% 20%, rgba(167, 139, 250, 0.22), rgba(255, 255, 255, 0) 70%),
            radial-gradient(42% 30% at 15% 25%, rgba(147, 197, 253, 0.18), rgba(255, 255, 255, 0) 70%),
            radial-gradient(70% 55% at 50% 100%, rgba(139, 92, 246, 0.14), rgba(255, 255, 255, 0) 70%),
            #ffffff;
        }
      `}</style>
      {/* Modern Fintech Layout */}
      <div className="min-h-screen flex flex-col items-center justify-start px-4">
        {/* Content Container */}
        <div className="w-full max-w-[38rem] mx-auto space-y-3">
          {/* Hero: Title + Search Form */}
          <div
            className={[
              "transition-all duration-500 relative",
              isHero ? "min-h-[60vh] flex items-center justify-center" : "pt-3"
            ].join(" ")}
          >
            <div className="w-full">
              <CardSearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>
            {isHero && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400">
                <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || (!isLoading && lastSearchTerm)) && (
            <div className="mt-2 transition-all duration-500">
              <SearchResults results={searchResults} searchTerm={lastSearchTerm} isLoading={isLoading} />
            </div>
          )}

          {/* Store Information - Only show when no search has been made */}
          {isHero && (
            <div className="mt-1">
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