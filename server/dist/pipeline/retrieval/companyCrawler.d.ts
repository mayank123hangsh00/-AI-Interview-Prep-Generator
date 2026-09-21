/**
 * Company Crawler — Smart crawling strategy that discovers what a company does
 * and how they hire, without hard-coding any paths.
 *
 * Strategy:
 * 1. Fetch the homepage
 * 2. Extract all internal links
 * 3. Score links by URL path + anchor text keywords
 * 4. Fetch top-N ranked pages
 * 5. Do a second pass: look for deeper links from the fetched pages
 * 6. Return cleaned, ranked page content
 */
export interface CrawledPage {
    url: string;
    title: string;
    content: string;
    relevanceScore: number;
}
export interface CrawlResult {
    pages: CrawledPage[];
    pagesUsed: string[];
    errors: string[];
    hiringPageFound: boolean;
}
/**
 * Crawl a company website to discover what they do and how they hire.
 */
export declare function crawlCompany(companyUrl: string): Promise<CrawlResult>;
