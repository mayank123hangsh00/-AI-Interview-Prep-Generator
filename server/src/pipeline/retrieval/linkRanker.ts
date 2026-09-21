/**
 * Link Ranker — Scores and ranks links found on a page by relevance.
 * Used by the company crawler to decide which pages to fetch next.
 *
 * The key insight: companies bury hiring info in unpredictable places.
 * Instead of hard-coding paths, we score links by URL keywords and anchor text.
 */

/** Keywords that indicate career/hiring content (high value) */
const CAREER_KEYWORDS = [
  'career', 'careers', 'jobs', 'job', 'hiring', 'hire', 'join',
  'work-with-us', 'work-at', 'openings', 'positions', 'vacancies',
  'talent', 'recruitment', 'apply', 'opportunities',
];

/** Keywords that indicate company/culture info (medium value) */
const COMPANY_KEYWORDS = [
  'about', 'about-us', 'team', 'our-team', 'people', 'culture',
  'values', 'mission', 'who-we-are', 'what-we-do', 'company',
  'engineering', 'blog', 'handbook', 'life-at', 'benefits',
];

/** Keywords that indicate interview process info (highest value) */
const INTERVIEW_KEYWORDS = [
  'interview', 'interviews', 'hiring-process', 'how-we-hire',
  'interview-process', 'recruiting-process', 'what-to-expect',
  'application-process', 'onboarding',
];

/** Low-value pages to deprioritize */
const LOW_VALUE_KEYWORDS = [
  'privacy', 'terms', 'legal', 'cookie', 'gdpr', 'sitemap',
  'login', 'signin', 'sign-in', 'signup', 'sign-up', 'register',
  'cart', 'checkout', 'pricing', 'contact', 'support', 'help',
  'docs', 'documentation', 'api', 'status', 'changelog',
];

export interface ScoredLink {
  url: string;
  anchorText: string;
  score: number;
  reasons: string[];
}

/**
 * Score a single link based on URL path and anchor text.
 */
export function scoreLink(url: string, anchorText: string, baseUrl: string): ScoredLink {
  let score = 0;
  const reasons: string[] = [];
  const normalizedAnchor = anchorText.toLowerCase().trim();

  let pathname: string;
  try {
    pathname = new URL(url).pathname.toLowerCase();
  } catch {
    return { url, anchorText, score: -1, reasons: ['invalid URL'] };
  }

  // Check if same domain
  try {
    const linkHost = new URL(url).hostname;
    const baseHost = new URL(baseUrl).hostname;
    if (linkHost !== baseHost && !linkHost.endsWith('.' + baseHost) && !baseHost.endsWith('.' + linkHost)) {
      return { url, anchorText, score: -10, reasons: ['external link'] };
    }
  } catch {
    return { url, anchorText, score: -1, reasons: ['invalid URL'] };
  }

  // Interview process keywords (highest value)
  for (const kw of INTERVIEW_KEYWORDS) {
    if (pathname.includes(kw) || normalizedAnchor.includes(kw)) {
      score += 25;
      reasons.push(`interview keyword: ${kw}`);
    }
  }

  // Career keywords (high value)
  for (const kw of CAREER_KEYWORDS) {
    if (pathname.includes(kw)) {
      score += 15;
      reasons.push(`career path keyword: ${kw}`);
    }
    if (normalizedAnchor.includes(kw)) {
      score += 10;
      reasons.push(`career anchor keyword: ${kw}`);
    }
  }

  // Company info keywords (medium value)
  for (const kw of COMPANY_KEYWORDS) {
    if (pathname.includes(kw)) {
      score += 8;
      reasons.push(`company path keyword: ${kw}`);
    }
    if (normalizedAnchor.includes(kw)) {
      score += 5;
      reasons.push(`company anchor keyword: ${kw}`);
    }
  }

  // Low-value pages (penalize)
  for (const kw of LOW_VALUE_KEYWORDS) {
    if (pathname.includes(kw)) {
      score -= 10;
      reasons.push(`low-value keyword: ${kw}`);
    }
  }

  // Depth penalty: deeper pages are less likely to be useful top-level info
  const depth = pathname.split('/').filter(Boolean).length;
  if (depth > 3) {
    score -= (depth - 3) * 2;
    reasons.push(`depth penalty: ${depth}`);
  }

  // Bonus for short, clean paths (likely main navigation)
  if (depth <= 2 && score > 0) {
    score += 3;
    reasons.push('short path bonus');
  }

  // Penalize fragment-only links
  if (url.includes('#') && !url.split('#')[0]) {
    score -= 20;
    reasons.push('fragment-only link');
  }

  return { url, anchorText, score, reasons };
}

/**
 * Score and rank an array of links, returning them sorted by relevance.
 */
export function rankLinks(
  links: Array<{ url: string; anchorText: string }>,
  baseUrl: string
): ScoredLink[] {
  const seen = new Set<string>();

  return links
    .map(({ url, anchorText }) => scoreLink(url, anchorText, baseUrl))
    .filter((link) => {
      // Deduplicate
      if (seen.has(link.url)) return false;
      seen.add(link.url);
      // Filter out negative/zero scores and external links
      return link.score > 0;
    })
    .sort((a, b) => b.score - a.score);
}
