/**
 * Sanitizer — Cleans text content for safe processing.
 * Treats all external content as data, never as instructions.
 */
/**
 * Wrap external content in delimiters to prevent prompt injection.
 * This tells the LLM to treat the content as data, not instructions.
 */
export declare function wrapAsData(content: string, label?: string): string;
/**
 * Strip HTML tags from text content.
 */
export declare function stripHtml(html: string): string;
/**
 * Truncate text to a maximum character count while preserving word boundaries.
 */
export declare function truncateText(text: string, maxChars?: number): string;
/**
 * Generate a simple hash for deduplication.
 */
export declare function hashString(input: string): Promise<string>;
