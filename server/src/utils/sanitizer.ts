/**
 * Sanitizer — Cleans text content for safe processing.
 * Treats all external content as data, never as instructions.
 */

/**
 * Wrap external content in delimiters to prevent prompt injection.
 * This tells the LLM to treat the content as data, not instructions.
 */
export function wrapAsData(content: string, label: string = 'content'): string {
  return `<${label}_data>\n${content}\n</${label}_data>`;
}

/**
 * Strip HTML tags from text content.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate text to a maximum character count while preserving word boundaries.
 */
export function truncateText(text: string, maxChars: number = 12000): string {
  if (text.length <= maxChars) return text;
  const truncated = text.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxChars * 0.8 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Generate a simple hash for deduplication.
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
