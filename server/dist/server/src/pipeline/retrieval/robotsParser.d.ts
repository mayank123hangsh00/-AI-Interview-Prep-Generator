/**
 * Robots.txt Parser — Fetches and caches robots.txt for a domain.
 * Respects robots.txt rules before any crawling.
 */
declare const USER_AGENT = "InterviewPrepBot/1.0";
/**
 * Fetch and parse robots.txt for a given URL's domain.
 * Results are cached per domain.
 */
export declare function getRobotsRules(baseUrl: string): Promise<any>;
/**
 * Check if a URL is allowed by robots.txt.
 */
export declare function isUrlAllowed(url: string): Promise<boolean>;
export { USER_AGENT };
