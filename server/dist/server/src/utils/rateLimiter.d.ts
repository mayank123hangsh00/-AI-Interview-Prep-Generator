/**
 * Rate Limiter — Token-bucket style rate limiter for outbound requests.
 * Used for both web scraping and LLM API calls.
 */
export declare class RateLimiter {
    private tokens;
    private lastRefill;
    private readonly maxTokens;
    private readonly refillRate;
    constructor(maxTokens: number, refillRatePerSecond: number);
    private refill;
    acquire(cost?: number): Promise<void>;
}
/**
 * Sleep helper.
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry with exponential backoff.
 * Retries on specific error codes (e.g., 429, 503).
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    retryableErrors?: string[];
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}): Promise<T>;
