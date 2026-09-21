/**
 * Kit Service — Business logic layer for kit operations.
 * Handles creation, pipeline execution, editing, regeneration.
 */

import { KitModel, type IKit } from '../models/Kit.js';
import { runPipeline } from '../pipeline/orchestrator.js';
import { hashString } from '../utils/sanitizer.js';
import type { Kit, PipelineStep, EditState, Question, Flashcard } from '../../../shared/types/kit.js';

/**
 * Create a new kit and start the generation pipeline.
 */
export async function createKit(
  userId: string,
  jobDescription: string,
  companyUrl: string,
  daysAvailable: number
): Promise<IKit> {
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
async function runPipelineForKit(
  kitId: string,
  jobDescription: string,
  companyUrl: string,
  daysAvailable: number
): Promise<void> {
  try {
    const kit = await runPipeline({
      jobDescription,
      companyUrl,
      daysAvailable,
      onProgress: async (step: PipelineStep) => {
        // Update progress in DB
        await KitModel.findByIdAndUpdate(kitId, {
          $set: { [`progress`]: step },
          $push: { progress: step },
        }).catch(() => {}); // Don't let progress updates fail the pipeline
      },
    });

    // Build initial edit state (all items are 'generated')
    const editState: Record<string, EditState> = {};
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
  } catch (error: any) {
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
export async function getUserKits(userId: string): Promise<IKit[]> {
  return KitModel.find({ userId })
    .sort({ createdAt: -1 })
    .select('-jobDescription') // Don't include full JD in list view
    .lean() as unknown as IKit[];
}

/**
 * Get a single kit by ID, ensuring it belongs to the user.
 */
export async function getKit(kitId: string, userId: string): Promise<IKit | null> {
  return KitModel.findOne({ _id: kitId, userId }).lean() as unknown as IKit | null;
}

/**
 * Update a question in the kit (edit).
 */
export async function updateQuestion(
  kitId: string,
  userId: string,
  questionId: string,
  updates: Partial<Question>
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  const questionIndex = kitDoc.kit.questions.findIndex((q: any) => q.id === questionId);
  if (questionIndex === -1) return null;

  // Apply updates
  const question = kitDoc.kit.questions[questionIndex];
  if (updates.prompt !== undefined) question.prompt = updates.prompt;
  if (updates.answer_outline !== undefined) question.answer_outline = updates.answer_outline;
  if (updates.difficulty !== undefined) question.difficulty = updates.difficulty;
  if (updates.category !== undefined) question.category = updates.category;

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
export async function addQuestion(
  kitId: string,
  userId: string,
  question: Omit<Question, 'id'>
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  // Generate new ID
  const maxId = kitDoc.kit.questions.reduce((max: number, q: any) => {
    const num = parseInt(q.id.replace('q', ''));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);

  const newQuestion: Question = {
    ...question,
    id: `q${maxId + 1}`,
  };

  kitDoc.kit.questions.push(newQuestion as any);
  kitDoc.editState[newQuestion.id] = 'pinned';

  kitDoc.markModified('kit');
  kitDoc.markModified('editState');
  await kitDoc.save();

  return kitDoc;
}

/**
 * Delete a question from the kit.
 */
export async function deleteQuestion(
  kitId: string,
  userId: string,
  questionId: string
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  kitDoc.kit.questions = kitDoc.kit.questions.filter((q: any) => q.id !== questionId);
  delete kitDoc.editState[questionId];

  // Remove from schedule
  for (const day of kitDoc.kit.schedule.days) {
    day.question_ids = day.question_ids.filter((id: string) => id !== questionId);
  }

  kitDoc.markModified('kit');
  kitDoc.markModified('editState');
  await kitDoc.save();

  return kitDoc;
}

/**
 * Reorder questions in the kit.
 */
export async function reorderQuestions(
  kitId: string,
  userId: string,
  questionIds: string[]
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  // Reorder based on provided ID array
  const questionMap = new Map(kitDoc.kit.questions.map((q: any) => [q.id, q]));
  const reordered: Question[] = [];

  for (const id of questionIds) {
    const q = questionMap.get(id);
    if (q) reordered.push(q);
  }

  // Add any questions not in the provided list (safety)
  for (const q of kitDoc.kit.questions) {
    if (!questionIds.includes(q.id)) {
      reordered.push(q);
    }
  }

  kitDoc.kit.questions = reordered as any;
  kitDoc.markModified('kit');
  await kitDoc.save();

  return kitDoc;
}

/**
 * Update a flashcard in the kit.
 */
export async function updateFlashcard(
  kitId: string,
  userId: string,
  flashcardId: string,
  updates: Partial<Flashcard>
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  const fcIndex = kitDoc.kit.flashcards.findIndex((f: any) => f.id === flashcardId);
  if (fcIndex === -1) return null;

  const fc = kitDoc.kit.flashcards[fcIndex];
  if (updates.front !== undefined) fc.front = updates.front;
  if (updates.back !== undefined) fc.back = updates.back;

  kitDoc.editState[flashcardId] = 'edited';
  kitDoc.markModified('kit');
  kitDoc.markModified('editState');
  await kitDoc.save();

  return kitDoc;
}

/**
 * Add a new flashcard to the kit.
 */
export async function addFlashcard(
  kitId: string,
  userId: string,
  flashcard: Omit<Flashcard, 'id'>
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  const maxId = kitDoc.kit.flashcards.reduce((max: number, f: any) => {
    const num = parseInt(f.id.replace('f', ''));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);

  const newFlashcard: Flashcard = {
    ...flashcard,
    id: `f${maxId + 1}`,
  };

  kitDoc.kit.flashcards.push(newFlashcard as any);
  kitDoc.editState[newFlashcard.id] = 'pinned';
  kitDoc.markModified('kit');
  kitDoc.markModified('editState');
  await kitDoc.save();

  return kitDoc;
}

/**
 * Delete a flashcard from the kit.
 */
export async function deleteFlashcard(
  kitId: string,
  userId: string,
  flashcardId: string
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  kitDoc.kit.flashcards = kitDoc.kit.flashcards.filter((f: any) => f.id !== flashcardId);
  delete kitDoc.editState[flashcardId];
  kitDoc.markModified('kit');
  kitDoc.markModified('editState');
  await kitDoc.save();

  return kitDoc;
}

/**
 * Update company brief.
 */
export async function updateCompanyBrief(
  kitId: string,
  userId: string,
  updates: Partial<Kit['company_brief']>
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  if (updates.summary !== undefined) kitDoc.kit.company_brief.summary = updates.summary;
  if (updates.what_they_do !== undefined) kitDoc.kit.company_brief.what_they_do = updates.what_they_do;

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
export async function regenerateSection(
  kitId: string,
  userId: string,
  section: string
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc || !kitDoc.kit) return null;

  try {
    kitDoc.status = 'generating' as any;
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
    } else if (section === 'questions' || ['technical', 'behavioural', 'system-design', 'company-fit'].includes(section)) {
      // Preserve edited and pinned questions
      const preservedQuestions = kitDoc.kit.questions.filter((q: any) => {
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
      const preservedIds = new Set(preservedQuestions.map((q: any) => q.id));
      const mergedQuestions = [
        ...preservedQuestions,
        ...newQuestions.filter((q) => !preservedIds.has(q.id)),
      ];

      // Re-ID the generated questions
      let nextId = mergedQuestions.length + 1;
      kitDoc.kit.questions = mergedQuestions.map((q: any, i: number) => {
        if (preservedIds.has(q.id)) return q;
        return { ...q, id: `q${i + 1}` };
      }) as any;

      // Update edit state for new questions
      for (const q of kitDoc.kit.questions) {
        if (!kitDoc.editState[q.id]) {
          kitDoc.editState[q.id] = 'generated';
        }
      }

      // Rebuild schedule
      const { allocateSchedule: allocSched } = await import('../pipeline/scheduling/scheduleAllocator.js');
      kitDoc.kit.schedule = allocSched(kitDoc.kit.questions as any, kitDoc.kit.role.requirements as any, kitDoc.daysAvailable) as any;
    } else if (section === 'flashcards') {
      // Preserve edited and pinned flashcards
      const preservedFlashcards = kitDoc.kit.flashcards.filter((f: any) => {
        const state = kitDoc.editState[f.id];
        return state === 'edited' || state === 'pinned';
      });

      const { generateFlashcards: genFlashcards } = await import('../pipeline/generation/flashcardGenerator.js');
      const newFlashcards = await genFlashcards(kitDoc.kit.role.requirements as any, kitDoc.kit.questions as any);

      const preservedIds = new Set(preservedFlashcards.map((f: any) => f.id));
      kitDoc.kit.flashcards = [
        ...preservedFlashcards,
        ...newFlashcards.filter((f) => !preservedIds.has(f.id)),
      ] as any;

      for (const f of kitDoc.kit.flashcards) {
        if (!kitDoc.editState[f.id]) {
          kitDoc.editState[f.id] = 'generated';
        }
      }
    } else if (section === 'schedule') {
      const { allocateSchedule: allocSched } = await import('../pipeline/scheduling/scheduleAllocator.js');
      kitDoc.kit.schedule = allocSched(kitDoc.kit.questions as any, kitDoc.kit.role.requirements as any, kitDoc.daysAvailable) as any;
    }

    kitDoc.status = 'ready' as any;
    kitDoc.markModified('kit');
    kitDoc.markModified('editState');
    await kitDoc.save();

    return kitDoc;
  } catch (error: any) {
    kitDoc.status = 'ready' as any; // Don't leave in generating state on error
    await kitDoc.save();
    throw error;
  }
}

/**
 * Update practice state for a flashcard.
 */
export async function updatePracticeState(
  kitId: string,
  userId: string,
  flashcardId: string,
  confidence: number
): Promise<IKit | null> {
  const kitDoc = await KitModel.findOne({ _id: kitId, userId });
  if (!kitDoc) return null;

  kitDoc.practiceState[flashcardId] = {
    seen: true,
    confidence: Math.min(5, Math.max(1, Math.round(confidence))) as any,
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
