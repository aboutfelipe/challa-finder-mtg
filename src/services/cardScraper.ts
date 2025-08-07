import { CardResult } from "@/components/SearchResults";

// API base URL - in production this would be configurable
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-scraper-api.com' 
  : 'http://localhost:3001';

export const searchCardInAllStores = async (cardName: string): Promise<CardResult[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results: CardResult[] = await response.json();
    return results;
  } catch (error) {
    console.error('Error searching cards:', error);
    
    // Fallback to mock data if API is unavailable
    console.log('Falling back to mock data...');
    return getMockResults(cardName);
  }
};

// Fallback mock data function for when the API is unavailable
const getMockResults = (cardName: string): CardResult[] => {
  const stores = ['Catlotus', 'Pay2Win', 'La Cripta', 'TCGMatch'];
  const results: CardResult[] = [];

  stores.forEach(store => {
    if (Math.random() > 0.3) { // 70% chance of having results
      results.push({
        store: store,
        storeUrl: getStoreUrl(store),
        cardName: cardName,
        price: `$${Math.floor(Math.random() * 50000 + 5000).toLocaleString()} CLP`,
        inStock: Math.random() > 0.4,
        productUrl: `${getStoreUrl(store)}/search?q=${encodeURIComponent(cardName)}`,
        condition: Math.random() > 0.5 ? "Near Mint" : "Lightly Played",
        set: "Magic Singles"
      });
    }
  });

  return results.sort((a, b) => {
    if (a.inStock !== b.inStock) {
      return b.inStock ? 1 : -1;
    }
    if (a.price && b.price) {
      const priceA = parseInt(a.price.replace(/[^\d]/g, ''));
      const priceB = parseInt(b.price.replace(/[^\d]/g, ''));
      return priceA - priceB;
    }
    return 0;
  });
};

const getStoreUrl = (storeName: string): string => {
  const storeUrls: { [key: string]: string } = {
    'Catlotus': 'https://catlotus.cl',
    'Pay2Win': 'https://www.paytowin.cl',
    'La Cripta': 'https://lacripta.cl',
    'TCGMatch': 'https://tcgmatch.cl'
  };
  return storeUrls[storeName] || '';
};

// Function to get store information
export const getStoreInfo = () => {
  return [
    { name: "Catlotus", url: "https://catlotus.cl" },
    { name: "Pay2Win", url: "https://www.paytowin.cl" },
    { name: "La Cripta", url: "https://lacripta.cl" },
    { name: "TCGMatch", url: "https://tcgmatch.cl" }
  ];
};