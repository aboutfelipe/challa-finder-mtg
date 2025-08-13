import { CardResult } from "@/components/SearchResults";

// API base URL - in production this would be configurable
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-scraper-api.com' 
  : 'http://localhost:3001';

// Interface for search response that includes metadata
export interface SearchResponse {
  results: CardResult[];
  isRealScraping: boolean;
  message: string;
  timestamp: string;
}

export const searchCardInAllStores = async (cardName: string): Promise<SearchResponse> => {
  try {
    console.log(`🔍 Iniciando scraping real para: "${cardName}"`);
    console.log(`📡 Conectando al servidor: ${API_BASE_URL}`);
    
    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardName }),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
    }

    const results: CardResult[] = await response.json();
    
    console.log(`✅ Scraping completado exitosamente. ${results.length} resultados obtenidos.`);
    
    return {
      results,
      isRealScraping: true,
      message: `Scraping completado exitosamente. Se obtuvieron ${results.length} resultados de las tiendas.`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en el scraping:', error);
    
    // Check if it's a network error (server not running)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const errorMessage = 'El servidor de scraping no está disponible. Asegúrate de ejecutar: npm run server';
      throw new Error(errorMessage);
    }
    
    // For other errors, throw them as well
    throw new Error(`Error en el scraping: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Function to check if scraper server is available
export const checkScraperHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.log('🚫 Servidor de scraping no disponible');
    return false;
  }
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