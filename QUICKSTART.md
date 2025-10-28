# Quick Start Guide

## TL;DR - Deploy in 5 Minutes

```bash
# 1. Install dependencies
cd text-generation-worker
npm install

# 2. Set your Gemini API key
npx wrangler secret put GEMINI_API_KEY
# Paste your key when prompted

# 3. Set allowed origins (your WordPress domain)
npx wrangler secret put ALLOWED_ORIGINS
# Example: https://your-wordpress-site.com

# 4. (Optional) Set API key for extra security
npx wrangler secret put API_KEY
# Generate: openssl rand -hex 32

# 5. Deploy!
npm run deploy
```

## ✅ What You Get (100% FREE)

- ✨ AI-powered fairy tale generation
- 🔒 Built-in rate limiting (5 requests/IP/hour)
- 🌐 CORS protection
- 🚀 Global CDN distribution
- 💰 Zero cost (free tier)

## 🎯 Key Changes from Next.js API

### Before (Next.js)
```typescript
// Had both OpenAI and Gemini
// Needed environment variables in .env.local
// Ran on your server
```

### After (Cloudflare Worker)
```typescript
// Only Gemini (as requested)
// Secrets managed by Cloudflare
// Runs on Cloudflare's edge globally
// Built-in rate limiting (no KV needed!)
```

## 🔐 Security Features

1. **CORS Protection**: Only your WordPress domain can call it
2. **Rate Limiting**: 5 requests per IP per hour (Cloudflare native)
3. **API Key**: Optional additional layer
4. **Input Validation**: Prevents malicious inputs

## 📊 What's Free vs Paid?

| Feature | Free Tier | Cost |
|---------|-----------|------|
| Worker Requests | 100,000/day | $0 |
| CPU Time | 10ms/request | $0 |
| Rate Limiting | Built-in | $0 |
| CORS | Built-in | $0 |
| SSL/TLS | Built-in | $0 |
| Global CDN | Built-in | $0 |
| **TOTAL** | Everything | **$0** |

## 🧪 Test Your Worker

### Local Test
```bash
npm run dev

# In another terminal:
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-wordpress-site.com" \
  -d '{
    "name": "Мария",
    "age": 5,
    "gender": "girl",
    "topic": "космос и звезди"
  }'
```

### Production Test
```bash
./test-request.sh https://book-generation-worker.YOUR_SUBDOMAIN.workers.dev
```

## 🌐 WordPress Integration

### Option 1: HTML/JavaScript (Simple)
See `wordpress-example.html` - Just update the `WORKER_URL` and embed in your page.

### Option 2: PHP Integration (Advanced)
See `wordpress-example.php` - Add to your theme's functions.php or create a plugin.

## 🔧 Configuration

### Change Rate Limits
Edit `src/index.ts`:
```typescript
const RATE_LIMIT_WINDOW = 3600; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests
```

### Change Allowed Ages/Topic Length
Edit `src/index.ts`:
```typescript
const MIN_AGE = 2;
const MAX_AGE = 10;
const MAX_TOPIC_LENGTH = 200;
```

### Change Gemini Model
Default is `gemini-2.5-flash-lite` (fastest + cheapest)

Available models:
- `gemini-2.5-flash-lite` - Fastest, cheapest
- `gemini-2.5-flash` - Better quality

## ⚡ Performance

- **Request time**: 15-30 seconds (Gemini AI processing)
- **CPU time**: ~2-5ms (well under 10ms limit)
- **Cold start**: ~50-100ms
- **Idle time**: NOT counted (waiting for Gemini API)

## 🐛 Common Issues

### "Origin not allowed"
→ Set `ALLOWED_ORIGINS` to your WordPress domain

### "Invalid API key" (if you set API_KEY)
→ Add `X-API-Key` header to your requests

### "Rate limit exceeded"
→ Working as intended! Wait 1 hour or increase limits

### "Empty response from AI model"
→ Check your Gemini API key and quota

## 📚 Learn More

- Full documentation: `README.md`
- WordPress examples: `wordpress-example.php` and `wordpress-example.html`
- API details: See README.md "API Reference" section

## 🎉 You're Done!

Your worker is deployed and ready to generate fairy tales! 🧚‍♀️✨

