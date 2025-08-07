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
    // Using the exact API URL format provided
    const searchUrl = `https://www.paytowin.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`PayToWin API error: ${response.status}`);
    }

    const data = await response.json();
    const products = data.resources?.results?.products || [];

    return products.slice(0, 10).map((product: any) => {
      // Extract set information from the body HTML or tags
      let extractedSet = "Magic Singles";
      if (product.body) {
        const setMatch = product.body.match(/<td>Set:<\/td>\s*<td>([^<]+)<\/td>/);
        if (setMatch) {
          extractedSet = setMatch[1].trim();
        }
      }

      // Extract condition from tags if available (looking for condition-related tags)
      let condition = "Near Mint";
      if (product.tags && Array.isArray(product.tags)) {
        const conditionTags = product.tags.filter((tag: string) => 
          tag.toLowerCase().includes('played') || 
          tag.toLowerCase().includes('damaged') || 
          tag.toLowerCase().includes('mint')
        );
        if (conditionTags.length > 0) {
          condition = conditionTags[0];
        }
      }

      // Convert price from centavos to CLP
      const priceInCLP = product.price ? Math.floor(Number(product.price)) : 0;
      const formattedPrice = priceInCLP > 0 ? 
        `$${priceInCLP.toLocaleString('es-CL')} CLP` : 
        "Precio no disponible";

      return {
        store: "Pay2Win",
        storeUrl: "https://www.paytowin.cl",
        cardName: product.title || cardName,
        price: formattedPrice,
        inStock: product.available || false,
        productUrl: `https://www.paytowin.cl${product.url}`,
        imageUrl: product.featured_image?.url || product.image || undefined,
        condition: condition,
        set: extractedSet
      };
    });

  } catch (error) {
    console.error('Error en PayToWin API directa:', error);
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
      productUrl: `https://tcgmatch.cl/producto/${item._id}`,
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

            const setCode = (card.set || card.set_code || "").toString().toLowerCase();
            const nameSlug = encodeURIComponent((card.nombre || "").toLowerCase());
            const collector = (card.collector_number || "").toString();
            let productUrl = "";
            const collectorOrDefault = collector || "default";
            if (setCode && nameSlug) {
              productUrl = `https://catlotus.cl/cardview/${setCode}/${nameSlug}/${encodeURIComponent(collectorOrDefault)}/single-part`;
            } else {
              productUrl = `https://catlotus.cl/search?q=${encodeURIComponent(card.nombre || cardName)}`;
            }

            results.push({
              store: "Catlotus",
              storeUrl: "https://catlotus.cl",
              cardName: card.nombre || cardName,
              price: `$${card.precio.toLocaleString('es-CL')}`,
              inStock: card.stock > 0,
              productUrl,
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