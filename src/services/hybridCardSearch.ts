import { CardResult } from "@/components/SearchResults";
import { searchCardInAllStores, SearchResponse } from "./cardScraper";
import { 
  searchStoreDirectApi, 
  getStoreApiCapabilities, 
  ApiSearchResult 
} from "./directApiSearch";

// Enhanced search response with method tracking
export interface HybridSearchResponse extends SearchResponse {
  methodsUsed: {
    directApi: string[];
    puppeteer: string[];
  };
  performance: {
    totalTime: number;
    fastestStore?: string;
    slowestStore?: string;
  };
}

// Main hybrid search function - Now 100% Direct APIs
export const searchCardHybrid = async (cardName: string): Promise<HybridSearchResponse> => {
  const startTime = Date.now();
  const capabilities = getStoreApiCapabilities();
  const allResults: CardResult[] = [];
  const directApiStores: string[] = [];
  const storeTimings: { [store: string]: number } = {};

  console.log(`🚀 Iniciando búsqueda 100% APIs directas para: "${cardName}"`);
  
  // All stores now have direct APIs - run them all in parallel
  const directApiPromises = Object.entries(capabilities).map(async ([storeName, _]) => {
    const storeStart = Date.now();
    try {
      console.log(`⚡ Buscando en ${storeName} con API directa...`);
      const results = await searchStoreDirectApi(storeName, cardName);
      const storeTime = Date.now() - storeStart;
      storeTimings[storeName] = storeTime;
      directApiStores.push(storeName);
      console.log(`✅ ${storeName} API completada en ${storeTime}ms - ${results.length} resultados`);
      return results;
    } catch (error) {
      console.warn(`⚠️ ${storeName} API falló:`, error);
      const storeTime = Date.now() - storeStart;
      storeTimings[storeName] = storeTime;
      return [];
    }
  });

  // Execute all direct API searches in parallel
  const directApiResults = await Promise.allSettled(directApiPromises);
  directApiResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    }
  });

  const totalTime = Date.now() - startTime;
  
  // Calculate performance metrics
  const timingEntries = Object.entries(storeTimings);
  const fastestStore = timingEntries.reduce((min, [store, time]) => 
    time < storeTimings[min] ? store : min, timingEntries[0]?.[0]
  );
  const slowestStore = timingEntries.reduce((max, [store, time]) => 
    time > storeTimings[max] ? store : max, timingEntries[0]?.[0]
  );

  // Sort results: in stock first, then by price
  const sortedResults = allResults.sort((a, b) => {
    if (a.inStock && !b.inStock) return -1;
    if (!a.inStock && b.inStock) return 1;
    
    const priceA = parseFloat(a.price?.replace(/[^\d]/g, '') || '0');
    const priceB = parseFloat(b.price?.replace(/[^\d]/g, '') || '0');
    return priceA - priceB;
  });

  console.log(`🎉 Búsqueda 100% APIs directas completada en ${totalTime}ms`);
  console.log(`📊 APIs directas utilizadas: ${directApiStores.length} de ${Object.keys(capabilities).length}`);

  return {
    results: sortedResults,
    isRealScraping: true,
    message: `Búsqueda 100% APIs directas completada. ${directApiStores.length} tienda(s) consultadas. Total: ${sortedResults.length} resultados.`,
    timestamp: new Date().toISOString(),
    methodsUsed: {
      directApi: directApiStores,
      puppeteer: [] // No longer used
    },
    performance: {
      totalTime,
      fastestStore,
      slowestStore
    }
  };
};

// Health check for 100% direct API system
export const checkHybridSystemHealth = async (): Promise<{
  directApis: { [store: string]: boolean };
  puppeteerAvailable: boolean;
  overallHealth: boolean;
}> => {
  const capabilities = getStoreApiCapabilities();
  const directApiHealth: { [store: string]: boolean } = {};
  
  // Test all direct APIs (all stores now have them)
  for (const [storeName, _] of Object.entries(capabilities)) {
    try {
      // Quick test search with timeout
      await Promise.race([
        searchStoreDirectApi(storeName, 'test'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      directApiHealth[storeName] = true;
    } catch (error) {
      console.warn(`Health check failed for ${storeName}:`, error);
      directApiHealth[storeName] = false;
    }
  }
  
  // Puppeteer is legacy but we'll check if available
  let puppeteerAvailable = false;
  try {
    const { checkScraperHealth } = await import('./cardScraper');
    puppeteerAvailable = await checkScraperHealth();
  } catch (error) {
    puppeteerAvailable = false;
  }
  
  // Overall health: at least 3 out of 4 APIs working
  const workingApis = Object.values(directApiHealth).filter(Boolean).length;
  const overallHealth = workingApis >= 3;
  
  return {
    directApis: directApiHealth,
    puppeteerAvailable,
    overallHealth
  };
};