/**
 * URL Validator — Validates and sanitizes URLs before fetching.
 * Rejects private/loopback addresses in production to prevent SSRF.
 */

import { env } from '../config/env.js';

// Private IP ranges (SSRF protection)
const PRIVATE_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./,               // Class C private
  /^0\./,                      // Current network
  /^169\.254\./,               // Link-local
  /^::1$/,                     // IPv6 loopback
  /^fc00:/,                    // IPv6 unique local
  /^fe80:/,                    // IPv6 link-local
];

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const MAX_URL_LENGTH = 2048;

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
export function validateUrl(urlString: string): URLValidationResult {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  if (urlString.length > MAX_URL_LENGTH) {
    return { valid: false, error: 'URL too long' };
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return { valid: false, error: `Protocol ${url.protocol} not allowed. Use http or https.` };
  }

  // In production, block private IPs
  const currentEnv = process.env.NODE_ENV || env.NODE_ENV;
  if (currentEnv === 'production') {
    const hostname = url.hostname;

    if (hostname === 'localhost' || hostname === '0.0.0.0') {
      return { valid: false, error: 'URLs pointing to localhost are not allowed in production' };
    }

    for (const range of PRIVATE_RANGES) {
      if (range.test(hostname)) {
        return { valid: false, error: 'URLs pointing to private or internal addresses are not allowed' };
      }
    }
  }

  return { valid: true, url };
}

/**
 * Normalize a URL for consistency (remove trailing slash, lowercase host).
 */
export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    // Remove trailing slash from path (unless it's just /)
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return urlString;
  }
}

/**
 * Resolve a relative URL against a base URL.
 */
export function resolveUrl(base: string, relative: string): string | null {
  try {
    return new URL(relative, base).toString();
  } catch {
    return null;
  }
}

/**
 * Check if two URLs are on the same domain (allowing subdomains).
 */
export function isSameDomain(url1: string, url2: string): boolean {
  try {
    const a = new URL(url1);
    const b = new URL(url2);
    // Allow same domain and subdomains
    return a.hostname === b.hostname ||
           a.hostname.endsWith('.' + b.hostname) ||
           b.hostname.endsWith('.' + a.hostname);
  } catch {
    return false;
  }
}

/**
 * Extract the domain name from a URL for display purposes.
 */
export function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return urlString;
  }
}
