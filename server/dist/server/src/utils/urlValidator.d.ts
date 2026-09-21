/**
 * URL Validator — Validates and sanitizes URLs before fetching.
 * Rejects private/loopback addresses in production to prevent SSRF.
 */
export interface URLValidationResult {
    valid: boolean;
    url?: URL;
    error?: string;
}
/**
 * Validate a URL for safety and correctness.
 * In production, rejects private/loopback addresses.
 * In development, allows localhost for testing.
 */
export declare function validateUrl(urlString: string): URLValidationResult;
/**
 * Normalize a URL for consistency (remove trailing slash, lowercase host).
 */
export declare function normalizeUrl(urlString: string): string;
/**
 * Resolve a relative URL against a base URL.
 */
export declare function resolveUrl(base: string, relative: string): string | null;
/**
 * Check if two URLs are on the same domain (allowing subdomains).
 */
export declare function isSameDomain(url1: string, url2: string): boolean;
/**
 * Extract the domain name from a URL for display purposes.
 */
export declare function extractDomain(urlString: string): string;
