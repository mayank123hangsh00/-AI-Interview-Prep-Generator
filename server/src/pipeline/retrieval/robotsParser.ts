/**
 * Robots.txt Parser — Fetches and caches robots.txt for a domain.
 * Respects robots.txt rules before any crawling.
 */

import robotsParser from 'robots-parser';

const USER_AGENT = 'InterviewPrepBot/1.0';
const robotsCache = new Map<string, { rules: any; fetchedAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch and parse robots.txt for a given URL's domain.
 * Results are cached per domain.
 */
export async function getRobotsRules(baseUrl: string): Promise<any> {
  try {
    const url = new URL(baseUrl);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;

    // Check cache
    const cached = robotsCache.get(robotsUrl);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      return cached.rules;
    }

    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      // No robots.txt = everything allowed
      const permissiveRules = robotsParser(robotsUrl, '');
      robotsCache.set(robotsUrl, { rules: permissiveRules, fetchedAt: Date.now() });
      return permissiveRules;
    }

    const text = await response.text();
    const rules = robotsParser(robotsUrl, text);
    robotsCache.set(robotsUrl, { rules, fetchedAt: Date.now() });
    return rules;
  } catch {
    // On error, be permissive (allow crawling)
    const url = new URL(baseUrl);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
    const permissiveRules = robotsParser(robotsUrl, '');
    robotsCache.set(robotsUrl, { rules: permissiveRules, fetchedAt: Date.now() });
    return permissiveRules;
  }
}

/**
 * Check if a URL is allowed by robots.txt.
 */
export async function isUrlAllowed(url: string): Promise<boolean> {
  try {
    const rules = await getRobotsRules(url);
    return rules.isAllowed(url, USER_AGENT) !== false;
  } catch {
    return true; // On error, allow
  }
}

export { USER_AGENT };
