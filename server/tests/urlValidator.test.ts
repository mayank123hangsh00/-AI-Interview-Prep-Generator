import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateUrl, extractDomain } from '../src/utils/urlValidator.js';

describe('URL Security & Helper Validator', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('accepts valid public HTTP and HTTPS URLs', () => {
    const res1 = validateUrl('https://stripe.com');
    expect(res1.valid).toBe(true);

    const res2 = validateUrl('http://example.org/careers');
    expect(res2.valid).toBe(true);
  });

  it('rejects non-HTTP protocols', () => {
    expect(validateUrl('ftp://example.com').valid).toBe(false);
    expect(validateUrl('file:///etc/passwd').valid).toBe(false);
    expect(validateUrl('javascript:alert(1)').valid).toBe(false);
  });

  it('rejects localhost, loopback, and private IP addresses in production', () => {
    process.env.NODE_ENV = 'production';

    expect(validateUrl('http://localhost').valid).toBe(false);
    expect(validateUrl('http://127.0.0.1').valid).toBe(false);
    expect(validateUrl('http://192.168.1.1').valid).toBe(false);
    expect(validateUrl('http://10.0.0.1').valid).toBe(false);
    expect(validateUrl('http://172.16.0.1').valid).toBe(false);
  });

  it('extracts clean domain names from URLs', () => {
    expect(extractDomain('https://www.stripe.com/jobs')).toBe('stripe.com');
    expect(extractDomain('https://careers.google.com/roles')).toBe('careers.google.com');
    expect(extractDomain('http://netflix.com')).toBe('netflix.com');
  });
});
