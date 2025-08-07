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
    // Use the full URL format as provided
    const searchUrl = `https://paytowin.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product&resources[options][unavailable_products]=last&resources[options][fields]=title,variants.title`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://paytowin.cl',
      },
      mode: 'cors',
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
      imageUrl: product.featured_image?.url ? `https:${product.featured_image.url}` : undefined,
      condition: "Near Mint", // Default for PayToWin
      set: product.vendor || "Magic Singles"
    }));

  } catch (error) {
    console.error('Error en PayToWin API directa (usando fallback):', error);
    // Return empty array instead of throwing to allow other APIs to work
    return [];
  }
};

// TCGMatch API implementation
export const searchTcgmatchDirect = async (cardName: string): Promise<CardResult[]> => {
  try {
    const searchUrl = `https://api.tcgmatch.cl/products/search?palabra=${encodeURIComponent(cardName)}&tcg=magic`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TCGMatch API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.items) {
      return [];
    }

    return data.data.items.map((item: any) => ({
      store: "TCGMatch",
      storeUrl: "https://tcgmatch.cl",
      cardName: item.name || cardName,
      price: `$${item.price.toLocaleString('es-CL')}`,
      inStock: item.quantity > 0,
      productUrl: `https://tcgmatch.cl/product/${item._id}`,
      imageUrl: item.card?.data?.image_uris?.normal || item.card?.data?.image_uris?.large,
      condition: item.status === 0 ? "Near Mint" : item.status === 1 ? "Lightly Played" : "Good",
      set: item.card?.data?.set_name || item.set || "Magic Singles"
    }));

  } catch (error) {
    console.error('Error en TCGMatch API directa:', error);
    throw error;
  }
};

// Catlotus API implementation
export const searchCatlotusDirect = async (cardName: string): Promise<CardResult[]> => {
  try {
    const response = await fetch('https://catlotus.cl/api/search/card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        search: cardName,
        set: "",
        foil: "",
        page: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Catlotus API error: ${response.status}`);
    }

    const data = await response.json();
    const results: CardResult[] = [];
    
    if (data.stock) {
      Object.values(data.stock).forEach((groupArray: any) => {
        if (Array.isArray(groupArray)) {
          groupArray.forEach((card: any) => {
            const conditionMap: { [key: number]: string } = {
              0: "Near Mint",
              1: "Lightly Played", 
              2: "Moderately Played",
              3: "Heavily Played"
            };

            results.push({
              store: "Catlotus",
              storeUrl: "https://catlotus.cl",
              cardName: card.nombre || cardName,
              price: `$${card.precio.toLocaleString('es-CL')}`,
              inStock: card.stock > 0,
              productUrl: `https://catlotus.cl/carta/${card.idcarta}`,
              imageUrl: card.image_uris?.normal || card.image_uris?.large,
              condition: conditionMap[card.estado] || "Near Mint",
              set: card.set_name || card.set || "Magic Singles"
            });
          });
        }
      });
    }

    return results;

  } catch (error) {
    console.error('Error en Catlotus API directa:', error);
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
    console.error('Error en La Cripta API directa (sin autenticación disponible):', error);
    // Return empty array instead of throwing to allow other APIs to work
    return [];
  }
};

// Store API capabilities detection
export const getStoreApiCapabilities = () => {
  return {
    'Pay2Win': { hasDirectApi: true, method: 'shopify' },
    'La Cripta': { hasDirectApi: true, method: 'woocommerce' },
    'Catlotus': { hasDirectApi: true, method: 'custom-api' },
    'TCGMatch': { hasDirectApi: true, method: 'custom-api' }
  };
};

// Direct API search dispatcher
export const searchStoreDirectApi = async (storeName: string, cardName: string): Promise<CardResult[]> => {
  switch (storeName) {
    case 'Pay2Win':
      return await searchPaytowinDirect(cardName);
    case 'La Cripta':
      return await searchLacriptaDirect(cardName);
    case 'Catlotus':
      return await searchCatlotusDirect(cardName);
    case 'TCGMatch':
      return await searchTcgmatchDirect(cardName);
    default:
      throw new Error(`No direct API available for ${storeName}`);
  }
};