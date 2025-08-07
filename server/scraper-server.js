import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { scrapeCatlotus } from './scrapers/catlotus.js';
import { scrapePaytowin } from './scrapers/paytowin.js';
import { scrapeLacripta } from './scrapers/lacripta.js';
import { scrapeTcgmatch } from './scrapers/tcgmatch.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cache for storing recent searches (simple in-memory cache)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, []);
  }
  
  const requests = rateLimiter.get(ip);
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}

// Global browser instance
let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }
  return browser;
}

// PayToWin direct API endpoint (to bypass CORS)
app.post('/api/paytowin-direct', async (req, res) => {
  const { cardName } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  if (!cardName) {
    return res.status(400).json({ error: 'Card name is required' });
  }

  try {
    const searchUrl = `https://www.paytowin.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
      }
    });

    if (!response.ok) {
      throw new Error(`PayToWin API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const products = data.resources?.results?.products || [];

    const results = products.slice(0, 10).map((product) => {
      // Extract set information from the body HTML
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
        const conditionTags = product.tags.filter((tag) => 
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

    res.json(results);
  } catch (error) {
    console.error('Error calling PayToWin API:', error);
    res.status(500).json({ error: `Error calling PayToWin API: ${error.message}` });
  }
});

// Magic Sur direct API endpoint (to bypass CORS)
app.post('/api/magicsur-direct', async (req, res) => {
  const { cardName } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  if (!cardName) {
    return res.status(400).json({ error: 'Card name is required' });
  }

  try {
    const searchUrl = `https://www.cartasmagicsur.cl/wp-admin/admin-ajax.php?action=porto_ajax_search_posts&nonce=f4be613acf&post_type=product&query=${encodeURIComponent(cardName)}`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
      }
    });

    if (!response.ok) {
      throw new Error(`Magic Sur API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const products = data.suggestions || [];

    const results = products.slice(0, 10).map((product) => {
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
        condition: "Near Mint", // Default condition
        set: product.categoria || "Magic Singles"
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Error calling Magic Sur API:', error);
    res.status(500).json({ error: `Error calling Magic Sur API: ${error.message}` });
  }
});

// Generic scraper endpoint
app.post('/api/scrape/:store', async (req, res) => {
  const { store } = req.params;
  const { cardName } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  if (!cardName) {
    return res.status(400).json({ error: 'Card name is required' });
  }

  // Check cache
  const cacheKey = `${store}-${cardName.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.json(cached.data);
  }

  try {
    const browserInstance = await getBrowser();
    let results = [];

    switch (store) {
      case 'catlotus':
        results = await scrapeCatlotus(browserInstance, cardName);
        break;
      case 'paytowin':
        results = await scrapePaytowin(browserInstance, cardName);
        break;
      case 'lacripta':
        results = await scrapeLacripta(browserInstance, cardName);
        break;
      case 'tcgmatch':
        results = await scrapeTcgmatch(browserInstance, cardName);
        break;
      default:
        return res.status(404).json({ error: 'Store not found' });
    }

    // Cache results
    cache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    res.json(results);
  } catch (error) {
    console.error(`Error scraping ${store}:`, error);
    res.status(500).json({ error: `Error scraping ${store}: ${error.message}` });
  }
});

// Search all stores endpoint
app.post('/api/search', async (req, res) => {
  const { cardName } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  if (!cardName) {
    return res.status(400).json({ error: 'Card name is required' });
  }

  try {
    const browserInstance = await getBrowser();
    const stores = ['catlotus', 'paytowin', 'lacripta', 'tcgmatch'];
    
    const searchPromises = stores.map(async (store) => {
      try {
        switch (store) {
          case 'catlotus':
            return await scrapeCatlotus(browserInstance, cardName);
          case 'paytowin':
            return await scrapePaytowin(browserInstance, cardName);
          case 'lacripta':
            return await scrapeLacripta(browserInstance, cardName);
          case 'tcgmatch':
            return await scrapeTcgmatch(browserInstance, cardName);
          default:
            return [];
        }
      } catch (error) {
        console.error(`Error scraping ${store}:`, error);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    const allResults = results.flat();

    // Sort by availability and price
    allResults.sort((a, b) => {
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

    res.json(allResults);
  } catch (error) {
    console.error('Error searching all stores:', error);
    res.status(500).json({ error: 'Error searching stores' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Scraper server running on port ${PORT}`);
});