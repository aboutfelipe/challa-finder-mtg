# Cloudflare Worker Deployment Guide

## Prerequisites
1. Cloudflare account (free tier is sufficient)
2. Node.js and npm installed
3. Wrangler CLI tool

## Setup Instructions

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create Worker Project
```bash
# In your project root
mkdir cloudflare-worker
cd cloudflare-worker
wrangler init mtg-api-proxy
```

### 4. Copy Worker Code
Copy the contents of `cloudflare-worker.js` to the newly created worker file.

### 5. Configure wrangler.toml
```toml
name = "mtg-api-proxy"
main = "src/index.js"
compatibility_date = "2023-12-01"

[vars]
ENVIRONMENT = "production"
```

### 6. Deploy Worker
```bash
wrangler deploy
```

### 7. Update Frontend Configuration
After deployment, update the `WORKER_BASE_URL` in `src/services/directApiSearch.ts`:

```typescript
const WORKER_BASE_URL = 'https://mtg-api-proxy.your-subdomain.workers.dev';
```

## Testing

### Test each endpoint:
- `https://your-worker.workers.dev/paytowin?q=lightning%20bolt`
- `https://your-worker.workers.dev/magicsur?q=lightning%20bolt`
- `https://your-worker.workers.dev/lacripta?q=lightning%20bolt`
- `https://your-worker.workers.dev/tcgmatch?q=lightning%20bolt`
- `https://your-worker.workers.dev/catlotus?q=lightning%20bolt`

## Benefits

✅ **Solves CORS issues** for all APIs
✅ **Global edge deployment** for faster response times
✅ **Free tier** supports up to 100,000 requests/day
✅ **Automatic caching** at edge locations
✅ **99.9% uptime** with Cloudflare's infrastructure
✅ **Maintains all existing fallbacks** for maximum reliability

## Monitoring

Use Cloudflare's dashboard to monitor:
- Request volume
- Error rates
- Response times
- Geographic distribution

## Custom Domain (Optional)

For a custom domain like `api.yourdomain.com`:
1. Add a CNAME record in your DNS pointing to your worker
2. Configure the route in Cloudflare Workers dashboard