/**
 * Link Ranker — Scores and ranks links found on a page by relevance.
 * Used by the company crawler to decide which pages to fetch next.
 *
 * The key insight: companies bury hiring info in unpredictable places.
 * Instead of hard-coding paths, we score links by URL keywords and anchor text.
 */
export interface ScoredLink {
    url: string;
    anchorText: string;
    score: number;
    reasons: string[];
}
/**
 * Score a single link based on URL path and anchor text.
 */
export declare function scoreLink(url: string, anchorText: string, baseUrl: string): ScoredLink;
/**
 * Score and rank an array of links, returning them sorted by relevance.
 */
export declare function rankLinks(links: Array<{
    url: string;
    anchorText: string;
}>, baseUrl: string): ScoredLink[];
