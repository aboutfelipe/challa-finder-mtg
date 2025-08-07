import { CardResult } from "@/components/SearchResults";

// Interface for different API search methods
export interface ApiSearchResult {
  results: CardResult[];
  method: 'direct-api' | 'puppeteer';
  responseTime: number;
}

// PayToWin Shopify API implementation
export const searchPaytowinDirect = async (cardName: string): Promise<CardResult[]> => {
  try {
    const searchUrl = `https://paytowin.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product&resources[limit]=10`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`PayToWin API error: ${response.status}`);
    }

    const data = await response.json();
    const products = data.resources?.results?.products || [];

    return products.map((product: any) => ({
      store: "Pay2Win",
      storeUrl: "https://www.paytowin.cl",
      cardName: product.title || cardName,
      price: product.price ? `$${(product.price / 100).toLocaleString('es-CL')}` : "Precio no disponible",
      inStock: product.available || false,
      productUrl: `https://paytowin.cl${product.url}`,
      imageUrl: product.image ? `https:${product.image}` : undefined,
      condition: "Near Mint", // Default for PayToWin
      set: product.vendor || "Magic Singles"
    }));

  } catch (error) {
    console.error('Error en PayToWin API directa:', error);
    throw error;
  }
};

// La Cripta WooCommerce API (experimental)
export const searchLacriptaDirect = async (cardName: string): Promise<CardResult[]> => {
  try {
    // Try WooCommerce REST API endpoint
    const searchUrl = `https://lacripta.cl/wp-json/wc/v3/products?search=${encodeURIComponent(cardName)}&per_page=10`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`La Cripta API error: ${response.status}`);
    }

    const products = await response.json();

    return products.map((product: any) => ({
      store: "La Cripta",
      storeUrl: "https://lacripta.cl",
      cardName: product.name || cardName,
      price: product.price ? `$${parseInt(product.price).toLocaleString('es-CL')}` : "Precio no disponible",
      inStock: product.stock_status === 'instock',
      productUrl: product.permalink,
      imageUrl: product.images?.[0]?.src,
      condition: "Near Mint", // Default
      set: product.categories?.[0]?.name || "Magic Singles"
    }));

  } catch (error) {
    console.error('Error en La Cripta API directa:', error);
    throw error;
  }
};

// Store API capabilities detection
export const getStoreApiCapabilities = () => {
  return {
    'Pay2Win': { hasDirectApi: true, method: 'shopify' },
    'La Cripta': { hasDirectApi: true, method: 'woocommerce' }, // Experimental
    'Catlotus': { hasDirectApi: false, method: 'puppeteer' },
    'TCGMatch': { hasDirectApi: false, method: 'puppeteer' }
  };
};

// Direct API search dispatcher
export const searchStoreDirectApi = async (storeName: string, cardName: string): Promise<CardResult[]> => {
  switch (storeName) {
    case 'Pay2Win':
      return await searchPaytowinDirect(cardName);
    case 'La Cripta':
      return await searchLacriptaDirect(cardName);
    default:
      throw new Error(`No direct API available for ${storeName}`);
  }
};