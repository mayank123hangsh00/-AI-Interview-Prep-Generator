/**
 * Public Discussion Searcher — Finds public discussion of a company's
 * interview process using web search.
 *
 * Approach: Use DuckDuckGo HTML search (no API key needed) to find
 * Glassdoor reviews, Reddit threads, blog posts about interview experiences.
 */
export interface DiscussionResult {
    found: boolean;
    discussions: Array<{
        url: string;
        title: string;
        snippet: string;
        source: string;
    }>;
    errors: string[];
}
/**
 * Search for public discussion of a company's interview process.
 * Uses DuckDuckGo HTML search as it doesn't require an API key.
 */
export declare function searchPublicDiscussion(companyName: string): Promise<DiscussionResult>;
/**
 * Fetch the content of the top discussion pages to get detailed information.
 */
export declare function fetchDiscussionContent(discussions: DiscussionResult['discussions'], maxPages?: number): Promise<Array<{
    url: string;
    content: string;
}>>;
