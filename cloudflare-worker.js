/**
 * Cloudflare Worker for MTG Card API Proxy - UPDATED VERSION WITH CUSTOM TYPE FILTERING
 * Handles CORS and acts as a proxy for various card store APIs
 * Agregar a script dentro de Cloudflare Worker UI
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
      } else if (path.startsWith('/lacomarca')) {
        return await handleLacomarca(request, corsHeaders);
      } else if (path.startsWith('/piedrabruja')) {
        return await handlePiedrabruja(request, corsHeaders);
      } else if (path.startsWith('/afkstore')) {
        return await handleAfkstore(request, corsHeaders);
      } else if (path.startsWith('/oasisgames')) {
        return await handleOasisgames(request, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
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

  const shopifyUrl = `https://paytowin.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product`;

  const response = await fetch(shopifyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`PayToWin API error: ${response.status}`);
  }

  const data = await response.json();

  // Filtrar productos cuyo type sea "MTG Single"
  if (data.resources?.results?.products) {
    data.resources.results.products = data.resources.results.products.filter(p =>
      p.type === "MTG Single"
    );
  }

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

  const tcgmatchUrl = `https://api.tcgmatch.cl/products/search?palabra=${encodeURIComponent(cardName)}&tcg=magic`;

  const response = await fetch(tcgmatchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
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

  const catlotusUrl = 'https://catlotus.cl/api/search/card';

  const response = await fetch(catlotusUrl, {
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

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

  const lacriptaUrl = `https://lacriptastore.com/wp-json/wc/v3/products?search=${encodeURIComponent(cardName)}`;

  const response = await fetch(lacriptaUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
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
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.cartasmagicsur.cl/',
      'Origin': 'https://www.cartasmagicsur.cl',
      'X-Requested-With': 'XMLHttpRequest',
    },
    redirect: 'follow'
  });

  if (response.url.includes('captcha')) {
    return new Response(JSON.stringify({
      error: 'Magic Sur blocked request - captcha detected',
      redirectUrl: response.url
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!response.ok) {
    throw new Error(`Magic Sur API error: ${response.status}`);
  }

  const data = await response.text();

  return new Response(data, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html' }
  });
}

async function handleLacomarca(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');

  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const shopifyUrl = `https://www.tiendalacomarca.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product`;

  const response = await fetch(shopifyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`La Comarca API error: ${response.status}`);
  }

  const data = await response.json();

  // Filtrar productos cuyo type sea "MTG Single"
  if (data.resources?.results?.products) {
    data.resources.results.products = data.resources.results.products.filter(p =>
      p.type === "MTG Single"
    );
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handlePiedrabruja(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');

  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const shopifyUrl = `https://piedrabruja.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product`;

  const response = await fetch(shopifyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Piedra Bruja API error: ${response.status}`);
  }

  const data = await response.json();

  // Filtrar productos cuyo type sea "singlemtg"
  if (data.resources?.results?.products) {
    data.resources.results.products = data.resources.results.products.filter(p =>
      p.type === "singlemtg"
    );
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAfkstore(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');

  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const shopifyUrl = `https://afkstore.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product`;

  const response = await fetch(shopifyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`AfkStore API error: ${response.status}`);
  }

  const data = await response.json();

  // Filtrar productos cuyo type sea "Singles Magic"
  if (data.resources?.results?.products) {
    data.resources.results.products = data.resources.results.products.filter(p =>
      p.type === "Singles Magic"
    );
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleOasisgames(request, corsHeaders) {
  const url = new URL(request.url);
  const cardName = url.searchParams.get('q');

  if (!cardName) {
    return new Response(JSON.stringify({ error: 'Missing card name' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const shopifyUrl = `https://oasisgames.cl/search/suggest.json?q=${encodeURIComponent(cardName)}&resources[type]=product`;

  const response = await fetch(shopifyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Oasis Games API error: ${response.status}`);
  }

  const data = await response.json();

  // Filtrar productos cuyo type sea "MTG Single"
  if (data.resources?.results?.products) {
    data.resources.results.products = data.resources.results.products.filter(p =>
      p.type === "MTG Single"
    );
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
} 