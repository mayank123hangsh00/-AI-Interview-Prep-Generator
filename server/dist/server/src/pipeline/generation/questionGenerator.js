/**
 * Question Generator — Generates interview questions per category.
 * LLM Calls #3-6 in the pipeline (one per category).
 *
 * Key design: questions are generated separately per category because
 * "5 years of React" → technical questions, while
 * "mentoring junior engineers" → behavioural questions.
 * These should not come from the same call with the same instructions.
 */
import { callLLM } from './llmClient.js';
import { QUESTION_GEN_SYSTEM, QUESTION_GEN_USER, GAP_FILL_SYSTEM, GAP_FILL_USER, } from './promptTemplates.js';
/**
 * Generate questions for a specific category of requirements.
 */
export async function generateQuestionsForCategory(category, requirements, hiringContext, startId) {
    if (requirements.length === 0) {
        return [];
    }
    console.log(`  ❓ Generating ${category} questions for ${requirements.length} requirements...`);
    const response = await callLLM(QUESTION_GEN_SYSTEM(category, hiringContext), QUESTION_GEN_USER(requirements, startId, category), { temperature: 0.5, maxOutputTokens: 8192 });
    let questions = Array.isArray(response.data) ? response.data : [];
    // Validate and fix question structure
    questions = questions.map((q, i) => ({
        id: q.id || `q${startId + i}`,
        requirement_ids: Array.isArray(q.requirement_ids) ? q.requirement_ids : [],
        category: category,
        prompt: q.prompt || '',
        answer_outline: q.answer_outline || '',
        difficulty: ([1, 2, 3].includes(q.difficulty) ? q.difficulty : 2),
    }));
    // Filter out questions with empty prompts
    questions = questions.filter((q) => q.prompt.trim().length > 0);
    console.log(`  ✅ Generated ${questions.length} ${category} questions`);
    return questions;
}
/**
 * Generate all questions across categories.
 * Splits requirements by kind and generates per-category.
 */
export async function generateAllQuestions(requirements, hiringContext, responsibilities) {
    const allQuestions = [];
    let nextId = 1;
    // Technical questions from technical requirements
    const technicalReqs = requirements.filter((r) => r.kind === 'technical');
    if (technicalReqs.length > 0) {
        const techQuestions = await generateQuestionsForCategory('technical', technicalReqs, hiringContext, nextId);
        allQuestions.push(...techQuestions);
        nextId += techQuestions.length;
    }
    // Behavioural questions from behavioural requirements
    const behaviouralReqs = requirements.filter((r) => r.kind === 'behavioural');
    if (behaviouralReqs.length > 0) {
        const behavQuestions = await generateQuestionsForCategory('behavioural', behaviouralReqs, hiringContext, nextId);
        allQuestions.push(...behavQuestions);
        nextId += behavQuestions.length;
    }
    // System design questions (from senior+ roles with technical requirements)
    const seniorityIndicators = responsibilities.join(' ').toLowerCase();
    const hasSeniorContext = seniorityIndicators.includes('architect') ||
        seniorityIndicators.includes('design') ||
        seniorityIndicators.includes('system') ||
        seniorityIndicators.includes('scale') ||
        seniorityIndicators.includes('lead') ||
        seniorityIndicators.includes('senior') ||
        technicalReqs.length >= 3;
    if (hasSeniorContext && technicalReqs.length > 0) {
        const designReqs = technicalReqs.slice(0, 5); // Use top technical reqs
        const designQuestions = await generateQuestionsForCategory('system-design', designReqs, hiringContext, nextId);
        allQuestions.push(...designQuestions);
        nextId += designQuestions.length;
    }
    // Company-fit questions (from domain requirements + general)
    const domainReqs = requirements.filter((r) => r.kind === 'domain');
    const fitReqs = domainReqs.length > 0 ? domainReqs : requirements.slice(0, 3);
    if (fitReqs.length > 0) {
        const fitQuestions = await generateQuestionsForCategory('company-fit', fitReqs, hiringContext, nextId);
        allQuestions.push(...fitQuestions);
        nextId += fitQuestions.length;
    }
    // Re-number all question IDs to be sequential
    allQuestions.forEach((q, i) => {
        q.id = `q${i + 1}`;
    });
    return allQuestions;
}
/**
 * Generate gap-filling questions for uncovered requirements.
 */
export async function generateGapFillingQuestions(uncoveredRequirements, startId) {
    if (uncoveredRequirements.length === 0)
        return [];
    console.log(`  🔧 Generating gap-filling questions for ${uncoveredRequirements.length} uncovered requirements...`);
    const response = await callLLM(GAP_FILL_SYSTEM, GAP_FILL_USER(uncoveredRequirements, startId), { temperature: 0.4, maxOutputTokens: 4096 });
    let questions = Array.isArray(response.data) ? response.data : [];
    // Validate and fix
    questions = questions.map((q, i) => ({
        id: q.id || `q${startId + i}`,
        requirement_ids: Array.isArray(q.requirement_ids) ? q.requirement_ids : [],
        category: (['technical', 'behavioural', 'system-design', 'company-fit'].includes(q.category) ? q.category : 'technical'),
        prompt: q.prompt || '',
        answer_outline: q.answer_outline || '',
        difficulty: ([1, 2, 3].includes(q.difficulty) ? q.difficulty : 2),
    }));
    questions = questions.filter((q) => q.prompt.trim().length > 0);
    console.log(`  ✅ Generated ${questions.length} gap-filling questions`);
    return questions;
}
//# sourceMappingURL=questionGenerator.js.map