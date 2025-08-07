import { CardResult } from "@/components/SearchResults";

// Interface for store scraper configuration
interface StoreConfig {
  name: string;
  baseUrl: string;
  searchUrl: string;
  scrapeFunction: (cardName: string) => Promise<CardResult[]>;
}

// Mock scraping functions for now - in production these would use actual web scraping
const scrapeSpintech = async (cardName: string): Promise<CardResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Mock results for demonstration
  const mockResults: CardResult[] = [];
  
  // Simulate random availability
  if (Math.random() > 0.3) {
    mockResults.push({
      store: "Spintech Gaming",
      storeUrl: "https://spintech.cl",
      cardName: cardName,
      price: `$${Math.floor(Math.random() * 50000 + 5000).toLocaleString()} CLP`,
      inStock: Math.random() > 0.4,
      productUrl: `https://spintech.cl/search?q=${encodeURIComponent(cardName)}`,
      condition: Math.random() > 0.5 ? "Near Mint" : "Lightly Played",
      set: "Mystery Set"
    });
  }
  
  return mockResults;
};

const scrapeCatlotus = async (cardName: string): Promise<CardResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));
  
  const mockResults: CardResult[] = [];
  
  if (Math.random() > 0.2) {
    mockResults.push({
      store: "Catlotus",
      storeUrl: "https://catlotus.cl",
      cardName: cardName,
      price: `$${Math.floor(Math.random() * 60000 + 3000).toLocaleString()} CLP`,
      inStock: Math.random() > 0.3,
      productUrl: `https://catlotus.cl/search?card=${encodeURIComponent(cardName)}`,
      condition: Math.random() > 0.6 ? "Near Mint" : "Moderately Played",
      set: "Premium Collection"
    });
  }
  
  return mockResults;
};

const scrapePaytowin = async (cardName: string): Promise<CardResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 2200));
  
  const mockResults: CardResult[] = [];
  
  if (Math.random() > 0.25) {
    mockResults.push({
      store: "Pay2Win",
      storeUrl: "https://www.paytowin.cl",
      cardName: cardName,
      price: `$${Math.floor(Math.random() * 45000 + 4000).toLocaleString()} CLP`,
      inStock: Math.random() > 0.35,
      productUrl: `https://www.paytowin.cl/search?q=${encodeURIComponent(cardName)}`,
      condition: "Near Mint",
      set: "Standard Collection"
    });
  }
  
  return mockResults;
};

const scrapeLaCripta = async (cardName: string): Promise<CardResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
  
  const mockResults: CardResult[] = [];
  
  if (Math.random() > 0.2) {
    mockResults.push({
      store: "La Cripta",
      storeUrl: "https://lacripta.cl",
      cardName: cardName,
      price: `$${Math.floor(Math.random() * 55000 + 6000).toLocaleString()} CLP`,
      inStock: Math.random() > 0.25,
      productUrl: `https://lacripta.cl/producto/${encodeURIComponent(cardName)}`,
      condition: Math.random() > 0.4 ? "Near Mint" : "Lightly Played",
      set: "Singles Collection"
    });
  }
  
  return mockResults;
};

const scrapeTcgmatch = async (cardName: string): Promise<CardResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 1800));
  
  const mockResults: CardResult[] = [];
  
  if (Math.random() > 0.3) {
    mockResults.push({
      store: "TCGMatch",
      storeUrl: "https://tcgmatch.cl",
      cardName: cardName,
      price: `$${Math.floor(Math.random() * 40000 + 5000).toLocaleString()} CLP`,
      inStock: Math.random() > 0.4,
      productUrl: `https://tcgmatch.cl/cartas/busqueda?q=${encodeURIComponent(cardName)}`,
      condition: "Near Mint",
      set: "Marketplace"
    });
  }
  
  return mockResults;
};

// Store configurations
const stores: StoreConfig[] = [
  {
    name: "Catlotus",
    baseUrl: "https://catlotus.cl",
    searchUrl: "/search",
    scrapeFunction: scrapeCatlotus
  },
  {
    name: "Pay2Win",
    baseUrl: "https://www.paytowin.cl",
    searchUrl: "/search",
    scrapeFunction: scrapePaytowin
  },
  {
    name: "La Cripta",
    baseUrl: "https://lacripta.cl",
    searchUrl: "/",
    scrapeFunction: scrapeLaCripta
  },
  {
    name: "TCGMatch",
    baseUrl: "https://tcgmatch.cl",
    searchUrl: "/cartas",
    scrapeFunction: scrapeTcgmatch
  }
];

export const searchCardInAllStores = async (cardName: string): Promise<CardResult[]> => {
  try {
    // Execute all store searches in parallel
    const searchPromises = stores.map(store => 
      store.scrapeFunction(cardName).catch(error => {
        console.error(`Error scraping ${store.name}:`, error);
        return [];
      })
    );
    
    const results = await Promise.all(searchPromises);
    
    // Flatten results and sort by availability and price
    const allResults = results.flat();
    
    return allResults.sort((a, b) => {
      // Sort by stock first (in stock items first)
      if (a.inStock !== b.inStock) {
        return b.inStock ? 1 : -1;
      }
      
      // Then by price (lowest first)
      if (a.price && b.price) {
        const priceA = parseInt(a.price.replace(/[^\d]/g, ''));
        const priceB = parseInt(b.price.replace(/[^\d]/g, ''));
        return priceA - priceB;
      }
      
      return 0;
    });
  } catch (error) {
    console.error('Error searching cards:', error);
    throw new Error('Error al buscar las cartas. Por favor intenta nuevamente.');
  }
};

// Function to get store information
export const getStoreInfo = () => {
  return stores.map(store => ({
    name: store.name,
    url: store.baseUrl
  }));
};