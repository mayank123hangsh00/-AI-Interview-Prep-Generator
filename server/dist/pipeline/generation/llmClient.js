/**
 * LLM Client — Multi-provider wrapper supporting Groq, Google Gemini, and OpenAI.
 *
 * Configurable via environment variables:
 * - LLM_PROVIDER=groq | gemini | openai
 * - GROQ_API_KEY / GROQ_MODEL (e.g. openai/gpt-oss-20b, llama-3.3-70b-versatile)
 * - GEMINI_API_KEY
 * - OPENAI_API_KEY / OPENAI_MODEL (e.g. gpt-4o-mini)
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { RateLimiter, retryWithBackoff, sleep } from '../../utils/rateLimiter.js';
// Rate limiter: ~30 RPM
const requestLimiter = new RateLimiter(30, 0.5);
let genAI = null;
function getGeminiClient() {
    if (!genAI) {
        if (!env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is required for Gemini provider');
        }
        genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    return genAI;
}
/**
 * Dispatch call to configured provider (Groq, Gemini, or OpenAI)
 */
async function dispatchLLMCall(systemPrompt, userPrompt, options) {
    const provider = (env.LLM_PROVIDER || '').toLowerCase();
    // If GROQ_API_KEY is provided and provider is groq (or default when GROQ set), use Groq
    if (provider === 'groq' || (env.GROQ_API_KEY && !env.GEMINI_API_KEY)) {
        // Pace Groq API calls to respect 8000 TPM rate limit
        await sleep(2500);
        return callGroqAPI(systemPrompt, userPrompt, options);
    }
    if (provider === 'openai') {
        return callOpenAIAPI(systemPrompt, userPrompt, options);
    }
    // Fallback to Gemini
    return callGeminiAPI(systemPrompt, userPrompt, options);
}
/**
 * Call Groq API (OpenAI compatible endpoint)
 */
async function callGroqAPI(systemPrompt, userPrompt, options) {
    const apiKey = (env.GROQ_API_KEY || '').trim();
    if (!apiKey || apiKey === 'your_groq_api_key_here')
        throw new Error('GROQ_API_KEY is required for Groq provider');
    const model = options.model || env.GROQ_MODEL || 'openai/gpt-oss-20b';
    const body = {
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4096,
    };
    if (options.isJson) {
        body.response_format = { type: 'json_object' };
    }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Groq API error (${res.status}): ${errorText}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;
    return { text, tokensUsed };
}
/**
 * Call OpenAI API
 */
async function callOpenAIAPI(systemPrompt, userPrompt, options) {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey)
        throw new Error('OPENAI_API_KEY is required for OpenAI provider');
    const model = options.model || env.OPENAI_MODEL || 'gpt-4o-mini';
    const body = {
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4096,
    };
    if (options.isJson) {
        body.response_format = { type: 'json_object' };
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;
    return { text, tokensUsed };
}
/**
 * Call Google Gemini API
 */
async function callGeminiAPI(systemPrompt, userPrompt, options) {
    const client = getGeminiClient();
    const modelName = options.model || 'gemini-2.0-flash';
    const generativeModel = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: options.temperature ?? 0.3,
            maxOutputTokens: options.maxTokens ?? 8192,
            ...(options.isJson ? { responseMimeType: 'application/json' } : {}),
        },
    });
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const response = await generativeModel.generateContent(fullPrompt);
    const text = response.response.text();
    const tokensUsed = response.response.usageMetadata?.totalTokenCount;
    return { text, tokensUsed };
}
/**
 * Call the configured LLM and parse JSON response.
 */
export async function callLLM(systemPrompt, userPrompt, options = {}) {
    const { temperature = 0.3, maxOutputTokens = 8192, model, retries = 5, } = options;
    await requestLimiter.acquire();
    const result = await retryWithBackoff(async () => {
        const { text, tokensUsed } = await dispatchLLMCall(systemPrompt, userPrompt, {
            temperature,
            maxTokens: maxOutputTokens,
            model,
            isJson: true,
        });
        if (!text || text.trim().length === 0) {
            throw new Error('Empty response from LLM');
        }
        const parsed = parseJsonResponse(text);
        if (parsed === null) {
            const err = new Error('Invalid JSON in LLM response');
            err.code = 'INVALID_JSON';
            throw err;
        }
        return { data: parsed, tokensUsed };
    }, {
        maxRetries: retries,
        initialDelayMs: 3000,
        maxDelayMs: 30000,
        retryableErrors: ['429', '413', '503', '502', 'RESOURCE_EXHAUSTED', 'UNAVAILABLE', 'INVALID_JSON', 'fetch failed', 'Empty response', 'rate_limit_exceeded', 'tokens per minute'],
        onRetry: (attempt, error, delay) => {
            console.log(`  ⏳ LLM retry ${attempt} (${error.message}) — waiting ${Math.round(delay / 1000)}s`);
        },
    });
    return result;
}
/**
 * Call LLM without JSON mode — for free text responses.
 */
export async function callLLMText(systemPrompt, userPrompt, options = {}) {
    const { temperature = 0.4, maxOutputTokens = 4096, model, } = options;
    await requestLimiter.acquire();
    const result = await retryWithBackoff(async () => {
        const { text } = await dispatchLLMCall(systemPrompt, userPrompt, {
            temperature,
            maxTokens: maxOutputTokens,
            model,
            isJson: false,
        });
        return text;
    }, {
        maxRetries: 3,
        initialDelayMs: 3000,
        maxDelayMs: 30000,
        retryableErrors: ['429', '503', '502', 'RESOURCE_EXHAUSTED', 'UNAVAILABLE'],
        onRetry: (attempt, error, delay) => {
            console.log(`  ⏳ LLM text retry ${attempt} (${error.message}) — waiting ${Math.round(delay / 1000)}s`);
        },
    });
    return result;
}
/**
 * Parse JSON from LLM response text, with fallback extraction.
 */
function parseJsonResponse(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        // Fallback: extract JSON from markdown code blocks
    }
    const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (jsonBlockMatch) {
        try {
            return JSON.parse(jsonBlockMatch[1]);
        }
        catch {
            // Continue
        }
    }
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const start = firstBrace === -1 ? firstBracket :
        firstBracket === -1 ? firstBrace :
            Math.min(firstBrace, firstBracket);
    if (start !== -1) {
        const isArray = text[start] === '[';
        const lastChar = isArray ? ']' : '}';
        const end = text.lastIndexOf(lastChar);
        if (end > start) {
            try {
                return JSON.parse(text.substring(start, end + 1));
            }
            catch {
                // Failed
            }
        }
    }
    return null;
}
//# sourceMappingURL=llmClient.js.map