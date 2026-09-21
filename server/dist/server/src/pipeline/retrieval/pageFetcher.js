/**
 * Page Fetcher — Fetches a single web page with safety checks.
 * Validates URLs, respects robots.txt, enforces content-type and size limits.
 */
import { isUrlAllowed, USER_AGENT } from './robotsParser.js';
import { validateUrl } from '../../utils/urlValidator.js';
import { RateLimiter, retryWithBackoff } from '../../utils/rateLimiter.js';
const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT = 10000; // 10 seconds
const ALLOWED_CONTENT_TYPES = ['text/html', 'text/plain', 'application/xhtml+xml'];
const SKIP_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.mp3', '.zip', '.tar', '.gz', '.exe', '.dmg', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot', '.ico'];
// Per-domain rate limiter: 2 requests per second
const domainLimiters = new Map();
function getDomainLimiter(hostname) {
    if (!domainLimiters.has(hostname)) {
        domainLimiters.set(hostname, new RateLimiter(2, 2));
    }
    return domainLimiters.get(hostname);
}
/**
 * Fetch a single page with all safety checks.
 * Returns null-safe result — never throws.
 */
export async function fetchPage(url) {
    // 1. Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
        return { success: false, error: { url, error: validation.error } };
    }
    // 2. Check file extension
    const pathname = validation.url.pathname.toLowerCase();
    if (SKIP_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
        return { success: false, error: { url, error: `Skipped binary file: ${pathname}` } };
    }
    // 3. Check robots.txt
    const allowed = await isUrlAllowed(url);
    if (!allowed) {
        return { success: false, error: { url, error: 'Disallowed by robots.txt' } };
    }
    // 4. Rate limit per domain
    const limiter = getDomainLimiter(validation.url.hostname);
    await limiter.acquire();
    // 5. Fetch with retry
    try {
        const page = await retryWithBackoff(async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': USER_AGENT,
                        'Accept': 'text/html,text/plain,application/xhtml+xml',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                    redirect: 'follow',
                });
                clearTimeout(timeout);
                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    error.status = String(response.status);
                    throw error;
                }
                // Check content type
                const contentType = response.headers.get('content-type') || '';
                const isAllowedType = ALLOWED_CONTENT_TYPES.some((t) => contentType.includes(t));
                if (!isAllowedType) {
                    return {
                        success: false,
                        error: { url, error: `Unexpected content type: ${contentType}` },
                    };
                }
                // Check content length
                const contentLength = response.headers.get('content-length');
                if (contentLength && parseInt(contentLength) > MAX_CONTENT_SIZE) {
                    return {
                        success: false,
                        error: { url, error: `Content too large: ${contentLength} bytes` },
                    };
                }
                const html = await response.text();
                if (html.length > MAX_CONTENT_SIZE) {
                    return {
                        success: false,
                        error: { url, error: `Content too large after download: ${html.length} bytes` },
                    };
                }
                return {
                    success: true,
                    page: {
                        url: response.url, // Use final URL after redirects
                        html,
                        statusCode: response.status,
                        contentType,
                    },
                };
            }
            finally {
                clearTimeout(timeout);
            }
        }, {
            maxRetries: 2,
            initialDelayMs: 1000,
            retryableErrors: ['429', '503', '502', 'ECONNRESET', 'ETIMEDOUT', 'fetch failed'],
            onRetry: (attempt, error, delay) => {
                console.log(`  ↻ Retry ${attempt} for ${url} (${error.message}) in ${Math.round(delay)}ms`);
            },
        });
        return page;
    }
    catch (error) {
        return {
            success: false,
            error: {
                url,
                error: error.message || 'Unknown fetch error',
                statusCode: error.status ? parseInt(error.status) : undefined,
            },
        };
    }
}
//# sourceMappingURL=pageFetcher.js.map