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

import * as cheerio from 'cheerio';
import { fetchPage, type FetchedPage } from './pageFetcher.js';
import { rankLinks, type ScoredLink } from './linkRanker.js';
import { resolveUrl, isSameDomain } from '../../utils/urlValidator.js';

const MAX_FIRST_PASS_PAGES = 8;
const MAX_SECOND_PASS_PAGES = 4;
const MAX_TOTAL_PAGES = 15;

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
 * Extract all links from an HTML page.
 */
function extractLinks(html: string, baseUrl: string): Array<{ url: string; anchorText: string }> {
  const $ = cheerio.load(html);
  const links: Array<{ url: string; anchorText: string }> = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Skip javascript:, mailto:, tel: links
    if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    const absoluteUrl = resolveUrl(baseUrl, href);
    if (!absoluteUrl) return;

    // Only internal links
    if (!isSameDomain(absoluteUrl, baseUrl)) return;

    const anchorText = $(el).text().trim();
    links.push({ url: absoluteUrl, anchorText });
  });

  return links;
}

/**
 * Extract clean text content from HTML, focusing on the main content area.
 */
function extractContent(html: string): { title: string; content: string } {
  const $ = cheerio.load(html);

  // Get title
  const title = $('title').text().trim() ||
                $('h1').first().text().trim() ||
                '';

  // Remove non-content elements
  $('script, style, nav, footer, header, iframe, noscript, svg, form').remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $('.nav, .navbar, .footer, .sidebar, .menu, .cookie, .popup, .modal, .ad, .advertisement').remove();

  // Try to find main content area
  let mainContent = '';
  const mainSelectors = ['main', 'article', '[role="main"]', '.content', '.main-content', '#content', '#main'];

  for (const selector of mainSelectors) {
    const el = $(selector);
    if (el.length > 0) {
      mainContent = el.text();
      break;
    }
  }

  // Fall back to body
  if (!mainContent || mainContent.trim().length < 100) {
    mainContent = $('body').text();
  }

  // Clean up whitespace
  const content = mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return { title, content };
}

/**
 * Crawl a company website to discover what they do and how they hire.
 */
export async function crawlCompany(companyUrl: string): Promise<CrawlResult> {
  const result: CrawlResult = {
    pages: [],
    pagesUsed: [],
    errors: [],
    hiringPageFound: false,
  };

  const fetchedUrls = new Set<string>();

  console.log(`🔍 Crawling: ${companyUrl}`);

  // ── Step 1: Fetch the homepage ──
  const homepageResult = await fetchPage(companyUrl);

  if (!homepageResult.success) {
    result.errors.push(`Homepage fetch failed: ${homepageResult.error.error}`);
    return result;
  }

  const homepage = homepageResult.page;
  fetchedUrls.add(homepage.url);
  result.pagesUsed.push(homepage.url);

  const { title: homeTitle, content: homeContent } = extractContent(homepage.html);
  result.pages.push({
    url: homepage.url,
    title: homeTitle,
    content: homeContent.substring(0, 8000), // Limit per page
    relevanceScore: 5, // Homepage always gets a baseline score
  });

  // ── Step 2: Extract and rank links from the homepage ──
  const links = extractLinks(homepage.html, homepage.url);
  const rankedLinks = rankLinks(links, homepage.url);

  console.log(`  📋 Found ${links.length} internal links, ranked ${rankedLinks.length} relevant`);

  if (rankedLinks.length > 0) {
    console.log(`  🏆 Top links:`);
    rankedLinks.slice(0, 5).forEach((l) => {
      console.log(`     [${l.score}] ${l.url} — "${l.anchorText}"`);
    });
  }

  // ── Step 3: Fetch top-ranked pages (first pass) ──
  const firstPassLinks = rankedLinks.slice(0, MAX_FIRST_PASS_PAGES);
  const secondPassCandidates: ScoredLink[] = [];

  for (const link of firstPassLinks) {
    if (fetchedUrls.has(link.url) || fetchedUrls.size >= MAX_TOTAL_PAGES) continue;

    const pageResult = await fetchPage(link.url);

    if (!pageResult.success) {
      result.errors.push(`${link.url}: ${pageResult.error.error}`);
      continue;
    }

    fetchedUrls.add(pageResult.page.url);
    result.pagesUsed.push(pageResult.page.url);

    const { title, content } = extractContent(pageResult.page.html);

    // Check if this looks like a hiring page
    const contentLower = content.toLowerCase();
    const isHiringPage =
      contentLower.includes('interview process') ||
      contentLower.includes('how we hire') ||
      contentLower.includes('hiring process') ||
      contentLower.includes('application process') ||
      contentLower.includes('what to expect') ||
      (contentLower.includes('interview') && contentLower.includes('stage'));

    if (isHiringPage) {
      result.hiringPageFound = true;
      console.log(`  ✅ Found hiring page: ${link.url}`);
    }

    result.pages.push({
      url: pageResult.page.url,
      title,
      content: content.substring(0, 8000),
      relevanceScore: link.score + (isHiringPage ? 20 : 0),
    });

    // ── Step 4: Look for deeper links on this page (second pass candidates) ──
    const subLinks = extractLinks(pageResult.page.html, pageResult.page.url);
    const rankedSubLinks = rankLinks(subLinks, companyUrl)
      .filter((sl) => !fetchedUrls.has(sl.url))
      .slice(0, 3);

    secondPassCandidates.push(...rankedSubLinks);
  }

  // ── Step 5: Second pass — fetch the most promising deeper pages ──
  const uniqueSecondPass = secondPassCandidates
    .filter((link) => !fetchedUrls.has(link.url))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SECOND_PASS_PAGES);

  if (uniqueSecondPass.length > 0) {
    console.log(`  🔄 Second pass: fetching ${uniqueSecondPass.length} deeper pages`);
  }

  for (const link of uniqueSecondPass) {
    if (fetchedUrls.has(link.url) || fetchedUrls.size >= MAX_TOTAL_PAGES) continue;

    const pageResult = await fetchPage(link.url);

    if (!pageResult.success) {
      result.errors.push(`${link.url}: ${pageResult.error.error}`);
      continue;
    }

    fetchedUrls.add(pageResult.page.url);
    result.pagesUsed.push(pageResult.page.url);

    const { title, content } = extractContent(pageResult.page.html);

    const contentLower = content.toLowerCase();
    const isHiringPage =
      contentLower.includes('interview process') ||
      contentLower.includes('how we hire') ||
      contentLower.includes('hiring process');

    if (isHiringPage) {
      result.hiringPageFound = true;
      console.log(`  ✅ Found hiring page (2nd pass): ${link.url}`);
    }

    result.pages.push({
      url: pageResult.page.url,
      title,
      content: content.substring(0, 8000),
      relevanceScore: link.score + (isHiringPage ? 20 : 0),
    });
  }

  // Sort pages by relevance
  result.pages.sort((a, b) => b.relevanceScore - a.relevanceScore);

  console.log(`  📊 Crawl complete: ${result.pages.length} pages, hiring page ${result.hiringPageFound ? 'found' : 'not found'}`);

  return result;
}
