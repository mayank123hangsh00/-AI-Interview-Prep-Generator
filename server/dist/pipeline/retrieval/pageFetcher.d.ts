/**
 * Page Fetcher — Fetches a single web page with safety checks.
 * Validates URLs, respects robots.txt, enforces content-type and size limits.
 */
export interface FetchedPage {
    url: string;
    html: string;
    statusCode: number;
    contentType: string;
    title?: string;
}
export interface FetchError {
    url: string;
    error: string;
    statusCode?: number;
}
export type FetchResult = {
    success: true;
    page: FetchedPage;
} | {
    success: false;
    error: FetchError;
};
/**
 * Fetch a single page with all safety checks.
 * Returns null-safe result — never throws.
 */
export declare function fetchPage(url: string): Promise<FetchResult>;
