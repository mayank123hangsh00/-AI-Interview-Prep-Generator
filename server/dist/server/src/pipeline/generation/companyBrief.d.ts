/**
 * Company Brief Generator — Generates a company brief from crawled pages.
 * LLM Call #2 in the pipeline.
 */
import type { CompanyBrief } from '@shared/types/kit.js';
import type { CrawledPage } from '../retrieval/companyCrawler.js';
import type { DiscussionResult } from '../retrieval/publicDiscussion.js';
/**
 * Generate a company brief from crawled pages and public discussion.
 */
export declare function generateCompanyBrief(pages: CrawledPage[], discussion: DiscussionResult, companyUrl: string): Promise<CompanyBrief>;
