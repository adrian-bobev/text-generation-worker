# Book Generation Cloudflare Worker

A secure Cloudflare Worker that generates personalized children's fairy tales in Bulgarian using Google's Gemini AI.

## Features

- ✅ **Gemini AI Integration** - Uses Google's Gemini models for story generation
- 🔒 **Security Features**:
  - CORS protection (whitelist specific domains)
  - Built-in rate limiting (5 requests per IP per hour) - **100% FREE**
  - Optional API key authentication
  - Input validation and sanitization
- ⚡ **Efficient** - Optimized for Cloudflare's 10ms CPU time limit (idle time during API calls not counted)
- 🌍 **Production Ready** - Error handling, logging, and proper HTTP responses
- 💰 **100% Free Tier** - No paid services required (KV, Durable Objects, etc.)

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier is sufficient)
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Setup

### 1. Install Dependencies

```bash
cd text-generation-worker
npm install
```

### 2. Set Environment Variables

Set your Gemini API key (this is encrypted and stored securely):

```bash
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted
```

Set allowed origins (your WordPress site):

```bash
wrangler secret put ALLOWED_ORIGINS
# Example: https://your-wordpress-site.com,https://www.your-wordpress-site.com
```

(Optional) Set an API key for extra security:

```bash
wrangler secret put API_KEY
# Enter a secure random string (e.g., use: openssl rand -hex 32)
```

### 3. Test Locally

```bash
npm run dev
```

Test with curl:

```bash
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

If you set an API key:

```bash
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-wordpress-site.com" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "name": "Мария",
    "age": 5,
    "gender": "girl",
    "topic": "космос и звезди"
  }'
```

### 4. Deploy to Cloudflare

```bash
npm run deploy
```

Your worker will be deployed to: `https://book-generation-worker.YOUR_SUBDOMAIN.workers.dev`

## WordPress Integration

### Example WordPress/JavaScript Code

```javascript
async function generateBook(name, age, gender, topic) {
  try {
    const response = await fetch('https://book-generation-worker.YOUR_SUBDOMAIN.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // If you set an API key:
        // 'X-API-Key': 'your-api-key-here'
      },
      body: JSON.stringify({
        name: name,
        age: parseInt(age),
        gender: gender,
        topic: topic
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate book');
    }

    const book = await response.json();
    return book;
  } catch (error) {
    console.error('Error generating book:', error);
    throw error;
  }
}

// Usage example
generateBook('Мария', 5, 'girl', 'космос и звезди')
  .then(book => {
    console.log('Book title:', book.bookTitle);
    console.log('Scenes:', book.scenes.length);
    // Display the book in your UI
  })
  .catch(error => {
    alert('Failed to generate book: ' + error.message);
  });
```

### WordPress PHP Integration

```php
<?php
function generate_fairy_tale($name, $age, $gender, $topic) {
    $url = 'https://book-generation-worker.YOUR_SUBDOMAIN.workers.dev';
    
    $data = array(
        'name' => $name,
        'age' => intval($age),
        'gender' => $gender,
        'topic' => $topic
    );
    
    $args = array(
        'body' => json_encode($data),
        'headers' => array(
            'Content-Type' => 'application/json',
            // If you set an API key:
            // 'X-API-Key' => 'your-api-key-here'
        ),
        'timeout' => 60,
        'method' => 'POST'
    );
    
    $response = wp_remote_post($url, $args);
    
    if (is_wp_error($response)) {
        return array('error' => $response->get_error_message());
    }
    
    $body = wp_remote_retrieve_body($response);
    return json_decode($body, true);
}
?>
```

## API Reference

### POST /

Generate a children's fairy tale.

**Request Body:**

```json
{
  "name": "Мария",
  "age": 5,
  "gender": "girl",
  "topic": "космос и звезди",
  "model": "gemini-2.5-flash-lite"
}
```

**Request Headers:**

- `Content-Type: application/json` (required)
- `Origin: https://your-wordpress-site.com` (required for CORS)
- `X-API-Key: your-api-key` (optional, if API_KEY is set)

**Response (200 OK):**

```json
{
  "bookTitle": "Мария и звездните приключения",
  "shortDescription": "Магическа приказка за любопитно момиче...",
  "motivationEnd": "Всяко дете може да открие вълшебството...",
  "scenes": [
    { "text": "Една вечер Мария стоеше на балкона..." },
    { "text": "Изведнъж една звезда засия по-ярко..." }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid API key
- `403 Forbidden` - Origin not allowed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - AI model error

## Security Configuration

### Rate Limiting

**Built-in Cloudflare Rate Limiting (FREE)** - No KV or Durable Objects needed!

Default: **5 requests per IP per hour**

To modify, edit `src/index.ts`:

```typescript
const RATE_LIMIT_WINDOW = 3600; // seconds (1 hour)
const RATE_LIMIT_MAX_REQUESTS = 5; // max requests per window
```

Rate limiting uses Cloudflare's native API which is:
- ✅ Free (no additional costs)
- ✅ Fast (no external storage lookups)
- ✅ Reliable (handled at the edge)
- ✅ Simple (no setup required)

### Input Validation

- **Name:** Max 50 characters
- **Age:** Between 2-10 years
- **Gender:** Must be "boy" or "girl"
- **Topic:** Max 200 characters

To modify, edit the constants in `src/index.ts`:

```typescript
const MAX_NAME_LENGTH = 50;
const MAX_TOPIC_LENGTH = 200;
const MIN_AGE = 2;
const MAX_AGE = 10;
```

### CORS Configuration

Set allowed origins via environment variable:

```bash
wrangler secret put ALLOWED_ORIGINS
# Enter: https://site1.com,https://site2.com
```

To allow all origins (not recommended for production), leave `ALLOWED_ORIGINS` unset.

## Monitoring

### View Logs

```bash
npm run tail
```

### Check Rate Limits

Rate limit info is returned in response headers:

```
X-RateLimit-Limit: 5
X-RateLimit-Window: 3600s
```

### Analytics

View analytics in Cloudflare Dashboard:
- Workers & Pages → book-generation-worker → Metrics

## Cost Estimation (Free Tier)

**100% FREE - No paid services used!**

- ✅ **Requests:** 100,000/day (free)
- ✅ **CPU Time:** 10ms per request (free)
- ✅ **Rate Limiting:** Built-in, no cost
- ✅ **No KV/Durable Objects:** Zero storage costs

With 5 requests per IP per hour rate limiting, you can handle thousands of unique IPs per day completely free!

## Troubleshooting

### "Rate limit exceeded" errors

The rate limiting is working correctly. Wait 1 hour or increase limits in code.

### "Origin not allowed" errors

Add your WordPress domain to `ALLOWED_ORIGINS`:

```bash
wrangler secret put ALLOWED_ORIGINS
```

### "CPU time exceeded" errors

The worker is optimized for 10ms CPU time. The actual AI generation time (5-30 seconds) doesn't count against this limit as it's idle/waiting time.

If you still see this error:
1. Check Cloudflare metrics to see actual CPU usage
2. The rate limiting is now using native Cloudflare API (no KV lookups = faster)
3. Consider upgrading to paid plan ($5/month for 50ms CPU time) if needed

### Gemini API errors

- Verify your API key is correct
- Check quotas in [Google AI Studio](https://makersuite.google.com/)
- Ensure the model name is valid (e.g., `gemini-2.5-flash-lite`)

## Development

### Project Structure

```
text-generation-worker/
├── src/
│   └── index.ts          # Main worker code
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── wrangler.toml         # Cloudflare config
└── README.md            # This file
```

### Local Development with Secrets

Create `.dev.vars` file (not committed to git):

```
GEMINI_API_KEY=your-key-here
ALLOWED_ORIGINS=http://localhost:3000
API_KEY=test-key
```

Then run:

```bash
npm run dev
```

## License

MIT

