import express from 'express';
import cors from 'cors';

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

// Puppeteer removed: no headless browser is used anymore.

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

// Generic scraper endpoint removed (Puppeteer-based scraping no longer used)

// Search-all endpoint removed (Puppeteer-based scraping no longer used)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});