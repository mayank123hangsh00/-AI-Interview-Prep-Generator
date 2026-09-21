/**
 * Rate Limiter — Token-bucket style rate limiter for outbound requests.
 * Used for both web scraping and LLM API calls.
 */

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRatePerSecond: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRatePerSecond;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  async acquire(cost: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return;
    }

    // Wait until enough tokens are available
    const deficit = cost - this.tokens;
    const waitTime = (deficit / this.refillRate) * 1000;
    await sleep(waitTime);
    this.refill();
    this.tokens -= cost;
  }
}

/**
 * Sleep helper.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff.
 * Retries on specific error codes (e.g., 429, 503).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    retryableErrors?: string[];
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 60000,
    retryableErrors = [],
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === maxRetries) break;

      // Check if error is retryable
      const isRetryable =
        retryableErrors.length === 0 ||
        retryableErrors.some((code) =>
          error.message?.includes(code) ||
          error.code === code ||
          String(error.status) === code
        );

      if (!isRetryable) throw error;

      // Parse retry delay from error message if provider specified one (e.g. "try again in 3.885s")
      let customDelay = 0;
      const match = error.message?.match(/try again in ([\d\.]+)s/i);
      if (match) {
        customDelay = (parseFloat(match[1]) + 1) * 1000;
      }

      const delay = customDelay || Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = delay * 0.1 * Math.random(); // Add 10% jitter
      const totalDelay = delay + jitter;

      onRetry?.(attempt + 1, error, totalDelay);
      await sleep(totalDelay);
    }
  }

  throw lastError!;
}
