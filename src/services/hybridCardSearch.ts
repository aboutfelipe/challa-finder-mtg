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

// Main hybrid search function
export const searchCardHybrid = async (cardName: string): Promise<HybridSearchResponse> => {
  const startTime = Date.now();
  const capabilities = getStoreApiCapabilities();
  const allResults: CardResult[] = [];
  const directApiStores: string[] = [];
  const puppeteerStores: string[] = [];
  const storeTimings: { [store: string]: number } = {};

  console.log(`🔄 Iniciando búsqueda híbrida para: "${cardName}"`);
  
  // Phase 1: Direct API searches (fast)
  const directApiPromises = Object.entries(capabilities)
    .filter(([_, config]) => config.hasDirectApi)
    .map(async ([storeName, _]) => {
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
        console.warn(`⚠️ ${storeName} API falló, será incluida en Puppeteer:`, error);
        // If direct API fails, it will be handled by puppeteer
        return [];
      }
    });

  // Execute direct API searches
  const directApiResults = await Promise.allSettled(directApiPromises);
  directApiResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    }
  });

  // Phase 2: Puppeteer for remaining stores
  const puppeteerStoreNames = Object.entries(capabilities)
    .filter(([_, config]) => !config.hasDirectApi)
    .map(([storeName, _]) => storeName);
  
  // Add failed direct API stores to puppeteer list
  const failedDirectApiStores = Object.entries(capabilities)
    .filter(([storeName, config]) => {
      return config.hasDirectApi && !directApiStores.includes(storeName);
    })
    .map(([storeName, _]) => storeName);

  const storesToScrape = [...puppeteerStoreNames, ...failedDirectApiStores];

  if (storesToScrape.length > 0) {
    try {
      console.log(`🤖 Iniciando Puppeteer para tiendas: ${storesToScrape.join(', ')}`);
      const puppeteerStart = Date.now();
      const puppeteerResponse = await searchCardInAllStores(cardName);
      const puppeteerTime = Date.now() - puppeteerStart;
      
      // Filter results to only include stores that need puppeteer
      const puppeteerResults = puppeteerResponse.results.filter(result => 
        storesToScrape.includes(result.store)
      );
      
      allResults.push(...puppeteerResults);
      puppeteerStores.push(...storesToScrape);
      
      // Estimate timing per store for puppeteer
      const timePerStore = puppeteerTime / storesToScrape.length;
      storesToScrape.forEach(store => {
        storeTimings[store] = timePerStore;
      });
      
      console.log(`✅ Puppeteer completado en ${puppeteerTime}ms - ${puppeteerResults.length} resultados`);
    } catch (error) {
      console.error('❌ Error en Puppeteer:', error);
      // Continue with direct API results only
    }
  }

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

  console.log(`🎉 Búsqueda híbrida completada en ${totalTime}ms`);
  console.log(`📊 APIs directas: ${directApiStores.length} | Puppeteer: ${puppeteerStores.length}`);

  return {
    results: sortedResults,
    isRealScraping: true,
    message: `Búsqueda híbrida completada. ${directApiStores.length} tienda(s) con API directa, ${puppeteerStores.length} con Puppeteer. Total: ${sortedResults.length} resultados.`,
    timestamp: new Date().toISOString(),
    methodsUsed: {
      directApi: directApiStores,
      puppeteer: puppeteerStores
    },
    performance: {
      totalTime,
      fastestStore,
      slowestStore
    }
  };
};

// Health check for hybrid system
export const checkHybridSystemHealth = async (): Promise<{
  directApis: { [store: string]: boolean };
  puppeteerAvailable: boolean;
  overallHealth: boolean;
}> => {
  const capabilities = getStoreApiCapabilities();
  const directApiHealth: { [store: string]: boolean } = {};
  
  // Test direct APIs
  for (const [storeName, config] of Object.entries(capabilities)) {
    if (config.hasDirectApi) {
      try {
        // Quick test search
        await searchStoreDirectApi(storeName, 'test');
        directApiHealth[storeName] = true;
      } catch (error) {
        directApiHealth[storeName] = false;
      }
    }
  }
  
  // Test puppeteer (import the health check from original service)
  let puppeteerAvailable = false;
  try {
    const { checkScraperHealth } = await import('./cardScraper');
    puppeteerAvailable = await checkScraperHealth();
  } catch (error) {
    puppeteerAvailable = false;
  }
  
  const overallHealth = Object.values(directApiHealth).some(healthy => healthy) || puppeteerAvailable;
  
  return {
    directApis: directApiHealth,
    puppeteerAvailable,
    overallHealth
  };
};