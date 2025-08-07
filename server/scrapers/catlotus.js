export async function scrapeCatlotus(browser, cardName) {
  const page = await browser.newPage();
  
  try {
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to Catlotus search
    await page.goto('https://catlotus.cl', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit to avoid looking like a bot
    await page.waitForTimeout(1000 + Math.random() * 2000);
    
    // Look for search input - trying common selectors
    const searchSelectors = [
      'input[type="search"]',
      'input[name="search"]',
      'input[name="q"]',
      'input[placeholder*="buscar"]',
      'input[placeholder*="search"]',
      '.search-input',
      '#search',
      '.search-box input'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        searchInput = await page.$(selector);
        if (searchInput) break;
      } catch (e) {
        continue;
      }
    }
    
    if (!searchInput) {
      console.log('Could not find search input on Catlotus');
      return [];
    }
    
    // Type the card name
    await searchInput.click();
    await searchInput.type(cardName, { delay: 100 });
    
    // Submit search - try different methods
    try {
      await Promise.race([
        searchInput.press('Enter'),
        page.click('button[type="submit"]'),
        page.click('.search-button'),
        page.click('input[type="submit"]')
      ]);
    } catch (e) {
      await searchInput.press('Enter');
    }
    
    // Wait for results
    await page.waitForTimeout(3000);
    
    // Try to find product containers
    const productSelectors = [
      '.product',
      '.item',
      '.card',
      '.product-item',
      '.search-result',
      '[class*="product"]',
      '[class*="item"]'
    ];
    
    let products = [];
    for (const selector of productSelectors) {
      try {
        products = await page.$$(selector);
        if (products.length > 0) break;
      } catch (e) {
        continue;
      }
    }
    
    if (products.length === 0) {
      console.log('No products found on Catlotus for:', cardName);
      return [];
    }
    
    const results = [];
    
    // Extract information from each product
    for (let i = 0; i < Math.min(products.length, 5); i++) {
      try {
        const product = products[i];
        
        // Extract product name
        const nameElement = await product.$('h1, h2, h3, h4, .product-name, .item-name, .title, [class*="name"], [class*="title"]') || 
                           await product.$('a');
        const productName = nameElement ? await page.evaluate(el => el.textContent?.trim(), nameElement) : cardName;
        
        // Extract price
        const priceElement = await product.$('.price, .cost, [class*="price"], [class*="cost"], [class*="valor"]');
        let price = 'Precio no disponible';
        if (priceElement) {
          const priceText = await page.evaluate(el => el.textContent?.trim(), priceElement);
          if (priceText && priceText.match(/\d/)) {
            price = priceText.includes('CLP') ? priceText : `${priceText} CLP`;
          }
        }
        
        // Extract stock status
        const stockElement = await product.$('.stock, .availability, [class*="stock"], [class*="disponib"]');
        let inStock = true;
        if (stockElement) {
          const stockText = await page.evaluate(el => el.textContent?.toLowerCase(), stockElement);
          inStock = !stockText.includes('agotado') && !stockText.includes('sin stock') && !stockText.includes('no disponible');
        }
        
        // Extract product URL
        const linkElement = await product.$('a');
        let productUrl = `https://catlotus.cl/search?q=${encodeURIComponent(cardName)}`;
        if (linkElement) {
          const href = await page.evaluate(el => el.getAttribute('href'), linkElement);
          if (href) {
            productUrl = href.startsWith('http') ? href : `https://catlotus.cl${href}`;
          }
        }
        
        // Extract condition if available
        const conditionElement = await product.$('.condition, [class*="condition"], [class*="estado"]');
        let condition = 'Near Mint';
        if (conditionElement) {
          const conditionText = await page.evaluate(el => el.textContent?.trim(), conditionElement);
          condition = conditionText || 'Near Mint';
        }
        
        // Extract set if available
        const setElement = await product.$('.set, .expansion, [class*="set"], [class*="expansion"]');
        let set = 'Magic Singles';
        if (setElement) {
          const setText = await page.evaluate(el => el.textContent?.trim(), setElement);
          set = setText || 'Magic Singles';
        }
        
        results.push({
          store: 'Catlotus',
          storeUrl: 'https://catlotus.cl',
          cardName: productName,
          price: price,
          inStock: inStock,
          productUrl: productUrl,
          condition: condition,
          set: set
        });
        
      } catch (error) {
        console.error('Error extracting product info from Catlotus:', error);
        continue;
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Error scraping Catlotus:', error);
    return [];
  } finally {
    await page.close();
  }
}