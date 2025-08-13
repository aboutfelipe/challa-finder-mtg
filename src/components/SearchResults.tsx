import { useState } from "react";
import { ExternalLink, ShoppingCart, AlertCircle, ChevronDown } from "lucide-react";

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
  isLoading?: boolean;
}

export const SearchResults = ({ results, searchTerm, isLoading = false, storeLogos }: SearchResultsProps & { storeLogos?: Record<string, string> }) => {
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  if (results.length === 0) {
    return (
      <div className="w-full max-w-[38rem] mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron resultados</h3>
          <p className="text-gray-600">
            No se encontró "{searchTerm}" en ninguna de las tiendas consultadas.
          </p>
        </div>
      </div>
    );
  }

  // Agrupar resultados por tienda
  const groupedByStore = results.reduce((acc, r) => {
    (acc[r.store] = acc[r.store] || []).push(r);
    return acc;
  }, {} as Record<string, CardResult[]>);

  // Calcular estadísticas
  const totalStores = Object.keys(groupedByStore).length;
  const totalOffers = results.length;
  const storesWithStock = Object.values(groupedByStore).filter(items => 
    items.some(item => item.inStock)
  ).length;

  // Obtener precios para estadísticas
  const pricesInStock = results
    .filter(r => r.inStock && r.price)
    .map(r => parseInt(r.price!.replace(/[^\d]/g, ''), 10))
    .filter(price => !isNaN(price));

  const bestPrice = pricesInStock.length > 0 ? Math.min(...pricesInStock) : 0;
  const avgPrice = pricesInStock.length > 0 ? Math.round(pricesInStock.reduce((a, b) => a + b, 0) / pricesInStock.length) : 0;
  const clp = new Intl.NumberFormat('es-CL');
  const totalStock = results.filter(r => r.inStock).length;

  const toggleExpand = (storeName: string) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeName)) {
      newExpanded.delete(storeName);
    } else {
      newExpanded.add(storeName);
    }
    setExpandedStores(newExpanded);
  };

  const getBestOfferForStore = (items: CardResult[]) => {
    const inStockItems = items.filter(item => item.inStock && item.price);
    if (inStockItems.length === 0) return items[0];
    
    return inStockItems.reduce((best, current) => {
      const bestPrice = parseInt(best.price!.replace(/[^\d]/g, ''), 10);
      const currentPrice = parseInt(current.price!.replace(/[^\d]/g, ''), 10);
      return currentPrice < bestPrice ? current : best;
    });
  };

  const getStockStatus = (count: number) => {
    if (count >= 5) return { text: `En stock: ${count}+`, class: "text-green-600" };
    if (count >= 2) return { text: `En stock: ${count}`, class: "text-amber-600" };
    if (count >= 1) return { text: `Stock bajo: ${count}`, class: "text-red-600" };
    return { text: "Sin stock", class: "text-gray-500" };
  };

  return (
    <div className="w-full max-w-[38rem] mx-auto">
      {/* Local animation keyframes (compatible with Animate UI style) */}
      <style>{`
        @keyframes aui-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(25%); }
          100% { transform: translateX(100%); }
        }
        /* Hide scrollbar but keep scroll on title containers */
        .title-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .title-scroll::-webkit-scrollbar { display: none; height: 0; }
      `}</style>
      {/* Loading Progress */}
      {isLoading && (
        <div className="mb-3">
          <div className="h-1 w-full overflow-hidden rounded bg-gray-200">
            <div
              className="h-1 w-1/3 bg-gradient-to-r from-gray-400 via-gray-900 to-gray-400"
              style={{ animation: 'aui-progress 1.2s ease-in-out infinite' }}
            />
          </div>
        </div>
      )}
      {/* Search Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="text-base font-semibold text-gray-900 mb-1">Resultados para "{searchTerm}"</div>
        <div className="text-sm text-gray-600">{storesWithStock} tiendas • {totalOffers} ofertas • {totalStores} tiendas encontradas</div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex justify-around text-center shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-bold text-gray-900">${clp.format(bestPrice)}</div>
          <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Mejor precio</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-lg font-bold text-gray-900">${clp.format(avgPrice)}</div>
          <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Precio promedio</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-lg font-bold text-gray-900">{totalStock}</div>
          <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">En stock total</div>
        </div>
      </div>


      {/* Store Groups */}
      <div className="flex flex-col gap-4">
        {Object.entries(groupedByStore)
          .sort(([, itemsA], [, itemsB]) => {
            const bestA = getBestOfferForStore(itemsA);
            const bestB = getBestOfferForStore(itemsB);
            
            if (!bestA.inStock && bestB.inStock) return 1;
            if (bestA.inStock && !bestB.inStock) return -1;
            
            if (bestA.price && bestB.price) {
              const priceA = parseInt(bestA.price.replace(/[^\d]/g, ''), 10);
              const priceB = parseInt(bestB.price.replace(/[^\d]/g, ''), 10);
              return priceA - priceB;
            }
            
            return 0;
          })
          .map(([storeName, items]) => {
            const isExpanded = expandedStores.has(storeName);
            const bestOffer = getBestOfferForStore(items);
            const inStockItems = items.filter(item => item.inStock);
            const stockStatus = getStockStatus(inStockItems.length);
            const isBestOverall = !!(bestOffer.price && (parseInt(bestOffer.price.replace(/[^\d]/g, ''), 10) === bestPrice));

            return (
              <div key={storeName} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                {/* Store Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {storeLogos?.[storeName] && (
                        <img src={storeLogos[storeName]} alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" loading="lazy" />
                      )}
                      <div className="text-base font-semibold text-gray-900 line-clamp-1">{storeName}</div>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="font-medium">{bestOffer.set || 'Set desconocido'}</span>
                      <div className="bg-gray-100 border border-gray-200 rounded-xl px-2 py-0.5 text-xs font-medium text-gray-700">
                        {items.length} ofertas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Offers List */}
                <div className="flex flex-col">
                  {/* Best Offer (Always Visible) */}
                  <div className={`p-4 border-b border-gray-100 flex justify-between items-center transition-colors duration-200 ${
                    isBestOverall ? 'bg-gradient-to-r from-green-50 to-green-100 border-l-3 border-l-green-500' : 'hover:bg-gray-50'
                  }`}>
                    <div className="w-12 h-16 mr-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {bestOffer.imageUrl ? (
                        <img
                          src={bestOffer.imageUrl}
                          alt={`${bestOffer.cardName}`}
                          className="w-full h-full object-cover rounded"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-xs text-gray-500">MTG</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-3 flex flex-col gap-1">
                      <div className="relative max-w-full sm:overflow-visible">
                        <div className={`pointer-events-none absolute inset-y-0 right-0 w-4 sm:hidden bg-gradient-to-l ${isBestOverall ? 'from-green-100/90' : 'from-white/90'} to-transparent`} />
                        <div className="max-w-full overflow-x-auto title-scroll [-webkit-overflow-scrolling:touch]">
                          <div className="inline-block whitespace-nowrap sm:whitespace-normal text-sm font-semibold text-gray-900 sm:truncate">
                            {bestOffer.cardName}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        {bestOffer.condition && (
                          <div className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-medium text-gray-700">
                            {bestOffer.condition}
                          </div>
                        )}
                        <div className={`text-xs font-medium ${stockStatus.class}`}>
                          {stockStatus.text}
                        </div>
                      </div>
                    </div>
                    <div className="flex-none w-36 flex flex-col items-end gap-1 text-right">
                      {isBestOverall && (
                        <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1 tracking-wide">
                          MEJOR PRECIO
                        </div>
                      )}
                      <div className={`text-lg font-bold whitespace-nowrap ${isBestOverall ? 'text-green-700' : 'text-gray-900'}`}>
                        {bestOffer.price || 'Sin precio'}
                      </div>
                      {bestOffer.productUrl && (
                        <button 
                          className="bg-gray-900 border-none rounded text-white text-xs font-semibold px-3 py-1.5 cursor-pointer transition-all duration-200 tracking-wide hover:bg-gray-700 hover:-translate-y-0.5 active:translate-y-0"
                          onClick={() => window.open(bestOffer.productUrl, '_blank')}
                        >
                          VER OFERTA
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional Offers (Collapsible) */}
                  {items.length > 1 && (
                    <>
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'}`}>
                        {items.slice(1).map((item, idx) => (
                        <div key={idx} className="p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors duration-200">
                          <div className="w-12 h-16 mr-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={`${item.cardName}`}
                                className="w-full h-full object-cover rounded"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-xs text-gray-500">MTG</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-3 flex flex-col gap-1">
                            <div className="relative max-w-full sm:overflow-visible">
                              <div className="pointer-events-none absolute inset-y-0 right-0 w-4 sm:hidden bg-gradient-to-l from-white/90 to-transparent" />
                              <div className="max-w-full overflow-x-auto title-scroll [-webkit-overflow-scrolling:touch]">
                                <div className="inline-block whitespace-nowrap sm:whitespace-normal text-sm font-semibold text-gray-900 sm:truncate">
                                  {item.cardName}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                              {item.condition && (
                                <div className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-medium text-gray-700">
                                  {item.condition}
                                </div>
                              )}
                              <div className={`text-xs font-medium ${item.inStock ? 'text-green-600' : 'text-gray-500'}`}> 
                                {item.inStock ? 'En stock' : 'Sin stock'}
                              </div>
                            </div>
                          </div>
                          <div className="flex-none w-36 flex flex-col items-end gap-2 text-right">
                            <div className="text-lg font-bold text-gray-900 whitespace-nowrap">
                              {item.price || 'Sin precio'}
                            </div>
                            {item.productUrl && (
                              <button 
                                className="bg-gray-900 border-none rounded text-white text-xs font-semibold px-3 py-1.5 cursor-pointer transition-all duration-200 tracking-wide hover:bg-gray-700 hover:-translate-y-0.5 active:translate-y-0"
                                onClick={() => window.open(item.productUrl, '_blank')}
                              >
                                VER OFERTA
                              </button>
                            )}
                          </div>
                        </div>
                        ))}
                      </div>
                      {/* Expand Toggle */}
                      <div 
                        className="flex items-center justify-center p-3 bg-gray-50 border-t border-gray-100 cursor-pointer text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => toggleExpand(storeName)}
                      >
                        {isExpanded ? 'Ocultar ofertas' : 'Ver todas las ofertas'}
                        <ChevronDown className={`ml-1 h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="text-center p-6 text-sm font-medium text-gray-600">
        Todas las tiendas cargadas
      </div>
    </div>
  );
};
