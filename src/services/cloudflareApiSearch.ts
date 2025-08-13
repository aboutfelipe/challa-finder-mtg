import { CardResult } from "@/components/SearchResults";

const WORKER_BASE_URL = 'https://challa-finder-mtg.aboutfelipe.workers.dev';
const REQUEST_TIMEOUT = 5000; // 5 seconds timeout

// TO-DO: Agregar precio minimo y maximo

// Helper function to parse and normalize price values
const parsePrice = (price: any): number | null => {
  if (!price || price === 'N/A' || price === '') return null;
  
  const cleanPrice = String(price).replace(/[^\d.,]/g, '').replace(',', '.');
  const numPrice = parseFloat(cleanPrice);
  
  return isNaN(numPrice) ? null : numPrice;
};

// Helper function to format price as string
const formatPrice = (price: any): string => {
  const numPrice = parsePrice(price);
  if (numPrice === null) return 'N/A';
  
  return `$${numPrice.toLocaleString('es-CL')} CLP`;
};

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
    
    // PayToWin returns Shopify format: { resources: { results: { products: [...] } } }
    const products = data?.resources?.results?.products || [];
    
    return products.map((item: any) => ({
      store: "Pay2Win",
      storeUrl: "https://www.paytowin.cl",
      cardName: item.title || cardName,
      price: formatPrice(item["price_max"]),
      inStock: item.available === true,
      productUrl: `https://paytowin.cl/products/${item.handle}`,
      imageUrl: item.image,
      condition: 'N/A',
      set: 'N/A',
    }));
  } catch (error) {
    console.error('PayToWin search failed:', error);
    return [];
  }
};

// La Comarca search via Cloudflare Worker
export const searchLacomarca = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/lacomarca', cardName);
    
    // La Comarca returns Shopify format: { resources: { results: { products: [...] } } }
    const products = data?.resources?.results?.products || [];
    
    return products.map((item: any) => ({
      store: "La Comarca",
      storeUrl: "https://www.tiendalacomarca.cl",
      cardName: item.title || cardName,
      price: formatPrice(item["price_max"]),
      inStock: item.available === true,
      productUrl: `https://tiendalacomarca.cl/products/${item.handle}`,
      imageUrl: item.image,
      condition: 'N/A',
      set: 'N/A',
    }));
  } catch (error) {
    console.error('La Comarca search failed:', error);
    return [];
  }
};

// Piedra Bruja search via Cloudflare Worker
export const searchPiedrabruja = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/piedrabruja', cardName);
    
    // Piedra Bruja returns Shopify format: { resources: { results: { products: [...] } } }
    const products = data?.resources?.results?.products || [];
    
    return products.map((item: any) => ({
      store: "Piedra Bruja",
      storeUrl: "https://www.piedrabruja.cl",
      cardName: item.title || cardName,
      price: formatPrice(item["price_max"]),
      inStock: item.available === true,
      productUrl: `https://piedrabruja.cl/products/${item.handle}`,
      imageUrl: item.image,
      condition: 'N/A',
      set: 'N/A',
    }));
  } catch (error) {
    console.error('Piedra Bruja search failed:', error);
    return [];
  }
};

// TCGMatch search via Cloudflare Worker
export const searchTcgmatch = async (cardName: string): Promise<CardResult[]> => {
  try {
    const response = await makeWorkerRequest('/tcgmatch', cardName);
    
    // TCGMatch returns { success: boolean, data: { items: [...] } }
    if (!response.success || !response.data?.items) {
      return [];
    }
    
    const products = response.data.items;
    
    return products.map((item: any) => ({
      store: "TCGMatch",
      storeUrl: "https://tcgmatch.cl",
      cardName: item.name || cardName,
      price: formatPrice(item.price),
      inStock: (item.quantity || 0) > 0,
      productUrl: `https://tcgmatch.cl/producto/${item._id}`, // Construir URL basada en el ID
      imageUrl: item.card?.data?.image_uris?.normal || item.card?.data?.image_uris?.small,
      condition: item.status || 'N/A',
      set: item.card?.data?.set_name || 'N/A',
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
    
    // Catlotus now returns WooCommerce API format (array of products)
    const products = Array.isArray(data) ? data : [];
    
    return products.map((item: any) => ({
      store: "Catlotus",
      storeUrl: "https://catlotus.cl",
      cardName: item.name || cardName,
      price: formatPrice(item.price),
      inStock: item.stock_status === 'instock',
      productUrl: item.permalink || '#',
      imageUrl: item.images?.[0]?.src,
      condition: 'N/A',
      set: 'N/A',
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
    
    // La Cripta returns WooCommerce API format (array of products)
    const products = Array.isArray(data) ? data : [];
    
    return products.map((item: any) => ({
      store: "La Cripta",
      storeUrl: "https://lacriptastore.com",
      cardName: item.name || cardName,
      price: formatPrice(item.price),
      inStock: item.stock_status === 'instock',
      productUrl: item.permalink || '#',
      imageUrl: item.images?.[0]?.src,
      condition: 'N/A',
      set: 'N/A',
    }));
  } catch (error) {
    console.error('La Cripta search failed:', error);
    return [];
  }
};

// Magic Sur search via Cloudflare Worker
export const searchMagicsur = async (cardName: string): Promise<CardResult[]> => {
  try {
    // Magic Sur returns HTML, need to parse it
    const response = await fetch(`${WORKER_BASE_URL}/magicsur?q=${encodeURIComponent(cardName)}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Magic Sur Worker error: ${response.status}`);
    }

    const htmlData = await response.text();
    
    // For now, return empty array since HTML parsing would be complex
    // Magic Sur can be implemented later if needed
    console.log('Magic Sur returned HTML data, parsing not implemented yet');
    return [];
  } catch (error) {
    console.error('Magic Sur search failed:', error);
    return [];
  }
};

// AfkStore search via Cloudflare Worker
export const searchAfkstore = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/afkstore', cardName);
    
    // AfkStore returns Shopify format: { resources: { results: { products: [...] } } }
    const products = data?.resources?.results?.products || [];
    
    return products.map((item: any) => ({
      store: "AfkStore",
      storeUrl: "https://www.afkstore.cl",
      cardName: item.title || cardName,
      price: formatPrice(item["price_max"]),
      inStock: item.available === true,
      productUrl: `https://afkstore.cl/products/${item.handle}`,
      imageUrl: item.image,
      condition: 'N/A',
      set: 'N/A',
    }));
  } catch (error) {
    console.error('AfkStore search failed:', error);
    return [];
  }
};

// Oasisgames search via Cloudflare Worker
export const searchOasisgames = async (cardName: string): Promise<CardResult[]> => {
  try {
    const data = await makeWorkerRequest('/oasisgames', cardName);
    
    // Oasisgames returns WooCommerce API format (array of products)
    const products = data?.resources?.results?.products || [];
    
    return products.map((item: any) => ({
      store: "Oasis Games",
      storeUrl: "https://www.oasisgames.cl",
      cardName: item.title || cardName,
      price: formatPrice(item["price_max"]),
      inStock: item.available === true,
      productUrl: `https://oasisgames.cl/products/${item.handle}`,
      imageUrl: item.image,
      condition: 'N/A',
      set: 'N/A',
    }));
  } catch (error) {
    console.error('Oasis Games search failed:', error);
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
    searchPiedrabruja(cardName),
    searchLacomarca(cardName),
    searchAfkstore(cardName),
    searchOasisgames(cardName),
  ];

  try {
    const results = await Promise.allSettled(searchPromises);
    const allCards: CardResult[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allCards.push(...result.value);
      } else {
        const storeNames = ['PayToWin', 'TCGMatch', 'Catlotus', 'La Cripta', 'Magic Sur', 'Piedra Bruja', 'La Comarca', 'AfkStore', 'Oasis Games'];
        console.error(`${storeNames[index]} search failed:`, result.reason);
      }
    });

    // Sort by stock first, then by price
    allCards.sort((a, b) => {
      if (a.inStock !== b.inStock) {
        return b.inStock ? 1 : -1;
      }
      
      // Use parsePrice helper to extract numeric values for comparison
      const priceA = parsePrice(a.price);
      const priceB = parsePrice(b.price);
      
      if (priceA !== null && priceB !== null) {
        return priceA - priceB;
      }
      
      // If one price is null, put it at the end
      if (priceA === null && priceB !== null) return 1;
      if (priceA !== null && priceB === null) return -1;
      
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
    { name: "Catlotus", url: "https://catlotus.cl" , status: "Disponible"},
    { name: "Pay2Win", url: "https://www.paytowin.cl" , status: "Disponible"},
    { name: "TCGMatch", url: "https://tcgmatch.cl" , status: "Disponible"},
    { name: "Tienda La Comarca", url: "https://www.tiendalacomarca.cl" , status: "Disponible"},
    { name: "AfkStore", url: "https://afkstore.cl" , status: "Disponible"},
    { name: "Oasis Games", url: "https://www.oasisgames.cl" , status: "Disponible"},
    { name: "La Cripta", url: "https://lacripta.cl" , status: "Próximamente"},
    { name: "Magic Sur", url: "https://cartasmagicsur.cl" , status: "Próximamente"},
    { name: "Piedra Bruja", url: "https://piedrabruja.cl" , status: "Próximamente"},
    ];
};