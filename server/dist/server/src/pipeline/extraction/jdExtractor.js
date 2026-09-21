/**
 * JD Extractor — Extracts structured requirements from a job description.
 * LLM Call #1 in the pipeline.
 */
import { callLLM } from '../generation/llmClient.js';
import { JD_EXTRACTION_SYSTEM, JD_EXTRACTION_USER } from '../generation/promptTemplates.js';
/**
 * Extract structured role information from a raw job description.
 */
export async function extractRequirements(jobDescription) {
    console.log('  📋 Extracting requirements from job description...');
    const response = await callLLM(JD_EXTRACTION_SYSTEM, JD_EXTRACTION_USER(jobDescription), { temperature: 0.1 } // Low temperature for precision
    );
    const result = response.data;
    // Validate and fix IDs
    result.requirements = result.requirements.map((req, i) => ({
        ...req,
        id: req.id || `r${i + 1}`,
        kind: (['technical', 'behavioural', 'domain'].includes(req.kind) ? req.kind : 'technical'),
        priority: (['must', 'nice'].includes(req.priority) ? req.priority : 'must'),
    }));
    console.log(`  ✅ Extracted ${result.requirements.length} requirements (${result.requirements.filter(r => r.priority === 'must').length} must, ${result.requirements.filter(r => r.priority === 'nice').length} nice)`);
    return result;
}
//# sourceMappingURL=jdExtractor.js.map