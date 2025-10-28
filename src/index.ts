import { GoogleGenAI } from '@google/genai';

// ============================================================================
// Types
// ============================================================================

export interface Scene {
  text: string;
}

export interface Book {
  bookTitle: string;
  shortDescription: string;
  motivationEnd: string;
  scenes: Scene[];
}

export interface GenerateRequestBody {
  name: string;
  age: number;
  gender: 'boy' | 'girl';
  topic: string;
  model?: string;
}

export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins
  API_KEY?: string; // Optional API key for additional protection
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const MAX_NAME_LENGTH = 50;
const MAX_TOPIC_LENGTH = 1000;
const MIN_AGE = 1;
const MAX_AGE = 99;

// Rate limiting: 5 requests per IP per hour
const RATE_LIMIT_WINDOW = 1800; // 30 minutes in seconds
const RATE_LIMIT_MAX_REQUESTS = 5;

// ============================================================================
// Prompt Builder
// ============================================================================

function buildPrompt({ name, age, gender, topic }: GenerateRequestBody): string {
  return `
    ## Create an Original Children's Fairy Tale

Create an **original children's fairy tale** suitable for ages **2–7**, written entirely in **Bulgarian**, that can be turned into an illustrated book.

**Important:** The story should always include **magical elements, fantastical creatures, or enchanting worlds** to stimulate the child's imagination and provide rich, visually appealing scenes for illustration.

---

## Configuration

* **Main Character:** [${name} (${gender}), ${age} years old]
* **Theme/Setting:** [${topic}]

---

## Response Format

**MANDATORY: Return the result in the following JSON format:**

{
  "bookTitle": "<book title>",
  "shortDescription": "<a short (2-3 sentences) motivational quote related to the book (not a direct message to the child)>",
  "motivationEnd": "<a short (2-3 sentences) motivational quote for the end of the book (not a direct message to the child)>",
  "scenes": [
    {
      "text": "<scene text - consider Technical requirements. New lines must be on a separate line (use \\n\\n for a new line)>"
    }
  ]
}

---

## Technical Requirements

* **14 scenes** (one per A5 page)
* **Progressive length:** 3–4 sentences at the beginning → 4–5 at the climax → 3–4 at the end
* **Total length:** 700–1200 words
* **Each scene easy to illustrate** with **hidden details** for re-reading
* Include **at least one magical or fantastical element per scene** (enchanted object, talking animal, magical landscape, mysterious sound, etc.)

---

## Stylistic Requirements

* **Warm, poetic language** with musicality
* **Simple, understandable words** without complex concepts
* **Smooth sentences** for easy read-aloud
* **Descriptive style** with a **magical feel**
* **NO descriptions of the appearance of [${name}]** (let the child imagine it)
* **Name the emotions**: "joyfully," "curiously," "proudly"

---

## Content Elements

* ✅ Adventure, discovery, and **magical transformation**
* ✅ Clearly named emotions and feelings
* ✅ Healthy coping strategies (deep breathing, asking for help, or similar)
* ✅ Friendship and mutual help
* ✅ Positive messages and life lessons
* ✅ Clear cause-and-effect relationships

---

## Structural Framework

### 1. INTRODUCTION (scenes 1–2)

* Present the hero in their familiar environment
* Show normal day/world with **named emotions**
* **Hint at the upcoming magical adventure**

### 2. DEVELOPMENT (scenes 3-10)

* The hero encounters a challenge or problem
* Use the **rule of three** — three attempts/obstacles
* Include magical helpers or enchanted friends
* Show emotional growth and coping strategies

### 3. CLIMAX (scenes 11-12)

* Peak magical moment with courage, wisdom, or kindness
* Most exciting magical event of the story
* Learn an important lesson with **clearly named emotions**

### 4. RESOLUTION (scenes 13-14)

* Problem solved with **positive magical resolution**
* Hero has changed/learned something
* Warm, soothing ending with **positive emotions**

---

## Flow and Consistency Rules

* **Every scene (except the first) must begin with an element connecting it to the previous scene**
* Show time passing naturally ("Next morning…," "After an hour…," etc.)
* Maintain a **logical sequence of magical events**

---

## Engagement Techniques

* **Repetitions:** "Тррр-тррр…," or similar
* **Magical recurring phrase:** "И тогава се случи нещо вълшебно…" or similar
* **Onomatopoeia and rhythm:** "Ооо-ооо," "Шшшш," etc.
* **Hidden visual details** in every scene for illustration

---

## Sensory Descriptions

* Use **colors, sounds, textures, smells, and temperatures** to bring magical worlds to life
* Emphasize **contrasts**: warm golden glow vs. cool moonlight, soft moss vs. sparkling crystal paths

---

## Visual Guidelines for the Illustrator

* **Angles:** multiple points of view
* **Hidden elements** for re-reading
* **Color palette:** warm for positive moments, cooler for challenges
* **Size and scale:** giant magical creatures vs. small hero
* **Emotion through gestures and setting**

---

## Important Reminders

* ❗ **DO NOT describe [${name}]'s appearance**
* ❗ **Each scene must have visual potential for illustration**
* ❗ **Maintain a positive tone — avoid scary/distressing elements**
* ❗ **Include magical worlds, creatures, or objects in every section**
* ❗ **Name emotions clearly**
* ❗ **Show healthy ways of coping**
* ❗ **Each scene must flow smoothly and logically**

---

## Final Checklist

* [ ] 14 scenes with progressive length (3–4 → 4–5 → 3–4 sentences)
* [ ] 700–1200 total words
* [ ] Magical worlds/creatures/objects woven throughout
* [ ] Positive message with healthy coping strategies
* [ ] Each scene suitable for illustration and re-reading
* [ ] JSON response format`;
}

// ============================================================================
// Security & Validation
// ============================================================================

function validateRequest(body: any): { valid: boolean; error?: string; data?: GenerateRequestBody } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { name, age, gender, topic } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Name is required and must be a non-empty string' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name must be less than ${MAX_NAME_LENGTH} characters` };
  }

  if (!age || typeof age !== 'number' || age < MIN_AGE || age > MAX_AGE) {
    return { valid: false, error: `Age must be between ${MIN_AGE} and ${MAX_AGE}` };
  }

  if (gender !== 'boy' && gender !== 'girl') {
    return { valid: false, error: 'Gender must be "boy" or "girl"' };
  }

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return { valid: false, error: 'Topic is required and must be a non-empty string' };
  }

  if (topic.length > MAX_TOPIC_LENGTH) {
    return { valid: false, error: `Topic must be less than ${MAX_TOPIC_LENGTH} characters` };
  }

  return {
    valid: true,
    data: {
      name: name.trim(),
      age,
      gender,
      topic: topic.trim(),
      model: body.model || DEFAULT_MODEL,
    },
  };
}

function checkCORS(request: Request, env: Env): { allowed: boolean; origin?: string } {
  const origin = request.headers.get('Origin');
  
  if (!env.ALLOWED_ORIGINS) {
    // If no origins configured, allow all (not recommended for production)
    return { allowed: true, origin: origin || '*' };
  }

  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  
  if (origin && allowedOrigins.includes(origin)) {
    return { allowed: true, origin };
  }

  return { allowed: false };
}

async function checkRateLimit(request: Request): Promise<{ success: boolean; remaining?: number }> {
  // Use Cloudflare's built-in Rate Limiting API
  // Format: { limit: max_requests, period: seconds }
  const rateLimit = {
    limit: RATE_LIMIT_MAX_REQUESTS,
    period: RATE_LIMIT_WINDOW,
  };

  try {
    // Create a unique key based on IP address
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `${ip}`;

    // Use the Rate Limiting API
    const { success } = await (request as any).limit?.(rateLimitKey, rateLimit) ?? { success: true };
    
    // Calculate remaining (approximate, as Cloudflare doesn't expose exact counts)
    // We'll return this in headers for user feedback
    return { success };
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    console.error('Rate limit check failed:', error);
    return { success: true };
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

// ============================================================================
// Main Handler
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      const corsCheck = checkCORS(request, env);
      if (!corsCheck.allowed) {
        return jsonResponse({ error: 'Origin not allowed' }, 403);
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(corsCheck.origin!),
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Check CORS
    const corsCheck = checkCORS(request, env);
    if (!corsCheck.allowed) {
      return jsonResponse({ error: 'Origin not allowed' }, 403);
    }
    const corsHeadersMap = corsHeaders(corsCheck.origin!);

    // Optional API key check
    // if (env.API_KEY) {
    //   const apiKey = request.headers.get('X-API-Key');
    //   if (apiKey !== env.API_KEY) {
    //     return jsonResponse({ error: 'Invalid API key' }, 401, corsHeadersMap);
    //   }
    // }

    // Rate limiting using Cloudflare's built-in API
    // const rateLimitCheck = await checkRateLimit(request);
    
    // const rateLimitHeaders = {
    //   'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
    //   'X-RateLimit-Window': `${RATE_LIMIT_WINDOW}s`,
    // };

    // if (!rateLimitCheck.success) {
    //   return jsonResponse(
    //     { error: 'Rate limit exceeded. Please try again later.' },
    //     429,
    //     { ...corsHeadersMap, ...rateLimitHeaders }
    //   );
    // }

    try {
      // Parse and validate request body
      const body = await request.json();
      const validation = validateRequest(body);
      
      if (!validation.valid) {
        return jsonResponse(
          { error: validation.error },
          400,
          { ...corsHeadersMap /*, ...rateLimitHeaders*/ }
        );
      }

      const requestData = validation.data!;

      // Check for Gemini API key
      if (!env.GEMINI_API_KEY) {
        return jsonResponse(
          { error: 'Service configuration error' },
          500,
          { ...corsHeadersMap, /*...rateLimitHeaders*/ }
        );
      }

      // Build prompt
      const prompt = buildPrompt(requestData);

      // Call Gemini API
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const response: any = await ai.models.generateContent({
        model: requestData.model || DEFAULT_MODEL,
        contents: prompt,
        config: {
          temperature: 0.9,
          thinkingConfig: { thinkingBudget: 0 },
        } as any,
      });

      const content = response?.text;

      if (!content) {
        return jsonResponse(
          { error: 'Empty response from AI model' },
          502,
          { ...corsHeadersMap, /*...rateLimitHeaders*/ }
        );
      }

      // Extract JSON (strip markdown fences if present)
      const jsonMatch = content.match(/```json([\s\S]*?)```/i);
      const raw = jsonMatch ? jsonMatch[1] : content;

      let parsed: Book;
      try {
        parsed = JSON.parse(raw.trim());
      } catch (err) {
        return jsonResponse(
          { error: 'Failed to parse AI response', details: 'Invalid JSON format' },
          502,
          { ...corsHeadersMap, /*...rateLimitHeaders*/ }
        );
      }

      // Validate book structure
      if (!parsed.bookTitle || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
        return jsonResponse(
          { error: 'Invalid book structure' },
          502,
          { ...corsHeadersMap, /*...rateLimitHeaders*/ }
        );
      }

      // Return successful response
      return jsonResponse(
        parsed,
        200,
        { ...corsHeadersMap, /*...rateLimitHeaders*/ }
      );

    } catch (error: any) {
      console.error('Worker error:', error);
      return jsonResponse(
        { error: 'Internal server error', message: error.message || 'Unknown error' },
        500,
        { ...corsHeadersMap, /*...rateLimitHeaders*/ }
      );
    }
  },
};

