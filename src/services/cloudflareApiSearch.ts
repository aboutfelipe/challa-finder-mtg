import { CardResult } from "@/components/SearchResults";

const WORKER_BASE_URL = 'https://challa-finder-mtg.aboutfelipe.workers.dev';
const REQUEST_TIMEOUT = 5000; // 5 seconds timeout

interface WorkerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Generic worker request function
const makeWorkerRequest = async (endpoint: string, cardName: string): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${WORKER_BASE_URL}${endpoint}?q=${encodeURIComponent(cardName)}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Worker error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// PayToWin search via Cloudflare Worker
export const searchPaytowin = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/paytowin', cardName);
    
    return data.map((item: any) => ({
      store: "Pay2Win",
      storeUrl: "https://www.paytowin.cl",
      cardName: item.name || cardName,
      price: item.price,
      inStock: item.stock > 0,
      productUrl: item.url,
      imageUrl: item.image,
      condition: item.condition,
      set: item.set,
    }));
  } catch (error) {
    console.error('PayToWin search failed:', error);
    return [];
  }
};

// TCGMatch search via Cloudflare Worker
export const searchTcgmatch = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/tcgmatch', cardName);
    
    return data.map((item: any) => ({
      store: "TCGMatch",
      storeUrl: "https://tcgmatch.cl",
      cardName: item.name || cardName,
      price: item.price,
      inStock: item.in_stock,
      productUrl: item.url,
      imageUrl: item.image,
      condition: item.condition,
      set: item.set,
    }));
  } catch (error) {
    console.error('TCGMatch search failed:', error);
    return [];
  }
};

// Catlotus search via Cloudflare Worker
export const searchCatlotus = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/catlotus', cardName);
    
    return data.map((item: any) => ({
      store: "Catlotus",
      storeUrl: "https://catlotus.cl",
      cardName: item.nombre || cardName,
      price: item.precio,
      inStock: item.stock > 0,
      productUrl: item.url,
      imageUrl: item.imagen,
      condition: item.condicion,
      set: item.set,
    }));
  } catch (error) {
    console.error('Catlotus search failed:', error);
    return [];
  }
};

// La Cripta search via Cloudflare Worker
export const searchLacripta = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/lacripta', cardName);
    
    return data.map((item: any) => ({
      store: "La Cripta",
      storeUrl: "https://lacripta.cl",
      cardName: item.name || cardName,
      price: item.price,
      inStock: item.stock_status === 'instock',
      productUrl: item.permalink,
      imageUrl: item.images?.[0]?.src,
      condition: item.condition,
      set: item.set,
    }));
  } catch (error) {
    console.error('La Cripta search failed:', error);
    return [];
  }
};

// Magic Sur search via Cloudflare Worker
export const searchMagicsur = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/magicsur', cardName);
    
    return data.map((item: any) => ({
      store: "Magic Sur",
      storeUrl: "https://cartasmagicsur.cl",
      cardName: item.name || cardName,
      price: item.price,
      inStock: item.stock > 0,
      productUrl: item.url,
      imageUrl: item.image,
      condition: item.condition,
      set: item.set,
    }));
  } catch (error) {
    console.error('Magic Sur search failed:', error);
    return [];
  }
};

// Main search function that calls all stores
export const searchAllStores = async (cardName: string): Promise<CardResult[]> => {
  const startTime = Date.now();
  
  // Execute all searches in parallel
  const searchPromises = [
    searchPaytowin(cardName),
    searchTcgmatch(cardName),
    searchCatlotus(cardName),
    searchLacripta(cardName),
    searchMagicsur(cardName),
  ];

  try {
    const results = await Promise.allSettled(searchPromises);
    const allCards: CardResult[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allCards.push(...result.value);
      } else {
        const storeNames = ['PayToWin', 'TCGMatch', 'Catlotus', 'La Cripta', 'Magic Sur'];
        console.error(`${storeNames[index]} search failed:`, result.reason);
      }
    });

    // Sort by stock first, then by price
    allCards.sort((a, b) => {
      if (a.inStock !== b.inStock) {
        return b.inStock ? 1 : -1;
      }
      
      if (a.price && b.price) {
        const priceA = parseFloat(a.price.replace(/[^\d.,]/g, '').replace(',', '.'));
        const priceB = parseFloat(b.price.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(priceA) && !isNaN(priceB)) {
          return priceA - priceB;
        }
      }
      
      return 0;
    });

    const endTime = Date.now();
    console.log(`✅ Search completed in ${endTime - startTime}ms. Found ${allCards.length} results.`);
    
    return allCards;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

// Store information
export const getStoreInfo = () => {
  return [
    { name: "Catlotus", url: "https://catlotus.cl" },
    { name: "Pay2Win", url: "https://www.paytowin.cl" },
    { name: "La Cripta", url: "https://lacripta.cl" },
    { name: "TCGMatch", url: "https://tcgmatch.cl" },
    { name: "Magic Sur", url: "https://cartasmagicsur.cl" }
  ];
};