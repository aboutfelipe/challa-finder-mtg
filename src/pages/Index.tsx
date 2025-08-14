import { useMemo, useState } from "react";
import { ChevronDown, Star, Search } from "lucide-react";
import { CardSearchForm } from "@/components/CardSearchForm";
import { SearchResults, CardResult } from "@/components/SearchResults";
import { searchAllStores, getStoreInfo } from "@/services/cloudflareApiSearch";
import { useFavorites } from "@/hooks/use-favorites";
import { FavoritesPanel } from "@/components/FavoritesPanel";
 

const Index = () => {
  const [searchResults, setSearchResults] = useState<CardResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const isHero = !isLoading && searchResults.length === 0 && !lastSearchTerm;
  const { favorites, groupedByStore: favoritesByStore, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  const totalFavorites = favorites.length;
  const [showFavorites, setShowFavorites] = useState(false);
  
  // Build a map of store name -> logo URL (favicon) once
  const storeLogos = useMemo(() => {
    try {
      const entries = getStoreInfo().map((s) => {
        try {
          const u = new URL(s.url);
          const domain = u.hostname;
          const logo = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          return [s.name, logo] as const;
        } catch {
          return [s.name, ""] as const;
        }
      });
      return Object.fromEntries(entries);
    } catch {
      return {} as Record<string, string>;
    }
  }, []);
  

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
      <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-6 md:pt-10 pb-24 md:pb-0">
        {/* Content Container */}
        <div className="w-full max-w-[38rem] mx-auto space-y-3">
          {/* Hero: Title + Search Form */}
          <div
            className={[
              "transition-all duration-500 relative",
              isHero ? "min-h-[60vh] flex items-center justify-center" : "pt-4 md:pt-6"
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
              <SearchResults 
                results={searchResults} 
                searchTerm={lastSearchTerm} 
                isLoading={isLoading} 
                storeLogos={storeLogos}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
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
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {storeLogos[store.name] && (
                        <img src={storeLogos[store.name]} alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" loading="lazy" />
                      )}
                      <h3 className="font-semibold text-gray-900 text-sm">{store.name}</h3>
                    </div>
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
      {/* Floating Favorites Toggle Button (hidden when open) */}
      {!showFavorites && (
        <button
          aria-label="Mostrar favoritos"
          className={`hidden md:flex fixed !top-5 !right-4 !left-auto !bottom-auto z-[100] items-center gap-2 justify-center h-10 w-10 md:w-auto rounded-full md:rounded-xl border transition-all shadow bg-white/90 border-gray-200 text-gray-700 hover:bg-gray-50 md:px-3 relative`}
          style={{ top: '1.25rem', right: '1rem', left: 'auto', bottom: 'auto', position: 'fixed' }}
          onClick={() => setShowFavorites(true)}
        >
          <Star className={`text-gray-500 w-5 h-5`} />
          <span className="hidden md:inline text-sm font-medium">Favoritos</span>
          {totalFavorites > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-purple-600 text-white text-[10px] leading-5 text-center font-semibold shadow ring-1 ring-white"
            >
              {totalFavorites}
            </span>
          )}
        </button>
      )}

      {/* Favorites Panel fixed top-right (conditional) */}
      {showFavorites && (
        <FavoritesPanel groupedByStore={favoritesByStore} onRemove={removeFavorite} storeLogos={storeLogos} onClose={() => setShowFavorites(false)} />
      )}

      {/* Mobile Bottom Bar (always visible) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200">
        <div className="px-6 py-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around text-xs">
          <button
            className={`flex flex-col items-center gap-1 px-3 py-1 active:scale-95 active:bg-gray-100 rounded-lg transition ${!showFavorites ? 'text-gray-900' : 'text-gray-500'}`}
            onClick={() => setShowFavorites(false)}
            aria-label="Ir a búsqueda"
          >
            <Search className={`w-5 h-5 ${!showFavorites ? 'text-gray-900' : 'text-gray-500'}`} />
            <span className="font-medium">Buscar</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1 px-3 py-1 active:scale-95 active:bg-gray-100 rounded-lg transition ${showFavorites ? 'text-gray-900' : 'text-gray-500'} relative`}
            onClick={() => setShowFavorites(true)}
            aria-label="Ir a favoritos"
          >
            <Star className={`w-5 h-5 ${showFavorites ? 'text-gray-900' : 'text-gray-500'}`} />
            <span className="font-medium">Favoritos</span>
            {totalFavorites > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-purple-600 text-white text-[10px] leading-5 text-center font-semibold shadow ring-1 ring-white"
              >
                {totalFavorites}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Index;