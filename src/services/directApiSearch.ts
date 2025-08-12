import { CardResult } from "@/components/SearchResults";

// Cloudflare Worker base URL - replace with your actual Worker URL
const WORKER_BASE_URL = 'https://challa-finder-mtg.aboutfelipe.workers.dev';

// Interface for different API search methods
export interface ApiSearchResult {
  results: CardResult[];
  method: 'direct-api' | 'puppeteer';
  responseTime: number;
}

// PayToWin with Cloudflare Worker priority
export const searchPaytowinDirect = async (cardName: string): Promise<CardResult[]> => {
  try {
    console.log('🔍 PayToWin: Attempting Cloudflare Worker...');
    const workerResponse = await fetch(`${WORKER_BASE_URL}/paytowin?q=${encodeURIComponent(cardName)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (workerResponse.ok) {
      const data = await workerResponse.json();
      
      if (data.resources?.results?.products) {
        const products = data.resources.results.products;
        
        const results = products.slice(0, 10).map((product: any) => {
          // Extract set information from the body HTML or tags
          let extractedSet = "Magic Singles";
          if (product.body) {
            const setMatch = product.body.match(/<td>Set:<\/td>\s*<td>([^<]+)<\/td>/);
            if (setMatch) {
              extractedSet = setMatch[1].trim();
            }
          }

          // Extract condition from tags if available
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

        console.log(`✅ PayToWin: Found ${results.length} results via Cloudflare Worker`);
        return results;
      }
    }
  } catch (error) {
    console.log('⚠️ PayToWin: Cloudflare Worker failed, trying direct API...', error);
  }

  // Fallback to direct Shopify API
  try {
    console.log('🔍 PayToWin: Attempting direct Shopify API call...');
    const searchUrl = `https://www.paytowin.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      mode: 'cors',
    });

    if (response.ok) {
      const data = await response.json();
      const products = data.resources?.results?.products || [];

      const results = products.slice(0, 10).map((product: any) => {
        let extractedSet = "Magic Singles";
        if (product.body) {
          const setMatch = product.body.match(/<td>Set:<\/td>\s*<td>([^<]+)<\/td>/);
          if (setMatch) {
            extractedSet = setMatch[1].trim();
          }
        }

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

      console.log(`✅ PayToWin: Found ${results.length} results via direct API`);
      return results;
    }
  } catch (error) {
    console.log('⚠️ PayToWin: Direct API failed, trying server fallback...', error);
  }

  // Final fallback to server endpoint
  try {
    const serverResponse = await fetch('/api/paytowin-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardName }),
    });

    if (serverResponse.ok) {
      const results = await serverResponse.json();
      console.log(`✅ PayToWin: Found ${results.length} results via server fallback`);
      return results;
    }
  } catch (serverError) {
    console.error('❌ PayToWin: All methods failed:', serverError);
  }

  return [];
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

// Magic Sur with Cloudflare Worker priority
export const searchMagicsurDirect = async (cardName: string): Promise<CardResult[]> => {
  try {
    console.log('🔍 Magic Sur: Attempting Cloudflare Worker...');
    const workerResponse = await fetch(`${WORKER_BASE_URL}/magicsur?q=${encodeURIComponent(cardName)}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      }
    });

    if (workerResponse.ok) {
      const data = await workerResponse.json();
      const products = data.suggestions || [];

      const results = products.slice(0, 10).map((product: any) => {
        // Extract price from HTML
        let priceValue = "Precio no disponible";
        if (product.price) {
          const priceMatch = product.price.match(/(\d+\.?\d*)/);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace('.', ''));
            priceValue = `$${price.toLocaleString('es-CL')} CLP`;
          }
        }

        return {
          store: "Magic Sur",
          storeUrl: "https://www.cartasmagicsur.cl",
          cardName: product.value || cardName,
          price: priceValue,
          inStock: product.instock || false,
          productUrl: product.url || "https://www.cartasmagicsur.cl",
          imageUrl: product.img || undefined,
          condition: "Near Mint",
          set: product.categoria || "Magic Singles"
        };
      });

      console.log(`✅ Magic Sur: Found ${results.length} results via Cloudflare Worker`);
      return results;
    }
  } catch (error) {
    console.log('⚠️ Magic Sur: Cloudflare Worker failed, trying direct API...', error);
  }

  // Fallback to direct WordPress AJAX
  try {
    console.log('🔍 Magic Sur: Attempting direct WordPress AJAX call...');
    const searchUrl = `https://www.cartasmagicsur.cl/wp-admin/admin-ajax.php?action=porto_ajax_search_posts&nonce=f4be613acf&post_type=product&query=${encodeURIComponent(cardName)}`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      const products = data.suggestions || [];

      const results = products.slice(0, 10).map((product: any) => {
        let priceValue = "Precio no disponible";
        if (product.price) {
          const priceMatch = product.price.match(/(\d+\.?\d*)/);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace('.', ''));
            priceValue = `$${price.toLocaleString('es-CL')} CLP`;
          }
        }

        return {
          store: "Magic Sur",
          storeUrl: "https://www.cartasmagicsur.cl",
          cardName: product.value || cardName,
          price: priceValue,
          inStock: product.instock || false,
          productUrl: product.url || "https://www.cartasmagicsur.cl",
          imageUrl: product.img || undefined,
          condition: "Near Mint",
          set: product.categoria || "Magic Singles"
        };
      });

      console.log(`✅ Magic Sur: Found ${results.length} results via direct API`);
      return results;
    }
  } catch (error) {
    console.log('⚠️ Magic Sur: Direct API failed, trying server fallback...', error);
  }

  // Final fallback to server endpoint
  try {
    const serverResponse = await fetch('/api/magicsur-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardName }),
    });

    if (serverResponse.ok) {
      const results = await serverResponse.json();
      console.log(`✅ Magic Sur: Found ${results.length} results via server fallback`);
      return results;
    }
  } catch (serverError) {
    console.error('❌ Magic Sur: All methods failed:', serverError);
  }

  return [];
};

// Store API capabilities detection
export const getStoreApiCapabilities = () => {
  return {
    'Pay2Win': { hasDirectApi: true, method: 'shopify' },
    'La Cripta': { hasDirectApi: true, method: 'woocommerce' },
    'Catlotus': { hasDirectApi: true, method: 'custom-api' },
    'TCGMatch': { hasDirectApi: true, method: 'custom-api' },
    'Magic Sur': { hasDirectApi: true, method: 'wordpress-ajax' }
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
    case 'Magic Sur':
      return await searchMagicsurDirect(cardName);
    default:
      throw new Error(`No direct API available for ${storeName}`);
  }
};