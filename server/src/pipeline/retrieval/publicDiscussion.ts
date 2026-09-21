/**
 * Public Discussion Searcher — Finds public discussion of a company's
 * interview process using web search.
 *
 * Approach: Use DuckDuckGo HTML search (no API key needed) to find
 * Glassdoor reviews, Reddit threads, blog posts about interview experiences.
 */

import * as cheerio from 'cheerio';
import { fetchPage } from './pageFetcher.js';
import { extractDomain } from '../../utils/urlValidator.js';
import { truncateText } from '../../utils/sanitizer.js';

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
export async function searchPublicDiscussion(companyName: string): Promise<DiscussionResult> {
  const result: DiscussionResult = {
    found: false,
    discussions: [],
    errors: [],
  };

  if (!companyName || companyName.trim().length < 2) {
    result.errors.push('Company name too short to search');
    return result;
  }

  // Queries to try
  const queries = [
    `${companyName} interview process experience`,
    `${companyName} interview questions glassdoor`,
  ];

  for (const query of queries) {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const searchResult = await fetchPage(searchUrl);

      if (!searchResult.success) {
        result.errors.push(`Search failed for "${query}": ${searchResult.error.error}`);
        continue;
      }

      const $ = cheerio.load(searchResult.page.html);

      // Parse DuckDuckGo HTML results
      $('.result').each((i, el) => {
        if (i >= 3) return; // Max 3 results per query

        const titleEl = $(el).find('.result__title a');
        const snippetEl = $(el).find('.result__snippet');

        const title = titleEl.text().trim();
        const snippet = snippetEl.text().trim();
        let url = titleEl.attr('href') || '';

        // DuckDuckGo wraps URLs — extract the actual URL
        if (url.includes('uddg=')) {
          try {
            const urlParam = new URL(url, 'https://duckduckgo.com').searchParams.get('uddg');
            if (urlParam) url = urlParam;
          } catch { /* keep original */ }
        }

        if (title && url && url.startsWith('http')) {
          result.discussions.push({
            url,
            title: truncateText(title, 200),
            snippet: truncateText(snippet, 500),
            source: extractDomain(url),
          });
        }
      });
    } catch (error: any) {
      result.errors.push(`Search error for "${query}": ${error.message}`);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  result.discussions = result.discussions.filter((d) => {
    if (seen.has(d.url)) return false;
    seen.add(d.url);
    return true;
  });

  result.found = result.discussions.length > 0;

  console.log(`  🔎 Public discussion: found ${result.discussions.length} results for "${companyName}"`);

  return result;
}

/**
 * Fetch the content of the top discussion pages to get detailed information.
 */
export async function fetchDiscussionContent(
  discussions: DiscussionResult['discussions'],
  maxPages: number = 3
): Promise<Array<{ url: string; content: string }>> {
  const results: Array<{ url: string; content: string }> = [];

  for (const discussion of discussions.slice(0, maxPages)) {
    try {
      const pageResult = await fetchPage(discussion.url);
      if (pageResult.success) {
        const $ = cheerio.load(pageResult.page.html);

        // Remove non-content elements
        $('script, style, nav, footer, header, iframe, noscript, svg').remove();

        const content = $('body').text()
          .replace(/\s+/g, ' ')
          .trim();

        results.push({
          url: discussion.url,
          content: truncateText(content, 5000),
        });
      }
    } catch {
      // Skip failed fetches
    }
  }

  return results;
}
