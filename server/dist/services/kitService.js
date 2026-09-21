/**
 * Kit Service — Business logic layer for kit operations.
 * Handles creation, pipeline execution, editing, regeneration.
 */
import { KitModel } from '../models/Kit.js';
import { runPipeline } from '../pipeline/orchestrator.js';
import { hashString } from '../utils/sanitizer.js';
/**
 * Create a new kit and start the generation pipeline.
 */
export async function createKit(userId, jobDescription, companyUrl, daysAvailable) {
    // Generate hash for deduplication
    const jdHash = await hashString(jobDescription + companyUrl);
    // Check for existing kit with same hash
    const existing = await KitModel.findOne({ userId, jdHash, status: 'ready' });
    if (existing) {
        return existing;
    }
    // Create the kit document
    const kitDoc = new KitModel({
        userId,
        status: 'generating',
        progress: [],
        jobDescription,
        companyUrl,
        daysAvailable,
        kit: null,
        editState: {},
        practiceState: {},
        jdHash,
    });
    await kitDoc.save();
    // Start pipeline in background (don't await — let it run)
    runPipelineForKit(kitDoc._id.toString(), jobDescription, companyUrl, daysAvailable)
        .catch((error) => {
        console.error(`Pipeline failed for kit ${kitDoc._id}:`, error);
    });
    return kitDoc;
}
/**
 * Run the pipeline and update the kit document with progress.
 */
async function runPipelineForKit(kitId, jobDescription, companyUrl, daysAvailable) {
    try {
        const kit = await runPipeline({
            jobDescription,
            companyUrl,
            daysAvailable,
            onProgress: async (step) => {
                // Update progress in DB
                await KitModel.findByIdAndUpdate(kitId, {
                    $set: { [`progress`]: step },
                    $push: { progress: step },
                }).catch(() => { }); // Don't let progress updates fail the pipeline
            },
        });
        // Build initial edit state (all items are 'generated')
        const editState = {};
        for (const q of kit.questions) {
            editState[q.id] = 'generated';
        }
        for (const f of kit.flashcards) {
            editState[f.id] = 'generated';
        }
        editState['company_brief'] = 'generated';
        // Save completed kit
        await KitModel.findByIdAndUpdate(kitId, {
            status: 'ready',
            kit,
            editState,
        });
        console.log(`✅ Kit ${kitId} generated successfully`);
    }
    catch (error) {
        console.error(`❌ Kit ${kitId} generation failed:`, error.message);
        await KitModel.findByIdAndUpdate(kitId, {
            status: 'failed',
            errorMessage: error.message,
        });
    }
}
/**
 * Get all kits for a user.
 */
export async function getUserKits(userId) {
    return KitModel.find({ userId })
        .sort({ createdAt: -1 })
        .select('-jobDescription') // Don't include full JD in list view
        .lean();
}
/**
 * Get a single kit by ID, ensuring it belongs to the user.
 */
export async function getKit(kitId, userId) {
    return KitModel.findOne({ _id: kitId, userId }).lean();
}
/**
 * Update a question in the kit (edit).
 */
export async function updateQuestion(kitId, userId, questionId, updates) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    const questionIndex = kitDoc.kit.questions.findIndex((q) => q.id === questionId);
    if (questionIndex === -1)
        return null;
    // Apply updates
    const question = kitDoc.kit.questions[questionIndex];
    if (updates.prompt !== undefined)
        question.prompt = updates.prompt;
    if (updates.answer_outline !== undefined)
        question.answer_outline = updates.answer_outline;
    if (updates.difficulty !== undefined)
        question.difficulty = updates.difficulty;
    if (updates.category !== undefined)
        question.category = updates.category;
    // Mark as edited
    kitDoc.editState[questionId] = 'edited';
    kitDoc.markModified('kit');
    kitDoc.markModified('editState');
    await kitDoc.save();
    return kitDoc;
}
/**
 * Add a new question to the kit (pinned).
 */
export async function addQuestion(kitId, userId, question) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    // Generate new ID
    const maxId = kitDoc.kit.questions.reduce((max, q) => {
        const num = parseInt(q.id.replace('q', ''));
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const newQuestion = {
        ...question,
        id: `q${maxId + 1}`,
    };
    kitDoc.kit.questions.push(newQuestion);
    kitDoc.editState[newQuestion.id] = 'pinned';
    kitDoc.markModified('kit');
    kitDoc.markModified('editState');
    await kitDoc.save();
    return kitDoc;
}
/**
 * Delete a question from the kit.
 */
export async function deleteQuestion(kitId, userId, questionId) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    kitDoc.kit.questions = kitDoc.kit.questions.filter((q) => q.id !== questionId);
    delete kitDoc.editState[questionId];
    // Remove from schedule
    for (const day of kitDoc.kit.schedule.days) {
        day.question_ids = day.question_ids.filter((id) => id !== questionId);
    }
    kitDoc.markModified('kit');
    kitDoc.markModified('editState');
    await kitDoc.save();
    return kitDoc;
}
/**
 * Reorder questions in the kit.
 */
export async function reorderQuestions(kitId, userId, questionIds) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    // Reorder based on provided ID array
    const questionMap = new Map(kitDoc.kit.questions.map((q) => [q.id, q]));
    const reordered = [];
    for (const id of questionIds) {
        const q = questionMap.get(id);
        if (q)
            reordered.push(q);
    }
    // Add any questions not in the provided list (safety)
    for (const q of kitDoc.kit.questions) {
        if (!questionIds.includes(q.id)) {
            reordered.push(q);
        }
    }
    kitDoc.kit.questions = reordered;
    kitDoc.markModified('kit');
    await kitDoc.save();
    return kitDoc;
}
/**
 * Update a flashcard in the kit.
 */
export async function updateFlashcard(kitId, userId, flashcardId, updates) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    const fcIndex = kitDoc.kit.flashcards.findIndex((f) => f.id === flashcardId);
    if (fcIndex === -1)
        return null;
    const fc = kitDoc.kit.flashcards[fcIndex];
    if (updates.front !== undefined)
        fc.front = updates.front;
    if (updates.back !== undefined)
        fc.back = updates.back;
    kitDoc.editState[flashcardId] = 'edited';
    kitDoc.markModified('kit');
    kitDoc.markModified('editState');
    await kitDoc.save();
    return kitDoc;
}
/**
 * Add a new flashcard to the kit.
 */
export async function addFlashcard(kitId, userId, flashcard) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    const maxId = kitDoc.kit.flashcards.reduce((max, f) => {
        const num = parseInt(f.id.replace('f', ''));
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const newFlashcard = {
        ...flashcard,
        id: `f${maxId + 1}`,
    };
    kitDoc.kit.flashcards.push(newFlashcard);
    kitDoc.editState[newFlashcard.id] = 'pinned';
    kitDoc.markModified('kit');
    kitDoc.markModified('editState');
    await kitDoc.save();
    return kitDoc;
}
/**
 * Delete a flashcard from the kit.
 */
export async function deleteFlashcard(kitId, userId, flashcardId) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    kitDoc.kit.flashcards = kitDoc.kit.flashcards.filter((f) => f.id !== flashcardId);
    delete kitDoc.editState[flashcardId];
    kitDoc.markModified('kit');
    kitDoc.markModified('editState');
    await kitDoc.save();
    return kitDoc;
}
/**
 * Update company brief.
 */
export async function updateCompanyBrief(kitId, userId, updates) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    if (updates.summary !== undefined)
        kitDoc.kit.company_brief.summary = updates.summary;
    if (updates.what_they_do !== undefined)
        kitDoc.kit.company_brief.what_they_do = updates.what_they_do;
    kitDoc.editState['company_brief'] = 'edited';
    kitDoc.markModified('kit');
    kitDoc.markModified('editState');
    await kitDoc.save();
    return kitDoc;
}
/**
 * Regenerate a section of the kit without losing edits elsewhere.
 *
 * This is the hardest state problem in the assessment:
 * - 'generated' items are replaced
 * - 'edited' items are preserved
 * - 'pinned' items are preserved
 */
export async function regenerateSection(kitId, userId, section) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc || !kitDoc.kit)
        return null;
    try {
        kitDoc.status = 'generating';
        await kitDoc.save();
        if (section === 'company_brief') {
            // Only regenerate if not edited
            if (kitDoc.editState['company_brief'] !== 'edited' && kitDoc.editState['company_brief'] !== 'pinned') {
                const crawlResult = await crawlCompany(kitDoc.companyUrl);
                const companyName = extractDomain(kitDoc.companyUrl);
                const discussion = await searchPublicDiscussion(companyName);
                kitDoc.kit.company_brief = await generateCompanyBrief(crawlResult.pages, discussion, kitDoc.companyUrl);
                kitDoc.editState['company_brief'] = 'generated';
            }
        }
        else if (section === 'questions' || ['technical', 'behavioural', 'system-design', 'company-fit'].includes(section)) {
            // Preserve edited and pinned questions
            const preservedQuestions = kitDoc.kit.questions.filter((q) => {
                const state = kitDoc.editState[q.id];
                if (section === 'questions') {
                    return state === 'edited' || state === 'pinned';
                }
                // If regenerating a specific category, only replace generated items in that category
                return q.category !== section || state === 'edited' || state === 'pinned';
            });
            // Regenerate
            const { extractRequirements: extractReqs } = await import('../pipeline/extraction/jdExtractor.js');
            const extracted = await extractReqs(kitDoc.jobDescription);
            const { generateAllQuestions: genQuestions } = await import('../pipeline/generation/questionGenerator.js');
            const newQuestions = await genQuestions(extracted.requirements, '', extracted.responsibilities);
            // Merge: keep preserved, add new generated ones
            const preservedIds = new Set(preservedQuestions.map((q) => q.id));
            const mergedQuestions = [
                ...preservedQuestions,
                ...newQuestions.filter((q) => !preservedIds.has(q.id)),
            ];
            // Re-ID the generated questions
            let nextId = mergedQuestions.length + 1;
            kitDoc.kit.questions = mergedQuestions.map((q, i) => {
                if (preservedIds.has(q.id))
                    return q;
                return { ...q, id: `q${i + 1}` };
            });
            // Update edit state for new questions
            for (const q of kitDoc.kit.questions) {
                if (!kitDoc.editState[q.id]) {
                    kitDoc.editState[q.id] = 'generated';
                }
            }
            // Rebuild schedule
            const { allocateSchedule: allocSched } = await import('../pipeline/scheduling/scheduleAllocator.js');
            kitDoc.kit.schedule = allocSched(kitDoc.kit.questions, kitDoc.kit.role.requirements, kitDoc.daysAvailable);
        }
        else if (section === 'flashcards') {
            // Preserve edited and pinned flashcards
            const preservedFlashcards = kitDoc.kit.flashcards.filter((f) => {
                const state = kitDoc.editState[f.id];
                return state === 'edited' || state === 'pinned';
            });
            const { generateFlashcards: genFlashcards } = await import('../pipeline/generation/flashcardGenerator.js');
            const newFlashcards = await genFlashcards(kitDoc.kit.role.requirements, kitDoc.kit.questions);
            const preservedIds = new Set(preservedFlashcards.map((f) => f.id));
            kitDoc.kit.flashcards = [
                ...preservedFlashcards,
                ...newFlashcards.filter((f) => !preservedIds.has(f.id)),
            ];
            for (const f of kitDoc.kit.flashcards) {
                if (!kitDoc.editState[f.id]) {
                    kitDoc.editState[f.id] = 'generated';
                }
            }
        }
        else if (section === 'schedule') {
            const { allocateSchedule: allocSched } = await import('../pipeline/scheduling/scheduleAllocator.js');
            kitDoc.kit.schedule = allocSched(kitDoc.kit.questions, kitDoc.kit.role.requirements, kitDoc.daysAvailable);
        }
        kitDoc.status = 'ready';
        kitDoc.markModified('kit');
        kitDoc.markModified('editState');
        await kitDoc.save();
        return kitDoc;
    }
    catch (error) {
        kitDoc.status = 'ready'; // Don't leave in generating state on error
        await kitDoc.save();
        throw error;
    }
}
/**
 * Update practice state for a flashcard.
 */
export async function updatePracticeState(kitId, userId, flashcardId, confidence) {
    const kitDoc = await KitModel.findOne({ _id: kitId, userId });
    if (!kitDoc)
        return null;
    kitDoc.practiceState[flashcardId] = {
        seen: true,
        confidence: Math.min(5, Math.max(1, Math.round(confidence))),
        lastPracticed: new Date().toISOString(),
    };
    kitDoc.markModified('practiceState');
    await kitDoc.save();
    return kitDoc;
}
// Re-export for use by regeneration
import { crawlCompany } from '../pipeline/retrieval/companyCrawler.js';
import { searchPublicDiscussion } from '../pipeline/retrieval/publicDiscussion.js';
import { generateCompanyBrief } from '../pipeline/generation/companyBrief.js';
import { extractDomain } from '../utils/urlValidator.js';
//# sourceMappingURL=kitService.js.map