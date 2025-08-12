/**
 * Cloudflare Worker for MTG Card API Proxy
 * Handles CORS and acts as a proxy for various card store APIs
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route to appropriate store API
      if (path.startsWith('/paytowin')) {
        return await handlePaytowin(request, corsHeaders);
      } else if (path.startsWith('/magicsur')) {
        return await handleMagicsur(request, corsHeaders);
      } else if (path.startsWith('/lacripta')) {
        return await handleLacripta(request, corsHeaders);
      } else if (path.startsWith('/tcgmatch')) {
        return await handleTcgmatch(request, corsHeaders);
      } else if (path.startsWith('/catlotus')) {
        return await handleCatlotus(request, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handlePaytowin(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');
  
  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const shopifyUrl = `https://paytowin.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product&resources[limit]=10`;
  
  const response = await fetch(shopifyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`PayToWin API error: ${response.status}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleMagicsur(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');
  
  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const magicsurUrl = 'https://www.cartasmagicsur.cl/wp-admin/admin-ajax.php';
  const formData = new FormData();
  formData.append('action', 'aws_action');
  formData.append('keyword', cardName);

  const response = await fetch(magicsurUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.cartasmagicsur.cl/',
      'Origin': 'https://www.cartasmagicsur.cl',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    redirect: 'follow'
  });

  // Check if we were redirected to captcha
  if (response.url.includes('sgcaptcha') || response.url.includes('captcha')) {
    console.log('Magic Sur redirected to captcha:', response.url);
    return new Response(JSON.stringify({ 
      error: 'Magic Sur blocked request - captcha detected',
      redirectUrl: response.url 
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!response.ok) {
    console.log('Magic Sur API error:', response.status, response.statusText);
    throw new Error(`Magic Sur API error: ${response.status}`);
  }

  const data = await response.text();
  console.log('Magic Sur response length:', data.length);
  
  return new Response(data, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html' }
  });
}

async function handleLacripta(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');
  
  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const lacriptaUrl = `https://lacriptastore.com/wp-json/wc/v3/products?search=${encodeURIComponent(cardName)}&per_page=20`;
  
  const response = await fetch(lacriptaUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`La Cripta API error: ${response.status}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleTcgmatch(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');
  
  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const tcgmatchUrl = `https://tcgmatch.com/api/products?search=${encodeURIComponent(cardName)}&limit=20`;
  
  const response = await fetch(tcgmatchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`TCGMatch API error: ${response.status}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleCatlotus(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');
  
  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const catlotusUrl = 'https://catlotus.cl/api/products/search';
  
  const response = await fetch(catlotusUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: cardName,
      limit: 20
    })
  });

  if (!response.ok) {
    throw new Error(`Catlotus API error: ${response.status}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}