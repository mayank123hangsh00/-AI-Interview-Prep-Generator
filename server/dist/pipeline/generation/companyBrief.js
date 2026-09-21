/**
 * Company Brief Generator — Generates a company brief from crawled pages.
 * LLM Call #2 in the pipeline.
 */
import { callLLM } from './llmClient.js';
import { COMPANY_BRIEF_SYSTEM, COMPANY_BRIEF_USER } from './promptTemplates.js';
/**
 * Generate a company brief from crawled pages and public discussion.
 */
export async function generateCompanyBrief(pages, discussion, companyUrl) {
    console.log('  🏢 Generating company brief...');
    // If no pages were crawled, produce an honest brief
    if (pages.length === 0) {
        return {
            summary: 'Company website could not be reached or returned no usable content.',
            what_they_do: 'Unable to determine — the company website was not accessible.',
            sources: [],
        };
    }
    // Prepare discussion text
    let discussionText = '';
    if (discussion.found) {
        discussionText = discussion.discussions
            .map((d) => `[${d.source}] ${d.title}: ${d.snippet}`)
            .join('\n\n');
    }
    const response = await callLLM(COMPANY_BRIEF_SYSTEM, COMPANY_BRIEF_USER(pages.map((p) => ({ url: p.url, title: p.title, content: p.content })), discussionText), { temperature: 0.3 });
    const brief = {
        summary: response.data.summary || 'Company information could not be summarized.',
        what_they_do: response.data.what_they_do || 'Unable to determine from available pages.',
        sources: pages.map((p) => p.url),
    };
    // Add optional fields if they have content
    if (response.data.hiring_process) {
        brief.hiring_process = response.data.hiring_process;
    }
    if (response.data.culture_notes) {
        brief.culture_notes = response.data.culture_notes;
    }
    console.log(`  ✅ Company brief generated (${brief.sources.length} sources used)`);
    return brief;
}
//# sourceMappingURL=companyBrief.js.map